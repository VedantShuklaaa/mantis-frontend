import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

const bytes = (value: string) => Buffer.from(value, "utf8");

export function poolPda(mintA: PublicKey, mintB: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [bytes("pool"), mintA.toBuffer(), mintB.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function authorityPda(pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [bytes("authority"), pool.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function vaultPda(pool: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [bytes("vault"), pool.toBuffer(), mint.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function lpMintPda(pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [bytes("lp_mint"), pool.toBuffer()],
    PROGRAM_ID,
  )[0];
}

export function lockedLpPda(pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [bytes("locked_lp"), pool.toBuffer()],
    PROGRAM_ID,
  )[0];
}
