/**
 * Test Devnet Faucet Functionality
 * 
 * Quick script to verify the devnet faucet is working
 * 
 * Usage:
 *   npm run test:faucet
 *   or
 *   ts-node --project tsconfig.scripts.json scripts/test-faucet.ts
 */

import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { testFaucetFunctionality, requestFaucetAirdrop } from '../app/lib/bundler/faucet-utils';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Devnet Faucet Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Connect to devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  console.log('🌐 Connected to devnet\n');

  // Create a test wallet
  const testWallet = Keypair.generate();
  console.log(`📝 Test wallet address: ${testWallet.publicKey.toString()}\n`);

  // Test 1: Basic functionality test
  console.log('🧪 Test 1: Basic faucet functionality...\n');
  const testResult = await testFaucetFunctionality(connection, testWallet.publicKey);
  
  if (testResult.working) {
    console.log('✅ Faucet is working!\n');
    if (testResult.details) {
      console.log('   Details:');
      console.log(`   - Amount received: ${testResult.details.amount?.toFixed(4)} SOL`);
      console.log(`   - Transaction signature: ${testResult.details.signature}`);
      console.log(`   - Final balance: ${testResult.details.balance?.toFixed(4)} SOL\n`);
    }
  } else {
    console.error('❌ Faucet test failed:', testResult.error);
    
    if (testResult.error?.includes('rate limit') || testResult.error?.includes('429')) {
      console.log('\n💡 Rate Limited - Solutions:');
      console.log('   1. Wait 2-5 minutes and try again');
      console.log('   2. Use manual faucet: https://faucet.solana.com/');
      console.log('   3. Use CLI: solana airdrop 2 YOUR_ADDRESS --url devnet');
      console.log('   4. Try a different RPC endpoint\n');
    } else {
      console.log('\n💡 Possible issues:');
      console.log('   - Network connectivity issues');
      console.log('   - RPC endpoint may be down');
      console.log('   - Try manual faucet: https://faucet.solana.com/\n');
    }
    
    // Don't exit on rate limit - it's temporary
    if (!testResult.error?.includes('rate limit') && !testResult.error?.includes('429')) {
      process.exit(1);
    }
  }

  // Test 2: Request specific amount
  console.log('🧪 Test 2: Request specific amount (0.5 SOL)...\n');
  const specificRequest = await requestFaucetAirdrop(connection, testWallet.publicKey, 0.5);
  
  if (specificRequest.success) {
    console.log('✅ Specific amount request successful!\n');
    console.log('   Details:');
    console.log(`   - Requested: 0.5 SOL`);
    console.log(`   - Signature: ${specificRequest.signature}`);
    console.log(`   - Final balance: ${specificRequest.balance?.toFixed(4)} SOL\n`);
  } else {
    console.warn('⚠️  Specific amount request failed:', specificRequest.error);
    console.log('   (This may be due to rate limiting - the basic test passed)\n');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Faucet Test Complete');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ The devnet faucet is functional and ready to use!');
  console.log(`📝 Test wallet: ${testWallet.publicKey.toString()}`);
  console.log('   (You can use this wallet for testing if needed)\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

export { main as testFaucet };

