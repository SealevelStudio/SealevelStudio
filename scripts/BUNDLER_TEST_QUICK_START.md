# Bundler Test Quick Start

## 🚀 Quick Setup (3 Steps)

### 1. Edit Config
```bash
# Edit scripts/bundler-test-config.json
# Set your funding wallet private key (hex format)
```

### 2. (Optional) Test Faucet
```bash
# Test if devnet faucet is working
npm run test:faucet
```

### 3. Fund Your Wallet (Automatic!)
```bash
# The script will automatically request SOL from faucet if needed!
# Or manually: Get SOL from https://faucet.solana.com/
# You need ~5.1 SOL (50 wallets × 0.1 SOL + fees)
```

### 4. Run Test
```bash
npm run test:bundler-50
# Script will automatically fund from faucet if needed!
```

## 📋 What It Does

✅ Creates 50 wallets in one transaction  
✅ Wallets 1-10: DCA buy every 60 minutes  
✅ Wallets 11-20: Sell 0.002 SOL every 30 minutes  
✅ Wallets 21-50: Manual control  

## 🔧 Configuration

Edit `scripts/bundler-test-config.json`:

```json
{
  "testConfig": {
    "totalWallets": 50,
    "initialFunding": {
      "amountPerWallet": 0.1,
      "fundingWallet": "YOUR_PRIVATE_KEY_HEX"
    },
    "walletGroups": {
      "dcaBuy": {
        "schedule": {
          "intervalMinutes": 60,    // Change interval
          "amountPerBuy": 0.01,     // Change amount
          "maxBuys": 10             // Max executions
        }
      },
      "scheduledSell": {
        "schedule": {
          "intervalMinutes": 30,    // Change interval
          "amountPerSell": 0.002,   // Change amount
          "destinationAddress": ""  // Set destination
        }
      }
    }
  }
}
```

## 📡 API Usage

### Get All Wallets
```bash
curl http://localhost:3000/api/bundler-test/wallets
```

### Send from Wallet
```bash
curl -X POST http://localhost:3000/api/bundler-test/send \
  -H "Content-Type: application/json" \
  -d '{
    "walletIndex": 1,
    "toAddress": "RECIPIENT",
    "amount": 0.01
  }'
```

### Control Scheduler
```bash
# Start
curl -X POST http://localhost:3000/api/bundler-test/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Stop
curl -X POST http://localhost:3000/api/bundler-test/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

## 📁 Files Created

- `scripts/bundler-test-wallets.json` - Wallet data (private keys!)
- `bundler-test.log` - Execution logs (if enabled)

## ⚠️ Security

- **Never commit** `bundler-test-wallets.json` (contains private keys)
- Only use on **devnet/testnet**
- Use a **separate wallet** for testing

## 🐛 Troubleshooting

**"Insufficient balance"**
→ Fund your wallet: https://faucet.solana.com/

**"Scheduler not running"**
→ Check config: `enabled: true` in schedule config

**"Transaction failed"**
→ Check wallet balances and RPC endpoint

## 📚 Full Documentation

See `docs/BUNDLER_TEST_50_WALLETS.md` for complete guide.

