import { BN } from "@coral-xyz/anchor";
import type {
  AnchorWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  type Connection,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  MAN_MINT,
  MINT_A,
  MINT_B,
  WSOL_MINT,
  type PoolState,
} from "./constants";
import { ComputeBudgetProgram } from "@solana/web3.js";
import { authorityPda, lockedLpPda, lpMintPda, poolPda, vaultPda } from "./pda";
import { writeProgram } from "./program";

function ataFor(mint: PublicKey, owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID);
}

async function tokenBalance(
  connection: Connection,
  address: PublicKey,
): Promise<bigint> {
  try {
    const result = await connection.getTokenAccountBalance(address);
    return BigInt(result.value.amount);
  } catch {
    return 0n;
  }
}

async function send(
  connection: Connection,
  wallet: WalletContextState,
  instructions: TransactionInstruction[],
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Connect a wallet to continue.");
  if (!wallet.sendTransaction) {
    throw new Error("This wallet cannot send transactions.");
  }

  const tx = new Transaction().add(...instructions);
  tx.feePayer = wallet.publicKey;

  const latest = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = latest.blockhash;

  let signature: string;
  try {
    signature = await wallet.sendTransaction(
      tx,
      connection,
      { maxRetries: 3 },
    );
  } catch (error) {
    throw new Error(readableError(error));
  }

  try {
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      },
      "confirmed",
    );

    if (confirmation.value.err) {
      throw new Error("The transaction failed on-chain.");
    }
  } catch (error) {
    throw new Error(readableError(error));
  }

  return signature;
}

export type SwapParams = {
  connection: Connection;
  wallet: WalletContextState;
  pool: PoolState;
  amountIn: bigint;
  minOut: bigint;
  aToB: boolean;
  payMint: PublicKey;
  receiveMint: PublicKey;
};

export async function swapTx(params: SwapParams): Promise<string> {
  const { connection, wallet, pool } = params;
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Connect a wallet to continue.");

  const program = writeProgram(connection, wallet as unknown as AnchorWallet);
  const userTokenA = ataFor(MINT_A, owner);
  const userTokenB = ataFor(MINT_B, owner);
  const wsolAta = ataFor(WSOL_MINT, owner);

  const payingSol = params.payMint.equals(WSOL_MINT);
  const receivingSol = params.receiveMint.equals(WSOL_MINT);
  const wsolBefore = await tokenBalance(connection, wsolAta);

  const instructions: TransactionInstruction[] = [
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenA,
      owner,
      MINT_A,
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenB,
      owner,
      MINT_B,
    ),
  ];

  if (payingSol) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: wsolAta,
        lamports: Number(params.amountIn),
      }),
      createSyncNativeInstruction(wsolAta),
    );
  }

  const swapIx = await program.methods
    .swap(
      new BN(params.amountIn.toString()),
      new BN(params.minOut.toString()),
      params.aToB,
    )
    .accounts({
      user: owner,
      pool: pool.address,
      poolAuthority: pool.authority,
      vaultA: pool.vaultA,
      vaultB: pool.vaultB,
      userTokenA,
      userTokenB,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as never)
    .instruction();

  instructions.push(swapIx);

  if (receivingSol && wsolBefore === 0n) {
    instructions.push(createCloseAccountInstruction(wsolAta, owner, owner));
  }

  return send(connection, wallet, instructions);
}

export async function wrapSolTx(
  connection: Connection,
  wallet: WalletContextState,
  lamports: bigint,
): Promise<string> {
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Connect a wallet to continue.");
  if (lamports <= 0n) throw new Error("Enter an amount to wrap.");

  const wsolAta = ataFor(WSOL_MINT, owner);

  return send(connection, wallet, [
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      wsolAta,
      owner,
      WSOL_MINT,
    ),
    SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey: wsolAta,
      lamports: Number(lamports),
    }),
    createSyncNativeInstruction(wsolAta),
  ]);
}

export async function unwrapSolTx(
  connection: Connection,
  wallet: WalletContextState,
): Promise<string> {
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Connect a wallet to continue.");

  const wsolAta = ataFor(WSOL_MINT, owner);
  const balance = await tokenBalance(connection, wsolAta);
  if (balance <= 0n) throw new Error("There is no wSOL to unwrap.");

  return send(connection, wallet, [
    createCloseAccountInstruction(wsolAta, owner, owner),
  ]);
}

export type AddLiquidityParams = {
  connection: Connection;
  wallet: WalletContextState;
  pool: PoolState;
  maxA: bigint;
  maxB: bigint;
  minLp: bigint;
};

export async function addLiquidityTx(
  params: AddLiquidityParams,
): Promise<string> {
  const { connection, wallet, pool } = params;
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Connect a wallet to continue.");

  const program = writeProgram(connection, wallet as unknown as AnchorWallet);
  const userTokenA = ataFor(MINT_A, owner);
  const userTokenB = ataFor(MINT_B, owner);
  const userLp = ataFor(pool.lpMint, owner);
  const wsolAta = ataFor(WSOL_MINT, owner);

  const instructions: TransactionInstruction[] = [
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenA,
      owner,
      MINT_A,
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenB,
      owner,
      MINT_B,
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userLp,
      owner,
      pool.lpMint,
    ),
  ];

  const requiredWsol = MINT_A.equals(WSOL_MINT) ? params.maxA : params.maxB;
  if (requiredWsol > 0n) {
    const wsolBalance = await tokenBalance(connection, wsolAta);
    if (wsolBalance < requiredWsol) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: wsolAta,
          lamports: Number(requiredWsol - wsolBalance),
        }),
        createSyncNativeInstruction(wsolAta),
      );
    }
  }

  const addIx = await program.methods
    .addLiquidity(
      new BN(params.maxA.toString()),
      new BN(params.maxB.toString()),
      new BN(params.minLp.toString()),
    )
    .accounts({
      user: owner,
      pool: pool.address,
      poolAuthority: pool.authority,
      vaultA: pool.vaultA,
      vaultB: pool.vaultB,
      lpMint: pool.lpMint,
      lockedLp: lockedLpPda(pool.address),
      userTokenA,
      userTokenB,
      userLp,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as never)
    .instruction();

  instructions.push(addIx);

  return send(connection, wallet, instructions);
}

