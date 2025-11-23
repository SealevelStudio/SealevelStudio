'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut } from 'lucide-react';
import { useNetwork } from '../contexts/NetworkContext';
import { useUser } from '../contexts/UserContext';

export const WalletButton = () => {
  const { publicKey, disconnect, wallet } = useWallet();
  const { network } = useNetwork();
  const { user } = useUser();

  // Force wallet to reconnect when network changes
  const handleNetworkSwitch = async () => {
    if (wallet) {
      try {
        // Disconnect current wallet
        await disconnect();
        // The wallet should reconnect to the new network
        console.log(`Wallet should now connect to ${network}`);
      } catch (error) {
        console.error('Error switching wallet network:', error);
      }
    }
  };

  // Show custodial wallet if available, otherwise show external wallet options
  if (user?.walletAddress) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium text-gray-300">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
          </span>
          {user.balance !== undefined && (
            <span className="text-xs text-gray-500 ml-2">
              {user.balance.toFixed(2)} SOL
            </span>
          )}
        </div>
      </div>
    );
  }

  // Fallback to external wallet connection (optional)
  if (publicKey) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium text-gray-300">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          title="Disconnect Wallet"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <WalletMultiButton 
        className="!bg-gradient-to-r !from-purple-500 !to-indigo-600 hover:!from-purple-600 hover:!to-indigo-700 !transition-all !rounded-lg !px-4 !py-2 !text-sm !font-medium !text-white !border-0"
      />
      <span className="text-xs text-gray-400">
        ({network})
      </span>
    </div>
  );
};

export default WalletButton;
