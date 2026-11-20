import {
  AnchorProvider,
  Program,
  type Idl,
  type Provider,
} from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import type { Connection, PublicKey } from "@solana/web3.js";
import idlJson from "@/lib/idl/man_amm.json";
import type { ManAmm } from "@/lib/idl/man_amm";

export const IDL = idlJson as unknown as Idl;

export type PoolAccount = {
  mintA: PublicKey;
  mintB: PublicKey;
  vaultA: PublicKey;
  vaultB: PublicKey;
  lpMint: PublicKey;
  feeBps: number;
  poolBump: number;
  authorityBump: number;
};

export function readProgram(connection: Connection): Program<ManAmm> {
  return new Program<ManAmm>(IDL, { connection } as unknown as Provider);
}

export function writeProgram(
  connection: Connection,
  wallet: AnchorWallet,
): Program<ManAmm> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  return new Program<ManAmm>(IDL, provider);
}
