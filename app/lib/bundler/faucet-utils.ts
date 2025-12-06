/**
 * Devnet Faucet Utilities
 * Helper functions for requesting SOL from devnet faucet
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

export interface FaucetRequestResult {
  success: boolean;
  signature?: string;
  amount?: number;
  error?: string;
  balance?: number;
  rpcEndpoint?: string;
}

export interface FaucetConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  minAmount?: number;
  maxAmount?: number;
  timeout?: number;
  useFallbackRPCs?: boolean;
}

// Fallback RPC endpoints for devnet
const DEVNET_RPC_ENDPOINTS = [
  'https://api.devnet.solana.com',
  'https://devnet.helius-rpc.com/?api-key=',
  'https://rpc.ankr.com/solana_devnet',
  'https://solana-devnet.g.alchemy.com/v2/',
  'https://devnet.sonic.game',
];

/**
 * Create connection with fallback RPC endpoints
 */
async function createConnectionWithFallback(
  currentEndpoint: string,
  timeout: number = 10000
): Promise<Connection> {
  // Try current endpoint first
  try {
    const testConnection = new Connection(currentEndpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: timeout,
    });
    
    // Quick health check
    await Promise.race([
      testConnection.getVersion(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);
    
    return testConnection;
  } catch (error) {
    console.warn(`⚠️  Primary RPC endpoint failed: ${currentEndpoint}`);
  }

  // Try fallback endpoints
  for (const endpoint of DEVNET_RPC_ENDPOINTS) {
    // Skip if it's the same as current
    if (endpoint === currentEndpoint || currentEndpoint.includes(endpoint)) {
      continue;
    }

    // Skip endpoints that need API keys if we don't have them
    if (endpoint.includes('api-key=') || endpoint.includes('/v2/')) {
      const apiKey = process.env.HELIUS_API_KEY || 
                     process.env.NEXT_PUBLIC_HELIUS_API_KEY ||
                     process.env.ALCHEMY_API_KEY;
      if (!apiKey) {
        continue;
      }
      const fullEndpoint = endpoint + apiKey;
      try {
        const testConnection = new Connection(fullEndpoint, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: timeout,
        });
        await Promise.race([
          testConnection.getVersion(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        console.log(`✅ Using fallback RPC: ${endpoint.replace(/api-key=.*|v2\/.*/, '***')}`);
        return testConnection;
      } catch {
        continue;
      }
    } else {
      try {
        const testConnection = new Connection(endpoint, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: timeout,
        });
        await Promise.race([
          testConnection.getVersion(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        console.log(`✅ Using fallback RPC: ${endpoint}`);
        return testConnection;
      } catch {
        continue;
      }
    }
  }

  // If all fail, return original connection (will fail with better error)
  return new Connection(currentEndpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: timeout,
  });
}

const DEFAULT_CONFIG: Required<FaucetConfig> = {
  maxRetries: 5, // Increased retries for rate limit handling
  retryDelayMs: 5000, // Start with 5 seconds, exponential backoff for rate limits
  minAmount: 0.001,
  maxAmount: 2.0, // Solana devnet typically allows up to 2 SOL per request
  timeout: 30000, // 30 second timeout for requests
  useFallbackRPCs: true, // Use fallback RPCs on timeout
};

/**
 * Request SOL from devnet faucet
 * Uses connection.requestAirdrop() which is the standard Solana method
 */
export async function requestFaucetAirdrop(
  connection: Connection,
  address: PublicKey | string,
  amount?: number,
  config?: FaucetConfig
): Promise<FaucetRequestResult> {
  const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const timeout = finalConfig.timeout || 30000; // 30 second default timeout
  
  // Generate random amount if not specified (between min and max)
  const airdropAmount = amount || 
    (Math.random() * (finalConfig.maxAmount - finalConfig.minAmount) + finalConfig.minAmount);
  
  const lamports = Math.floor(airdropAmount * LAMPORTS_PER_SOL);

  // Validate amount
  if (airdropAmount < finalConfig.minAmount || airdropAmount > finalConfig.maxAmount) {
    return {
      success: false,
      error: `Amount must be between ${finalConfig.minAmount} and ${finalConfig.maxAmount} SOL`,
    };
  }

  // Check if we're on devnet
  const endpoint = connection.rpcEndpoint;
  if (!endpoint.includes('devnet') && !endpoint.includes('localhost')) {
    return {
      success: false,
      error: 'Faucet is only available on devnet',
    };
  }

  // Try to get a working connection (with fallbacks if enabled)
  let workingConnection = connection;
  if (finalConfig.useFallbackRPCs !== false) {
    try {
      workingConnection = await createConnectionWithFallback(endpoint, timeout);
    } catch (error) {
      console.warn('⚠️  Could not establish fallback RPC, using original connection');
    }
  }

  // Retry logic with timeout and fallback RPC handling
  let lastError: Error | null = null;
  let isRateLimited = false;
  
  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      console.log(`💧 Requesting ${airdropAmount.toFixed(4)} SOL from faucet (attempt ${attempt}/${finalConfig.maxRetries})...`);
      console.log(`   RPC: ${workingConnection.rpcEndpoint.replace(/api-key=[^&]+/, 'api-key=***')}`);
      
      // Request airdrop with timeout
      const signature = await Promise.race([
        workingConnection.requestAirdrop(pubkey, lamports),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
      
      // Wait for confirmation with timeout
      await Promise.race([
        workingConnection.confirmTransaction(signature, 'confirmed'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Confirmation timeout')), timeout)
        )
      ]);
      
      // Get updated balance
      const balance = await Promise.race([
        workingConnection.getBalance(pubkey),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Balance check timeout')), 10000)
        )
      ]);
      
      console.log(`✅ Faucet request successful! Signature: ${signature}`);
      console.log(`💰 New balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      
      return {
        success: true,
        signature,
        amount: airdropAmount,
        balance: balance / LAMPORTS_PER_SOL,
        rpcEndpoint: workingConnection.rpcEndpoint,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message.toLowerCase();
      
      // Check for timeout or network errors
      const isTimeout = errorMessage.includes('timeout') || 
                        errorMessage.includes('timed out') ||
                        errorMessage.includes('operation timed out') ||
                        errorMessage.includes('cluster version query failed');
      
      // Check for rate limiting (429 or "too many requests")
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('too many requests') || 
                          errorMessage.includes('rate limit');
      
      if (isTimeout) {
        console.warn(`⚠️  RPC timeout (attempt ${attempt}). Trying fallback RPC...`);
        
        // Try to get a different RPC endpoint
        if (finalConfig.useFallbackRPCs !== false && attempt < finalConfig.maxRetries) {
          try {
            workingConnection = await createConnectionWithFallback(endpoint, timeout);
            console.log(`   Switched to: ${workingConnection.rpcEndpoint.replace(/api-key=[^&]+/, 'api-key=***')}`);
          } catch {
            // Fallback failed, continue with retry
            console.warn(`   Fallback RPC failed, will retry with current connection`);
          }
        }
        
        // Wait before retry
        if (attempt < finalConfig.maxRetries) {
          const backoffDelay = Math.min(
            finalConfig.retryDelayMs * attempt,
            10000 // Max 10 seconds for timeout retries
          );
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      } else if (isRateLimit) {
        isRateLimited = true;
        const backoffDelay = Math.min(
          finalConfig.retryDelayMs * Math.pow(2, attempt - 1),
          30000 // Max 30 seconds
        );
        
        console.warn(`⚠️  Rate limited (429). Waiting ${(backoffDelay / 1000).toFixed(1)}s before retry...`);
        
        // Wait before retry (except on last attempt)
        if (attempt < finalConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      } else {
        console.warn(`⚠️  Faucet request attempt ${attempt} failed:`, lastError.message);
        
        // Wait before retry (except on last attempt)
        if (attempt < finalConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelayMs));
        }
      }
    }
  }

  // Provide helpful error message
  const errorMsg = lastError?.message.toLowerCase() || '';
  if (isRateLimited) {
    return {
      success: false,
      error: `Rate limited by faucet. Please wait a few minutes and try again, or use manual funding: https://faucet.solana.com/`,
      rpcEndpoint: workingConnection.rpcEndpoint,
    };
  }
  
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out') || errorMsg.includes('cluster version query failed')) {
    return {
      success: false,
      error: `RPC timeout. The network may be slow or the RPC endpoint is down. Try again later or use manual funding: https://faucet.solana.com/`,
      rpcEndpoint: workingConnection.rpcEndpoint,
    };
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to request airdrop after all retries',
    rpcEndpoint: workingConnection.rpcEndpoint,
  };
}

/**
 * Ensure wallet has minimum balance, request from faucet if needed
 */
export async function ensureMinimumBalance(
  connection: Connection,
  address: PublicKey | string,
  minBalanceSol: number,
  config?: FaucetConfig
): Promise<FaucetRequestResult> {
  const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
  
  // Check current balance
  const currentBalance = await connection.getBalance(pubkey);
  const currentBalanceSol = currentBalance / LAMPORTS_PER_SOL;
  
  console.log(`🔍 Current balance: ${currentBalanceSol.toFixed(4)} SOL`);
  
  if (currentBalanceSol >= minBalanceSol) {
    return {
      success: true,
      balance: currentBalanceSol,
      amount: 0,
    };
  }

  // Calculate needed amount
  const needed = minBalanceSol - currentBalanceSol;
  const requestAmount = Math.ceil(needed * 1.1); // Request 10% more to account for fees
  
  console.log(`💰 Need ${needed.toFixed(4)} SOL, requesting ${requestAmount.toFixed(4)} SOL from faucet...`);
  
  return await requestFaucetAirdrop(connection, pubkey, requestAmount, config);
}

/**
 * Test faucet functionality
 */
export async function testFaucetFunctionality(
  connection: Connection,
  testAddress: PublicKey | string
): Promise<{ working: boolean; error?: string; details?: any }> {
  try {
    const pubkey = typeof testAddress === 'string' ? new PublicKey(testAddress) : testAddress;
    
    // Try a small request
    const result = await requestFaucetAirdrop(connection, pubkey, 0.1, {
      maxRetries: 1,
      retryDelayMs: 1000,
    });
    
    if (result.success) {
      return {
        working: true,
        details: {
          signature: result.signature,
          amount: result.amount,
          balance: result.balance,
        },
      };
    } else {
      return {
        working: false,
        error: result.error,
      };
    }
  } catch (error) {
    return {
      working: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

