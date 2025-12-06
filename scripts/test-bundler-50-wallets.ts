/**
 * Test Script: Bundler with 50 Wallets
 * 
 * This script:
 * 1. Creates 50 wallets using the bundler
 * 2. Sets up schedules for different wallet groups:
 *    - Wallets 1-10: DCA buy every X minutes
 *    - Wallets 11-20: Sell .002 SOL every X minutes
 *    - Wallets 21-50: Manual control
 * 3. Allows sending SOL/tokens from each wallet separately
 * 
 * Usage:
 *   npm run test:bundler-50
 * 
 * Configuration:
 *   Edit scripts/bundler-test-config.json to customize settings
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { createTestWallets, TestWallet, sendSolFromWallet, sendTokenFromWallet } from '../app/lib/bundler/test-utils';
import { BundlerScheduler, ScheduleConfig } from '../app/lib/bundler/scheduler';
import { requestFaucetAirdrop, ensureMinimumBalance, testFaucetFunctionality } from '../app/lib/bundler/faucet-utils';

// Load configuration
const configPath = path.join(__dirname, 'bundler-test-config.json');
let config: any;

try {
  const configFile = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(configFile).testConfig;
} catch (error) {
  console.error('Error loading config file. Using defaults.');
  config = {
    totalWallets: 50,
    network: 'devnet',
    initialFunding: {
      amountPerWallet: 0.1,
    },
    walletGroups: {
      dcaBuy: {
        wallets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        schedule: {
          enabled: true,
          intervalMinutes: 60,
          amountPerBuy: 0.01,
          targetToken: 'SOL',
          maxBuys: 10,
        },
      },
      scheduledSell: {
        wallets: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        schedule: {
          enabled: true,
          intervalMinutes: 30,
          amountPerSell: 0.002,
          token: 'SOL',
          maxSells: 20,
          destinationAddress: '', // Will be set to funding wallet
        },
      },
    },
  };
}

// Initialize connection with timeout
const network = config.network || 'devnet';
const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network as any);
const connection = new Connection(rpcUrl, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000, // 60 second timeout
});

// Storage for test wallets
let testWallets: TestWallet[] = [];
let scheduler: BundlerScheduler;
let fundingWallet: Keypair;

/**
 * Initialize funding wallet
 */
function initializeFundingWallet(): Keypair {
  const fundingKey = config.initialFunding?.fundingWallet;
  
  if (fundingKey) {
    try {
      // Try to parse as private key
      const secretKey = Buffer.from(fundingKey, 'hex');
      if (secretKey.length === 64) {
        return Keypair.fromSecretKey(secretKey);
      }
    } catch {
      // If hex fails, try base64
      try {
        const secretKey = Buffer.from(fundingKey, 'base64');
        return Keypair.fromSecretKey(secretKey);
      } catch {
        console.error('Invalid funding wallet private key format');
      }
    }
  }

  // Generate new keypair for testing (devnet only)
  console.warn('⚠️  No funding wallet provided. Generating new keypair for devnet testing.');
  const newKeypair = Keypair.generate();
  console.log(`📝 Funding wallet address: ${newKeypair.publicKey.toString()}`);
  console.log(`📝 Private key (hex): ${Buffer.from(newKeypair.secretKey).toString('hex')}`);
  return newKeypair;
}

/**
 * Test faucet functionality
 */
async function testFaucet(): Promise<boolean> {
  console.log('\n🧪 Testing devnet faucet functionality...\n');
  
  // Create a test wallet to check faucet
  const testWallet = Keypair.generate();
  console.log(`📝 Test wallet: ${testWallet.publicKey.toString()}`);
  
  const faucetTest = await testFaucetFunctionality(connection, testWallet.publicKey);
  
  if (faucetTest.working) {
    console.log('✅ Faucet is working!');
    if (faucetTest.details) {
      console.log(`   Received: ${faucetTest.details.amount?.toFixed(4)} SOL`);
      console.log(`   Signature: ${faucetTest.details.signature}`);
    }
    return true;
  } else {
    const isRateLimited = faucetTest.error?.includes('rate limit') || 
                          faucetTest.error?.includes('429') ||
                          faucetTest.error?.includes('Too Many Requests');
    
    if (isRateLimited) {
      console.warn('⚠️  Faucet is rate-limited (429 Too Many Requests)');
      console.warn('   This is temporary - the faucet is working but limiting requests');
      console.warn('   Options:');
      console.warn('   1. Wait 2-5 minutes and try again');
      console.warn('   2. Use manual faucet: https://faucet.solana.com/');
      console.warn('   3. Continue anyway - script will try to fund automatically\n');
      return false; // Continue anyway, will try to fund
    } else {
      console.error('❌ Faucet test failed:', faucetTest.error);
      console.warn('⚠️  You may need to manually fund wallets\n');
      return false;
    }
  }
}

/**
 * Create 50 wallets using bundler
 */
