'use client';

import React, { useState } from 'react';
import { Wallet, Copy, Download, AlertTriangle, Check, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface WalletPassphraseModalProps {
  passphrase: string;
  walletAddress: string;
  privateKey?: string; // Optional - only shown if provided
  onContinue: () => void;
  onCancel?: () => void;
}

export function WalletPassphraseModal({
  passphrase,
  walletAddress,
  privateKey,
  onContinue,
  onCancel,
}: WalletPassphraseModalProps) {
  const [passphraseCopied, setPassphraseCopied] = useState(false);
  const [passphraseSaved, setPassphraseSaved] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyCopied, setPrivateKeyCopied] = useState(false);
  const [privateKeySaved, setPrivateKeySaved] = useState(false);

  const handleCopyPassphrase = async () => {
    try {
      await navigator.clipboard.writeText(passphrase);
      setPassphraseCopied(true);
      setTimeout(() => setPassphraseCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadPassphrase = () => {
    const content = `Wallet Recovery Information\n` +
      `========================\n\n` +
      `Wallet Address: ${walletAddress}\n` +
      `Recovery Passphrase (12 words):\n${passphrase}\n\n` +
      `IMPORTANT: Keep this information secure. Anyone with your passphrase can access your wallet.\n` +
      `Never share this with anyone. Store it in a safe, offline location.\n\n` +
      `Generated: ${new Date().toISOString()}\n`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-backup-${walletAddress.slice(0, 8)}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPassphraseSaved(true);
  };

  const handleCopyPrivateKey = async () => {
    if (!privateKey) return;
    try {
      await navigator.clipboard.writeText(privateKey);
      setPrivateKeyCopied(true);
      setTimeout(() => setPrivateKeyCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadPrivateKey = () => {
    if (!privateKey) return;
    const content = `Wallet Private Key\n` +
      `==================\n\n` +
      `Wallet Address: ${walletAddress}\n` +
      `Private Key (Base58):\n${privateKey}\n\n` +
      `⚠️ CRITICAL SECURITY WARNING:\n` +
      `This is your private key. Anyone with this key has FULL access to your wallet.\n` +
      `- Never share this with anyone\n` +
      `- Never store this online or in cloud storage\n` +
      `- Store this in a secure, offline location\n` +
      `- Consider using the passphrase instead for recovery\n\n` +
      `Generated: ${new Date().toISOString()}\n`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-private-key-${walletAddress.slice(0, 8)}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPrivateKeySaved(true);
  };

  const canContinue = passphraseSaved || passphraseCopied;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-auto">
        <div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full mb-4 border border-green-500/30">
              <Wallet className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Save Your Recovery Information
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Your wallet has been created! Save this information securely.
            </p>
            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
              <p className="text-sm font-mono text-white break-all">{walletAddress}</p>
            </div>
          </div>

          {/* Passphrase Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span>🔑 Recovery Passphrase (12 words)</span>
            </h2>
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
                Download Backup
              </button>
            </div>
          </div>

          {/* Private Key Section (if provided) */}
          {privateKey && (
            <div className="mb-6 p-4 bg-red-900/10 border-2 border-red-500/30 rounded-xl">
              <h2 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Private Key (Advanced - Use with Caution)
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                Your private key provides direct access to your wallet. Only download if you understand the risks.
              </p>
              
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {showPrivateKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showPrivateKey ? 'Hide' : 'Show'} Private Key
                  </button>
                </div>
                {showPrivateKey && (
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 mb-3">
                    <p className="text-xs font-mono text-white break-all">{privateKey}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyPrivateKey}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 rounded-lg font-semibold transition-colors text-sm"
                >
                  {privateKeyCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Private Key
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadPrivateKey}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 rounded-lg font-semibold transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Private Key
                </button>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-500/50 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="text-red-400 font-semibold mb-2">⚠️ Critical Security Warning</h3>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>Never share your passphrase or private key with anyone</li>
                  <li>Store it in a secure location offline</li>
                  <li>Anyone with your passphrase can access your wallet</li>
                  <li>If you lose your passphrase, you cannot recover your wallet</li>
                  <li>Make multiple secure backups</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              I've Saved My Information - Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

