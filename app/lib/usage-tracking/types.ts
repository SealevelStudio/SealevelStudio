// Usage Tracking Types
// Types for tracking feature usage and calculating costs

export type FeatureType = 
  | 'scanner_scan'
  | 'scanner_auto_refresh'
  | 'simulation'
  | 'ai_query'
  | 'code_export'
  | 'advanced_transaction';

export interface UsageRecord {
  id: string;
  userId: string; // Wallet address
  feature: FeatureType;
  timestamp: Date;
  metadata?: Record<string, any>; // Additional context (e.g., scan results, query length)
  cost: number; // Cost in SEAL tokens (0 during free trial)
  paid: boolean; // Whether payment was collected (false during free trial)
}

export interface UsageStats {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  startDate: Date;
  endDate: Date;
  features: {
    scanner_scan: number;
    scanner_auto_refresh: number;
    simulation: number;
    ai_query: number;
    code_export: number;
    advanced_transaction: number;
  };
  totalCost: number; // Total cost in SEAL (0 during free trial)
  totalPaid: number; // Total actually paid (0 during free trial)
}

export interface FreeTrialStatus {
  userId: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  remainingDays: number;
  featuresUsed: {
    scanner_scan: number;
    scanner_auto_refresh: number;
    simulation: number;
    ai_query: number;
    code_export: number;
    advanced_transaction: number;
  };
  totalUsage: number;
}

export interface SubscriptionTier {
  id: 'free' | 'basic' | 'pro';
  name: string;
  price: number; // Monthly price in SEAL
  features: {
    scanner_scan: number; // -1 for unlimited
    scanner_auto_refresh: number;
    simulation: number;
    ai_query: number;
    code_export: number;
    advanced_transaction: number;
  };
}

