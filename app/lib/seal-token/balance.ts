// SEAL Token Balance Utilities
// Functions to check and manage SEAL token balances

import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getSealMintAddress, formatSealAmount, SEAL_TOKEN_CONFIG } from './config';

/**
 * Get SEAL token balance for a wallet
 * 
 * @param connection - Solana connection
 * @param wallet - Wallet public key
 * @returns Balance in lamports (bigint) or null if account doesn't exist
 */
export async function getSealBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<bigint | null> {
  const mint = getSealMintAddress();
  if (!mint) {
    return null; // SEAL token not initialized yet
  }
  
  try {
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      wallet,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    const account = await getAccount(connection, tokenAccount);
    return account.amount;
  } catch (error) {
    // Account doesn't exist or other error
    return BigInt(0);
  }
}

/**
 * Get formatted SEAL token balance (human-readable)
 * 
 * @param connection - Solana connection
 * @param wallet - Wallet public key
 * @returns Formatted balance string (e.g., "1,000.5 SEAL") or "0 SEAL"
 */
export async function getFormattedSealBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<string> {
  const balance = await getSealBalance(connection, wallet);
  if (balance === null) {
    return '0 SEAL';
  }
  return `${formatSealAmount(balance)} SEAL`;
}

/**
 * Check if wallet has sufficient SEAL balance
 * 
 * @param connection - Solana connection
 * @param wallet - Wallet public key
 * @param requiredAmount - Required amount in lamports
 * @returns true if balance >= required amount
 */
export async function hasSufficientSealBalance(
  connection: Connection,
  wallet: PublicKey,
  requiredAmount: bigint
): Promise<boolean> {
  const balance = await getSealBalance(connection, wallet);
  if (balance === null) {
    return false;
  }
  return balance >= requiredAmount;
}

/**
 * Check if wallet has sufficient SEAL balance (using SEAL amount, not lamports)
 * 
 * @param connection - Solana connection
 * @param wallet - Wallet public key
 * @param requiredSeal - Required amount in SEAL (e.g., 10 for 10 SEAL)
 * @returns true if balance >= required amount
 */
export async function hasSufficientSeal(
  connection: Connection,
  wallet: PublicKey,
  requiredSeal: number
): Promise<boolean> {
  const requiredLamports = BigInt(requiredSeal) * BigInt(Math.pow(10, SEAL_TOKEN_CONFIG.decimals));
  return hasSufficientSealBalance(connection, wallet, requiredLamports);
}

/**
 * Get SEAL token account address for a wallet
 * 
 * @param wallet - Wallet public key
 * @returns Associated Token Account address or null if mint not initialized
 */
export async function getSealTokenAccount(
  wallet: PublicKey
): Promise<PublicKey | null> {
  const mint = getSealMintAddress();
  if (!mint) {
    return null;
  }
  
  return getAssociatedTokenAddress(
    mint,
    wallet,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

