// Solscan API Client

export interface SolscanAccountInfo {
  account: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  data?: any;
}

export interface SolscanTokenInfo {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenSupply: string;
  tokenPrice?: number;
  tokenLogoURI?: string;
}

export interface SolscanTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  fee: number;
  status: 'Success' | 'Failed';
  from: string;
  to: string;
  amount: number;
  token?: string;
}

/**
 * Get account information from Solscan
 */
export async function getSolscanAccountInfo(address: string): Promise<SolscanAccountInfo | null> {
  try {
    const response = await fetch(`/api/solscan?endpoint=account&address=${address}&action=info`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Solscan account info error:', error);
    return null;
  }
}

/**
 * Get account tokens from Solscan
 */
export async function getSolscanAccountTokens(address: string): Promise<SolscanTokenInfo[]> {
  try {
    const response = await fetch(`/api/solscan?endpoint=account&address=${address}&action=tokens`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Solscan account tokens error:', error);
    return [];
  }
}

/**
 * Get account transactions from Solscan
 */
export async function getSolscanAccountTransactions(
  address: string,
  limit: number = 50
): Promise<SolscanTransaction[]> {
  try {
    const response = await fetch(
      `/api/solscan?endpoint=account&address=${address}&action=transactions&limit=${limit}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Solscan account transactions error:', error);
    return [];
  }
}

/**
 * Get token information from Solscan
 */
export async function getSolscanTokenInfo(tokenAddress: string): Promise<SolscanTokenInfo | null> {
  try {
    const response = await fetch(`/api/solscan?endpoint=token&tokenAddress=${tokenAddress}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Solscan token info error:', error);
    return null;
  }
}

/**
 * Get token market data from Solscan
 */
export async function getSolscanTokenMarket(tokenAddress: string): Promise<{
  price: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
} | null> {
  try {
    const response = await fetch(`/api/solscan?endpoint=market&tokenAddress=${tokenAddress}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Solscan token market error:', error);
    return null;
  }
}

