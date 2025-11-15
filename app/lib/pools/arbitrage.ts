// Arbitrage detection algorithms (2-pool and multi-hop pathfinding)

import { Connection, PublicKey } from '@solana/web3.js';
import {
  PoolData,
  ArbitrageOpportunity,
  ArbitragePath,
  ArbitrageStep,
  ArbitragePathType,
  TokenInfo,
  WSOL_MINT,
  SOL_DECIMALS,
  ScannerConfig,
} from './types';

// Gas estimate constants (in lamports)
const BASE_TRANSACTION_FEE = 5000; // Base fee per transaction
const SWAP_INSTRUCTION_FEE = 2000; // Additional fee per swap instruction
const WRAP_UNWRAP_FEE = 10000; // Fee for wrapping/unwrapping SOL

export class ArbitrageDetector {
  private pools: PoolData[];
  private config: ScannerConfig;
  private connection: Connection;

  constructor(pools: PoolData[], config: ScannerConfig, connection: Connection) {
    this.pools = pools;
    this.config = config;
    this.connection = connection;
  }

  detectOpportunities(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // 1. Simple 2-pool arbitrage
    opportunities.push(...this.detectSimpleArbitrage());

    // 2. Multi-hop arbitrage
    opportunities.push(...this.detectMultiHopArbitrage());

    // 3. Wrapping/unwrapping arbitrage
    opportunities.push(...this.detectWrapUnwrapArbitrage());

    // Filter by minimum thresholds
    return opportunities.filter(
      opp =>
        opp.netProfit >= this.config.minProfitThreshold &&
        opp.profitPercent >= this.config.minProfitPercent
    );
  }

  private detectSimpleArbitrage(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Group pools by token pair
    const poolsByPair = new Map<string, PoolData[]>();
    
    for (const pool of this.pools) {
      const pairKey = this.getPairKey(pool.tokenA.mint, pool.tokenB.mint);
      if (!poolsByPair.has(pairKey)) {
        poolsByPair.set(pairKey, []);
      }
      poolsByPair.get(pairKey)!.push(pool);
    }

    // Find price differences for same token pairs
    for (const [pairKey, pools] of Array.from(poolsByPair.entries())) {
      if (pools.length < 2) continue;

      // Compare all pairs of pools
      for (let i = 0; i < pools.length; i++) {
        for (let j = i + 1; j < pools.length; j++) {
          const poolA = pools[i];
          const poolB = pools[j];

          // Check if prices differ significantly
          const priceDiff = Math.abs(poolA.price - poolB.price);
          const avgPrice = (poolA.price + poolB.price) / 2;
          const priceDiffPercent = (priceDiff / avgPrice) * 100;

          if (priceDiffPercent > this.config.minProfitPercent) {
            // Determine which direction is profitable
            const opportunity = this.calculateSimpleArbitrage(poolA, poolB);
            if (opportunity) {
              opportunities.push(opportunity);
            }
          }
        }
      }
    }

    return opportunities;
  }

  private detectMultiHopArbitrage(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const maxHops = this.config.maxHops;

    // Build graph of token connections
    const graph = this.buildTokenGraph();

    // Find cycles starting from each token
    const tokens = Array.from(graph.keys()).slice(0, 20); // Limit to first 20 tokens for performance
    
    for (const startToken of tokens) {
      const cycles = this.findProfitableCycles(startToken, graph, maxHops);
      opportunities.push(...cycles);
    }

    return opportunities;
  }

  private detectWrapUnwrapArbitrage(): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Find pools involving SOL and wSOL
    const solPools = this.pools.filter(
      p => p.tokenA.mint === WSOL_MINT || p.tokenB.mint === WSOL_MINT
    );

    const wsolPools = this.pools.filter(
      p => (p.tokenA.mint === WSOL_MINT || p.tokenB.mint === WSOL_MINT) &&
           p.dex !== 'jupiter' // Jupiter handles wrapping automatically
    );

    // Check if wrapping/unwrapping creates arbitrage
    for (const solPool of solPools) {
      for (const wsolPool of wsolPools) {
        if (solPool.id === wsolPool.id) continue;

        // Check SOL -> wSOL -> Token -> wSOL -> SOL path
        const opportunity = this.calculateWrapUnwrapArbitrage(solPool, wsolPool);
        if (opportunity) {
          opportunities.push(opportunity);
        }
      }
    }

