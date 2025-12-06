# Bundler Test: 50 Wallets with Scheduled Transactions

This guide explains how to test the bundler on-chain with 50 wallets and set up scheduled transactions (DCA buys and scheduled sells).

## Overview

The test system allows you to:
1. **Create 50 wallets** using the bundler in a single transaction
2. **Send SOL/tokens** from each wallet separately
3. **Set up schedules** for different wallet groups:
   - Wallets 1-10: DCA (Dollar Cost Averaging) buy every X minutes
   - Wallets 11-20: Sell 0.002 SOL every X minutes
   - Wallets 21-50: Manual control

## Quick Start

### 1. Configure Test Settings

Edit `scripts/bundler-test-config.json`:

```json
{
  "testConfig": {
    "totalWallets": 50,
    "network": "devnet",
    "initialFunding": {
      "amountPerWallet": 0.1,
      "fundingWallet": "YOUR_FUNDING_WALLET_PRIVATE_KEY_HEX"
    },
    "walletGroups": {
      "dcaBuy": {
        "wallets": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "schedule": {
          "enabled": true,
          "intervalMinutes": 60,
          "amountPerBuy": 0.01,
          "targetToken": "SOL",
          "maxBuys": 10
        }
      },
      "scheduledSell": {
        "wallets": [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        "schedule": {
          "enabled": true,
          "intervalMinutes": 30,
          "amountPerSell": 0.002,
          "token": "SOL",
          "maxSells": 20,
          "destinationAddress": "YOUR_DESTINATION_ADDRESS"
        }
      }
    }
  }
}
```

### 2. Fund Your Wallet (Automatic on Devnet!)

**Automatic Funding (Recommended):**
The test script will automatically request SOL from the devnet faucet if your wallet balance is insufficient. Just run the script and it will handle funding!

**Manual Funding (Optional):**
If you prefer to fund manually:
- Get SOL from the devnet faucet: https://faucet.solana.com/
- Or use CLI: `solana airdrop 5 YOUR_WALLET_ADDRESS --url devnet`

You'll need approximately:
- `(50 wallets × 0.1 SOL) + 0.1 SOL fees = 5.1 SOL` minimum

**Test Faucet First:**
Before running the full test, you can verify the faucet is working:
```bash
npm run test:faucet
```

### 3. Run the Test Script

```bash
npm run test:bundler-50
```

This will:
1. **Test faucet functionality** (on devnet)
2. **Automatically fund your wallet** from the devnet faucet if needed
3. Create 50 wallets using the bundler
4. Set up schedules for wallets 1-20
5. Start the scheduler
6. Save wallet information to `scripts/bundler-test-wallets.json`

**Note:** The script will automatically request SOL from the devnet faucet if your funding wallet doesn't have enough balance. You don't need to manually fund it first!

### 4. Monitor Schedules

The scheduler will automatically:
- Execute DCA buys for wallets 1-10 every configured interval
- Execute sells for wallets 11-20 every configured interval

Press `Ctrl+C` to stop the scheduler.

## API Endpoints

### Get All Test Wallets

```bash
GET /api/bundler-test/wallets
```

Returns all test wallets with their balances.

### Send from a Test Wallet

```bash
POST /api/bundler-test/send
Content-Type: application/json

{
  "walletIndex": 1,
  "toAddress": "RECIPIENT_ADDRESS",
  "amount": 0.01,
  "tokenMint": "OPTIONAL_TOKEN_MINT" // Omit for SOL
}
```

### Manage Scheduler

**Get scheduler status:**
```bash
GET /api/bundler-test/scheduler
```

**Start scheduler:**
```bash
POST /api/bundler-test/scheduler
Content-Type: application/json

{
  "action": "start"
}
```

**Stop scheduler:**
```bash
POST /api/bundler-test/scheduler
Content-Type: application/json

{
  "action": "stop"
}
```

**Update schedule:**
```bash
POST /api/bundler-test/scheduler
Content-Type: application/json

{
  "action": "update",
  "walletIndex": 1,
  "config": {
    "enabled": true,
    "intervalMinutes": 30,
    "amountPerSell": 0.002,
    "token": "SOL",
    "destinationAddress": "DESTINATION_ADDRESS"
  }
}
```

## Programmatic Usage

### Import and Use in Your Code

