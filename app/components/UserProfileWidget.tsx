import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Twitter, Send, LogOut, User as UserIcon, Wallet, Coins, Loader2 } from 'lucide-react';
import { DepositWallet } from './DepositWallet';

export function UserProfileWidget() {
  const { user, isLoading, linkTwitter, linkTelegram, logout, refreshBalance, createWallet } = useUser();
  const [isLinkingTwitter, setIsLinkingTwitter] = useState(false);
  const [isLinkingTelegram, setIsLinkingTelegram] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          <span className="text-sm text-gray-400">Loading wallet...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Creating your wallet...</h3>
            <p className="text-xs text-gray-400">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
            </h3>
            <p className="text-xs text-gray-400">
              {user.balance !== undefined ? `${user.balance.toFixed(4)} SOL` : 'Loading balance...'}
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Wallet Balance & Deposit */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 mb-3">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-300">Wallet Balance</span>
          </div>
          <span className="text-lg font-bold text-white">
            {user.balance !== undefined ? `${user.balance.toFixed(4)} SOL` : '---'}
          </span>
        </div>
        <button
          onClick={() => setShowDeposit(!showDeposit)}
          className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium text-sm transition-all"
        >
          {showDeposit ? 'Hide Deposit' : 'Deposit SOL'}
        </button>
        {showDeposit && (
          <div className="mt-4">
            <DepositWallet 
              walletAddress={user.walletAddress}
              balance={user.balance}
              onRefresh={refreshBalance}
            />
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
          <div className="flex items-center space-x-3">
            <Twitter className={`w-5 h-5 ${user.isTwitterLinked ? 'text-blue-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${user.isTwitterLinked ? 'text-white' : 'text-gray-400'}`}>
              {user.isTwitterLinked ? user.twitterHandle : 'Twitter not linked'}
            </span>
          </div>
          {!user.isTwitterLinked && (
            <button 
              onClick={async () => {
                setIsLinkingTwitter(true);
                try {
                  await linkTwitter();
                } finally {
                  setIsLinkingTwitter(false);
                }
              }}
              disabled={isLinkingTwitter}
              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-md transition-colors border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLinkingTwitter ? 'Opening...' : 'Connect'}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
          <div className="flex items-center space-x-3">
            <Send className={`w-5 h-5 ${user.isTelegramLinked ? 'text-blue-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${user.isTelegramLinked ? 'text-white' : 'text-gray-400'}`}>
              {user.isTelegramLinked ? user.telegramHandle : 'Telegram not linked'}
            </span>
          </div>
          {!user.isTelegramLinked && (
            <button 
              onClick={async () => {
                setIsLinkingTelegram(true);
                try {
                  await linkTelegram();
                } finally {
                  setIsLinkingTelegram(false);
                }
              }}
              disabled={isLinkingTelegram}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded-md transition-colors border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLinkingTelegram ? 'Opening...' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Credits / Status */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-300">Ad Credits</span>
        </div>
        <span className="text-lg font-bold text-white">{user.credits.toLocaleString()}</span>
      </div>
    </div>
  );
}

