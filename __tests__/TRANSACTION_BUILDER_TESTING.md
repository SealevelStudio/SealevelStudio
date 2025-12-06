# Transaction Builder Comprehensive Testing

This document describes the comprehensive test suite for the Transaction Builder that tests every possible combination of instructions, parameters, and modes.

## Overview

The test suite covers:
- ✅ All individual instruction templates (20+ instructions)
- ✅ All category combinations (system, token, nft, defi, custom)
- ✅ Multi-instruction combinations
- ✅ Parameter variations (amounts, strings, booleans)
- ✅ Transaction features (priority fees, memos)
- ✅ Flash loan combinations
- ✅ Complex workflows (token creation, arbitrage)

## Test Files

### 1. Jest Test Suite
**File:** `__tests__/transaction-builder-comprehensive.test.ts`

A comprehensive Jest test suite that can be run with your test runner. Tests all combinations programmatically.

### 2. Test Script
**File:** `scripts/test-tx-builder-combinations.ts`

A standalone script that runs all combinations and generates a detailed report.

## Running the Tests

### Option 1: Run the Test Script
```bash
npm run test:tx-builder
```

This will:
- Test all instruction templates individually
- Test all category combinations
- Test parameter variations
- Test transaction features
- Test flash loan combinations
- Test complex workflows
- Generate a comprehensive report

### Option 2: Run Jest Tests
```bash
# If you have Jest configured
npm test __tests__/transaction-builder-comprehensive.test.ts
```

## Test Coverage

### Individual Instructions
Tests each of the 20+ instruction templates:
- System: `system_transfer`, `system_create_account`
- Token: `spl_token_transfer`, `spl_token_mint_to`, `spl_token_burn`, `spl_token_approve`, `spl_ata_create`, `spl_token_create_mint`
- NFT: `mpl_create_metadata`, `mpl_update_metadata`
- DeFi: `jupiter_swap`, `orca_open_position`, `marinade_deposit`, `raydium_swap`
- Flash Loans: `kamino_flash_loan`, `kamino_flash_repay`, `solend_flash_loan`, `solend_flash_repay`, `marginfi_flash_loan`, `marginfi_flash_repay`
- NFT Marketplace: `me_buy_now`
- Custom: `custom_instruction`

### Category Combinations
Tests all possible 2-instruction combinations across categories:
- system + system
- system + token
- system + nft
- system + defi
- token + token
- token + nft
- token + defi
- nft + defi
- ... and all other combinations

### Parameter Variations
- **Amounts**: Tests with values from 1 to MAX_SAFE_INTEGER
- **Strings**: Tests with empty strings, short strings, long strings, special characters
- **Booleans**: Tests all boolean combinations for multi-flag instructions

### Transaction Features
- Priority fees (various amounts)
- Memos (various lengths)
- Combined priority fees + memos

### Complex Workflows
### Flash Loan Testing

The test suite includes **comprehensive flash loan testing** covering:

**Basic Flash Loan Pairs:**
- Kamino: `kamino_flash_loan` + `kamino_flash_repay`
- Solend: `solend_flash_loan` + `solend_flash_repay`
- Marginfi: `marginfi_flash_loan` + `marginfi_flash_repay`

**Advanced Flash Loan Capabilities:**
- ✅ Flash loan arbitrage workflows (borrow + swap + repay)
- ✅ Flash loans with priority fees
- ✅ Flash loans with memos
- ✅ Multiple flash loans from different protocols in one transaction
- ✅ Flash loans with various amounts (1K to 10M+)
- ✅ Stacked flash loans (multiple protocols)

**Flash Loan Test Coverage:**
- 3 basic pairs (borrow + repay)
- 3 arbitrage workflows (borrow + swap + repay)
- 3 priority fee variations
- 3 memo variations
- 1 multi-protocol test
- 5 amount variation tests

**Total Flash Loan Tests: 18+**

### Complex Workflows
- **Token Creation**: Create token + mint + metadata
- **Arbitrage**: Flash loan + swap + repay
- **Multi-step DeFi**: Multiple protocol interactions

## Test Results

The test script generates a report showing:
- Total tests run
- Pass/fail counts and percentages
- Average test duration
- Failed test details
- Results grouped by category

Example output:
```
📊 TEST REPORT
================================================================================

Total Tests: 156
✅ Passed: 152 (97.4%)
❌ Failed: 4 (2.6%)
⏱️  Average Duration: 45.23ms

📈 Results by Category:
  system: 8/8 passed (100.0%)
  token: 12/12 passed (100.0%)
  nft: 4/4 passed (100.0%)
  defi: 18/20 passed (90.0%)
  custom: 1/1 passed (100.0%)
```

## Understanding Test Failures

If a test fails, it could be due to:
1. **Invalid account addresses**: Some instructions require specific account types
2. **Missing required parameters**: Some instructions have dependencies
3. **Network issues**: Tests use devnet connection
4. **Program availability**: Some programs may not be available on devnet

## Adding New Tests

To add tests for new instruction templates:

1. Add the template to `app/lib/instructions/templates.ts`
2. The test suite will automatically pick it up
3. Run `npm run test:tx-builder` to verify

## Continuous Testing

Consider adding this to your CI/CD pipeline:
```yaml
- name: Test Transaction Builder
  run: npm run test:tx-builder
```

## Notes

- Tests use devnet connection (no real SOL required)
- Tests generate random keypairs for each test
- Tests validate transaction structure, not execution
- Some tests may fail if programs aren't available on devnet

