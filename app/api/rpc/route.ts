import type { NextRequest } from "next/server";

/*
 * This app enables `cacheComponents`, which makes the `dynamic` and `runtime`
 * route segment configs build errors. Neither is needed here: POST route
 * handlers are never cached, and Node.js is the default (and only supported)
 * runtime in this setup.
 */

/*
 * Same-origin JSON-RPC proxy.
 *
 * The browser's Solana connection points here (`/mantis/api/rpc`) instead of
 * at the upstream RPC. `RPC_URL` is a server-only secret, so it is never inlined
 * into the client bundle. Only the methods this app needs are forwarded.
 */

const PUBLIC_DEVNET_RPC = "https://api.devnet.solana.com";
const MAX_BODY_BYTES = 100 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const MAX_BATCH_SIZE = 20;

const ALLOWED_METHODS = new Set([
	"getLatestBlockhash",
	"getBlockHeight",
	"getSlot",
	"isBlockhashValid",
	"getAccountInfo",
	"getMultipleAccounts",
	"getBalance",
	"getTokenAccountBalance",
	"getTokenAccountsByOwner",
	"getSignatureStatuses",
	"getTransaction",
	"getFeeForMessage",
	"getMinimumBalanceForRentExemption",
	"simulateTransaction",
	"sendTransaction",
]);

type JsonRpcId = string | number | null;

type ErrorBody = {
	jsonrpc: "2.0";
	id: JsonRpcId;
	error: { code: number; message: string };
};

type ValidationResult =
	| { ok: true; request: Record<string, unknown>; id: JsonRpcId }
	| { ok: false; id: JsonRpcId; code: number; message: string };

const NO_STORE_HEADERS = { "cache-control": "no-store" };

let warnedAboutFallbackRpc = false;

/*
 * Best-effort, per-process rate limit. This Map is not shared between
 * serverless invocations or instances, and it resets on cold start, so it only
 * blunts naive floods. A durable limit belongs in the platform's edge/WAF.
 */
const requestsByIp = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = requestsByIp.get(ip);

	if (!entry || entry.resetAt <= now) {
		requestsByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });

		// Opportunistically drop expired entries so the Map cannot grow forever.
		if (requestsByIp.size > 10_000) {
			for (const [key, value] of requestsByIp) {
				if (value.resetAt <= now) requestsByIp.delete(key);
			}
		}

		return false;
	}

	entry.count += 1;
	return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function clientIp(request: NextRequest): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}

	return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function requestHost(request: NextRequest): string {
	const forwardedHost = request.headers.get("x-forwarded-host");
	if (forwardedHost) return forwardedHost.split(",")[0]?.trim() || "";

	return request.headers.get("host") || new URL(request.url).host;
}

/*
 * Browsers attach Origin to cross-origin requests. Same-origin requests may
 * omit it, which is fine; if it is present it must match the request host.
 */
function originMatchesHost(request: NextRequest): boolean {
	const origin = request.headers.get("origin");
	if (origin === null) return true;

	try {
		return new URL(origin).host === requestHost(request);
	} catch {
		return false;
	}
}

function jsonRpcError(id: JsonRpcId, code: number, message: string): ErrorBody {
	return { jsonrpc: "2.0", id, error: { code, message } };
}

function errorResponse(
	id: JsonRpcId,
	code: number,
	message: string,
	status: number,
): Response {
	return Response.json(jsonRpcError(id, code, message), {
		status,
		headers: NO_STORE_HEADERS,
	});
}

function validateRequest(candidate: unknown): ValidationResult {
	if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
		return { ok: false, id: null, code: -32600, message: "Invalid JSON-RPC request." };
	}

	const request = candidate as Record<string, unknown>;
	const id =
		typeof request.id === "string" || typeof request.id === "number"
			? request.id
			: null;

	if (request.jsonrpc !== "2.0") {
		return { ok: false, id, code: -32600, message: "Invalid JSON-RPC request." };
	}

	if (typeof request.method !== "string") {
		return { ok: false, id, code: -32600, message: "Invalid JSON-RPC request." };
	}

	if (!ALLOWED_METHODS.has(request.method)) {
		return {
			ok: false,
			id,
			code: -32601,
			message: `Method not allowed: ${request.method}`,
		};
	}

	return { ok: true, request, id };
}

function idKey(id: unknown): string {
	return `${typeof id}:${id === null || id === undefined ? "null" : String(id)}`;
}

async function forwardToUpstream(
	upstream: string,
	body: string,
): Promise<Response | null> {
	try {
		return await fetch(upstream, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json",
			},
			body,
			cache: "no-store",
			signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
		});
	} catch {
		// Never log or return the upstream URL, headers, or credential.
		return null;
	}
}

function isJsonResponse(response: Response): boolean {
	return (response.headers.get("content-type") ?? "").includes("application/json");
}

