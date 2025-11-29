'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, Loader2, Sparkles, ArrowRight, Copy, Download, AlertTriangle, Check, X, Eye, EyeOff } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface LoginGateProps {
  children: React.ReactNode;
}

export function LoginGate({ children }: LoginGateProps) {
  const { user, isLoading, createWallet } = useUser();
  const { publicKey, connect, disconnect, connecting, connected } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [vanityPrefix, setVanityPrefix] = useState('');
  const [walletMode, setWalletMode] = useState<'custodial' | 'hot' | null>(null);
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [passphraseCopied, setPassphraseCopied] = useState(false);
  const [passphraseSaved, setPassphraseSaved] = useState(false);

  // Show loading state while checking for user
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  // If user is logged in or hot wallet connected, show children
  if (user || (connected && publicKey)) {
    return <>{children}</>;
  }

  // Show login/wallet creation screen
  const handleCreateWallet = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: showEmailInput && email ? email : undefined,
          vanityPrefix: vanityPrefix.trim() || undefined,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create wallet');
      }

      // Store passphrase if provided
      if (data.passphrase) {
        setPassphrase(data.passphrase);
        setShowDisclaimer(true);
      } else {
        // If no passphrase, just create wallet normally
        await createWallet(
          showEmailInput && email ? email : undefined,
          vanityPrefix.trim() || undefined
        );
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to create wallet. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectHotWallet = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const handleDownloadPassphrase = () => {
    if (!passphrase) return;
    
    const blob = new Blob([passphrase], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-passphrase-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPassphraseSaved(true);
  };

  const handleCopyPassphrase = async () => {
    if (!passphrase) return;
    
    try {
      await navigator.clipboard.writeText(passphrase);
      setPassphraseCopied(true);
      setTimeout(() => setPassphraseCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleContinueAfterPassphrase = async () => {
    if (!passphraseSaved && !passphraseCopied) {
      alert('Please save or copy your passphrase before continuing!');
      return;
    }

    // Create wallet in user context
    try {
      await createWallet(
        showEmailInput && email ? email : undefined,
        vanityPrefix.trim() || undefined
      );
      setShowPassphrase(false);
      setShowDisclaimer(false);
      setPassphrase(null);
    } catch (error) {
      console.error('Failed to finalize wallet creation:', error);
    }
  };

  // Show passphrase screen
  if (showPassphrase && passphrase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-2xl w-full my-auto">
          <div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full mb-4 border border-green-500/30">
                <Wallet className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Save Your Recovery Passphrase
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Write down these 12 words in order and keep them safe
              </p>
            </div>

            {/* Passphrase Display */}
            <div className="mb-6">
              <div className="bg-gray-800/50 border-2 border-purple-500/30 rounded-xl p-6 mb-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {passphrase.split(' ').map((word, index) => (
                    <div
                      key={index}
                      className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                    >
                      <span className="text-xs text-gray-500 mr-2">{index + 1}.</span>
                      <span className="text-white font-semibold">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyPassphrase}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {passphraseCopied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Passphrase
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadPassphrase}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download as File
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-500/50 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h3 className="text-red-400 font-semibold mb-2">⚠️ Critical Security Warning</h3>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>Never share your passphrase with anyone</li>
                    <li>Store it in a secure location offline</li>
                    <li>Anyone with your passphrase can access your wallet</li>
                    <li>If you lose your passphrase, you cannot recover your wallet</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinueAfterPassphrase}
              disabled={!passphraseSaved && !passphraseCopied}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              I've Saved My Passphrase - Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show disclaimer before passphrase
  if (showDisclaimer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-lg w-full my-auto">
          <div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full mb-4 border border-yellow-500/30">
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
                Important: Save Your Passphrase
              </h1>
            </div>

            <div className="mb-6 space-y-4">
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
                <p className="text-sm text-yellow-200 mb-3">
                  Your wallet has been created! You will now see a 12-word recovery passphrase.
                </p>
                <p className="text-sm text-yellow-200 mb-3">
                  <strong>This is the ONLY way to recover your wallet.</strong> If you lose this passphrase, you will permanently lose access to your wallet and all funds.
                </p>
                <p className="text-sm text-yellow-200">
                  Please ensure you:
                </p>
                <ul className="text-sm text-yellow-200 mt-2 space-y-1 list-disc list-inside">
                  <li>Write it down on paper</li>
                  <li>Store it in a secure location</li>
                  <li>Never share it with anyone</li>
                  <li>Keep multiple copies in safe places</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisclaimer(false);
                  setPassphrase(null);
                }}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDisclaimer(false);
                  setShowPassphrase(true);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg font-semibold transition-colors"
              >
                I Understand - Show Passphrase
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-md w-full my-auto">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full mb-3 sm:mb-4 border border-purple-500/30">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Welcome to Sea Level Studio
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Connect your wallet or create a new one
            </p>
          </div>

          {/* Wallet Mode Selection */}
          {!walletMode && (
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setWalletMode('hot')}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Connect Hot Wallet (Phantom, Solflare, etc.)
              </button>
              <button
                onClick={() => setWalletMode('custodial')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Create Custodial Wallet
              </button>
            </div>
          )}

          {/* Hot Wallet Connection */}
          {walletMode === 'hot' && (
            <div className="space-y-4">
              <button
                onClick={() => setWalletMode(null)}
                className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleConnectHotWallet}
                disabled={connecting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Connect using Phantom, Solflare, or any Solana wallet extension
              </p>
            </div>
          )}

          {/* Custodial Wallet Creation */}
          {walletMode === 'custodial' && (
            <div className="space-y-4">
              <button
                onClick={() => setWalletMode(null)}
                className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Back
              </button>

              {/* Email Input (Optional) */}
              {showEmailInput && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Email (Optional - for wallet recovery)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Vanity Address Generation */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      🎨 Vanity Address (Optional - for fun!)
                    </label>
                    <input
                      type="text"
                      value={vanityPrefix}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^1-9A-HJ-NP-Za-km-z]/g, '');
                        setVanityPrefix(value);
                      }}
                      placeholder="Type prefix (e.g., 'SEAL', 'ABC')"
                      maxLength={8}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Your wallet address will start with this prefix! Shorter prefixes (1-3 chars) are faster.
                    </p>
                  </div>
                </div>
              )}

              {/* Create Wallet Button */}
              <button
                onClick={handleCreateWallet}
                disabled={isCreating}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Creating Wallet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Create New Wallet</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>

              {/* Email Toggle */}
              <button
                onClick={() => setShowEmailInput(!showEmailInput)}
                className="w-full text-xs sm:text-sm text-gray-400 hover:text-gray-300 transition-colors py-1"
              >
                {showEmailInput ? 'Skip email (create wallet without recovery)' : 'Add email for wallet recovery'}
              </button>
            </div>
          )}

          {/* Info */}
          {!walletMode && (
            <div className="mt-4 sm:mt-6 space-y-3">
              <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-300">
                  <strong className="text-blue-200">🔒 Secure:</strong> Your wallet is created securely and stored server-side. 
                  You can access it anytime by logging in.
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <a
                  href="https://discord.gg/sealevelstudios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs sm:text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span><strong className="text-indigo-200">💬 Join Discord:</strong> Connect with @sealevelstudios community</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
