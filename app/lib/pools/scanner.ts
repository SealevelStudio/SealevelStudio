// Main scanner orchestrator that aggregates all DEX data

import { Connection } from '@solana/web3.js';
import { PoolData, ScannerState, ScannerConfig, DEFAULT_SCANNER_CONFIG, DEXProtocol } from './types';
import { PoolFetcher } from './fetchers/base';
import { RaydiumFetcher } from './fetchers/raydium';
import { OrcaFetcher } from './fetchers/orca';
import { JupiterFetcher } from './fetchers/jupiter';
import { MeteoraFetcher } from './fetchers/meteora';
import { LifinityFetcher } from './fetchers/lifinity';

export class PoolScanner {
  private fetchers: Map<DEXProtocol, PoolFetcher>;
  private state: ScannerState;

  constructor(config: Partial<ScannerConfig> = {}) {
    this.state = {
      pools: [],
      opportunities: [],
      isScanning: false,
      lastScanTime: null,
      errors: [],
      config: { ...DEFAULT_SCANNER_CONFIG, ...config },
    };

    // Initialize fetchers
    this.fetchers = new Map();
    this.fetchers.set('raydium', new RaydiumFetcher());
    this.fetchers.set('orca', new OrcaFetcher());
    this.fetchers.set('jupiter', new JupiterFetcher());
    this.fetchers.set('meteora', new MeteoraFetcher());
    this.fetchers.set('lifinity', new LifinityFetcher());
  }

  async scan(connection: Connection): Promise<ScannerState> {
    if (this.state.isScanning) {
      return this.state;
    }

    this.state.isScanning = true;
    this.state.errors = [];

    try {
      const allPools: PoolData[] = [];
      const enabledDEXs = this.state.config.enabledDEXs;

      // Fetch pools from each enabled DEX
      const fetchPromises = enabledDEXs.map(async (dex) => {
        const fetcher = this.fetchers.get(dex);
        if (!fetcher) {
          this.state.errors.push(`No fetcher found for DEX: ${dex}`);
          return;
        }

        try {
          const result = await fetcher.fetchPools(connection);
          allPools.push(...result.pools);
          
          if (result.errors && result.errors.length > 0) {
            this.state.errors.push(...result.errors);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.state.errors.push(`Error fetching ${dex}: ${errorMsg}`);
        }
      });

      await Promise.allSettled(fetchPromises);

      // Update state
      this.state.pools = allPools;
      this.state.lastScanTime = new Date();
      this.state.isScanning = false;

      return this.state;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.state.errors.push(`Scanner error: ${errorMsg}`);
      this.state.isScanning = false;
      return this.state;
    }
  }

  getState(): ScannerState {
    return { ...this.state };
  }

  updateConfig(config: Partial<ScannerConfig>): void {
    this.state.config = { ...this.state.config, ...config };
  }

  getPools(): PoolData[] {
    return [...this.state.pools];
  }

  getPoolsByDEX(dex: DEXProtocol): PoolData[] {
    return this.state.pools.filter(pool => pool.dex === dex);
  }

  getPoolsByToken(mint: string): PoolData[] {
    return this.state.pools.filter(
      pool => pool.tokenA.mint === mint || pool.tokenB.mint === mint
    );
  }

  getPoolById(poolId: string): PoolData | undefined {
    return this.state.pools.find(pool => pool.id === poolId);
  }

  async refreshPool(connection: Connection, poolId: string): Promise<PoolData | null> {
    const pool = this.getPoolById(poolId);
    if (!pool) {
      return null;
    }

    const fetcher = this.fetchers.get(pool.dex);
    if (!fetcher) {
      return null;
    }

    try {
      const updatedPool = await fetcher.fetchPoolById(connection, poolId);
      if (updatedPool) {
        // Update pool in state
        const index = this.state.pools.findIndex(p => p.id === poolId);
        if (index !== -1) {
          this.state.pools[index] = updatedPool;
        }
        return updatedPool;
      }
    } catch (error) {
      this.handleError(error, `refreshPool ${poolId}`);
    }

    return null;
  }

  private handleError(error: any, context: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PoolScanner] Error in ${context}:`, errorMessage);
    this.state.errors.push(`${context}: ${errorMessage}`);
  }
}

