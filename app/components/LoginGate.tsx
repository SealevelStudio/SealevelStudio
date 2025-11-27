'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Wallet, Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface LoginGateProps {
  children: React.ReactNode;
}

export function LoginGate({ children }: LoginGateProps) {
  const { user, isLoading, createWallet } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

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

  // If user is logged in, show children
  if (user) {
    return <>{children}</>;
  }

  // Show login/wallet creation screen
  const handleCreateWallet = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      await createWallet(showEmailInput && email ? email : undefined);
    } catch (error) {
      console.error('Failed to create wallet:', error);
      alert('Failed to create wallet. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full mb-4 border border-purple-500/30">
              <Wallet className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Welcome to Sea Level Studio
            </h1>
            <p className="text-gray-400">
              Create a wallet or login to get started
            </p>
          </div>

          {/* Email Input (Optional) */}
          {showEmailInput && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email (Optional - for wallet recovery)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Create Wallet Button */}
          <button
            onClick={handleCreateWallet}
            disabled={isCreating}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Wallet...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Create New Wallet</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Email Toggle */}
          <button
            onClick={() => setShowEmailInput(!showEmailInput)}
            className="w-full text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showEmailInput ? 'Skip email (create wallet without recovery)' : 'Add email for wallet recovery'}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong className="text-blue-200">🔒 Secure:</strong> Your wallet is created securely and stored server-side. 
              You can access it anytime by logging in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