async function createWallets(): Promise<void> {
  console.log('\n🚀 Creating 50 wallets using bundler...\n');

  fundingWallet = initializeFundingWallet();

  // Test faucet functionality first
  if (network === 'devnet') {
    const faucetWorking = await testFaucet();
    if (!faucetWorking) {
      console.warn('\n⚠️  Faucet test failed, but continuing...');
      console.warn('   You may need to manually fund the wallet\n');
    }
  }

  // Check funding wallet balance
  const balance = await connection.getBalance(fundingWallet.publicKey);
  const balanceSOL = balance / 1e9;
  
  const requiredBalance = config.totalWallets * config.initialFunding.amountPerWallet + 0.1; // +0.1 for fees
  
  console.log(`\n💰 Funding wallet balance: ${balanceSOL.toFixed(4)} SOL`);
  console.log(`💰 Required balance: ${requiredBalance.toFixed(4)} SOL\n`);
  
  if (balanceSOL < requiredBalance) {
    if (network === 'devnet') {
      console.log(`💧 Insufficient balance. Requesting from devnet faucet...\n`);
      
      // Try to get enough SOL from faucet
      // Request in smaller chunks to avoid rate limits
      const chunkSize = 2.0; // Request 2 SOL at a time (max per request)
      const chunks = Math.ceil(requiredBalance / chunkSize);
      
      console.log(`💧 Requesting ${requiredBalance.toFixed(4)} SOL in ${chunks} chunk(s)...\n`);
      
      let totalReceived = 0;
      let lastError: string | undefined;
      
      for (let chunk = 1; chunk <= chunks; chunk++) {
        const chunkAmount = Math.min(chunkSize, requiredBalance - totalReceived);
        const currentNeeded = requiredBalance - totalReceived;
        
        console.log(`💧 Chunk ${chunk}/${chunks}: Requesting ${chunkAmount.toFixed(4)} SOL...`);
        
        const faucetResult = await ensureMinimumBalance(
          connection,
          fundingWallet.publicKey,
          currentNeeded,
          {
            maxRetries: 3,
            retryDelayMs: 5000, // 5 second base delay
          }
        );
        
        if (faucetResult.success) {
          const newBalance = await connection.getBalance(fundingWallet.publicKey);
          const newBalanceSOL = newBalance / 1e9;
          totalReceived = newBalanceSOL;
          console.log(`✅ Chunk ${chunk} received! Current balance: ${newBalanceSOL.toFixed(4)} SOL\n`);
          
          // Check if we have enough
          if (newBalanceSOL >= requiredBalance) {
            console.log(`✅ Sufficient balance achieved!`);
            console.log(`💰 Final balance: ${newBalanceSOL.toFixed(4)} SOL\n`);
            break;
          }
          
          // Wait between chunks to avoid rate limits
          if (chunk < chunks) {
            console.log(`⏳ Waiting 10 seconds before next request to avoid rate limits...\n`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } else {
          lastError = faucetResult.error;
          const isRateLimited = faucetResult.error?.includes('rate limit') || 
                                faucetResult.error?.includes('429');
          
          if (isRateLimited && chunk < chunks) {
            console.warn(`⚠️  Rate limited on chunk ${chunk}. Waiting 30 seconds...\n`);
            await new Promise(resolve => setTimeout(resolve, 30000));
            chunk--; // Retry this chunk
            continue;
          } else if (isRateLimited) {
            console.error(`❌ Rate limited. Please wait and try again, or fund manually.`);
            break;
          } else {
            console.error(`❌ Chunk ${chunk} failed: ${faucetResult.error}`);
            break;
          }
        }
      }
      
      // Final balance check
      const finalBalance = await connection.getBalance(fundingWallet.publicKey);
      const finalBalanceSOL = finalBalance / 1e9;
      
      if (finalBalanceSOL < requiredBalance) {
        console.error(`\n❌ Insufficient balance after faucet requests.`);
        console.error(`   Current: ${finalBalanceSOL.toFixed(4)} SOL`);
        console.error(`   Required: ${requiredBalance.toFixed(4)} SOL`);
        console.error(`   Shortfall: ${(requiredBalance - finalBalanceSOL).toFixed(4)} SOL`);
        
        if (lastError?.includes('rate limit')) {
          console.log(`\n💡 Rate limited by faucet. Options:`);
          console.log(`   1. Wait 5-10 minutes and run the script again`);
          console.log(`   2. Manually fund: https://faucet.solana.com/`);
          console.log(`   3. CLI: solana airdrop ${(requiredBalance - finalBalanceSOL).toFixed(2)} ${fundingWallet.publicKey.toString()} --url devnet`);
        } else {
          console.log(`\n💡 Please manually fund the wallet:`);
          console.log(`   - Web: https://faucet.solana.com/`);
          console.log(`   - CLI: solana airdrop ${(requiredBalance - finalBalanceSOL).toFixed(2)} ${fundingWallet.publicKey.toString()} --url devnet`);
        }
        process.exit(1);
      } else {
        console.log(`✅ Funding complete!`);
        console.log(`💰 Final balance: ${finalBalanceSOL.toFixed(4)} SOL\n`);
      }
    } else {
      console.error(`❌ Insufficient balance. Please fund the wallet with at least ${requiredBalance.toFixed(4)} SOL`);
      process.exit(1);
    }
  }

  // Create wallets
  testWallets = await createTestWallets(
    connection,
    fundingWallet,
    config.totalWallets,
    config.initialFunding.amountPerWallet
  );

  console.log(`✅ Created ${testWallets.length} wallets\n`);
  
  // Display wallet info
  console.log('📋 Wallet Summary:');
  testWallets.forEach((wallet, index) => {
    console.log(`  ${index + 1}. ${wallet.label} (${wallet.group}) - ${wallet.address}`);
  });

  // Save wallets to file
  const walletsFile = path.join(__dirname, 'bundler-test-wallets.json');
  const walletsData = testWallets.map(w => ({
    index: w.index,
    address: w.address,
    label: w.label,
    group: w.group,
    privateKey: Buffer.from(w.keypair.secretKey).toString('hex'), // Store for later use
  }));
  fs.writeFileSync(walletsFile, JSON.stringify(walletsData, null, 2));
  console.log(`\n💾 Wallets saved to: ${walletsFile}`);
}

/**
 * Setup scheduler
 */
function setupScheduler(): void {
  console.log('\n⏰ Setting up scheduler...\n');
  
  scheduler = new BundlerScheduler(connection);

  // Setup DCA buy wallets (1-10)
  const dcaConfig = config.walletGroups?.dcaBuy?.schedule;
  if (dcaConfig?.enabled) {
    const dcaWallets = testWallets.filter(w => w.group === 'dcaBuy');
    console.log(`📈 Setting up DCA buy for ${dcaWallets.length} wallets`);
    
    dcaWallets.forEach(wallet => {
      const scheduleConfig: ScheduleConfig = {
        enabled: true,
        intervalMinutes: dcaConfig.intervalMinutes || 60,
        amountPerBuy: dcaConfig.amountPerBuy || 0.01,
        targetToken: dcaConfig.targetToken || 'SOL',
        maxBuys: dcaConfig.maxBuys,
      };
      scheduler.addWalletSchedule(wallet, scheduleConfig);
    });
  }

  // Setup scheduled sell wallets (11-20)
  const sellConfig = config.walletGroups?.scheduledSell?.schedule;
  if (sellConfig?.enabled) {
    const sellWallets = testWallets.filter(w => w.group === 'scheduledSell');
    console.log(`📉 Setting up scheduled sell for ${sellWallets.length} wallets`);
    
    // Use funding wallet as destination if not specified
    const destinationAddress = sellConfig.destinationAddress || fundingWallet.publicKey.toString();
    
    sellWallets.forEach(wallet => {
      const scheduleConfig: ScheduleConfig = {
        enabled: true,
        intervalMinutes: sellConfig.intervalMinutes || 30,
        amountPerSell: sellConfig.amountPerSell || 0.002,
        token: sellConfig.token || 'SOL',
        maxSells: sellConfig.maxSells,
        destinationAddress,
      };
      scheduler.addWalletSchedule(wallet, scheduleConfig);
    });
  }

  console.log('✅ Scheduler configured\n');
}

/**
 * Start scheduler
 */
function startScheduler(): void {
  console.log('▶️  Starting scheduler...\n');
  scheduler.start();
  console.log('✅ Scheduler started. Schedules will execute according to configuration.\n');
  console.log('Press Ctrl+C to stop the scheduler.\n');
}

/**
 * Manual send function (for testing individual wallets)
 */
async function manualSend(
  walletIndex: number,
  toAddress: string,
  amount: number,
  tokenMint?: string
): Promise<void> {
  const wallet = testWallets[walletIndex - 1];
  if (!wallet) {
    console.error(`❌ Wallet ${walletIndex} not found`);
    return;
  }

  try {
    let signature: string;
    
    if (tokenMint) {
      signature = await sendTokenFromWallet(connection, {
        fromWallet: wallet,
        toAddress,
        amount,
        tokenMint,
      });
      console.log(`✅ Sent ${amount} tokens (${tokenMint}) from ${wallet.label}`);
    } else {
      signature = await sendSolFromWallet(connection, {
        fromWallet: wallet,
        toAddress,
        amount,
      });
      console.log(`✅ Sent ${amount} SOL from ${wallet.label}`);
    }
    
    console.log(`📝 Signature: ${signature}`);
  } catch (error) {
    console.error(`❌ Error sending from ${wallet.label}:`, error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Bundler Test: 50 Wallets with Scheduled Transactions');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create wallets
    await createWallets();

    // Step 2: Setup scheduler
    setupScheduler();

    // Step 3: Start scheduler
    startScheduler();

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping scheduler...');
      scheduler.stop();
      console.log('✅ Scheduler stopped. Goodbye!');
      process.exit(0);
    });

    // Example: Manual send (uncomment to test)
    // setTimeout(async () => {
    //   console.log('\n🧪 Testing manual send...');
    //   await manualSend(1, fundingWallet.publicKey.toString(), 0.001);
    // }, 5000);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use in other scripts
export { createWallets, setupScheduler, startScheduler, manualSend, testWallets, scheduler };

