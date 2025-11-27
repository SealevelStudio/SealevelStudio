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
}

export function RevenueLanding({ onBack, onNavigateToPresale, onNavigateToPremium }: RevenueLandingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showPaymentMethods, setShowPaymentMethods] = useState<string | null>(null);

  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Sea Level Studio',
      features: [
        'Account Inspector',
        'Basic Transaction Builder',
        'Limited Arbitrage Scanner (10 scans/day)',
        'Community Support',
        '5 free trial features',
        'Basic Analytics',
      ],
      cta: 'Get Started Free',
      paymentMethods: [],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$49',
      period: 'month',
      annualPrice: '$490',
      annualSavings: 'Save $98/year',
      description: 'For serious Solana developers',
      features: [
        'Everything in Free',
        'Unlimited Arbitrage Scanner',
        'Advanced Transaction Builder',
        'AI Cyber Playground Access',
        'Premium Support (24hr response)',
        'Priority Feature Requests',
        'Advanced Analytics Dashboard',
        'API Access',
        'Custom Webhooks',
        'Transaction History Export',
      ],
      cta: 'Upgrade to Pro',
      popular: true,
      badge: 'Most Popular',
      paymentMethods: ['card', 'crypto', 'seal'],
      savings: 'Best Value',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team Collaboration (up to 50 users)',
        'Custom Integrations',
        'Dedicated Support (4hr response SLA)',
        'SLA Guarantees (99.9% uptime)',
        'On-premise Deployment Option',
        'Custom Training & Onboarding',
        'Advanced Security Features',
        'SSO & SAML Support',
        'Custom Contract Terms',
      ],
      cta: 'Contact Sales',
      paymentMethods: ['card', 'crypto', 'seal', 'wire'],
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+', icon: <Users className="w-5 h-5" /> },
    { label: 'Transactions Built', value: '500K+', icon: <Code className="w-5 h-5" /> },
    { label: 'Arbitrage Opportunities', value: '1M+', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Revenue Generated', value: '$2.5M+', icon: <DollarSign className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen animated-bg text-white relative overflow-y-auto">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-slate-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-purple-800/50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="text-sm">Back</span>
              </button>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <button
                onClick={onNavigateToPresale}
                className="btn-modern px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
              >
                SEAL Presale
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 pb-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">The Future of Solana Development</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-gradient-primary">
            Build. Deploy. Profit.
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            The most powerful developer toolkit for Solana. Join thousands of developers building the future of DeFi.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onNavigateToPremium}
              className="btn-modern px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-semibold"
            >
              Start Free Trial
            </button>
            <button
              onClick={onNavigateToPresale}
              className="btn-modern px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-semibold"
            >
              Join SEAL Presale
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="card-modern p-6 text-center">
              <div className="flex justify-center mb-3 text-purple-400">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold mb-1 text-gradient-primary">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Pricing Tiers */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gradient-primary">Choose Your Plan</h2>
            <p className="text-gray-400 text-lg mb-6">Start free, upgrade when you're ready</p>
            
            {/* Billing Cycle Toggle (only for Pro tier) */}
            <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => {
              const displayPrice = tier.id === 'pro' && billingCycle === 'annual' 
                ? tier.annualPrice 
                : tier.price;
              const displayPeriod = tier.id === 'pro' && billingCycle === 'annual'
                ? 'year'
                : tier.period;
              const monthlyEquivalent = tier.id === 'pro' && billingCycle === 'annual'
                ? '$41'
                : tier.price;

              return (
                <div
                  key={tier.id}
                  className={`card-modern card-glow p-8 relative transition-all ${
                    tier.popular ? 'border-purple-500 glow-purple scale-105 shadow-2xl' : 'border-slate-700'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="badge-modern bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                        {tier.badge}
                      </span>
                    </div>
                  )}
                  
                  {tier.savings && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {tier.savings}
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-gradient-primary">{displayPrice}</span>
                      {displayPeriod && (
                        <span className="text-gray-400">/{displayPeriod}</span>
                      )}
                    </div>
                    {tier.id === 'pro' && billingCycle === 'annual' && (
                      <div className="text-sm text-gray-400 mb-1">
                        <span className="line-through text-gray-500">${parseInt(tier.price.replace('$', '')) * 12}/year</span>
                        <span className="ml-2 text-green-400 font-semibold">{tier.annualSavings}</span>
                      </div>
                    )}
                    {tier.id === 'pro' && billingCycle === 'annual' && (
                      <div className="text-xs text-gray-500">
                        Just {monthlyEquivalent}/month billed annually
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mt-2">{tier.description}</p>
                  </div>

                  {/* Payment Methods */}
                  {tier.paymentMethods.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-slate-700">
                      <button
                        onClick={() => setShowPaymentMethods(showPaymentMethods === tier.id ? null : tier.id)}
                        className="flex items-center justify-between w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          Payment Options
                        </span>
                        <span className="text-xs">
                          {tier.paymentMethods.length} method{tier.paymentMethods.length > 1 ? 's' : ''}
                        </span>
                      </button>
                      {showPaymentMethods === tier.id && (
                        <div className="mt-3 space-y-2">
                          {tier.paymentMethods.includes('card') && (
                            <div className="flex items-center gap-2 text-sm text-gray-300 bg-slate-800/50 p-2 rounded">
                              <CreditCard className="w-4 h-4 text-blue-400" />
                              <span>Credit/Debit Card</span>
                            </div>
                          )}
                          {tier.paymentMethods.includes('crypto') && (
                            <div className="flex items-center gap-2 text-sm text-gray-300 bg-slate-800/50 p-2 rounded">
                              <Coins className="w-4 h-4 text-yellow-400" />
                              <span>Cryptocurrency (SOL, USDC, USDT)</span>
                            </div>
                          )}
                          {tier.paymentMethods.includes('seal') && (
                            <div className="flex items-center gap-2 text-sm text-gray-300 bg-slate-800/50 p-2 rounded">
                              <Star className="w-4 h-4 text-orange-400" />
                              <span>SEAL Tokens (20% discount)</span>
                            </div>
                          )}
                          {tier.paymentMethods.includes('wire') && (
                            <div className="flex items-center gap-2 text-sm text-gray-300 bg-slate-800/50 p-2 rounded">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span>Wire Transfer</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <ul className="space-y-3 mb-8 min-h-[300px]">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      if (tier.id === 'pro') {
                        onNavigateToPremium?.();
                      } else if (tier.id === 'enterprise') {
                        window.location.href = 'mailto:sales@sealevel.studio?subject=Enterprise Plan Inquiry';
                      } else {
                        onNavigateToPremium?.();
                      }
                    }}
                    className={`btn-modern w-full py-3 font-semibold transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {tier.cta}
                    {tier.id !== 'enterprise' && <ArrowRight className="w-4 h-4 ml-2 inline" />}
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

          {/* Payment Methods Info */}
          <div className="mt-12 card-modern p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Info className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-white">Payment Information</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>
                    <strong className="text-white">Credit/Debit Cards:</strong> Accepted via Stripe. Secure, instant activation.
                  </p>
                  <p>
                    <strong className="text-white">Cryptocurrency:</strong> Pay with SOL, USDC, or USDT. Automatic conversion at checkout.
                  </p>
                  <p>
                    <strong className="text-white">SEAL Tokens:</strong> Get 20% off when paying with SEAL tokens. Purchase SEAL tokens in our presale.
                  </p>
                  <p>
                    <strong className="text-white">Enterprise:</strong> Wire transfers and custom payment terms available. Contact sales for details.
                  </p>
                  <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-slate-700">
                    All subscriptions auto-renew. Cancel anytime. 30-day money-back guarantee on annual plans.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEAL Presale Section */}
        <div className="card-modern card-glow p-12 mb-16 bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full mb-6">
              <Star className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300">Limited Time Offer</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gradient-danger">
              SEAL Token Presale
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get in early on Sea Level Studio's native token. Early supporters get exclusive bonuses and lifetime benefits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-400 mb-1">50% Bonus</div>
                <div className="text-sm text-gray-400">First 24 hours</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-400 mb-1">25% Bonus</div>
                <div className="text-sm text-gray-400">First week</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-400 mb-1">10% Bonus</div>
                <div className="text-sm text-gray-400">First month</div>
              </div>
            </div>
            <button
              onClick={onNavigateToPresale}
              className="btn-modern px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-semibold inline-flex items-center gap-2"
            >
              Join Presale Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-12 text-center text-gradient-primary">Why Choose Sea Level Studio?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-8 h-8" />,
                title: 'AI-Powered',
                description: 'Advanced AI agents help you build, optimize, and execute transactions with confidence.',
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Secure by Default',
                description: 'Built-in security scanning and vulnerability detection keep your transactions safe.',
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: 'Profit Opportunities',
                description: 'Real-time arbitrage scanner finds profitable opportunities across all DEXs.',
              },
            ].map((feature, index) => (
              <div key={index} className="card-modern p-6 text-center">
                <div className="flex justify-center mb-4 text-purple-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 text-gradient-primary">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of developers building on Solana</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onNavigateToPremium}
              className="btn-modern px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-semibold"
            >
              Start Free Trial
            </button>
            <button
              onClick={onNavigateToPresale}
              className="btn-modern px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-semibold"
            >
              Join SEAL Presale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