export type RemoveLiquidityParams = {
  connection: Connection;
  wallet: WalletContextState;
  pool: PoolState;
  lpAmount: bigint;
  minA: bigint;
  minB: bigint;
};

export async function removeLiquidityTx(
  params: RemoveLiquidityParams,
): Promise<string> {
  const { connection, wallet, pool } = params;
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Connect a wallet to continue.");

  const program = writeProgram(connection, wallet as unknown as AnchorWallet);
  const userTokenA = ataFor(MINT_A, owner);
  const userTokenB = ataFor(MINT_B, owner);
  const userLp = ataFor(pool.lpMint, owner);

  const removeIx = await program.methods
    .removeLiquidity(
      new BN(params.lpAmount.toString()),
      new BN(params.minA.toString()),
      new BN(params.minB.toString()),
    )
    .accounts({
      user: owner,
      pool: pool.address,
      poolAuthority: pool.authority,
      vaultA: pool.vaultA,
      vaultB: pool.vaultB,
      lpMint: pool.lpMint,
      userTokenA,
      userTokenB,
      userLp,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as never)
    .instruction();

  return send(connection, wallet, [
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenA,
      owner,
      MINT_A,
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      userTokenB,
      owner,
      MINT_B,
    ),
    removeIx,
  ]);
}

const ERROR_NAMES: Record<string, string> = {
  MintsNotSorted: "The token pair is not supported by this pool.",
  FeeTooHigh: "The pool fee is invalid.",
  MathOverflow: "The amount is too large to process.",
  InsufficientLiquidity: "That amount is too small for the pool.",
  EmptyPool: "The pool has no liquidity yet.",
  ZeroOutput: "The output amount would be zero.",
  ZeroAmount: "Enter an amount greater than zero.",
  SlippageExceeded: "Slippage exceeded. Try a higher tolerance.",
};

const ERROR_CODES: Record<number, string> = {
  6000: "The token pair is not supported by this pool.",
  6001: "The pool fee is invalid.",
  6002: "The amount is too large to process.",
  6003: "That amount is too small for the pool.",
  6004: "The pool has no liquidity yet.",
  6005: "The output amount would be zero.",
  6006: "Enter an amount greater than zero.",
  6007: "Slippage exceeded. Try a higher tolerance.",
};

export function readableError(error: unknown): string {
  const candidate = error as {
    error?: {
      errorCode?: { code?: string; number?: number };
      errorMessage?: string;
    };
    message?: string;
  };

  const anchorName = candidate?.error?.errorCode?.code;
  if (anchorName && ERROR_NAMES[anchorName]) return ERROR_NAMES[anchorName];

  const anchorNumber = candidate?.error?.errorCode?.number;
  if (typeof anchorNumber === "number" && ERROR_CODES[anchorNumber]) {
    return ERROR_CODES[anchorNumber];
  }

  const raw =
    candidate?.error?.errorMessage ||
    candidate?.message ||
    (typeof error === "string" ? error : "");

  if (!raw) return "Something went wrong. Please try again.";

  const hex = raw.match(/custom program error: 0x([0-9a-f]+)/i);
  if (hex) {
    const code = Number.parseInt(hex[1], 16);
    if (ERROR_CODES[code]) return ERROR_CODES[code];
  }

  const named = Object.keys(ERROR_NAMES).find((name) => raw.includes(name));
  if (named) return ERROR_NAMES[named];

  if (/user rejected|rejected the request|request rejected/i.test(raw)) {
    return "The transaction was rejected in your wallet.";
  }
  if (/insufficient (funds|lamports)|not enough sol/i.test(raw)) {
    return "Not enough SOL to pay for this transaction.";
  }
  if (/blockhash|expired/i.test(raw)) {
    return "The transaction expired. Please try again.";
  }
  if (/failed to fetch|network|timeout/i.test(raw)) {
    return "Network error. Check your RPC connection and retry.";
  }

  return raw.split("\n")[0].slice(0, 160);
}

export async function initializePoolTx(
  connection: Connection,
  wallet: WalletContextState,
  feeBps: number = 30,
): Promise<string> {
  const owner = wallet.publicKey;
  if (!owner) throw new Error("Connect a wallet to continue.");

  const program = writeProgram(connection, wallet as unknown as AnchorWallet);
  const pool = poolPda(MINT_A, MINT_B);
  console.log("pool PDA", pool.toBase58());

  const initIx = await program.methods
    .initializePool(feeBps)
    .accounts({
      payer: owner,
      mintA: MINT_A,
      mintB: MINT_B,
      pool,
      poolAuthority: authorityPda(pool),
      vaultA: vaultPda(pool, MINT_A),
      vaultB: vaultPda(pool, MINT_B),
      lpMint: lpMintPda(pool),
      lockedLp: lockedLpPda(pool),
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as never)
    .instruction();

  console.log("sending initialize tx");
  return send(connection, wallet, [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
    initIx,
  ]);
}