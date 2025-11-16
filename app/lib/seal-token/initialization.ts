// SEAL Token Initialization
// Functions to create and initialize the SEAL token

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token';
import { SEAL_TOKEN_CONFIG } from './config';

export interface SealTokenInitResult {
  mint: PublicKey;
  mintKeypair: Keypair;
  treasury: PublicKey;
  treasuryTokenAccount: PublicKey;
  transaction: Transaction;
  signers: Keypair[];
}

/**
 * Create SEAL token initialization transaction
 * This creates the mint, sets up treasury, and mints initial supply
 * 
 * @param payer - Account that will pay for the initialization
 * @param treasury - Treasury wallet address (if null, will use payer)
 * @param connection - Solana connection
 * @returns Initialization transaction and required signers
 */
export async function createSealTokenInitialization(
  payer: PublicKey,
  treasury: PublicKey | null,
  connection: Connection
): Promise<SealTokenInitResult> {
  // Use payer as treasury if not provided
  const treasuryPubkey = treasury || payer;
  
  // Generate mint keypair
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  
  // Get treasury token account (ATA)
  const treasuryTokenAccount = await getAssociatedTokenAddress(
    mint,
    treasuryPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  // Calculate rent for mint account
  const mintRent = await getMinimumBalanceForRentExemptMint(connection);
  
  // Create transaction
  const transaction = new Transaction();
  const signers: Keypair[] = [mintKeypair];
  
  // 1. Create mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint,
      space: MINT_SIZE,
      lamports: mintRent,
      programId: TOKEN_PROGRAM_ID,
    })
  );
  
  // 2. Initialize mint
  // No freeze authority (null) - tokens cannot be frozen
  transaction.add(
    createInitializeMintInstruction(
      mint,
      SEAL_TOKEN_CONFIG.decimals,
      treasuryPubkey, // Mint authority (treasury)
      null, // No freeze authority
      TOKEN_PROGRAM_ID
    )
  );
  
  // 3. Create treasury token account (ATA)
  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer, // Payer
      treasuryTokenAccount, // ATA address
      treasuryPubkey, // Owner
      mint, // Mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );
  
  // 4. Mint initial supply to treasury
  const initialSupply = BigInt(SEAL_TOKEN_CONFIG.totalSupply) * BigInt(Math.pow(10, SEAL_TOKEN_CONFIG.decimals));
  transaction.add(
    createMintToInstruction(
      mint,
      treasuryTokenAccount,
      treasuryPubkey, // Mint authority
      initialSupply,
      [],
      TOKEN_PROGRAM_ID
    )
  );
  
  return {
    mint,
    mintKeypair,
    treasury: treasuryPubkey,
    treasuryTokenAccount,
    transaction,
    signers,
  };
}

/**
 * Create distribution transaction
 * Distributes SEAL tokens from treasury to various recipients
 * 
 * @param mint - SEAL token mint address
 * @param treasury - Treasury wallet (mint authority and token account owner)
 * @param treasuryTokenAccount - Treasury's token account
 * @param distributions - Array of {recipient, amount} pairs
 * @param connection - Solana connection
 * @returns Distribution transaction
 */
export async function createDistributionTransaction(
  mint: PublicKey,
  treasury: PublicKey,
  treasuryTokenAccount: PublicKey,
  distributions: Array<{ recipient: PublicKey; amount: bigint }>,
  connection: Connection
): Promise<Transaction> {
  const transaction = new Transaction();
  
  for (const { recipient, amount } of distributions) {
    // Get recipient's ATA
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mint,
      recipient,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    // Check if ATA exists, if not, create it
    let recipientInfo;
    try {
      recipientInfo = await getAccount(connection, recipientTokenAccount);
    } catch {
      recipientInfo = null;
    }
    
    if (!recipientInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          treasury, // Payer
          recipientTokenAccount,
          recipient,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    
    // Transfer tokens from treasury to recipient
    transaction.add(
      createTransferInstruction(
        treasuryTokenAccount, // Source
        recipientTokenAccount, // Destination
        treasury, // Authority (treasury)
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }
  
  return transaction;
}

/**
 * Alternative: Mint directly to recipients (if treasury has mint authority)
 * Use this for initial distribution before revoking mint authority
 */
export async function createMintDistributionTransaction(
  mint: PublicKey,
  mintAuthority: PublicKey,
  distributions: Array<{ recipient: PublicKey; amount: bigint }>,
  connection: Connection
): Promise<Transaction> {
  const transaction = new Transaction();
  
  for (const { recipient, amount } of distributions) {
    // Get recipient's ATA
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mint,
      recipient,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    // Check if ATA exists, if not, create it
    let recipientInfo;
    try {
      recipientInfo = await getAccount(connection, recipientTokenAccount);
    } catch {
      recipientInfo = null;
    }
    
    if (!recipientInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          mintAuthority, // Payer
          recipientTokenAccount,
          recipient,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    
    // Mint directly to recipient
    transaction.add(
      createMintToInstruction(
        mint,
        recipientTokenAccount,
        mintAuthority, // Mint authority
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }
  
  return transaction;
}

/**
 * Revoke mint authority (makes supply fixed)
 * Call this after initial distribution to make the token immutable
 * 
 * @param mint - SEAL token mint
 * @param currentAuthority - Current mint authority (treasury)
 * @returns Transaction to revoke authority
 */
export function createRevokeMintAuthorityTransaction(
  mint: PublicKey,
  currentAuthority: PublicKey
): Transaction {
  const transaction = new Transaction();
  
  // Note: Revoking mint authority requires a SetAuthority instruction
  // This is a placeholder - implement with proper SPL Token instruction
  // transaction.add(createSetAuthorityInstruction(...));
  
  return transaction;
}