export async function POST(request: NextRequest): Promise<Response> {
	if (!originMatchesHost(request)) {
		return errorResponse(null, -32600, "Origin not allowed.", 403);
	}

	const contentLength = Number(request.headers.get("content-length") ?? "");
	if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
		return errorResponse(null, -32600, "Request body too large.", 413);
	}

	if (isRateLimited(clientIp(request))) {
		return errorResponse(null, -32005, "Too many requests.", 429);
	}

	let raw: string;
	try {
		raw = await request.text();
	} catch {
		return errorResponse(null, -32700, "Invalid JSON.", 400);
	}

	if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
		return errorResponse(null, -32600, "Request body too large.", 413);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return errorResponse(null, -32700, "Invalid JSON.", 400);
	}

	const batch = Array.isArray(parsed) ? parsed : null;
	if (batch && batch.length === 0) {
		return errorResponse(null, -32600, "Empty batch.", 400);
	}

	if (batch && batch.length > MAX_BATCH_SIZE) {
		return errorResponse(null, -32600, "Batch too large.", 413);
	}

	const isBatch = batch !== null;
	const candidates: unknown[] = batch ?? [parsed];
	const upstream = process.env.RPC_URL?.trim() || PUBLIC_DEVNET_RPC;

	if (!process.env.RPC_URL?.trim() && !warnedAboutFallbackRpc) {
		warnedAboutFallbackRpc = true;
		// Logged once per server instance. Deliberately excludes the URL itself.
		console.warn(
			"[api/rpc] RPC_URL is empty; using the public Solana devnet RPC. Set RPC_URL for production traffic.",
		);
	}

	const validations = candidates.map(validateRequest);
	const allValid = validations.every(
		(validation): validation is Extract<ValidationResult, { ok: true }> =>
			validation.ok,
	);

	// Common path: forward the payload untouched so ids, params, and batch
	// ordering stay exactly as the client sent them.
	if (allValid) {
		const upstreamResponse = await forwardToUpstream(upstream, raw);
		if (!upstreamResponse || !isJsonResponse(upstreamResponse)) {
			return errorResponse(
				null,
				-32603,
				"Upstream RPC unavailable.",
				502,
			);
		}

		const body = await upstreamResponse.text();
		return new Response(body, {
			status: upstreamResponse.status,
			headers: { "content-type": "application/json", ...NO_STORE_HEADERS },
		});
	}

	// Reject the disallowed entries and forward the rest.
	const validEntries: Array<{
		index: number;
		request: Record<string, unknown>;
		id: JsonRpcId;
	}> = [];
	const rejected = new Map<number, ErrorBody>();

	validations.forEach((validation, index) => {
		if (validation.ok) {
			validEntries.push({
				index,
				request: validation.request,
				id: validation.id,
			});
		} else {
			rejected.set(index, jsonRpcError(validation.id, validation.code, validation.message));
		}
	});

	if (validEntries.length === 0) {
		const body = isBatch
			? JSON.stringify(
				[...rejected.entries()]
					.sort(([a], [b]) => a - b)
					.map(([, error]) => error),
			)
			: JSON.stringify(rejected.get(0));
		return new Response(body, {
			status: 200,
			headers: { "content-type": "application/json", ...NO_STORE_HEADERS },
		});
	}

	const forwardedBody = JSON.stringify(
		validEntries.length === 1
			? validEntries[0].request
			: validEntries.map((entry) => entry.request),
	);
	const upstreamResponse = await forwardToUpstream(upstream, forwardedBody);
	if (!upstreamResponse || !isJsonResponse(upstreamResponse)) {
		return errorResponse(null, -32603, "Upstream RPC unavailable.", 502);
	}

	let upstreamPayload: unknown;
	try {
		upstreamPayload = await upstreamResponse.json();
	} catch {
		return errorResponse(
			null,
			-32603,
			"Upstream RPC returned an invalid response.",
			502,
		);
	}

	const upstreamItems = Array.isArray(upstreamPayload)
		? upstreamPayload
		: [upstreamPayload];
	const results: unknown[] = new Array(candidates.length);
	const unmatched = [...validEntries];

	for (const item of upstreamItems) {
		const itemId =
			typeof item === "object" && item !== null
				? (item as { id?: unknown }).id
				: undefined;

		// Match by id first; fall back to batch position for servers that omit
		// or rewrite ids.
		let match = unmatched.findIndex((entry) => idKey(entry.id) === idKey(itemId));
		if (match === -1) match = 0;

		const [entry] = unmatched.splice(match, 1);
		if (entry) results[entry.index] = item;
	}

	for (const entry of unmatched) {
		results[entry.index] = jsonRpcError(
			entry.id,
			-32603,
			"Upstream RPC did not return a result.",
		);
	}

	for (const [index, error] of rejected) {
		results[index] = error;
	}

	return new Response(JSON.stringify(isBatch ? results : results[0]), {
		status: 200,
		headers: { "content-type": "application/json", ...NO_STORE_HEADERS },
	});
}
