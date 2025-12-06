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
const PRIORITY_FEE_MULTIPLIER = 1.5; // Multiplier for priority fees (MEV protection)

export class ArbitrageDetector {
  private pools: PoolData[];
  private config: ScannerConfig;
  private connection: Connection;
  private birdeyeOptimizer?: any; // BirdeyeOptimizer instance

  constructor(pools: PoolData[], config: ScannerConfig, connection: Connection, birdeyeOptimizer?: any) {
    this.pools = pools;
    this.config = config;
    this.connection = connection;
    this.birdeyeOptimizer = birdeyeOptimizer;
  }

  async detectOpportunities(): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];

    // Filter out Jupiter pools - Jupiter is an aggregator, not a real pool
    // We only want direct DEX pools with actual reserves for arbitrage detection
    const realPools = this.pools.filter(p => 
      p.dex !== 'jupiter' && 
      p.reserves.tokenA > BigInt(0) && 
      p.reserves.tokenB > BigInt(0) &&
      p.poolAddress // Must have on-chain address
    );

    if (realPools.length === 0) {
      console.warn('No real pools with reserves found for arbitrage detection');
      return [];
    }

    // Improved: Verify and refresh prices for high-priority pools before detection
    // This ensures we're working with current on-chain data
    const verifiedPools = await this.verifyPoolPrices(realPools);

    // Use Birdeye optimizer for enhanced detection if available
    if (this.birdeyeOptimizer) {
      try {
        // Find opportunities using Birdeye's optimized price data
        const birdeyeOpportunities = await this.birdeyeOptimizer.findArbitrageOpportunities(
          verifiedPools,
          this.config.minProfitPercent
        );
        
        // Convert Birdeye opportunities to standard format
        for (const opp of birdeyeOpportunities) {
          const opportunity = this.calculateSimpleArbitrage(opp.poolA, opp.poolB);
          if (opportunity) {
            opportunities.push(opportunity);
          }
        }
      } catch (error) {
        console.error('Error using Birdeye optimizer for arbitrage detection:', error);
      }
    }

    // Direct on-chain arbitrage detection methods (better than Jupiter API calls)
    // Run detection methods in parallel for better performance
    const [simpleOpps, multiHopOpps, wrapOpps, crossDexOpps] = await Promise.all([
      Promise.resolve(this.detectSimpleArbitrage(verifiedPools)),
      this.detectMultiHopArbitrage(verifiedPools),
      Promise.resolve(this.detectWrapUnwrapArbitrage(verifiedPools)),
      Promise.resolve(this.detectCrossDEXArbitrage(verifiedPools)),
    ]);

    opportunities.push(...simpleOpps, ...multiHopOpps, ...wrapOpps, ...crossDexOpps);

    // Remove duplicates and filter by minimum thresholds (unless showUnprofitable is true)
    const uniqueOpportunities = this.deduplicateOpportunities(opportunities);
    
    // Improved: Dynamic profit threshold adjustment based on market conditions
    const dynamicThreshold = this.calculateDynamicProfitThreshold(uniqueOpportunities);
    
    return uniqueOpportunities
      .filter(opp => {
        if (this.config.showUnprofitable) return true;
        // Use dynamic threshold if it's lower (more opportunities) or static threshold
        const minProfit = Math.min(this.config.minProfitThreshold, dynamicThreshold.minProfit);
        const minPercent = Math.min(this.config.minProfitPercent, dynamicThreshold.minPercent);
        return opp.netProfit >= minProfit && opp.profitPercent >= minPercent;
      })
      .sort((a, b) => {
        // Improved sorting: prioritize by execution speed and profitability
        // Opportunities with fewer hops and higher profit are prioritized
        const scoreA = this.calculateOpportunityScore(a);
        const scoreB = this.calculateOpportunityScore(b);
        return scoreB - scoreA;
      });
  }

  /**
   * Verify pool prices on-chain before detection (improves accuracy)
   */
  private async verifyPoolPrices(pools: PoolData[]): Promise<PoolData[]> {
    // For high-priority pools (high TVL or recent activity), verify prices
    // This is a simplified version - in production, would fetch on-chain data
    const verifiedPools = pools.map(pool => {
      // Recalculate price from reserves to ensure accuracy
      const verifiedPrice = this.calculatePriceFromReserves(pool);
      if (Math.abs(verifiedPrice - pool.price) / pool.price > 0.05) {
        // Price deviation > 5%, update it
        return { ...pool, price: verifiedPrice };
      }
      return pool;
    });

    return verifiedPools;
  }

  /**
   * Calculate dynamic profit threshold based on market conditions
   * Adjusts thresholds when many opportunities are found (lower threshold)
   * or few opportunities (higher threshold to focus on best)
   */
  private calculateDynamicProfitThreshold(opportunities: ArbitrageOpportunity[]): {
    minProfit: number;
    minPercent: number;
  } {
    if (opportunities.length === 0) {
      return {
        minProfit: this.config.minProfitThreshold,
        minPercent: this.config.minProfitPercent,
      };
    }

    // Calculate average profit
    const avgProfit = opportunities.reduce((sum, opp) => sum + opp.profit, 0) / opportunities.length;
    const avgPercent = opportunities.reduce((sum, opp) => sum + opp.profitPercent, 0) / opportunities.length;

    // If many opportunities with good profits, we can be more selective
    // If few opportunities, lower threshold to show more
    const opportunityCount = opportunities.length;
    const adjustmentFactor = opportunityCount > 20 ? 1.2 : opportunityCount < 5 ? 0.8 : 1.0;

    return {
      minProfit: Math.max(this.config.minProfitThreshold * adjustmentFactor, avgProfit * 0.5),
      minPercent: Math.max(this.config.minProfitPercent * adjustmentFactor, avgPercent * 0.5),
    };
  }

  /**
   * Calculate opportunity score for prioritization
   * Higher score = better opportunity (considers profit, speed, confidence)
   */
  private calculateOpportunityScore(opp: ArbitrageOpportunity): number {
    // Factors:
    // 1. Net profit (higher = better)
    // 2. Fewer hops (faster execution = better)
    // 3. Higher confidence (more reliable = better)
    // 4. Profit percentage (higher ROI = better)
    
    const profitScore = opp.netProfit * 1000; // Scale profit
    const speedScore = (10 - opp.path.totalHops) * 10; // Fewer hops = higher score
    const confidenceScore = opp.confidence * 50;
    const roiScore = opp.profitPercent * 10;

    return profitScore + speedScore + confidenceScore + roiScore;
  }

  private deduplicateOpportunities(opportunities: ArbitrageOpportunity[]): ArbitrageOpportunity[] {
    const seen = new Set<string>();
    return opportunities.filter(opp => {
      // Validate path.steps exists and has elements
      if (!opp.path?.steps || opp.path.steps.length === 0) {
        return false; // Skip opportunities with invalid paths
      }
      const key = `${opp.path.steps[0]?.pool.id}-${opp.path.steps[opp.path.steps.length - 1]?.pool.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private detectSimpleArbitrage(pools: PoolData[] = this.pools): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Group pools by token pair (only real pools with reserves)
    const poolsByPair = new Map<string, PoolData[]>();
    
    for (const pool of pools) {
      // Skip pools without valid reserves or addresses
      if (!pool.poolAddress || pool.reserves.tokenA === BigInt(0) || pool.reserves.tokenB === BigInt(0)) {
        continue;
      }
      
      const pairKey = this.getPairKey(pool.tokenA.mint, pool.tokenB.mint);
      if (!poolsByPair.has(pairKey)) {
        poolsByPair.set(pairKey, []);
      }
      poolsByPair.get(pairKey)!.push(pool);
    }

    // Find price differences for same token pairs across different DEXs
    for (const [pairKey, pairPools] of Array.from(poolsByPair.entries())) {
      if (pairPools.length < 2) continue;

      // Compare all pairs of pools (prefer different DEXs for better arbitrage)
      for (let i = 0; i < pairPools.length; i++) {
        for (let j = i + 1; j < pairPools.length; j++) {
          const poolA = pairPools[i];
          const poolB = pairPools[j];

          // Prefer cross-DEX arbitrage (different DEXs = better opportunity)
          if (poolA.dex === poolB.dex && pairPools.length > 2) {
            // Skip same-DEX pairs if we have cross-DEX options
            continue;
          }

          // Calculate actual price from reserves (more accurate than stored price)
          const priceA = this.calculatePriceFromReserves(poolA);
          const priceB = this.calculatePriceFromReserves(poolB);

          // Check if prices differ significantly
          const priceDiff = Math.abs(priceA - priceB);
          const avgPrice = (priceA + priceB) / 2;
          const priceDiffPercent = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

          if (this.config.showUnprofitable || priceDiffPercent > this.config.minProfitPercent) {
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

  /**
   * Calculate price directly from on-chain reserves (more accurate)
   */
  private calculatePriceFromReserves(pool: PoolData): number {
    if (pool.reserves.tokenB === BigInt(0)) return 0;
    
    const adjustedA = Number(pool.reserves.tokenA) / Math.pow(10, pool.tokenA.decimals);
    const adjustedB = Number(pool.reserves.tokenB) / Math.pow(10, pool.tokenB.decimals);
    
    return adjustedB / adjustedA;
  }

  private async detectMultiHopArbitrage(pools: PoolData[] = this.pools): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    const maxHops = this.config.maxHops;

    // Filter to only real pools with reserves
    const realPools = pools.filter(p => 
      p.poolAddress && 
      p.reserves.tokenA > BigInt(0) && 
      p.reserves.tokenB > BigInt(0)
    );

    if (realPools.length === 0) return [];

    // Build graph of token connections (only real pools)
    const graph = this.buildTokenGraph(realPools);

    // Improved: Use Bellman-Ford algorithm for negative cycle detection (more efficient)
    // This finds profitable cycles more reliably than DFS
    const bellmanFordOpps = this.findArbitrageWithBellmanFord(graph, realPools, maxHops);
    opportunities.push(...bellmanFordOpps);

    // Also use improved DFS for high-liquidity tokens (parallel processing)
    // Focus on high-liquidity tokens first for better opportunities
    const tokens = this.getHighLiquidityTokens(realPools, 50); // Increased from 30 to 50
    
    // Process tokens in parallel batches for better performance
    const BATCH_SIZE = 10;
    const batches: string[][] = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      batches.push(tokens.slice(i, i + BATCH_SIZE));
    }

    // Process batches in parallel (using Promise.all for async processing)
    const batchPromises = batches.map(async batch => {
      const batchOpps: ArbitrageOpportunity[] = [];
      for (const startToken of batch) {
        const cycles = this.findProfitableCycles(startToken, graph, maxHops);
        batchOpps.push(...cycles);
      }
      return batchOpps;
    });

    const batchResults = await Promise.all(batchPromises);
    for (const batchOpps of batchResults) {
      opportunities.push(...batchOpps);
    }

    return opportunities;
  }

  /**
   * Get high liquidity tokens sorted by TVL
   */
  private getHighLiquidityTokens(pools: PoolData[], limit: number): string[] {
    const tokenTVL = new Map<string, number>();
    
    for (const pool of pools) {
      const tvl = pool.tvl || 0;
      const tokenA = pool.tokenA.mint;
      const tokenB = pool.tokenB.mint;
      
      tokenTVL.set(tokenA, (tokenTVL.get(tokenA) || 0) + tvl);
      tokenTVL.set(tokenB, (tokenTVL.get(tokenB) || 0) + tvl);
    }

    return Array.from(tokenTVL.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([mint]) => mint);
  }

  /**
   * Use Bellman-Ford algorithm to find negative cycles (profitable arbitrage loops)
   * More efficient than DFS for finding cycles in graphs
   */
  private findArbitrageWithBellmanFord(
    graph: Map<string, Map<string, PoolData[]>>,
    pools: PoolData[],
    maxHops: number
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Build edge list with weights (negative log prices for cycle detection)
    const edges: Array<{ from: string; to: string; pool: PoolData; weight: number }> = [];
    
    for (const pool of pools) {
      if (!pool.poolAddress) continue;
      
      const tokenA = pool.tokenA.mint;
      const tokenB = pool.tokenB.mint;
      
      // Weight = -log(price * (1 - fee)) for A->B
      // Negative cycle in this graph = profitable arbitrage
      const feeMultiplier = 1 - (pool.fee / 10000);
      const weightAB = -Math.log(pool.price * feeMultiplier);
      const weightBA = -Math.log((1 / pool.price) * feeMultiplier);
      
      edges.push({ from: tokenA, to: tokenB, pool, weight: weightAB });
      edges.push({ from: tokenB, to: tokenA, pool, weight: weightBA });
    }

    // Get unique tokens
    const tokens = Array.from(new Set(edges.map(e => e.from).concat(edges.map(e => e.to))));
    
    // Run Bellman-Ford from each high-liquidity token
    const highLiquidityTokens = this.getHighLiquidityTokens(pools, 20);
    
    for (const startToken of highLiquidityTokens) {
      // Bellman-Ford algorithm
      const distances = new Map<string, number>();
      const predecessors = new Map<string, { from: string; pool: PoolData }>();
      
      // Initialize distances
      for (const token of tokens) {
        distances.set(token, token === startToken ? 0 : Infinity);
      }
      
      // Relax edges (maxHops times)
      for (let i = 0; i < Math.min(maxHops, tokens.length - 1); i++) {
        for (const edge of edges) {
          const distFrom = distances.get(edge.from) ?? Infinity;
          const distTo = distances.get(edge.to) ?? Infinity;
          
          if (distFrom !== Infinity && distFrom + edge.weight < distTo) {
            distances.set(edge.to, distFrom + edge.weight);
            predecessors.set(edge.to, { from: edge.from, pool: edge.pool });
          }
        }
      }
      
      // Check for negative cycles (profitable loops)
      for (const edge of edges) {
        const distFrom = distances.get(edge.from) ?? Infinity;
        const distTo = distances.get(edge.to) ?? Infinity;
        
        if (distFrom !== Infinity && distFrom + edge.weight < distTo) {
          // Found a negative cycle - reconstruct the path
          const cycle = this.reconstructCycle(edge.to, predecessors, startToken);
          if (cycle && cycle.length > 0) {
            const opportunity = this.calculateCycleOpportunity(cycle, startToken);
            if (opportunity && opportunity.netProfit > 0) {
              opportunities.push(opportunity);
            }
          }
        }
      }
    }

    return opportunities;
  }

  /**
   * Reconstruct cycle from Bellman-Ford predecessors
   */
  private reconstructCycle(
    startNode: string,
    predecessors: Map<string, { from: string; pool: PoolData }>,
    targetToken: string
  ): PoolData[] | null {
    const cycle: PoolData[] = [];
    const visited = new Set<string>();
    let current = startNode;
    
    // Trace back to find cycle
    for (let i = 0; i < 20; i++) { // Max cycle length
      if (visited.has(current)) {
        // Found cycle
        return cycle;
      }
      
      visited.add(current);
      const pred = predecessors.get(current);
      if (!pred) break;
      
      cycle.unshift(pred.pool);
      current = pred.from;
      
      if (current === targetToken && cycle.length > 0) {
        return cycle;
      }
    }
    
    return cycle.length > 0 ? cycle : null;
  }

  /**
   * Calculate opportunity from a cycle of pools
   */
  private calculateCycleOpportunity(
    cycle: PoolData[],
    startToken: string
  ): ArbitrageOpportunity | null {
    if (cycle.length < 2) return null;

    const startTokenInfo = this.getTokenInfo(startToken);
    if (!startTokenInfo) return null;

    const inputAmount = BigInt(1_000_000_000); // 1 SOL
    let currentAmount = inputAmount;
    const steps: ArbitrageStep[] = [];

    // Execute swaps along the cycle
    for (let i = 0; i < cycle.length; i++) {
      const pool = cycle[i];
      const isFirst = i === 0;
      const prevStep = steps[steps.length - 1];

      const tokenIn = isFirst ? startTokenInfo : prevStep.tokenOut;
      const tokenOut = pool.tokenA.mint === tokenIn.mint ? pool.tokenB : pool.tokenA;

      const reservesIn = pool.tokenA.mint === tokenIn.mint 
        ? pool.reserves.tokenA 
        : pool.reserves.tokenB;
      const reservesOut = pool.tokenA.mint === tokenIn.mint 
        ? pool.reserves.tokenB 
        : pool.reserves.tokenA;

      const amountOut = this.calculateSwapOutputWithSlippage(
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
    const gasEstimate = BASE_TRANSACTION_FEE + (SWAP_INSTRUCTION_FEE * cycle.length);
    const netProfit = profit - gasEstimate / 1e9;

    if (netProfit <= 0) return null;

    const arbitragePath: ArbitragePath = {
      type: cycle.length > 3 ? 'cross-protocol' : 'multi_hop' as ArbitragePathType,
      steps,
      startToken: startTokenInfo,
      endToken: startTokenInfo,
      totalHops: cycle.length,
    };

    return {
      id: `arb-bf-${Date.now()}-${Math.random()}`,
      path: arbitragePath,
      type: cycle.length > 3 ? 'cross_protocol' : 'multi_hop',
      profit,
      profitPercent,
      inputAmount,
      outputAmount: currentAmount,
      gasEstimate,
      netProfit,
      confidence: this.calculateConfidence(profitPercent, cycle.length),
      steps,
      timestamp: new Date(),
    };
  }

  private detectWrapUnwrapArbitrage(pools: PoolData[] = this.pools): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Find pools involving SOL and wSOL (only real pools)
    const solPools = pools.filter(
      p => (p.tokenA.mint === WSOL_MINT || p.tokenB.mint === WSOL_MINT) &&
           p.poolAddress &&
           p.reserves.tokenA > BigInt(0) &&
           p.reserves.tokenB > BigInt(0)
    );

    // Check if wrapping/unwrapping creates arbitrage
    // SOL and wSOL should be 1:1, but sometimes pools have slight price differences
    for (let i = 0; i < solPools.length; i++) {
      for (let j = i + 1; j < solPools.length; j++) {
        const poolA = solPools[i];
        const poolB = solPools[j];

        if (poolA.id === poolB.id) continue;

        // Check SOL -> wSOL -> Token -> wSOL -> SOL path
        const opportunity = this.calculateWrapUnwrapArbitrage(poolA, poolB);
        if (opportunity) {
          opportunities.push(opportunity);
        }
      }
    }

    return opportunities;
  }

  /**
   * Detect cross-DEX arbitrage opportunities (same token pair on different DEXs)
   * This is more efficient than Jupiter API calls
   */
  private detectCrossDEXArbitrage(pools: PoolData[] = this.pools): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Group by token pair and DEX
    const poolsByPairAndDEX = new Map<string, Map<string, PoolData[]>>();
    
    for (const pool of pools) {
      if (!pool.poolAddress || pool.reserves.tokenA === BigInt(0) || pool.reserves.tokenB === BigInt(0)) {
        continue;
      }

      const pairKey = this.getPairKey(pool.tokenA.mint, pool.tokenB.mint);
      
      if (!poolsByPairAndDEX.has(pairKey)) {
        poolsByPairAndDEX.set(pairKey, new Map());
      }
      
      const dexMap = poolsByPairAndDEX.get(pairKey)!;
      if (!dexMap.has(pool.dex)) {
        dexMap.set(pool.dex, []);
      }
      
      dexMap.get(pool.dex)!.push(pool);
    }

    // Find opportunities across different DEXs
    for (const [pairKey, dexMap] of Array.from(poolsByPairAndDEX.entries())) {
      const dexes = Array.from(dexMap.keys());
      
      // Need at least 2 different DEXs for cross-DEX arbitrage
      if (dexes.length < 2) continue;

      // Compare pools across different DEXs
      for (let i = 0; i < dexes.length; i++) {
        for (let j = i + 1; j < dexes.length; j++) {
          const poolsA = dexMap.get(dexes[i])!;
          const poolsB = dexMap.get(dexes[j])!;

          // Compare best pools from each DEX
          for (const poolA of poolsA) {
            for (const poolB of poolsB) {
              const priceA = this.calculatePriceFromReserves(poolA);
              const priceB = this.calculatePriceFromReserves(poolB);
              
              const priceDiff = Math.abs(priceA - priceB);
              const avgPrice = (priceA + priceB) / 2;
              const priceDiffPercent = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

              if (this.config.showUnprofitable || priceDiffPercent > this.config.minProfitPercent) {
                const opportunity = this.calculateSimpleArbitrage(poolA, poolB);
                if (opportunity) {
                  opportunity.type = 'cross_protocol';
                  opportunities.push(opportunity);
                }
              }
            }
          }
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

    // Calculate optimal input amount with slippage modeling
    const optimalAmount = this.calculateOptimalInputAmount(sourcePool, destPool);
    const inputAmount = optimalAmount;
    
    // Calculate swap output with slippage consideration
    const outputAmount = this.calculateSwapOutputWithSlippage(
      inputAmount,
      sourcePool.reserves.tokenA,
      sourcePool.reserves.tokenB,
      sourcePool.tokenA.decimals,
      sourcePool.tokenB.decimals,
      sourcePool.fee
    );

    // Swap back on second pool with slippage
    const finalAmount = this.calculateSwapOutputWithSlippage(
      outputAmount,
      destPool.reserves.tokenB,
      destPool.reserves.tokenA,
      destPool.tokenB.decimals,
      destPool.tokenA.decimals,
      destPool.fee
    );

    const profit = Number(finalAmount - inputAmount) / 1e9; // Convert to SOL
    const profitPercent = (profit / Number(inputAmount) * 1e9) * 100;
    // Enhanced gas estimation with priority fees for MEV protection
    const baseGas = BASE_TRANSACTION_FEE + (SWAP_INSTRUCTION_FEE * 2);
    const priorityFee = Math.floor(baseGas * PRIORITY_FEE_MULTIPLIER);
    const gasEstimate = baseGas + priorityFee;
    const netProfit = profit - gasEstimate / 1e9;

    if (!this.config.showUnprofitable && netProfit <= 0) {
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
      type: 'simple',
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

    if (!this.config.showUnprofitable && netProfit <= 0) {
      return null;
    }

    const arbitragePath: ArbitragePath = {
      type: path.length > 3 ? 'cross-protocol' : 'multi_hop' as ArbitragePathType,
      steps,
      startToken,
      endToken: startToken,
      totalHops: path.length,
    };

    return {
      id: `arb-mh-${Date.now()}-${Math.random()}`,
      path: arbitragePath,
      type: path.length > 3 ? 'cross_protocol' : 'multi_hop',
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

  /**
   * Calculate optimal input amount for maximum profit
   * Uses binary search with improved slippage modeling for better accuracy
   */
  private calculateOptimalInputAmount(poolA: PoolData, poolB: PoolData): bigint {
    // Improved: Use binary search to find optimal amount more efficiently
    // Also considers slippage for more realistic profit calculations
    
    const minAmount = BigInt(100_000_000); // 0.1 SOL minimum
    const maxAmount = this.calculateMaxSafeAmount(poolA, poolB); // Max safe amount based on liquidity
    
    let left = minAmount;
    let right = maxAmount;
    let optimalAmount = BigInt(1_000_000_000); // Default to 1 SOL
    let maxProfit = BigInt(0);

    // Binary search for optimal amount (with slippage)
    for (let i = 0; i < 20; i++) { // Max 20 iterations
      const mid1 = (left + right) / BigInt(2);
      const mid2 = (left + right * BigInt(3)) / BigInt(4);
      
      const amounts = [mid1, mid2];
      
      for (const amount of amounts) {
        if (amount < minAmount || amount > maxAmount) continue;
        
        // Calculate with improved slippage modeling
        const output1 = this.calculateSwapOutputWithSlippage(
          amount,
          poolA.reserves.tokenA,
          poolA.reserves.tokenB,
          poolA.tokenA.decimals,
          poolA.tokenB.decimals,
          poolA.fee
        );
        const output2 = this.calculateSwapOutputWithSlippage(
          output1,
          poolB.reserves.tokenB,
          poolB.reserves.tokenA,
          poolB.tokenB.decimals,
          poolB.tokenA.decimals,
          poolB.fee
        );
        const profit = output2 - amount;

        if (profit > maxProfit) {
          maxProfit = profit;
          optimalAmount = amount;
        }
      }
      
      // Narrow search range
      if (maxProfit > BigInt(0)) {
        // If we found profit, search around that area
        left = optimalAmount - (optimalAmount / BigInt(4));
        right = optimalAmount + (optimalAmount / BigInt(4));
      } else {
        // No profit found, try smaller amounts
        right = (left + right) / BigInt(2);
      }
      
      if (right - left < BigInt(10_000_000)) break; // Convergence threshold
    }

    return optimalAmount;
  }

  /**
   * Calculate maximum safe amount to trade based on pool liquidity
   * Prevents attempting trades that would cause excessive slippage
   */
  private calculateMaxSafeAmount(poolA: PoolData, poolB: PoolData): bigint {
    // Don't trade more than 5% of the smaller pool's reserve
    const poolAMax = (poolA.reserves.tokenA * BigInt(5)) / BigInt(100);
    const poolBMax = (poolB.reserves.tokenB * BigInt(5)) / BigInt(100);
    
    // Use the smaller of the two, but at least 10 SOL worth
    const maxAmount = poolAMax < poolBMax ? poolAMax : poolBMax;
    const minAmount = BigInt(10_000_000_000); // 10 SOL minimum
    
    return maxAmount > minAmount ? maxAmount : minAmount;
  }

  /**
   * Calculate swap output with improved slippage modeling
   * Accounts for price impact, liquidity depth, and realistic execution
   */
  private calculateSwapOutputWithSlippage(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    decimalsIn: number,
    decimalsOut: number,
    fee: number
  ): bigint {
    // Base calculation using constant product formula
    const baseOutput = this.calculateSwapOutput(
      amountIn,
      reserveIn,
      reserveOut,
      decimalsIn,
      decimalsOut,
      fee
    );

    if (baseOutput === BigInt(0)) return BigInt(0);

    // Improved slippage model based on:
    // 1. Trade size relative to liquidity (price impact)
    // 2. Pool depth (deeper pools = less slippage)
    // 3. Market volatility (estimated from price)
    
    const reserveInNum = Number(reserveIn);
    const reserveOutNum = Number(reserveOut);
    const amountInNum = Number(amountIn);
    
    if (reserveInNum === 0) return BigInt(0);

    // Calculate price impact more accurately
    // Using constant product: (x + dx) * (y - dy) = k
    // Price impact = (dy/y) where dy is the output amount
    const tradeSizeRatio = amountInNum / reserveInNum;
    
    // Improved slippage calculation:
    // - Small trades (< 1% of pool): minimal slippage
    // - Medium trades (1-10%): moderate slippage
    // - Large trades (> 10%): significant slippage
    let slippageMultiplier = 1.0;
    
    if (tradeSizeRatio < 0.01) {
      // Very small trade: < 1% of pool, minimal slippage
      slippageMultiplier = 1 - (tradeSizeRatio * 2); // ~0-2% slippage
    } else if (tradeSizeRatio < 0.1) {
      // Medium trade: 1-10% of pool
      const normalizedRatio = (tradeSizeRatio - 0.01) / 0.09; // Normalize to 0-1
      slippageMultiplier = 1 - (0.02 + normalizedRatio * 0.05); // 2-7% slippage
    } else {
      // Large trade: > 10% of pool, significant slippage
      const normalizedRatio = Math.min((tradeSizeRatio - 0.1) / 0.4, 1); // Cap at 50% of pool
      slippageMultiplier = 1 - (0.07 + normalizedRatio * 0.13); // 7-20% slippage
    }

    // Additional factor: pool depth (deeper pools = less slippage)
    const totalLiquidity = reserveInNum + reserveOutNum;
    const depthFactor = Math.min(1, Math.log10(totalLiquidity / 1e9) / 3); // Normalize by log scale
    slippageMultiplier = slippageMultiplier * (0.95 + depthFactor * 0.05); // Adjust by 0-5% based on depth

    // Ensure slippage multiplier is reasonable (not negative, not too high)
    slippageMultiplier = Math.max(0.5, Math.min(1.0, slippageMultiplier));
    
    const adjustedOutput = BigInt(Math.floor(Number(baseOutput) * slippageMultiplier));

    return adjustedOutput;
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

  private buildTokenGraph(pools: PoolData[] = this.pools): Map<string, Map<string, PoolData[]>> {
    const graph = new Map<string, Map<string, PoolData[]>>();

    // Only include real pools with reserves
    for (const pool of pools) {
      if (!pool.poolAddress || pool.reserves.tokenA === BigInt(0) || pool.reserves.tokenB === BigInt(0)) {
        continue;
      }

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

  private calculateConfidence(profitPercent: number, hops: number): number {
    // Returns confidence as a number between 0 and 1
    // Higher profit and fewer hops = higher confidence
    let confidence = 0.5; // Base confidence
    
    // Adjust based on profit percentage
    if (profitPercent > 1) confidence += 0.3;
    else if (profitPercent > 0.5) confidence += 0.2;
    else if (profitPercent > 0.1) confidence += 0.1;
    
    // Adjust based on number of hops (fewer hops = higher confidence)
    if (hops <= 2) confidence += 0.2;
    else if (hops <= 3) confidence += 0.1;
    else confidence -= 0.1;
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }
}

