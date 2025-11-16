/**
 * SEAL Token Airdrop
 * Airdrop SEAL tokens to beta testers on attestation mint
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token';
import { SEAL_TOKEN_ECONOMICS } from './config';
import { WalletContextState } from '@solana/wallet-adapter-react';

/**
 * Airdrop SEAL tokens to beta tester
 */
export async function airdropSealToBetaTester(
  connection: Connection,
  treasuryWallet: Keypair, // Treasury wallet that holds SEAL tokens
  recipientWallet: PublicKey
): Promise<string> {
  const sealMint = new PublicKey(SEAL_TOKEN_ECONOMICS.mint.address);
  const airdropAmount = SEAL_TOKEN_ECONOMICS.beta_tester.airdrop_amount;
  const decimals = SEAL_TOKEN_ECONOMICS.mint.decimals;
  
  // Calculate amount in smallest unit
  const amount = BigInt(airdropAmount) * BigInt(10 ** decimals);
  
  // Get recipient's associated token account
  const recipientATA = await getAssociatedTokenAddress(
    sealMint,
    recipientWallet
  );
  
  // Get treasury's associated token account
  const treasuryATA = await getAssociatedTokenAddress(
    sealMint,
    treasuryWallet.publicKey
  );
  
  const transaction = new Transaction();
  
  // Check if recipient ATA exists
  try {
    await getAccount(connection, recipientATA);
  } catch {
    // Create ATA if it doesn't exist
    transaction.add(
      createAssociatedTokenAccountInstruction(
        treasuryWallet.publicKey, // Payer
        recipientATA,
        recipientWallet,
        sealMint
      )
    );
  }
  
  // Add transfer instruction
  transaction.add(
    createTransferInstruction(
      treasuryATA,
      recipientATA,
      treasuryWallet.publicKey,
      amount
    )
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = treasuryWallet.publicKey;
  
  // Sign and send
  transaction.sign(treasuryWallet);
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [treasuryWallet],
    { commitment: 'confirmed' }
  );
  
  return signature;
}

/**
 * Check if user is eligible for airdrop
 */
export async function checkAirdropEligibility(
  connection: Connection,
  walletAddress: PublicKey
): Promise<{ eligible: boolean; reason?: string }> {
  // Check if user has beta tester attestation
  // This would call the beta tester check API
  try {
    const response = await fetch(
      `/api/verisol/beta-tester/check?wallet=${walletAddress.toString()}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.hasAttestation) {
        // Check if already received airdrop
        const sealMint = new PublicKey(SEAL_TOKEN_ECONOMICS.mint.address);
        const recipientATA = await getAssociatedTokenAddress(
          sealMint,
          walletAddress
        );
        
        try {
          const account = await getAccount(connection, recipientATA);
          const airdropAmount = SEAL_TOKEN_ECONOMICS.beta_tester.airdrop_amount;
          const decimals = SEAL_TOKEN_ECONOMICS.mint.decimals;
          const expectedAmount = BigInt(airdropAmount) * BigInt(10 ** decimals);
          
          // Check if balance is at least the airdrop amount
          if (account.amount >= expectedAmount) {
            return {
              eligible: false,
              reason: 'Airdrop already received',
            };
          }
        } catch {
          // ATA doesn't exist, eligible for airdrop
        }
        
        return { eligible: true };
      }
    }
    
    return {
      eligible: false,
      reason: 'Beta tester attestation not found',
    };
  } catch (error) {
    return {
      eligible: false,
      reason: `Error checking eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

