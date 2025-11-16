# SEAL Token

The native utility token for Sealevel Studio.

## Overview

SEAL is the native utility token that powers Sealevel Studio. Users must spend SEAL tokens to access premium features:

- **Arbitrage Scanner**: Scan for arbitrage opportunities
- **Transaction Simulator**: Simulate transactions before execution
- **AI Agents**: Query AI agents for help and analysis
- **Code Exporter**: Export transaction code
- **Advanced Features**: Access to advanced transaction building features

## Token Configuration

- **Name**: Sealevel Studio Token
- **Symbol**: SEAL
- **Decimals**: 9 (standard Solana token)
- **Total Supply**: 1,000,000,000 SEAL (1 billion)

## Initial Distribution

- **40%** - Treasury (operations, rewards, feature access)
- **20%** - Team (vested over 24 months with 6-month cliff)
- **20%** - Initial Liquidity Pools
- **10%** - Community Rewards & Airdrops
- **10%** - Reserves

## Token Economics

### Feature Pricing

- Scanner Scan: 10 SEAL
- Scanner Auto-Refresh: 50 SEAL/hour
- Simulation: 5 SEAL
- AI Query: 2 SEAL
- Code Export: 3 SEAL
- Advanced Transaction: 1 SEAL

### Subscription Tiers

1. **Free Tier** (0 SEAL/month)
   - 5 scanner scans/day
   - 3 simulations/day
   - 10 AI queries/day
   - 2 code exports/day

2. **Basic Tier** (1,000 SEAL/month)
   - 50 scanner scans/day
   - 20 simulations/day
   - 100 AI queries/day
   - 10 code exports/day

3. **Pro Tier** (5,000 SEAL/month)
   - Unlimited access to all features

## Usage

### Initialization

```typescript
import { createSealTokenInitialization } from '@/lib/seal-token';

const result = await createSealTokenInitialization(
  payerPublicKey,
  treasuryPublicKey,
  connection
);

// Sign and send transaction
await sendTransaction(result.transaction, result.signers);
```

### Configuration

```typescript
import { SEAL_TOKEN_CONFIG, getSealMintAddress } from '@/lib/seal-token/config';

// Get mint address
const mintAddress = getSealMintAddress();

// Get feature cost
const cost = getFeatureCost('scannerScan'); // 10 SEAL
```

## Security Notes

- Mint authority should be revoked after initial distribution to make supply fixed
- Treasury should be a multi-sig wallet in production
- Token distribution should follow vesting schedule
- All transactions should be audited before mainnet deployment

