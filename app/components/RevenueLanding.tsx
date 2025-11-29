'use client';

import React, { useState } from 'react';
import {
  Zap,
  TrendingUp,
  Shield,
  Code,
  Brain,
  Check,
  ArrowRight,
  Star,
  Users,
  DollarSign,
  Sparkles,
  ArrowLeft,
  CreditCard,
  Coins,
  Wallet,
  CheckCircle2,
  Info,
  Gift,
} from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  badge?: string;
  paymentMethods: ('card' | 'crypto' | 'seal' | 'wire')[];
  savings?: string;
  annualPrice?: string;
  annualSavings?: string;
}

interface RevenueLandingProps {
  onBack?: () => void;
  onNavigateToPresale?: () => void;
  onNavigateToPremium?: () => void;
  onNavigateToVeriSol?: () => void;
}

export function RevenueLanding({ onBack, onNavigateToPresale, onNavigateToPremium, onNavigateToVeriSol }: RevenueLandingProps) {
  const [showPaymentMethods, setShowPaymentMethods] = useState<string | null>(null);

  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Sea Level Studio and learning Solana development',
      features: [
        'Account Inspector - Inspect any Solana account (wallets, tokens, programs) and see parsed data in human-readable format. Essential for debugging and understanding on-chain state.',
        '10 Transaction Builder Trials - Build and simulate up to 10 transactions to learn how Solana transactions work. See exactly what your transaction does before sending.',
        'Transaction Simulator - Fork the chain and see before/after state changes. Understand how your transaction mutates accounts without risking real funds.',
        'Basic Arbitrage Scanner - Scan 50 opportunities across Raydium, Orca, Jupiter, Meteora, and Lifinity. Find price differences between DEXs.',
        'AI Agent Queries (100) - Get help from AI agents for transaction building, code suggestions, and Solana development questions.',
        'Code Export (20) - Export your perfect transactions as copy-paste-ready TypeScript or Rust code for your dApp.',
        'Community Support - Access to community forums and documentation',
        'Devnet Faucet - Get free test SOL for development and testing',
        'Basic Analytics - View your transaction history and usage stats',
      ],
      cta: 'Get Started Free',
      paymentMethods: [],
    },
    {
      id: 'chad',
      name: 'Chad Tier',
      price: '$20',
      period: 'month',
      description: 'For builders who want unlimited transaction tools and DeFi operations',
      features: [
        'Everything in Free Tier',
        'Unlimited Transaction Builder - Build as many transactions as you need. No limits on testing, simulating, or deploying.',
        'Unlimited Account Inspector - Inspect unlimited accounts to debug issues, verify state, and understand program data structures.',
        'Unlimited Transaction Simulator - Test complex multi-instruction transactions without risk. See state changes for every account.',
        'Unlimited Code Export - Export unlimited transactions as production-ready code for your dApps and smart contracts.',
        'Advanced Transaction Builder - Build complex transactions with multiple instructions, CPIs (Cross-Program Invocations), and custom programs.',
        'Transaction Templates - Save and reuse common transaction patterns. Speed up development with pre-built templates.',
        'Transaction History Export - Export your transaction history as CSV or JSON for accounting, analytics, or compliance.',
        'Basic Analytics Dashboard - Track your transaction usage, success rates, and costs. Monitor your development activity.',
        'Basic API Access - Integrate Sealevel Studio into your workflow with REST API access for transaction building and simulation.',
        'Multi-Instruction Support - Build transactions with multiple instructions in sequence (e.g., create account + transfer + mint tokens).',
        'Token-2022 Support - Full support for Token-2022 extensions including transfer fees, hooks, confidential transfers, and more.',
        'Community Support - Priority access to community forums and faster response times',
      ],
      cta: 'Subscribe to Chad Tier',
      popular: true,
      badge: 'Most Popular',
      paymentMethods: ['card', 'crypto', 'seal'],
      savings: 'Best Value',
    },
    {
      id: 'dev',
      name: 'Dev Tier',
      price: '$75',
      period: 'month',
      description: 'For serious Solana developers building production dApps and DeFi protocols',
      features: [
        'Everything in Chad Tier',
        'AI Cyber Playground Access - Advanced AI agents for trading strategies, security auditing, blockchain analysis, and gaming management. 23 specialized AI agents at your disposal.',
        'Transaction Bundler - Multi-send SOL to up to 50 wallets in one transaction. Auto-create accounts automatically. Perfect for airdrops, payroll, and batch operations. (500 SEAL per transaction)',
        'Advanced Security Scanner - AI-powered vulnerability detection for your transactions. Identifies security risks, constraint violations, and potential exploits before deployment.',
        'Multi-Wallet Management - Manage multiple wallets, import/export keys, organize with labels and tags. Track balances across all your wallets.',
        'Full API Access - Complete REST API with authentication. Build Sealevel Studio into your CI/CD pipeline, automated trading systems, or custom tools.',
        'Custom Webhooks - Get real-time notifications for transaction confirmations, arbitrage opportunities, account changes, and more.',
        'Advanced Analytics Dashboard - Deep insights into your transaction patterns, success rates, gas costs, and usage trends. Export data for analysis.',
        'Priority Feature Requests - Your feature requests get prioritized. Help shape the future of Sealevel Studio.',
        'Premium Support (24hr response) - Direct access to the development team. Get help with complex issues and integration questions.',
        'Flash Loan Simulator - Test flash loan strategies without risk. Perfect for developing arbitrage bots and DeFi strategies.',
        'Jito Bundle Integration - Submit atomic transaction bundles to Jito Block Engine for MEV protection and guaranteed execution.',
        'Advanced Pathfinding - Multi-hop arbitrage pathfinding with dynamic slippage modeling. Find optimal routes across multiple DEXs.',
        'Signal Monitoring - Real-time alerts for new pool creation, large swaps, LSD de-pegging, and other on-chain events.',
      ],
      cta: 'Subscribe to Dev Tier',
      paymentMethods: ['card', 'crypto', 'seal'],
    },
    {
      id: 'degen',
      name: 'DEGEN Tier',
      price: '$200',
      period: 'month',
      description: 'For power users, professional traders, MEV searchers, and DeFi protocols',
      features: [
        'Everything in Dev Tier',
        'Market Maker Agent - Autonomous on-chain trading agent with customizable strategies. Grid trading, TWAP execution, real-time analytics. Own wallet with AI-driven trading decisions. (2,000 SEAL setup + 5,000 SEAL/month)',
        'Unlimited Arbitrage Scanner - No limits on scanning. Real-time WebSocket subscriptions for instant opportunity detection across all DEXs.',
        'Priority MEV Bundle Submission - Your bundles get priority in Jito Block Engine. Higher success rate for atomic arbitrage execution.',
        'Real-time Arbitrage Alerts - WebSocket-based alerts for profitable opportunities. Get notified instantly when arbitrage appears.',
        'Advanced MEV Tools - Front-running, back-running, sandwich attack protection. Protected arbitrage with user MEV sharing.',
        'Flash Loan Integration - Zero-capital arbitrage with Kamino flash loans. Borrow → Execute → Repay in one atomic transaction.',
        'Advanced Trading Tools - Portfolio optimization, risk assessment, position management. AI-powered trading strategies.',
        'Custom Bot Integration - Full API access for building custom trading bots, arbitrage systems, and automated strategies.',
        'Advertising Bots - Telegram and Twitter/X bots for token promotion. Automated posting, scheduling, message templating. (1,000-1,500 SEAL setup)',
        'Dedicated Support (12hr response) - Direct line to the development team. Priority support for critical issues.',
        'Early Access to New Features - Be the first to test new tools, strategies, and integrations before public release.',
        'Advanced Portfolio Analytics - Track P&L, ROI, risk metrics, and performance across all your trading activities.',
        'Enterprise-grade Security - Enhanced security scanning, audit reports, and compliance tools for institutional use.',
        'Multi-RPC Broadcasting - Submit bundles to multiple Jito endpoints for redundancy and higher success rates.',
        'Signal Monitoring Pro - Advanced monitoring for new pools, LSD de-pegging, large swaps, and oracle updates.',
        'Custom Strategy Development - Work with the team to develop custom trading strategies and integrations.',
      ],
      cta: 'Subscribe to DEGEN Tier',
      paymentMethods: ['card', 'crypto', 'seal'],
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+', icon: <Users className="w-5 h-5" /> },
    { label: 'Transactions Built', value: '500K+', icon: <Code className="w-5 h-5" /> },
    { label: 'Arbitrage Opportunities', value: '1M+', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Features Available', value: '50+', icon: <Sparkles className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 text-white relative overflow-y-auto">
      {/* Enhanced animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-indigo-900/30" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-1/3 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-purple-500/30 bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 border border-gray-700/50 hover:border-purple-500/50"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <button
                onClick={onNavigateToPresale}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-orange-500/50"
              >
                SEAL Presale
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 pb-24">
        {/* Hero Section */}
        <div className="text-center mb-20">
          {/* Beta Trial Announcement */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-full mb-6 backdrop-blur-sm animate-pulse">
            <Sparkles className="w-5 h-5 text-green-400" />
            <span className="text-base font-bold text-green-300">🚀 BETA TRIAL NOW LIVE - Get 10 Free Transactions!</span>
          </div>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm font-medium text-purple-300">The Future of Solana Development</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Build. Deploy. Profit.
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            The most powerful developer toolkit for Solana. Join thousands of developers building the future of DeFi.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={onNavigateToPremium}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={onNavigateToPresale}
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-orange-500/50 transform hover:scale-105"
            >
              Join SEAL Presale
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105"
            >
              <div className="flex justify-center mb-4 text-purple-400">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Pricing Tiers */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="text-gray-300 text-lg mb-8">Start free, upgrade when you're ready</p>
            
            {/* SEAL Staking Alternative */}
            <div className="mt-6 mb-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-full">
                <Star className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-300">
                  Alternative: Stake SEAL tokens to unlock tier features
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier) => {
              const displayPrice = tier.price;
              const displayPeriod = tier.period;

              return (
                <div
                  key={tier.id}
                  className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md border-2 rounded-2xl p-8 relative transition-all duration-300 hover:shadow-2xl ${
                    tier.popular 
                      ? 'border-purple-500/60 shadow-2xl shadow-purple-500/20 scale-105' 
                      : 'border-gray-700/50 hover:border-purple-500/40'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                        {tier.badge}
                      </span>
                    </div>
                  )}
                  
                  {tier.savings && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-green-500/30">
                        <Gift className="w-3.5 h-3.5" />
                        {tier.savings}
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-3 text-white">{tier.name}</h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">{displayPrice}</span>
                      {displayPeriod && (
                        <span className="text-gray-400 text-lg">/{displayPeriod}</span>
                      )}
                    </div>
                    {(tier.id === 'chad' || tier.id === 'dev' || tier.id === 'degen') && (
                      <div className="text-xs text-gray-400 mb-2">
                        Or stake SEAL tokens for equivalent access
                      </div>
                    )}
                    <p className="text-sm text-gray-300 leading-relaxed">{tier.description}</p>
                  </div>

                  {/* Payment Methods */}
                  {tier.paymentMethods.length > 0 && (
                    <div className="mb-6 pb-6 border-b border-gray-700/50">
                      <button
                        onClick={() => setShowPaymentMethods(showPaymentMethods === tier.id ? null : tier.id)}
                        className="flex items-center justify-between w-full text-left text-sm text-gray-300 hover:text-white transition-colors group"
                      >
                        <span className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                          <span className="font-medium">Payment Options</span>
                        </span>
                        <span className="text-xs bg-gray-700/50 px-2 py-1 rounded-full">
                          {tier.paymentMethods.length} method{tier.paymentMethods.length > 1 ? 's' : ''}
                        </span>
                      </button>
                      {showPaymentMethods === tier.id && (
                        <div className="mt-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                          {tier.paymentMethods.includes('card') && (
                            <div className="flex items-center gap-3 text-sm text-gray-200 bg-gradient-to-r from-gray-800/50 to-gray-700/30 p-3 rounded-lg border border-gray-700/50">
                              <CreditCard className="w-5 h-5 text-blue-400" />
                              <span>Credit/Debit Card</span>
                            </div>
                          )}
                          {tier.paymentMethods.includes('crypto') && (
                            <div className="flex items-center gap-3 text-sm text-gray-200 bg-gradient-to-r from-gray-800/50 to-gray-700/30 p-3 rounded-lg border border-gray-700/50">
                              <Coins className="w-5 h-5 text-yellow-400" />
                              <span>Cryptocurrency (SOL, USDC, USDT)</span>
                            </div>
                          )}
                          {tier.paymentMethods.includes('seal') && (
                            <div className="flex items-center gap-3 text-sm text-gray-200 bg-gradient-to-r from-gray-800/50 to-gray-700/30 p-3 rounded-lg border border-gray-700/50">
                              <Star className="w-5 h-5 text-orange-400" />
                              <span>SEAL Tokens (20% discount)</span>
                            </div>
                          )}
                          {tier.paymentMethods.includes('wire') && (
                            <div className="flex items-center gap-3 text-sm text-gray-200 bg-gradient-to-r from-gray-800/50 to-gray-700/30 p-3 rounded-lg border border-gray-700/50">
                              <DollarSign className="w-5 h-5 text-green-400" />
                              <span>Wire Transfer</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <ul className="space-y-3.5 mb-8 min-h-[400px]">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-200 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      if (tier.id === 'free') {
                        onNavigateToPremium?.();
                      } else if (tier.id === 'chad' || tier.id === 'dev' || tier.id === 'degen') {
                        // Navigate to VeriSol attestation page to verify tier eligibility
                        onNavigateToVeriSol?.();
                      } else {
                        onNavigateToPremium?.();
                      }
                    }}
                    className={`w-full py-3.5 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105'
                        : tier.id === 'degen'
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/50 transform hover:scale-105'
                        : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-purple-500/50'
                    }`}
                  >
                    {tier.cta}
                    {tier.id !== 'free' && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {tier.id === 'free' && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                      No credit card required
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* VeriSol Attestation & SEAL Staking Info */}
          <div className="mt-16 space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 shadow-xl">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-500/30">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4 text-white">VeriSol Attestation Required</h3>
                  <div className="space-y-3 text-sm text-gray-200">
                    <p>
                      <strong className="text-white">Tier Verification:</strong> All paid tiers require a VeriSol attestation to verify your eligibility. Visit the VeriSol page to get your tier verified.
                    </p>
                    <p>
                      <strong className="text-white">Two Ways to Access:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-gray-300">
                      <li><strong className="text-white">Subscription:</strong> Pay monthly with card, crypto, or SEAL tokens</li>
                      <li><strong className="text-white">SEAL Staking:</strong> Stake SEAL tokens to unlock tier features without a subscription</li>
                    </ul>
                    <p className="mt-4">
                      <strong className="text-white">How It Works:</strong> The VeriSol attestation system verifies your tier eligibility based on either your active subscription or your SEAL token stake amount. Once verified, you'll receive a compressed NFT (cNFT) attestation that grants you access to your tier's features.
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <button
                        onClick={() => onNavigateToVeriSol?.()}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 inline-flex items-center gap-2"
                      >
                        Get VeriSol Attestation
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 shadow-xl">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
                  <Coins className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4 text-white">Payment & Staking Options</h3>
                  <div className="space-y-3 text-sm text-gray-200">
                    <p>
                      <strong className="text-white">Credit/Debit Cards:</strong> Accepted via Stripe. Secure, instant activation.
                    </p>
                    <p>
                      <strong className="text-white">Cryptocurrency:</strong> Pay with SOL, USDC, or USDT. Automatic conversion at checkout.
                    </p>
                    <p>
                      <strong className="text-white">SEAL Tokens:</strong> Get 20% off when paying with SEAL tokens, or stake SEAL tokens to unlock tier features without a subscription.
                    </p>
                    <p className="mt-4">
                      <strong className="text-white">SEAL Staking Benefits:</strong> Stake SEAL tokens instead of paying monthly. Your stake amount determines your tier access. Staked tokens remain yours and can be unstaked at any time (tier access will be revoked).
                    </p>
                    <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-700/50">
                      All subscriptions auto-renew. Cancel anytime. 30-day money-back guarantee. SEAL staking is non-custodial - you maintain full control of your tokens.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEAL Presale Section */}
        <div className="bg-gradient-to-br from-orange-900/40 via-red-900/30 to-orange-900/40 backdrop-blur-sm p-12 mb-20 rounded-2xl border-2 border-orange-500/40 shadow-2xl shadow-orange-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500/30 to-red-500/30 border border-orange-500/50 rounded-full mb-8">
              <Star className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-sm font-semibold text-orange-300">Limited Time Offer</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
              SEAL Token Presale
            </h2>
            <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Get in early on Sea Level Studio's native token. Early supporters get exclusive bonuses and lifetime benefits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">50% Bonus</div>
                <div className="text-sm text-gray-300 font-medium">First 24 hours</div>
              </div>
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">25% Bonus</div>
                <div className="text-sm text-gray-300 font-medium">First week</div>
              </div>
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">10% Bonus</div>
                <div className="text-sm text-gray-300 font-medium">First month</div>
              </div>
            </div>
            <button
              onClick={onNavigateToPresale}
              className="px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-orange-500/50 transform hover:scale-105 inline-flex items-center gap-2"
            >
              Join Presale Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Why You Need These Tools */}
        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Why You Need These Tools
          </h2>
          <p className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            Solana development is complex. These tools solve real problems that every developer, trader, and protocol faces.
          </p>

          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Problem 1: Transaction Building */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-500/30 flex-shrink-0">
                  <Code className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-white">The Transaction Building Problem</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">The Problem:</strong> Solana's account-based model makes transaction building a nightmare. You need to manually figure out which accounts are required, in what order, which are mutable, which are signers, and handle complex CPIs (Cross-Program Invocations).
                  </p>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">How We Solve It:</strong> Our Transaction Builder is a visual WYSIWYG editor. Select a program, choose an instruction, and fill in the required accounts. The tool validates everything before you send. No more guessing what accounts you need.
                  </p>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <p className="text-sm text-gray-300 mb-2"><strong className="text-white">Use Cases:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 ml-4">
                      <li>Building token transfers, swaps, and DeFi operations</li>
                      <li>Creating complex multi-instruction transactions</li>
                      <li>Learning Solana development without trial-and-error</li>
                      <li>Prototyping dApp features before writing production code</li>
                      <li>Debugging failed transactions by rebuilding them step-by-step</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Problem 2: State Verification */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 flex-shrink-0">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-white">The "Black Box" Problem</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">The Problem:</strong> Transactions fail with cryptic errors like "0x1 (InvalidAccountData)" or "ConstraintHasOne". You have no idea what your transaction actually does to on-chain state until you send it and hope for the best.
                  </p>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">How We Solve It:</strong> Our Transaction Simulator forks the chain and shows you a clear "before-and-after" state diff. See exactly how your transaction mutates every account, compute units used, and console logs - all without risking real funds.
                  </p>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <p className="text-sm text-gray-300 mb-2"><strong className="text-white">Use Cases:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 ml-4">
                      <li>Testing complex transactions before mainnet deployment</li>
                      <li>Understanding how DeFi protocols modify account state</li>
                      <li>Debugging why transactions fail by seeing state changes</li>
                      <li>Learning Solana's account model through visualization</li>
                      <li>Verifying token transfers, swaps, and program interactions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Problem 3: Arbitrage Opportunities */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-white">The Arbitrage Opportunity Problem</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">The Problem:</strong> Price differences exist across DEXs (Raydium, Orca, Jupiter, etc.), but finding profitable opportunities manually is impossible. You need to monitor multiple DEXs in real-time, calculate paths, account for slippage, and execute fast.
                  </p>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">How We Solve It:</strong> Our Arbitrage Scanner monitors all major DEXs in real-time via WebSocket. It finds profitable opportunities, calculates optimal paths using modified Dijkstra algorithm, accounts for slippage and fees, and lets you execute with one click. Advanced tiers include Jito bundles for atomic execution and flash loans for zero-capital arbitrage.
                  </p>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <p className="text-sm text-gray-300 mb-2"><strong className="text-white">Use Cases:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 ml-4">
                      <li>Finding profitable trades across multiple DEXs automatically</li>
                      <li>Building automated arbitrage bots and trading systems</li>
                      <li>MEV (Maximal Extractable Value) extraction for searchers</li>
                      <li>Market making and liquidity provision strategies</li>
                      <li>Flash loan arbitrage for zero-capital trading</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Problem 4: Account Inspection */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30 flex-shrink-0">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-white">The Account Inspection Problem</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">The Problem:</strong> On-chain account data is raw bytes. You need to know the program IDL, understand the data structure, and manually deserialize to see what's actually stored. This makes debugging and verification extremely difficult.
                  </p>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">How We Solve It:</strong> Our Account Inspector fetches any account, automatically deserializes it using program IDLs (Anchor, Metaplex, etc.), and displays human-readable data. See token balances, program state, account ownership, and more - instantly.
                  </p>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <p className="text-sm text-gray-300 mb-2"><strong className="text-white">Use Cases:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 ml-4">
                      <li>Verifying token balances and account ownership</li>
                      <li>Debugging failed transactions by inspecting account state</li>
                      <li>Understanding how DeFi protocols store data</li>
                      <li>Auditing smart contracts and program accounts</li>
                      <li>Learning Solana's account model through real examples</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Problem 5: Code Generation */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-white">The Code Generation Problem</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">The Problem:</strong> Once you've built the perfect transaction in a GUI, you need to convert it to code for your dApp. This means manually translating the visual transaction into TypeScript or Rust, which is error-prone and time-consuming.
                  </p>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    <strong className="text-white">How We Solve It:</strong> Our Code Exporter generates production-ready TypeScript or Rust code from your perfected transaction. Copy-paste directly into your dApp, integration tests, or smart contracts. No manual translation needed.
                  </p>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <p className="text-sm text-gray-300 mb-2"><strong className="text-white">Use Cases:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 ml-4">
                      <li>Prototyping in GUI, then exporting to production code</li>
                      <li>Generating integration test code for your dApp</li>
                      <li>Creating code examples and documentation</li>
                      <li>Learning Solana SDK patterns through generated code</li>
                      <li>Rapid development: build visually, deploy programmatically</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Why Choose Sea Level Studio?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-10 h-10" />,
                title: 'AI-Powered',
                description: '23 specialized AI agents help you build, optimize, and execute transactions with confidence. From trading strategies to security auditing.',
              },
              {
                icon: <Shield className="w-10 h-10" />,
                title: 'Secure by Default',
                description: 'Built-in security scanning and vulnerability detection keep your transactions safe. Simulate before sending to avoid costly mistakes.',
              },
              {
                icon: <TrendingUp className="w-10 h-10" />,
                title: 'Profit Opportunities',
                description: 'Real-time arbitrage scanner finds profitable opportunities across all DEXs. MEV tools for professional traders and searchers.',
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 text-center hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-500/30">
                    <div className="text-purple-400">
                      {feature.icon}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center pb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-10">Join thousands of developers building on Solana</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={onNavigateToPremium}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={onNavigateToPresale}
              className="px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-orange-500/50 transform hover:scale-105"
            >
              Join SEAL Presale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

