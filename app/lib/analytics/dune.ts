// Dune Analytics API Client

export interface DuneQueryResult {
  execution_id: string;
  query_id: number;
  state: 'QUERY_STATE_PENDING' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_FAILED';
  submitted_at: string;
  expires_at: string;
  execution_started_at?: string;
  execution_ended_at?: string;
  result?: {
    rows: any[];
    metadata: {
      column_names: string[];
      result_set_bytes: number;
      total_row_count: number;
      datapoint_count: number;
      pending_time_millis: number;
      execution_time_millis: number;
    };
  };
}

export interface DuneQuery {
  query_id: number;
  name: string;
  description?: string;
  tags?: string[];
}

/**
 * Execute a Dune Analytics query
 */
export async function executeDuneQuery(queryId: number): Promise<DuneQueryResult> {
  try {
    const response = await fetch(`/api/dune/query?queryId=${queryId}&action=execute`);
    
    if (!response.ok) {
      throw new Error(`Dune API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Dune query execution error:', error);
    throw error;
  }
}

/**
 * Get Dune Analytics query results
 */
export async function getDuneQueryResults(queryId: number): Promise<DuneQueryResult> {
  try {
    const response = await fetch(`/api/dune/query?queryId=${queryId}&action=results`);
    
    if (!response.ok) {
      throw new Error(`Dune API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Dune query results error:', error);
    throw error;
  }
}

/**
 * Check Dune Analytics query execution status
 */
export async function getDuneQueryStatus(executionId: string): Promise<DuneQueryResult> {
  try {
    const response = await fetch(`/api/dune/query?queryId=${executionId}&action=status`);
    
    if (!response.ok) {
      throw new Error(`Dune API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Dune query status error:', error);
    throw error;
  }
}

/**
 * Popular Dune Analytics queries for Solana
 */
export const POPULAR_DUNE_QUERIES = {
  // Solana Network Stats
  SOL_PRICE: 123456, // Placeholder - replace with actual query ID
  SOL_SUPPLY: 123457,
  NETWORK_TPS: 123458,
  
  // Token Analytics
  TOP_TOKENS_BY_VOLUME: 123459,
  TOKEN_HOLDERS: 123460,
  
  // DeFi Analytics
  DEX_VOLUME: 123461,
  LIQUIDITY_POOLS: 123462,
  
  // NFT Analytics
  NFT_SALES: 123463,
  NFT_COLLECTIONS: 123464,
};