```typescript
import { createTestWallets, sendSolFromWallet } from '@/app/lib/bundler/test-utils';
import { BundlerScheduler } from '@/app/lib/bundler/scheduler';

// Create wallets
const wallets = await createTestWallets(
  connection,
  fundingWallet,
  50,
  0.1 // SOL per wallet
);

// Send from a specific wallet
const signature = await sendSolFromWallet(connection, {
  fromWallet: wallets[0],
  toAddress: 'RECIPIENT_ADDRESS',
  amount: 0.01,
});

// Setup scheduler
const scheduler = new BundlerScheduler(connection);
scheduler.addWalletSchedule(wallets[0], {
  enabled: true,
  intervalMinutes: 60,
  amountPerSell: 0.002,
  token: 'SOL',
  destinationAddress: 'DESTINATION_ADDRESS',
});
scheduler.start();
```

## Configuration Options

### Wallet Groups

- **dcaBuy**: Wallets that perform DCA (Dollar Cost Averaging) buys
  - `intervalMinutes`: How often to buy
  - `amountPerBuy`: Amount to buy each time
  - `targetToken`: Token to buy (currently supports SOL, extend for DEX swaps)
  - `maxBuys`: Maximum number of buys before stopping

- **scheduledSell**: Wallets that sell on a schedule
  - `intervalMinutes`: How often to sell
  - `amountPerSell`: Amount to sell each time
  - `token`: Token to sell (SOL or SPL token mint address)
  - `maxSells`: Maximum number of sells before stopping
  - `destinationAddress`: Where to send the sold tokens

- **manual**: Wallets for manual control (no automatic scheduling)

### Network Configuration

- `network`: `"devnet"` or `"mainnet-beta"`
- Uses `NEXT_PUBLIC_SOLANA_RPC_URL` environment variable if set

## File Structure

```
scripts/
  ├── bundler-test-config.json      # Configuration file
  ├── bundler-test-wallets.json      # Generated wallet data (created after running)
  └── test-bundler-50-wallets.ts     # Main test script

app/
  ├── lib/bundler/
  │   ├── test-utils.ts              # Utility functions
  │   └── scheduler.ts               # Scheduler service
  └── api/bundler-test/
      ├── wallets/route.ts           # Wallet management API
      ├── send/route.ts              # Send transaction API
      └── scheduler/route.ts         # Scheduler control API
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Keys**: The test wallets' private keys are stored in `bundler-test-wallets.json` in **plain text**. 
   - Never commit this file to version control
   - Only use on devnet/testnet
   - For production, use proper key management

2. **Funding Wallet**: The funding wallet private key is stored in the config file.
   - Use a separate wallet for testing
   - Never use your main wallet's private key

3. **Network**: Always test on devnet first before using mainnet

## Troubleshooting

### "Insufficient balance" error

- Check your funding wallet has enough SOL
- For devnet, use the faucet: https://faucet.solana.com/
- Calculate required: `(totalWallets × amountPerWallet) + 0.1 SOL for fees`

### Scheduler not executing

- Check that schedules are enabled in config
- Verify wallet balances are sufficient
- Check console logs for errors

### Transaction failures

- Ensure RPC endpoint is working
- Check network congestion
- Verify wallet balances
- Check transaction signatures in Solana Explorer

## Extending the System

### Adding DEX Integration for DCA Buys

Currently, DCA buys only log. To implement actual buys:

1. Integrate with a DEX (e.g., Jupiter, Raydium)
2. Modify `scheduler.ts` `executeSchedule()` method
3. Add swap instructions to the transaction

### Adding More Schedule Types

1. Add new schedule config to `bundler-test-config.json`
2. Extend `ScheduleConfig` interface in `scheduler.ts`
3. Add execution logic in `executeSchedule()`

## Example Use Cases

1. **Testing Bundler Performance**: Create 50 wallets and measure transaction time
2. **Stress Testing**: Send transactions from all wallets simultaneously
3. **DCA Strategy Testing**: Test DCA buy strategies with multiple wallets
4. **Liquidity Testing**: Test scheduled sells to simulate liquidity events

## Support

For issues or questions:
- Check the logs in `bundler-test.log` (if logging enabled)
- Review Solana Explorer for transaction details
- Check RPC endpoint status

