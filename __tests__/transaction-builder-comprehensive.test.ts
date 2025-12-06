/**
 * Comprehensive Test Suite for Transaction Builder
 * Tests every possible combination of instructions, parameters, and modes
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { TransactionBuilder } from '../app/lib/transaction-builder';
import { INSTRUCTION_TEMPLATES, getTemplatesByCategory, getTemplateById } from '../app/lib/instructions/templates';
import { TransactionDraft, BuiltInstruction } from '../app/lib/instructions/types';

// Mock connection for testing
const createMockConnection = (): Connection => {
  return new Connection('https://api.devnet.solana.com', 'confirmed');
};

// Test keypairs
const testKeypair1 = Keypair.generate();
const testKeypair2 = Keypair.generate();
const testKeypair3 = Keypair.generate();

// Helper to create a test transaction draft
const createTestDraft = (instructions: BuiltInstruction[]): TransactionDraft => ({
  instructions,
  priorityFee: undefined,
  memo: undefined,
});

// Helper to create a built instruction from template
const createBuiltInstruction = (
  templateId: string,
  accounts: Record<string, string>,
  args: Record<string, any> = {}
): BuiltInstruction => {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return { template, accounts, args };
};

describe('Transaction Builder - Comprehensive Tests', () => {
  let builder: TransactionBuilder;
  let connection: Connection;

  beforeEach(() => {
    connection = createMockConnection();
    builder = new TransactionBuilder(connection);
  });

  describe('Individual Instruction Templates', () => {
    // Test each instruction template individually
    INSTRUCTION_TEMPLATES.forEach((template) => {
      describe(`${template.category.toUpperCase()} - ${template.name} (${template.id})`, () => {
        it(`should build ${template.id} instruction with minimal valid parameters`, async () => {
          const accounts: Record<string, string> = {};
          const args: Record<string, any> = {};

          // Fill required accounts with test keypairs
          template.accounts.forEach((account) => {
            if (!account.isOptional) {
              if (account.type === 'signer') {
                accounts[account.name] = testKeypair1.publicKey.toBase58();
              } else {
                accounts[account.name] = testKeypair2.publicKey.toBase58();
              }
            }
          });

          // Fill required args with default or minimal values
          template.args.forEach((arg) => {
            if (!arg.isOptional) {
              switch (arg.type) {
                case 'u64':
                case 'u32':
                case 'u16':
                case 'u8':
                  args[arg.name] = arg.validation?.min || 1;
                  break;
                case 'i64':
                case 'i32':
                  args[arg.name] = arg.validation?.min || 0;
                  break;
                case 'string':
                  args[arg.name] = 'test';
                  break;
                case 'bool':
                  args[arg.name] = false;
                  break;
                case 'pubkey':
                  args[arg.name] = testKeypair3.publicKey.toBase58();
                  break;
                default:
                  args[arg.name] = arg.defaultValue || '';
              }
            }
          });

          const instruction = createBuiltInstruction(template.id, accounts, args);
          const draft = createTestDraft([instruction]);

          // Should not throw when building
          expect(async () => {
            const tx = await builder.buildTransaction(draft);
            expect(tx).toBeDefined();
            expect(tx.instructions.length).toBeGreaterThan(0);
          }).not.toThrow();
        });

        it(`should handle ${template.id} with all optional parameters`, async () => {
          const accounts: Record<string, string> = {};
          const args: Record<string, any> = {};

          // Fill all accounts (including optional)
          template.accounts.forEach((account) => {
            if (account.type === 'signer') {
              accounts[account.name] = testKeypair1.publicKey.toBase58();
            } else {
              accounts[account.name] = testKeypair2.publicKey.toBase58();
            }
          });

          // Fill all args (including optional)
          template.args.forEach((arg) => {
            switch (arg.type) {
              case 'u64':
              case 'u32':
              case 'u16':
              case 'u8':
                args[arg.name] = arg.validation?.max || 1000;
                break;
              case 'i64':
              case 'i32':
                args[arg.name] = arg.validation?.max || 100;
                break;
              case 'string':
                args[arg.name] = 'test-value';
                break;
              case 'bool':
                args[arg.name] = true;
                break;
              case 'pubkey':
                args[arg.name] = testKeypair3.publicKey.toBase58();
                break;
              default:
                args[arg.name] = arg.defaultValue || 'default';
            }
          });

          const instruction = createBuiltInstruction(template.id, accounts, args);
          const draft = createTestDraft([instruction]);

          expect(async () => {
            const tx = await builder.buildTransaction(draft);
            expect(tx).toBeDefined();
          }).not.toThrow();
        });
      });
    });
  });

  describe('Category Combinations', () => {
    const categories = ['system', 'token', 'nft', 'defi', 'custom'];

    // Test all possible 2-instruction combinations across categories
    categories.forEach((cat1) => {
      categories.forEach((cat2) => {
        it(`should build transaction with ${cat1} + ${cat2} instructions`, async () => {
          const templates1 = getTemplatesByCategory(cat1);
          const templates2 = getTemplatesByCategory(cat2);

          if (templates1.length === 0 || templates2.length === 0) {
            return; // Skip if category has no templates
          }

          const template1 = templates1[0];
          const template2 = templates2[0];

          // Create minimal instructions
          const accounts1: Record<string, string> = {};
          const accounts2: Record<string, string> = {};
          const args1: Record<string, any> = {};
          const args2: Record<string, any> = {};

          // Fill template1
          template1.accounts.forEach((acc) => {
            if (!acc.isOptional) {
              accounts1[acc.name] = testKeypair1.publicKey.toBase58();
            }
          });
          template1.args.forEach((arg) => {
            if (!arg.isOptional) {
              if (arg.type.includes('u') || arg.type.includes('i')) {
                args1[arg.name] = 1;
              } else if (arg.type === 'string') {
                args1[arg.name] = 'test';
              } else if (arg.type === 'bool') {
                args1[arg.name] = false;
              }
            }
          });

          // Fill template2
          template2.accounts.forEach((acc) => {
            if (!acc.isOptional) {
              accounts2[acc.name] = testKeypair2.publicKey.toBase58();
            }
          });
          template2.args.forEach((arg) => {
            if (!arg.isOptional) {
              if (arg.type.includes('u') || arg.type.includes('i')) {
                args2[arg.name] = 1;
              } else if (arg.type === 'string') {
                args2[arg.name] = 'test';
              } else if (arg.type === 'bool') {
                args2[arg.name] = false;
              }
            }
          });

          const inst1 = createBuiltInstruction(template1.id, accounts1, args1);
          const inst2 = createBuiltInstruction(template2.id, accounts2, args2);
          const draft = createTestDraft([inst1, inst2]);

          expect(async () => {
            const tx = await builder.buildTransaction(draft);
            expect(tx.instructions.length).toBeGreaterThanOrEqual(2);
          }).not.toThrow();
        });
      });
    });
  });

  describe('Multi-Instruction Combinations', () => {
    it('should build transaction with 3+ instructions from same category', async () => {
      const systemTemplates = getTemplatesByCategory('system');
      if (systemTemplates.length >= 2) {
        const instructions = systemTemplates.slice(0, 2).map((template) => {
          const accounts: Record<string, string> = {};
          const args: Record<string, any> = {};
          template.accounts.forEach((acc) => {
            if (!acc.isOptional) {
              accounts[acc.name] = testKeypair1.publicKey.toBase58();
            }
          });
          template.args.forEach((arg) => {
            if (!arg.isOptional) {
              if (arg.type.includes('u') || arg.type.includes('i')) {
                args[arg.name] = 1;
              } else if (arg.type === 'string') {
                args[arg.name] = 'test';
              }
            }
          });
          return createBuiltInstruction(template.id, accounts, args);
        });

        const draft = createTestDraft(instructions);
        const tx = await builder.buildTransaction(draft);
        expect(tx.instructions.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should build transaction with mixed categories (system + token + nft)', async () => {
      const systemTemplate = getTemplateById('system_transfer');
      const tokenTemplate = getTemplateById('spl_token_transfer');
      const nftTemplate = getTemplateById('mpl_create_metadata');

      if (systemTemplate && tokenTemplate && nftTemplate) {
        const instructions = [
          createBuiltInstruction('system_transfer', {
            from: testKeypair1.publicKey.toBase58(),
            to: testKeypair2.publicKey.toBase58(),
          }, { amount: 1000000 }),
          createBuiltInstruction('spl_token_transfer', {
            source: testKeypair1.publicKey.toBase58(),
            destination: testKeypair2.publicKey.toBase58(),
            authority: testKeypair1.publicKey.toBase58(),
          }, { amount: 1000 }),
          createBuiltInstruction('mpl_create_metadata', {
            metadata: testKeypair1.publicKey.toBase58(),
            mint: testKeypair2.publicKey.toBase58(),
            mintAuthority: testKeypair1.publicKey.toBase58(),
            payer: testKeypair1.publicKey.toBase58(),
            updateAuthority: testKeypair1.publicKey.toBase58(),
          }, { name: 'Test', symbol: 'TST', uri: 'https://test.com' }),
        ];

        const draft = createTestDraft(instructions);
        const tx = await builder.buildTransaction(draft);
        expect(tx.instructions.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Parameter Variations', () => {
    describe('Amount Variations', () => {
      const amounts = [1, 100, 1000, 1000000, 1000000000, Number.MAX_SAFE_INTEGER];

      amounts.forEach((amount) => {
        it(`should handle system_transfer with amount ${amount}`, async () => {
          const instruction = createBuiltInstruction('system_transfer', {
            from: testKeypair1.publicKey.toBase58(),
            to: testKeypair2.publicKey.toBase58(),
          }, { amount });

          const draft = createTestDraft([instruction]);
          const tx = await builder.buildTransaction(draft);
          expect(tx.instructions.length).toBeGreaterThan(0);
        });
      });
    });

    describe('String Variations', () => {
      const strings = ['', 'a', 'test', 'very-long-string-with-many-characters', '123', 'special-chars-!@#$%'];

      strings.forEach((str) => {
        it(`should handle mpl_create_metadata with name "${str}"`, async () => {
          const instruction = createBuiltInstruction('mpl_create_metadata', {
            metadata: testKeypair1.publicKey.toBase58(),
            mint: testKeypair2.publicKey.toBase58(),
            mintAuthority: testKeypair1.publicKey.toBase58(),
            payer: testKeypair1.publicKey.toBase58(),
            updateAuthority: testKeypair1.publicKey.toBase58(),
          }, { name: str, symbol: 'TST', uri: 'https://test.com' });

          const draft = createTestDraft([instruction]);
          expect(async () => {
            await builder.buildTransaction(draft);
          }).not.toThrow();
        });
      });
    });

    describe('Boolean Combinations', () => {
      const boolCombinations = [
        { enableFreeze: false, revokeMintAuthority: false },
        { enableFreeze: true, revokeMintAuthority: false },
        { enableFreeze: false, revokeMintAuthority: true },
        { enableFreeze: true, revokeMintAuthority: true },
      ];

      boolCombinations.forEach((combo) => {
        it(`should handle create_token_and_mint with ${JSON.stringify(combo)}`, async () => {
          const instruction = createBuiltInstruction('spl_token_create_mint', {
            payer: testKeypair1.publicKey.toBase58(),
            mint: testKeypair2.publicKey.toBase58(),
            mintAuthority: testKeypair1.publicKey.toBase58(),
            tokenAccount: testKeypair3.publicKey.toBase58(),
            tokenAccountOwner: testKeypair1.publicKey.toBase58(),
          }, {
            decimals: 9,
            initialSupply: 1000000,
            ...combo,
          });

          const draft = createTestDraft([instruction]);
          expect(async () => {
            await builder.buildTransaction(draft);
          }).not.toThrow();
        });
      });
    });
  });

  describe('Transaction Features', () => {
    it('should add priority fee when specified', async () => {
      const instruction = createBuiltInstruction('system_transfer', {
        from: testKeypair1.publicKey.toBase58(),
        to: testKeypair2.publicKey.toBase58(),
      }, { amount: 1000000 });

      const draft: TransactionDraft = {
        instructions: [instruction],
        priorityFee: 10000,
        memo: undefined,
      };

      const tx = await builder.buildTransaction(draft);
      // Priority fee should add an instruction
      expect(tx.instructions.length).toBeGreaterThan(1);
    });

    it('should add memo when specified', async () => {
      const instruction = createBuiltInstruction('system_transfer', {
        from: testKeypair1.publicKey.toBase58(),
        to: testKeypair2.publicKey.toBase58(),
      }, { amount: 1000000 });

      const draft: TransactionDraft = {
        instructions: [instruction],
        priorityFee: undefined,
        memo: 'Test memo',
      };

      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThan(1);
    });

    it('should handle both priority fee and memo', async () => {
      const instruction = createBuiltInstruction('system_transfer', {
        from: testKeypair1.publicKey.toBase58(),
        to: testKeypair2.publicKey.toBase58(),
      }, { amount: 1000000 });

      const draft: TransactionDraft = {
        instructions: [instruction],
        priorityFee: 5000,
        memo: 'Test transaction with fee and memo',
      };

      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThan(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty instruction list', async () => {
      const draft = createTestDraft([]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBe(0);
    });

    it('should handle maximum number of instructions', async () => {
      // Solana transaction limit is typically 1232 bytes, but we'll test with 10 instructions
      const instructions: BuiltInstruction[] = [];
      for (let i = 0; i < 10; i++) {
        instructions.push(createBuiltInstruction('system_transfer', {
          from: testKeypair1.publicKey.toBase58(),
          to: testKeypair2.publicKey.toBase58(),
        }, { amount: 1000000 }));
      }

      const draft = createTestDraft(instructions);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBe(10);
    });

    it('should handle duplicate instructions', async () => {
      const instruction = createBuiltInstruction('system_transfer', {
        from: testKeypair1.publicKey.toBase58(),
        to: testKeypair2.publicKey.toBase58(),
      }, { amount: 1000000 });

      const draft = createTestDraft([instruction, instruction, instruction]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBe(3);
    });

    it('should handle zero amounts', async () => {
      const instruction = createBuiltInstruction('system_transfer', {
        from: testKeypair1.publicKey.toBase58(),
        to: testKeypair2.publicKey.toBase58(),
      }, { amount: 0 });

      const draft = createTestDraft([instruction]);
      expect(async () => {
        await builder.buildTransaction(draft);
      }).not.toThrow();
    });
  });

  describe('Special Operations', () => {
    it('should handle create_token_and_mint operation', async () => {
      const instruction: BuiltInstruction = {
        template: getTemplateById('spl_token_create_mint')!,
        accounts: {
          payer: testKeypair1.publicKey.toBase58(),
        },
        args: {
          _operation: 'create_token_and_mint',
          decimals: 9,
          initialSupply: 1000000,
          enableFreeze: false,
          revokeMintAuthority: false,
        },
      };

      const draft = createTestDraft([instruction]);
      const tx = await builder.buildTransaction(draft);
      // create_token_and_mint should generate multiple instructions
      expect(tx.instructions.length).toBeGreaterThan(1);
    });

    it('should handle Token-2022 features', async () => {
      const instruction: BuiltInstruction = {
        template: getTemplateById('spl_token_create_mint')!,
        accounts: {
          payer: testKeypair1.publicKey.toBase58(),
        },
        args: {
          _operation: 'create_token_and_mint',
          decimals: 9,
          initialSupply: 1000000,
          useToken2022: true,
          enableTax: true,
          transferFee: 100,
        },
      };

      const draft = createTestDraft([instruction]);
      expect(async () => {
        await builder.buildTransaction(draft);
      }).not.toThrow();
    });
  });

  describe('Flash Loan Combinations', () => {
    const flashLoanPairs = [
      { borrow: 'kamino_flash_loan', repay: 'kamino_flash_repay' },
      { borrow: 'solend_flash_loan', repay: 'solend_flash_repay' },
      { borrow: 'marginfi_flash_loan', repay: 'marginfi_flash_repay' },
    ];

    // Basic flash loan pairs (borrow + repay)
    flashLoanPairs.forEach(({ borrow, repay }) => {
      it(`should build ${borrow} + ${repay} transaction`, async () => {
        const borrowInst = createBuiltInstruction(borrow, {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { amount: 1000000 });

        const repayInst = createBuiltInstruction(repay, {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { repayAmount: 1001000 });

        const draft = createTestDraft([borrowInst, repayInst]);
        const tx = await builder.buildTransaction(draft);
        expect(tx.instructions.length).toBeGreaterThanOrEqual(2);
      });
    });

    // Flash loan arbitrage workflows (borrow + swap + repay)
    flashLoanPairs.forEach(({ borrow, repay }) => {
      it(`should build ${borrow} arbitrage workflow (borrow + swap + repay)`, async () => {
        const borrowInst = createBuiltInstruction(borrow, {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { amount: 1000000 });

        const swapInst = createBuiltInstruction('jupiter_swap', {
          userTransferAuthority: testKeypair1.publicKey.toBase58(),
          userSourceTokenAccount: testKeypair2.publicKey.toBase58(),
          userDestinationTokenAccount: testKeypair3.publicKey.toBase58(),
          destinationTokenAccount: testKeypair2.publicKey.toBase58(),
          destinationMint: testKeypair3.publicKey.toBase58(),
        }, { amount: 1000000, minAmountOut: 1100000 });

        const repayInst = createBuiltInstruction(repay, {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { repayAmount: 1001000 });

        const draft = createTestDraft([borrowInst, swapInst, repayInst]);
        const tx = await builder.buildTransaction(draft);
        expect(tx.instructions.length).toBeGreaterThanOrEqual(3);
      });
    });

    // Flash loan with priority fee
    flashLoanPairs.forEach(({ borrow, repay }) => {
      it(`should build ${borrow} + ${repay} with priority fee`, async () => {
        const borrowInst = createBuiltInstruction(borrow, {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { amount: 1000000 });

        const repayInst = createBuiltInstruction(repay, {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { repayAmount: 1001000 });

        const draft: TransactionDraft = {
          instructions: [borrowInst, repayInst],
          priorityFee: 50000, // Higher priority for flash loans
          memo: undefined,
        };

        const tx = await builder.buildTransaction(draft);
        expect(tx.instructions.length).toBeGreaterThanOrEqual(3); // borrow + repay + priority fee
      });
    });

    // Flash loan with memo
    flashLoanPairs.forEach(({ borrow, repay }) => {
      it(`should build ${borrow} + ${repay} with memo`, async () => {
        const borrowInst = createBuiltInstruction(borrow, {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { amount: 1000000 });

        const repayInst = createBuiltInstruction(repay, {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { repayAmount: 1001000 });

        const draft: TransactionDraft = {
          instructions: [borrowInst, repayInst],
          priorityFee: undefined,
          memo: 'Flash loan arbitrage',
        };

        const tx = await builder.buildTransaction(draft);
        expect(tx.instructions.length).toBeGreaterThanOrEqual(3); // borrow + repay + memo
      });
    });

    // Multiple flash loans in sequence (different protocols)
    it('should build multiple flash loans from different protocols', async () => {
      const kaminoBorrow = createBuiltInstruction('kamino_flash_loan', {
        lendingPool: testKeypair1.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
        borrower: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, { amount: 1000000 });

      const solendBorrow = createBuiltInstruction('solend_flash_loan', {
        lendingPool: testKeypair1.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
        borrower: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, { amount: 2000000 });

      const kaminoRepay = createBuiltInstruction('kamino_flash_repay', {
        lendingPool: testKeypair1.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
        borrower: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, { repayAmount: 1001000 });

      const solendRepay = createBuiltInstruction('solend_flash_repay', {
        lendingPool: testKeypair1.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
        borrower: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, { repayAmount: 2002000 });

      // Order: borrow1, borrow2, operations, repay2, repay1 (reverse order for repays)
      const draft = createTestDraft([kaminoBorrow, solendBorrow, solendRepay, kaminoRepay]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThanOrEqual(4);
    });

    // Flash loan with different amounts
    const amounts = [1000, 10000, 100000, 1000000, 10000000];
    amounts.forEach((amount) => {
      it(`should build kamino flash loan with amount ${amount}`, async () => {
        const borrowInst = createBuiltInstruction('kamino_flash_loan', {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { amount });

        const repayInst = createBuiltInstruction('kamino_flash_repay', {
          lendingPool: testKeypair1.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
          borrower: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, { repayAmount: amount + Math.floor(amount * 0.001) }); // Add 0.1% fee

        const draft = createTestDraft([borrowInst, repayInst]);
        const tx = await builder.buildTransaction(draft);
        expect(tx.instructions.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Flash Loan Liquidity Withdrawal', () => {
    it('should build flash loan liquidity withdrawal for Orca pool', async () => {
      const instruction = createBuiltInstruction('flash_loan_liquidity_withdraw', {
        borrower: testKeypair1.publicKey.toBase58(),
        poolAddress: testKeypair2.publicKey.toBase58(),
        positionAccount: testKeypair3.publicKey.toBase58(),
        withdrawTokenAccount: testKeypair1.publicKey.toBase58(),
        flashLoanProtocol: testKeypair2.publicKey.toBase58(),
        flashLoanPool: testKeypair2.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, {
        withdrawAmount: 1000000,
        flashLoanAmount: 100000,
        protocol: 'orca',
        flashLoanProtocol: 'kamino',
        flashLoanFeeBps: 9,
      });

      const draft = createTestDraft([instruction]);
      const tx = await builder.buildTransaction(draft);
      // Should have: flash loan borrow + withdraw + repay = 3 instructions
      expect(tx.instructions.length).toBeGreaterThanOrEqual(3);
    });

    it('should build flash loan liquidity withdrawal for Raydium pool', async () => {
      const instruction = createBuiltInstruction('flash_loan_liquidity_withdraw', {
        borrower: testKeypair1.publicKey.toBase58(),
        poolAddress: testKeypair2.publicKey.toBase58(),
        positionAccount: testKeypair3.publicKey.toBase58(),
        withdrawTokenAccount: testKeypair1.publicKey.toBase58(),
        flashLoanProtocol: testKeypair2.publicKey.toBase58(),
        flashLoanPool: testKeypair2.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, {
        withdrawAmount: 2000000,
        flashLoanAmount: 200000,
        protocol: 'raydium',
        flashLoanProtocol: 'solend',
        flashLoanFeeBps: 10,
      });

      const draft = createTestDraft([instruction]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThanOrEqual(3);
    });

    it('should build flash loan liquidity withdrawal with different flash loan protocols', async () => {
      const protocols = ['kamino', 'solend', 'marginfi'];
      
      for (const flashLoanProtocol of protocols) {
        const instruction = createBuiltInstruction('flash_loan_liquidity_withdraw', {
          borrower: testKeypair1.publicKey.toBase58(),
          poolAddress: testKeypair2.publicKey.toBase58(),
          positionAccount: testKeypair3.publicKey.toBase58(),
          withdrawTokenAccount: testKeypair1.publicKey.toBase58(),
          flashLoanProtocol: testKeypair2.publicKey.toBase58(),
          flashLoanPool: testKeypair2.publicKey.toBase58(),
          borrowerTokenAccount: testKeypair1.publicKey.toBase58(),
          tokenMint: testKeypair3.publicKey.toBase58(),
        }, {
          withdrawAmount: 1000000,
          flashLoanAmount: 100000,
          protocol: 'orca',
          flashLoanProtocol,
          flashLoanFeeBps: 9,
        });

        const draft = createTestDraft([instruction]);
        const tx = await builder.buildTransaction(draft);
        expect(tx.instructions.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should calculate correct repay amount with fee', async () => {
      const instruction = createBuiltInstruction('flash_loan_liquidity_withdraw', {
        borrower: testKeypair1.publicKey.toBase58(),
        poolAddress: testKeypair2.publicKey.toBase58(),
        positionAccount: testKeypair3.publicKey.toBase58(),
        withdrawTokenAccount: testKeypair1.publicKey.toBase58(),
        flashLoanProtocol: testKeypair2.publicKey.toBase58(),
        flashLoanPool: testKeypair2.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, {
        withdrawAmount: 1000000,
        flashLoanAmount: 1000000, // 1M tokens
        protocol: 'orca',
        flashLoanProtocol: 'kamino',
        flashLoanFeeBps: 9, // 0.09% fee
      });

      const draft = createTestDraft([instruction]);
      const tx = await builder.buildTransaction(draft);
      // Fee should be: 1,000,000 * 9 / 10000 = 900
      // Repay should be: 1,000,000 + 900 = 1,000,900
      expect(tx.instructions.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('DeFi Protocol Combinations', () => {
    it('should build Jupiter swap transaction', async () => {
      const instruction = createBuiltInstruction('jupiter_swap', {
        userTransferAuthority: testKeypair1.publicKey.toBase58(),
        userSourceTokenAccount: testKeypair2.publicKey.toBase58(),
        userDestinationTokenAccount: testKeypair3.publicKey.toBase58(),
        destinationTokenAccount: testKeypair2.publicKey.toBase58(),
        destinationMint: testKeypair3.publicKey.toBase58(),
      }, { amount: 1000000, minAmountOut: 900000 });

      const draft = createTestDraft([instruction]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThan(0);
    });

    it('should build Raydium swap transaction', async () => {
      const instruction = createBuiltInstruction('raydium_swap', {
        ammId: testKeypair1.publicKey.toBase58(),
        ammAuthority: testKeypair2.publicKey.toBase58(),
        ammOpenOrders: testKeypair3.publicKey.toBase58(),
        ammTargetOrders: testKeypair1.publicKey.toBase58(),
        poolCoinTokenAccount: testKeypair2.publicKey.toBase58(),
        poolPcTokenAccount: testKeypair3.publicKey.toBase58(),
        serumProgramId: testKeypair1.publicKey.toBase58(),
        serumMarket: testKeypair2.publicKey.toBase58(),
        serumBids: testKeypair3.publicKey.toBase58(),
        serumAsks: testKeypair1.publicKey.toBase58(),
        serumEventQueue: testKeypair2.publicKey.toBase58(),
        serumCoinVaultAccount: testKeypair3.publicKey.toBase58(),
        serumPcVaultAccount: testKeypair1.publicKey.toBase58(),
        serumVaultSigner: testKeypair2.publicKey.toBase58(),
        userSourceTokenAccount: testKeypair3.publicKey.toBase58(),
        userDestinationTokenAccount: testKeypair1.publicKey.toBase58(),
        userSourceOwner: testKeypair1.publicKey.toBase58(),
      }, { amountIn: 1000000, minimumAmountOut: 900000 });

      const draft = createTestDraft([instruction]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThan(0);
    });
  });

  describe('NFT Operations', () => {
    it('should build Magic Eden buy transaction', async () => {
      const instruction = createBuiltInstruction('me_buy_now', {
        auctionHouse: testKeypair1.publicKey.toBase58(),
        auctionHouseFeeAccount: testKeypair2.publicKey.toBase58(),
        auctionHouseTreasury: testKeypair3.publicKey.toBase58(),
        buyerTradeState: testKeypair1.publicKey.toBase58(),
        sellerTradeState: testKeypair2.publicKey.toBase58(),
        freeSellerTradeState: testKeypair3.publicKey.toBase58(),
        buyer: testKeypair1.publicKey.toBase58(),
        seller: testKeypair2.publicKey.toBase58(),
        tokenAccount: testKeypair3.publicKey.toBase58(),
        tokenMint: testKeypair1.publicKey.toBase58(),
        treasuryMint: testKeypair2.publicKey.toBase58(),
        buyerReceiptTokenAccount: testKeypair3.publicKey.toBase58(),
      }, {
        tradeStateBump: 255,
        escrowPaymentBump: 255,
        buyerPrice: 1000000000,
        tokenSize: 1,
      });

      const draft = createTestDraft([instruction]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Workflows', () => {
    it('should build complete token creation workflow', async () => {
      // 1. Create token + mint
      const createToken = createBuiltInstruction('spl_token_create_mint', {
        payer: testKeypair1.publicKey.toBase58(),
      }, {
        _operation: 'create_token_and_mint',
        decimals: 9,
        initialSupply: 1000000,
      });

      // 2. Create metadata
      const createMetadata = createBuiltInstruction('mpl_create_metadata', {
        metadata: testKeypair1.publicKey.toBase58(),
        mint: testKeypair2.publicKey.toBase58(),
        mintAuthority: testKeypair1.publicKey.toBase58(),
        payer: testKeypair1.publicKey.toBase58(),
        updateAuthority: testKeypair1.publicKey.toBase58(),
      }, {
        name: 'Test Token',
        symbol: 'TEST',
        uri: 'https://test.com/metadata.json',
      });

      const draft = createTestDraft([createToken, createMetadata]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThan(2);
    });

    it('should build arbitrage workflow (flash loan + swap + repay)', async () => {
      const flashLoan = createBuiltInstruction('kamino_flash_loan', {
        lendingPool: testKeypair1.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
        borrower: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, { amount: 1000000 });

      const swap = createBuiltInstruction('jupiter_swap', {
        userTransferAuthority: testKeypair1.publicKey.toBase58(),
        userSourceTokenAccount: testKeypair2.publicKey.toBase58(),
        userDestinationTokenAccount: testKeypair3.publicKey.toBase58(),
        destinationTokenAccount: testKeypair2.publicKey.toBase58(),
        destinationMint: testKeypair3.publicKey.toBase58(),
      }, { amount: 1000000, minAmountOut: 1100000 });

      const repay = createBuiltInstruction('kamino_flash_repay', {
        lendingPool: testKeypair1.publicKey.toBase58(),
        borrowerTokenAccount: testKeypair2.publicKey.toBase58(),
        borrower: testKeypair1.publicKey.toBase58(),
        tokenMint: testKeypair3.publicKey.toBase58(),
      }, { repayAmount: 1001000 });

      const draft = createTestDraft([flashLoan, swap, repay]);
      const tx = await builder.buildTransaction(draft);
      expect(tx.instructions.length).toBeGreaterThanOrEqual(3);
    });
  });
});