    return opportunities;
  }

  private calculateSimpleArbitrage(
    poolA: PoolData,
    poolB: PoolData
  ): ArbitrageOpportunity | null {
    // Determine profitable direction
    const buyFromA = poolA.price < poolB.price;
    const sourcePool = buyFromA ? poolA : poolB;
    const destPool = buyFromA ? poolB : poolA;

    // Calculate optimal input amount (simplified - use 1 SOL worth)
    const inputAmount = BigInt(1_000_000_000); // 1 SOL
    const outputAmount = this.calculateSwapOutput(
      inputAmount,
      sourcePool.reserves.tokenA,
      sourcePool.reserves.tokenB,
      sourcePool.tokenA.decimals,
      sourcePool.tokenB.decimals,
      sourcePool.fee
    );

    // Swap back on second pool
    const finalAmount = this.calculateSwapOutput(
      outputAmount,
      destPool.reserves.tokenB,
      destPool.reserves.tokenA,
      destPool.tokenB.decimals,
      destPool.tokenA.decimals,
      destPool.fee
    );

    const profit = Number(finalAmount - inputAmount) / 1e9; // Convert to SOL
    const profitPercent = (profit / Number(inputAmount) * 1e9) * 100;
    const gasEstimate = BASE_TRANSACTION_FEE + (SWAP_INSTRUCTION_FEE * 2);
    const netProfit = profit - gasEstimate / 1e9;

    if (netProfit <= 0) {
      return null;
    }

    const steps: ArbitrageStep[] = [
      {
        pool: sourcePool,
        dex: sourcePool.dex,
        tokenIn: sourcePool.tokenA,
        tokenOut: sourcePool.tokenB,
        amountIn: inputAmount,
        amountOut: outputAmount,
        price: sourcePool.price,
        fee: sourcePool.fee,
      },
      {
        pool: destPool,
        dex: destPool.dex,
        tokenIn: destPool.tokenB,
        tokenOut: destPool.tokenA,
        amountIn: outputAmount,
        amountOut: finalAmount,
        price: 1 / destPool.price,
        fee: destPool.fee,
      },
    ];

    const path: ArbitragePath = {
      type: 'simple',
      steps,
      startToken: sourcePool.tokenA,
      endToken: sourcePool.tokenA,
      totalHops: 2,
    };

    return {
      id: `arb-${Date.now()}-${Math.random()}`,
      path,
      profit,
      profitPercent,
      inputAmount,
      outputAmount: finalAmount,
      gasEstimate,
      netProfit,
      confidence: this.calculateConfidence(profitPercent, 2),
      steps,
      timestamp: new Date(),
    };
  }

  private calculateMultiHopArbitrage(
    path: PoolData[],
    startToken: TokenInfo
  ): ArbitrageOpportunity | null {
    if (path.length < 2) return null;

    const inputAmount = BigInt(1_000_000_000); // 1 SOL worth
    let currentAmount = inputAmount;
    const steps: ArbitrageStep[] = [];

    // Execute swaps along the path
    for (let i = 0; i < path.length; i++) {
      const pool = path[i];
      const isFirst = i === 0;
      const prevStep = steps[steps.length - 1];

      const tokenIn = isFirst ? startToken : prevStep.tokenOut;
      const tokenOut = pool.tokenA.mint === tokenIn.mint ? pool.tokenB : pool.tokenA;

      const reservesIn = pool.tokenA.mint === tokenIn.mint 
        ? pool.reserves.tokenA 
        : pool.reserves.tokenB;
      const reservesOut = pool.tokenA.mint === tokenIn.mint 
        ? pool.reserves.tokenB 
        : pool.reserves.tokenA;

      const amountOut = this.calculateSwapOutput(
        currentAmount,
        reservesIn,
        reservesOut,
        tokenIn.decimals,
        tokenOut.decimals,
        pool.fee
      );

      steps.push({
        pool,
        dex: pool.dex,
        tokenIn,
        tokenOut,
        amountIn: currentAmount,
        amountOut,
        price: pool.price,
        fee: pool.fee,
      });

      currentAmount = amountOut;
    }

    // Check if we end up with more than we started
    const profit = Number(currentAmount - inputAmount) / 1e9;
    const profitPercent = (profit / Number(inputAmount) * 1e9) * 100;
    const gasEstimate = BASE_TRANSACTION_FEE + (SWAP_INSTRUCTION_FEE * path.length);
    const netProfit = profit - gasEstimate / 1e9;

    if (netProfit <= 0) {
      return null;
    }

    const arbitragePath: ArbitragePath = {
      type: path.length > 3 ? 'cross-protocol' : 'multihop',
      steps,
      startToken,
      endToken: startToken,
      totalHops: path.length,
    };

    return {
      id: `arb-mh-${Date.now()}-${Math.random()}`,
      path: arbitragePath,
      profit,
      profitPercent,
      inputAmount,
      outputAmount: currentAmount,
      gasEstimate,
      netProfit,
      confidence: this.calculateConfidence(profitPercent, path.length),
      steps,
      timestamp: new Date(),
    };
  }

  private calculateWrapUnwrapArbitrage(
    solPool: PoolData,
    wsolPool: PoolData
  ): ArbitrageOpportunity | null {
    // Simplified - would need more complex logic for actual wrap/unwrap arbitrage
    // This is a placeholder for the concept
    return null;
  }

  private calculateSwapOutput(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    decimalsIn: number,
    decimalsOut: number,
    feeBps: number
  ): bigint {
    if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
      return BigInt(0);
    }

    // Constant product formula: (x + dx) * (y - dy) = x * y
    // With fee: amountInWithFee = amountIn * (10000 - feeBps) / 10000
    const amountInWithFee = (amountIn * BigInt(10000 - feeBps)) / BigInt(10000);
    
    // Adjust for decimals
    const adjustedReserveIn = reserveIn;
    const adjustedReserveOut = reserveOut;
    
    // Calculate output: dy = (y * dx) / (x + dx)
    const numerator = adjustedReserveOut * amountInWithFee;
    const denominator = adjustedReserveIn + amountInWithFee;
    
    return numerator / denominator;
  }

  private buildTokenGraph(): Map<string, Map<string, PoolData[]>> {
    const graph = new Map<string, Map<string, PoolData[]>>();

    for (const pool of this.pools) {
      const tokenA = pool.tokenA.mint;
      const tokenB = pool.tokenB.mint;

      if (!graph.has(tokenA)) {
        graph.set(tokenA, new Map());
      }
      if (!graph.has(tokenB)) {
        graph.set(tokenB, new Map());
      }

      const connectionsA = graph.get(tokenA)!;
      if (!connectionsA.has(tokenB)) {
        connectionsA.set(tokenB, []);
      }
      connectionsA.get(tokenB)!.push(pool);

      const connectionsB = graph.get(tokenB)!;
      if (!connectionsB.has(tokenA)) {
        connectionsB.set(tokenA, []);
      }
      connectionsB.get(tokenA)!.push(pool);
    }

    return graph;
  }

  private findProfitableCycles(
    startToken: string,
    graph: Map<string, Map<string, PoolData[]>>,
    maxHops: number
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    const visited = new Set<string>();
    const path: PoolData[] = [];

    const dfs = (currentToken: string, targetToken: string, hops: number) => {
      if (hops > maxHops) return;
      if (hops > 0 && currentToken === targetToken) {
        // Found a cycle
        const tokenInfo = this.getTokenInfo(startToken);
        if (tokenInfo) {
          const opportunity = this.calculateMultiHopArbitrage([...path], tokenInfo);
          if (opportunity) {
            opportunities.push(opportunity);
          }
        }
        return;
      }

      if (visited.has(currentToken)) return;
      visited.add(currentToken);

      const connections = graph.get(currentToken);
      if (connections) {
        for (const [nextToken, pools] of Array.from(connections.entries())) {
          for (const pool of pools) {
            path.push(pool);
            dfs(nextToken, targetToken, hops + 1);
            path.pop();
          }
        }
      }

      visited.delete(currentToken);
    };

    dfs(startToken, startToken, 0);
    return opportunities;
  }

  private getPairKey(mintA: string, mintB: string): string {
    return [mintA, mintB].sort().join('-');
  }

  private getTokenInfo(mint: string): TokenInfo | null {
    for (const pool of this.pools) {
      if (pool.tokenA.mint === mint) return pool.tokenA;
      if (pool.tokenB.mint === mint) return pool.tokenB;
    }
    return null;
  }

  private calculateConfidence(profitPercent: number, hops: number): 'high' | 'medium' | 'low' {
    if (profitPercent > 1 && hops <= 2) return 'high';
    if (profitPercent > 0.5 && hops <= 3) return 'medium';
    return 'low';
  }
}

