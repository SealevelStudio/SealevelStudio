'use client';

import React from 'react';
import { Wallet, Shield, Key, AlertTriangle, X, ArrowRight, BookOpen } from 'lucide-react';

interface WalletEducationModalProps {
  onContinue: () => void;
  onSkip?: () => void;
}

export function WalletEducationModal({ onContinue, onSkip }: WalletEducationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-3xl w-full my-auto">
        <div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Close button */}
          {onSkip && (
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full mb-6 border border-purple-500/30">
              <BookOpen className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Understanding Crypto Wallets
            </h1>
            <p className="text-gray-400 text-lg">
              Learn the basics before creating your wallet
            </p>
          </div>

          {/* Educational Content */}
          <div className="space-y-6 mb-8">
            {/* What is a Wallet */}
            <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <Wallet className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">What is a Crypto Wallet?</h3>
                  <p className="text-gray-300 leading-relaxed">
                    A crypto wallet is like a digital bank account for your cryptocurrency. It stores your digital assets (like SOL tokens) and allows you to send, receive, and manage them on the blockchain. Think of it as a combination of a bank account number (your wallet address) and a password (your private key).
                  </p>
                </div>
              </div>
            </div>

            {/* Passphrase Explanation */}
            <div className="bg-gray-800/50 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <Key className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Your Recovery Passphrase</h3>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Your wallet will generate a <strong className="text-blue-400">12-word recovery passphrase</strong>. This is the master key to your wallet. It's like a password that can recover your entire wallet if you ever lose access.
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-2">
                    <li>Write it down on paper and store it safely</li>
                    <li>Never share it with anyone - not even us!</li>
                    <li>Keep multiple secure copies in different locations</li>
                    <li>If you lose it, you lose access to your wallet forever</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security Warning */}
            <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-red-400 mb-2">⚠️ Critical Security Rules</h3>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-2">
                    <li><strong className="text-red-400">NEVER</strong> share your passphrase with anyone</li>
                    <li><strong className="text-red-400">NEVER</strong> enter it on any website</li>
                    <li><strong className="text-red-400">NEVER</strong> store it online or in cloud storage</li>
                    <li><strong className="text-red-400">NEVER</strong> take screenshots of it</li>
                    <li><strong className="text-red-400">ONLY</strong> use it to recover your wallet if needed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-gray-800/50 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">How Wallets Work</h3>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    When you create a wallet, you'll get:
                  </p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside ml-2">
                    <li><strong className="text-green-400">Wallet Address:</strong> A public address (like a bank account number) that others can use to send you tokens</li>
                    <li><strong className="text-green-400">Private Key:</strong> A secret key that proves you own the wallet (keep this secret!)</li>
                    <li><strong className="text-green-400">Recovery Passphrase:</strong> 12 words that can recreate your entire wallet</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {onSkip && (
              <button
                onClick={onSkip}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Skip Tutorial
              </button>
            )}
            <button
              onClick={onContinue}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50"
            >
              I Understand - Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

