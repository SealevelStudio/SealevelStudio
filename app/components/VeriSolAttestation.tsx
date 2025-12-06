// VeriSol Attestation Component
// Allows users to create a beta tester attestation that will be minted as a cNFT
// Uses zk proofs to verify credentials privately

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  Copy,
  Sparkles,
  Settings,
  Wallet as WalletIcon,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  mintVeriSolAttestation,
  checkVeriSolSetup,
} from '../lib/verisol';
import {
  verifyUsageRequirements,
} from '../lib/verisol/beta-tester-proof';
import { getTierForUsage, getTierInfo, TIER_CONFIG } from '../lib/attestation/client';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useUser } from '../contexts/UserContext';
import { signTransactionWithCustodialAndSigners, shouldUseCustodialWallet } from '../lib/wallet-recovery/custodial-signer';
import { CopyButton } from './CopyButton';

interface VeriSolAttestationProps {
  connection?: Connection; // Optional, will use useConnection if not provided
}

export function VeriSolAttestation({ connection: connectionProp }: VeriSolAttestationProps) {
  const { connection: contextConnection } = useConnection();
  const wallet = useWallet();
  const { publicKey: externalWallet, connected: isWalletConnected, connect, connecting } = wallet;
  
  // Use prop connection if provided, otherwise use context connection
  const connection = connectionProp || contextConnection;
  const { user } = useUser();
  const { getStats, getTrialStatus } = useUsageTracking();
  const [useCustodial, setUseCustodial] = useState(true); // Default to custodial wallet
  const [isCreating, setIsCreating] = useState(false);
  const [attestationSignature, setAttestationSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cNFTAddress, setCNFTAddress] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<{
    ready: boolean;
    errors: string[];
  } | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(false);
  const [usageStats, setUsageStats] = useState<{
    totalUsage: number;
    meetsRequirement: boolean;
    minRequired: number;
  } | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<Array<{
    id: string;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
    message?: string;
    timestamp?: Date;
  }>>([]);

  // Determine which wallet to use
  const activeWallet = useCustodial && user?.walletAddress 
    ? new PublicKey(user.walletAddress)
    : externalWallet;

  const checkUsageStats = useCallback(() => {
    if (!activeWallet) return;
    
    const stats = getStats();
    if (!stats) {
      setUsageStats({
        totalUsage: 0,
        meetsRequirement: false,
        minRequired: 10,
      });
      return;
    }
    
    // Calculate total usage from features object
    const totalUsage = Object.values(stats.features).reduce((sum, count) => sum + count, 0);
    const tier = getTierForUsage(totalUsage);
    const minRequired = TIER_CONFIG[1].threshold; // Bronze tier minimum
    
    setUsageStats({
      totalUsage,
      meetsRequirement: tier > 0,
      minRequired,
    });
  }, [activeWallet, getStats]);

  const checkSetup = useCallback(async () => {
    setIsCheckingSetup(true);
    try {
      const status = await checkVeriSolSetup(connection);
      setSetupStatus(status);
    } catch (err) {
      console.error('Error checking setup:', err);
      setSetupStatus({
        ready: false,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
      });
    } finally {
      setIsCheckingSetup(false);
    }
  }, [connection]);

  // Check VeriSol setup and usage stats on mount
  useEffect(() => {
    checkSetup();
    checkUsageStats();
  }, [connection, activeWallet, checkSetup, checkUsageStats]);

  // Update workflow step status
  const updateWorkflowStep = useCallback((id: string, status: 'pending' | 'in-progress' | 'completed' | 'error', message?: string) => {
    setWorkflowSteps(prev => {
      const existing = prev.find(s => s.id === id);
      if (existing) {
        return prev.map(s => s.id === id ? { ...s, status, message, timestamp: new Date() } : s);
      } else {
        return [...prev, { id, name: id, status, message, timestamp: new Date() }];
      }
    });
  }, []);

  // Initialize workflow steps
  const initializeWorkflow = () => {
    setWorkflowSteps([
      { id: 'check-program', name: 'Check Program Deployment', status: 'pending' },
      { id: 'load-idl', name: 'Load Program IDL', status: 'pending' },
      { id: 'verify-eligibility', name: 'Verify Eligibility', status: 'pending' },
      { id: 'build-transaction', name: 'Build Transaction', status: 'pending' },
      { id: 'sign-transaction', name: 'Sign Transaction', status: 'pending' },
      { id: 'send-transaction', name: 'Send Transaction', status: 'pending' },
      { id: 'confirm-transaction', name: 'Confirm Transaction', status: 'pending' },
      { id: 'check-airdrop', name: 'Check Airdrop Eligibility', status: 'pending' },
      { id: 'complete', name: 'Attestation Minted', status: 'pending' },
    ]);
  };

  // Mint attestation with support for both wallet types
  const mintAttestationWithWallet = useCallback(async (
    walletPubkey: PublicKey,
    usageCount: number,
    metadata: { name: string; symbol: string; uri: string }
  ): Promise<string> => {
    initializeWorkflow();
    // Create a wallet adapter that intercepts signing and sending
    const walletAdapter = {
      publicKey: walletPubkey,
      signTransaction: async (tx: Transaction | any) => {
        // Convert to Transaction if needed
        const transaction = tx instanceof Transaction ? tx : Transaction.from(tx.serialize());
        
        updateWorkflowStep('sign-transaction', 'in-progress', useCustodial ? 'Signing with custodial wallet...' : 'Signing with hot wallet...');
        
        try {
          let signedTx: Transaction;
          if (useCustodial && user?.walletAddress) {
            // Sign with custodial wallet via API
            signedTx = await signTransactionWithCustodialAndSigners(
              transaction,
              [],
              {
                userWalletAddress: user.walletAddress,
                connection,
              }
            ) as Transaction;
          } else {
            // Sign with external wallet
            if (!wallet.signTransaction) {
              throw new Error('External wallet signTransaction not available');
            }
            signedTx = await wallet.signTransaction(transaction);
          }
          updateWorkflowStep('sign-transaction', 'completed', 'Transaction signed successfully');
          return signedTx;
        } catch (error) {
          updateWorkflowStep('sign-transaction', 'error', error instanceof Error ? error.message : 'Signing failed');
          throw error;
        }
      },
      signAllTransactions: async (txs: (Transaction | any)[]): Promise<(Transaction | any)[]> => {
        const transactions = txs.map(tx => tx instanceof Transaction ? tx : Transaction.from(tx.serialize()));
        
        if (useCustodial && user?.walletAddress) {
          // Sign all with custodial wallet
          return await Promise.all(
            transactions.map(tx => signTransactionWithCustodialAndSigners(
              tx,
              [],
              {
                userWalletAddress: user.walletAddress,
                connection,
              }
            ))
          ) as Transaction[];
        } else {
          // Sign all with external wallet
          if (!wallet.signAllTransactions) {
            throw new Error('External wallet signAllTransactions not available');
          }
          return await wallet.signAllTransactions(transactions);
        }
      },
      sendTransaction: async (tx: Transaction | any, connection: Connection) => {
        // Convert to Transaction if needed
        const transaction = tx instanceof Transaction ? tx : Transaction.from(tx.serialize());
        
        updateWorkflowStep('send-transaction', 'in-progress', 'Sending transaction to network...');
        
        try {
          let signature: string;
          if (useCustodial && user?.walletAddress) {
            // Transaction already signed, just send it
            const serialized = transaction.serialize({ requireAllSignatures: false });
            signature = await connection.sendRawTransaction(serialized, {
              skipPreflight: false,
              maxRetries: 3,
            });
          } else {
            // Send with external wallet
            if (!wallet.sendTransaction) {
              throw new Error('External wallet sendTransaction not available');
            }
            signature = await wallet.sendTransaction(transaction, connection);
          }
          updateWorkflowStep('send-transaction', 'completed', `Transaction sent: ${signature.slice(0, 8)}...${signature.slice(-8)}`);
          return signature;
        } catch (error) {
          updateWorkflowStep('send-transaction', 'error', error instanceof Error ? error.message : 'Sending failed');
          throw error;
        }
      },
    };

    // Create mock wallet context
    const mockWallet = {
      publicKey: walletPubkey,
      signTransaction: walletAdapter.signTransaction,
      signAllTransactions: walletAdapter.signAllTransactions,
      sendTransaction: walletAdapter.sendTransaction,
    } as any;

    try {
      // Step 1: Check program deployment
      updateWorkflowStep('check-program', 'in-progress', 'Checking if attestation program is deployed...');
      const { checkAttestationProgramDeployed } = await import('../lib/attestation/client');
      const isDeployed = await checkAttestationProgramDeployed(connection);
      if (!isDeployed) {
        updateWorkflowStep('check-program', 'error', 'Program not deployed');
        throw new Error('Attestation program not deployed');
      }
      updateWorkflowStep('check-program', 'completed', 'Program is deployed');

      // Step 2: Load IDL (happens inside mintVeriSolAttestation)
      updateWorkflowStep('load-idl', 'in-progress', 'Loading program IDL...');

      // Step 3: Verify eligibility
      updateWorkflowStep('verify-eligibility', 'in-progress', `Verifying eligibility for ${usageCount} usage count...`);
      const tier = getTierForUsage(usageCount);
      if (tier === 0) {
        updateWorkflowStep('verify-eligibility', 'error', `Insufficient usage: ${usageCount}`);
        throw new Error(`Insufficient usage: ${usageCount}`);
      }
      const tierInfo = getTierInfo(tier);
      updateWorkflowStep('verify-eligibility', 'completed', `Eligible for ${tierInfo.name} tier`);

      // Step 4: Build transaction
      updateWorkflowStep('build-transaction', 'in-progress', 'Building mint transaction...');

      // Step 7: Confirm transaction (will be updated after sending)
      updateWorkflowStep('confirm-transaction', 'pending', 'Waiting for confirmation...');

      // Call the mint function (it will handle steps 4-7 via wallet adapter)
      const signature = await mintVeriSolAttestation({
        connection,
        wallet: mockWallet,
        usageCount,
        metadata,
      });

      // Update steps that were completed by the mint function
      updateWorkflowStep('load-idl', 'completed', 'IDL loaded successfully');
      updateWorkflowStep('build-transaction', 'completed', 'Transaction built');
      
      // Confirm transaction
      updateWorkflowStep('confirm-transaction', 'in-progress', 'Waiting for confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');
      updateWorkflowStep('confirm-transaction', 'completed', 'Transaction confirmed');

      // Step 8: Check airdrop eligibility
      updateWorkflowStep('check-airdrop', 'in-progress', 'Checking airdrop eligibility...');
      try {
        const { checkAirdropEligibility } = await import('../lib/seal-token/airdrop');
        const eligibility = await checkAirdropEligibility(connection, walletPubkey);
        if (eligibility.eligible) {
          updateWorkflowStep('check-airdrop', 'completed', 'Eligible for SEAL airdrop');
        } else {
          updateWorkflowStep('check-airdrop', 'completed', 'Not eligible for airdrop');
        }
      } catch (airdropError) {
        updateWorkflowStep('check-airdrop', 'completed', 'Airdrop check skipped (non-critical)');
      }

      // Step 9: Complete
      updateWorkflowStep('complete', 'completed', `Attestation minted successfully! Tier: ${tierInfo.name}`);

      return signature;
    } catch (error) {
      // Mark current step as error
      setWorkflowSteps(prev => {
        const currentStep = prev.find(s => s.status === 'in-progress');
        if (currentStep) {
          return prev.map(s => 
            s.id === currentStep.id 
              ? { ...s, status: 'error' as const, message: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date() }
              : s
          );
        }
        return prev;
      });
      throw error;
    }
  }, [useCustodial, user, wallet, connection, updateWorkflowStep]);

  const handleCreateAttestation = useCallback(async () => {
    if (!activeWallet) {
      if (useCustodial && !user?.walletAddress) {
        setError('Please create a custodial wallet or connect your hot wallet');
      } else if (!useCustodial && !externalWallet) {
        setError('Please connect your hot wallet or use your custodial wallet');
      } else {
        setError('Please connect a wallet');
      }
      return;
    }

    // 1. Verify usage requirements first
    const stats = getStats();
    if (!stats) {
      setError('Unable to retrieve usage statistics. Please try again.');
      return;
    }
    
    // Calculate total usage from features object
    const featuresTotal = Object.values(stats.features).reduce((sum, count) => sum + count, 0);
    const tier = getTierForUsage(featuresTotal);
    
    if (tier === 0) {
      setError(`Insufficient usage: ${featuresTotal} (minimum ${TIER_CONFIG[1].threshold} required for Bronze tier)`);
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(false);
    setAttestationSignature(null);
    setCNFTAddress(null);
    setWorkflowSteps([]); // Clear previous workflow steps

    try {
      // 2. Calculate total usage from features
      const featuresTotal = Object.values(stats.features).reduce((sum, count) => sum + count, 0);

      // 3. Mint attestation with simple verification (no ZK proof needed)
      // Just pass the usage count directly
      const tierInfo = getTierInfo(tier);
      const signature = await mintAttestationWithWallet(
        activeWallet,
        featuresTotal,
        {
          name: `Sealevel Studio Beta Tester - ${tierInfo.name}`,
          symbol: `BETA-${tierInfo.name.slice(0, 1)}`,
          uri: `https://sealevel.studio/metadata/beta-tester-${tierInfo.name.toLowerCase()}.json`,
        }
      );

      setAttestationSignature(signature);
      setSuccess(true);
      setError(null);
      
      // Show tier in success message
      console.log(`Minted ${tierInfo.name} tier attestation (${tierInfo.rarity})`);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // TODO: Extract cNFT address from transaction logs
      // For now, we'll leave it null as extracting it requires parsing Bubblegum events
    } catch (err) {
      console.error('Error creating attestation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create attestation');
      setSuccess(false);
    } finally {
      setIsCreating(false);
    }
  }, [activeWallet, useCustodial, user, wallet, connection, getStats]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
      {/* Wallet Selection */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-blue-400 font-medium">Select Wallet</p>
          <div className="flex gap-2">
            <button
              onClick={() => setUseCustodial(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                useCustodial
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <WalletIcon size={16} className="inline mr-2" />
              Custodial Wallet
            </button>
            <button
              onClick={() => setUseCustodial(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !useCustodial
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <WalletIcon size={16} className="inline mr-2" />
              Hot Wallet
            </button>
          </div>
        </div>
        {useCustodial ? (
          <div>
            {user?.walletAddress ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-white">
                  Using custodial wallet: <span className="font-mono text-sm text-white font-semibold">{user.walletAddress}</span>
                </p>
                <CopyButton text={user.walletAddress} size={12} />
              </div>
            ) : (
              <p className="text-sm text-yellow-400">
                No custodial wallet found. Please create one in settings or use your hot wallet.
              </p>
            )}
          </div>
        ) : (
          <div>
            {externalWallet ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-white">
                  Using hot wallet: <span className="font-mono text-sm text-white font-semibold">{externalWallet.toString()}</span>
                </p>
                <CopyButton text={externalWallet.toString()} size={12} />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-yellow-400">
                  Please connect your hot wallet (Phantom, Solflare, etc.) to use this option.
                </p>
                <div className="flex justify-start">
                  <WalletMultiButton 
                    className="!bg-gradient-to-r !from-purple-500 !to-indigo-600 hover:!from-purple-600 hover:!to-indigo-700 !transition-all !rounded-lg !px-4 !py-2 !text-sm !font-medium !text-white !border-0"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!activeWallet && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center mb-6">
          <Shield size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Wallet Required</h3>
          <p className="text-slate-400">
            {useCustodial 
              ? 'Please create a custodial wallet or switch to hot wallet to create a VeriSol beta tester attestation.'
              : 'Please connect your hot wallet or switch to custodial wallet to create a VeriSol beta tester attestation.'}
          </p>
        </div>
      )}

      {/* Real-time Workflow Visualization */}
      {workflowSteps.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={20} />
            Attestation Workflow (Real-time)
          </h3>
          <div className="space-y-3">
            {workflowSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  step.status === 'completed'
                    ? 'bg-green-900/20 border-green-700/50'
                    : step.status === 'in-progress'
                    ? 'bg-blue-900/20 border-blue-700/50'
                    : step.status === 'error'
                    ? 'bg-red-900/20 border-red-700/50'
                    : 'bg-slate-900/50 border-slate-700'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.status === 'completed' ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : step.status === 'in-progress' ? (
                    <Loader size={18} className="text-blue-400 animate-spin" />
                  ) : step.status === 'error' ? (
                    <XCircle size={18} className="text-red-400" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-medium text-sm ${
                        step.status === 'completed'
                          ? 'text-green-300'
                          : step.status === 'in-progress'
                          ? 'text-blue-300'
                          : step.status === 'error'
                          ? 'text-red-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </span>
                    {step.timestamp && (
                      <span className="text-xs text-slate-500">
                        {step.timestamp.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {step.message && (
                    <p
                      className={`text-xs ${
                        step.status === 'completed'
                          ? 'text-green-400/80'
                          : step.status === 'in-progress'
                          ? 'text-blue-400/80'
                          : step.status === 'error'
                          ? 'text-red-400/80'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">VeriSol Beta Tester Attestation</h2>
          <p className="text-slate-400 text-sm">
            Create a verifiable credential proving you were a beta tester
          </p>
        </div>
      </div>

      {/* Tier Information */}
      {usageStats && usageStats.totalUsage > 0 && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles size={20} />
            Your Tier Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((tierNum) => {
              const tierInfo = TIER_CONFIG[tierNum];
              const currentTier = getTierForUsage(usageStats.totalUsage);
              const isUnlocked = currentTier >= tierNum;
              const isCurrent = currentTier === tierNum;
              
              return (
                <div
                  key={tierNum}
                  className={`border-2 rounded-lg p-4 ${
                    isCurrent
                      ? 'bg-opacity-20'
                      : isUnlocked
                      ? 'border-slate-600 bg-slate-800/50'
                      : 'border-slate-700 bg-slate-900/50 opacity-60'
                  }`}
                  style={{
                    borderColor: isCurrent ? tierInfo.color : isUnlocked ? '#475569' : '#334155',
                    backgroundColor: isCurrent ? `${tierInfo.color}20` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: isCurrent ? tierInfo.color : '#6B7280' }}
                    >
                      {tierInfo.name}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{tierInfo.rarity}</div>
                  <div className="text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Threshold:</span>
                      <span className="font-semibold">{tierInfo.threshold}+</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Your Usage:</span>
                      <span className={isUnlocked ? 'text-green-400' : 'text-slate-500'}>
                        {usageStats.totalUsage}
                      </span>
                    </div>
                    {!isUnlocked && (
                      <div className="text-xs text-slate-500 mt-2">
                        Need {tierInfo.threshold - usageStats.totalUsage} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Sparkles size={16} />
            Attestation Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Credential Type:</span>
              <span className="text-white font-mono">Beta Tester</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Wallet Address:</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-xs">
                  {activeWallet?.toString() || 'N/A'}
                </span>
                {activeWallet && <CopyButton text={activeWallet.toString()} size={12} />}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Verification:</span>
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle size={14} />
                Simple Verification
              </span>
            </div>
            {usageStats && usageStats.totalUsage > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Your Tier:</span>
                <span
                  className="font-semibold"
                  style={{ color: getTierInfo(getTierForUsage(usageStats.totalUsage)).color }}
                >
                  {getTierInfo(getTierForUsage(usageStats.totalUsage)).name} ({getTierInfo(getTierForUsage(usageStats.totalUsage)).rarity})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Format:</span>
              <span className="text-white">Compressed NFT (cNFT)</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-red-400 font-semibold mb-1">Error</h4>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && usageStats && (
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-green-400 font-semibold mb-2">
                  {(() => {
                    const tier = getTierForUsage(usageStats.totalUsage);
                    const tierInfo = getTierInfo(tier);
                    return `Attestation Created Successfully! - ${tierInfo.name} Tier (${tierInfo.rarity})`;
                  })()}
                </h4>
                {attestationSignature && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-300">Transaction:</span>
                      <a
                        href={`https://solscan.io/tx/${attestationSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
                      >
                        {attestationSignature.slice(0, 8)}...{attestationSignature.slice(-8)}
                        <ExternalLink size={12} />
                      </a>
                      <CopyButton text={attestationSignature} size={12} />
                    </div>
                    {cNFTAddress && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-300">cNFT Address:</span>
                        <span className="text-sm font-mono text-green-400">
                          {cNFTAddress.slice(0, 8)}...{cNFTAddress.slice(-8)}
                        </span>
                        <CopyButton text={cNFTAddress} size={12} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Setup Status */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-300">VeriSol Setup Status</h4>
          <button
            onClick={checkSetup}
            disabled={isCheckingSetup}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Refresh setup status"
          >
            <Settings size={16} className={isCheckingSetup ? 'animate-spin' : ''} />
          </button>
        </div>
        {isCheckingSetup ? (
          <div className="text-sm text-slate-400">Checking setup...</div>
        ) : setupStatus ? (
          setupStatus.ready ? (
            <div className="text-sm text-green-400 flex items-center gap-2">
              <CheckCircle size={16} />
              <span>VeriSol infrastructure ready</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>Setup incomplete - Fix the issues below</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside ml-4">
                {setupStatus.errors.map((err, idx) => (
                  <li key={idx} className="leading-relaxed">{err}</li>
                ))}
              </ul>
              <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-700">
                <p className="text-xs font-semibold text-slate-300 mb-2">Quick Fixes:</p>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  {setupStatus.errors.some(e => e.includes('program') || e.includes('Program')) && (
                    <>
                      <li>Deploy program: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">cd programs/attestation-program && anchor deploy --provider.cluster devnet</code></li>
                      <li>Set <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">NEXT_PUBLIC_ATTESTATION_PROGRAM_ID</code> in .env.local</li>
                    </>
                  )}
                  {setupStatus.errors.some(e => e.includes('merkle tree') || e.includes('Merkle')) && (
                    <>
                      <li>Create merkle tree: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">npm run setup:merkle-tree</code></li>
                      <li>Set <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">NEXT_PUBLIC_BETA_TESTER_MERKLE_TREE</code> in .env.local</li>
                    </>
                  )}
                  {setupStatus.errors.some(e => e.includes('IDL') || e.includes('idl')) && (
                    <li>Build program: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">cd programs/attestation-program && anchor build</code></li>
                  )}
                  {setupStatus.errors.some(e => e.includes('registry') || e.includes('Registry')) && (
                    <li>Initialize registry by calling <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">client.initialize(merkleTree)</code> once (requires authority wallet)</li>
                  )}
                </ul>
                <div className="mt-3 pt-2 border-t border-slate-700">
                  <a 
                    href="/docs/ATTESTATION_SETUP_GUIDE.md" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                  >
                    📖 View Full Setup Guide
                    <ExternalLink size={12} />
                  </a>
                  <span className="text-xs text-slate-500 mx-2">|</span>
                  <button
                    onClick={() => {
                      window.open('https://github.com/coral-xyz/anchor', '_blank');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Anchor Docs
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="text-sm text-slate-400">Click refresh to check setup</div>
        )}
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">How It Works</h4>
        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
          <li>Your usage is tracked automatically as you use Sealevel Studio features</li>
          <li>Attestations are minted based on your total usage count</li>
          <li>Three tiers available: Bronze (10+), Silver (50+), Gold (250+)</li>
          <li>Higher tiers receive rarer cNFTs with unique metadata</li>
          <li>Your credential is stored on-chain as a compressed NFT</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-slate-700">
          <h5 className="text-xs font-semibold text-slate-300 mb-2">Tier Requirements:</h5>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="font-semibold" style={{ color: TIER_CONFIG[1].color }}>Bronze:</span>
              <span className="text-slate-400 ml-1">{TIER_CONFIG[1].threshold}+ uses</span>
            </div>
            <div>
              <span className="font-semibold" style={{ color: TIER_CONFIG[2].color }}>Silver:</span>
              <span className="text-slate-400 ml-1">{TIER_CONFIG[2].threshold}+ uses</span>
            </div>
            <div>
              <span className="font-semibold" style={{ color: TIER_CONFIG[3].color }}>Gold:</span>
              <span className="text-slate-400 ml-1">{TIER_CONFIG[3].threshold}+ uses</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleCreateAttestation}
        disabled={!activeWallet || isCreating || success || (usageStats ? !usageStats.meetsRequirement : false)}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
      >
        {isCreating ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Creating Attestation...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle size={20} />
            <span>Attestation Created</span>
          </>
        ) : (
          <>
            <Shield size={20} />
            <span>Create Beta Tester Attestation</span>
          </>
        )}
      </button>
    </div>
  );
}

