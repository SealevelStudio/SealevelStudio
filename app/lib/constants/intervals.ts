/**
 * Application-wide interval and timeout constants
 * Centralized to avoid magic numbers and improve maintainability
 */

export const INTERVALS = {
  // Price and data refresh intervals
  PRICE_REFRESH_MS: 60000, // 1 minute
  ARBITRAGE_SCAN_MS: 30000, // 30 seconds
  BALANCE_REFRESH_MS: 10000, // 10 seconds
  POOL_SCAN_MS: 15000, // 15 seconds
  
  // UI update intervals
  COUNTDOWN_UPDATE_MS: 1000, // 1 second
  ANIMATION_FRAME_MS: 16, // ~60fps
  
  // Network timeouts
  API_TIMEOUT_MS: 10000, // 10 seconds
  RPC_TIMEOUT_MS: 15000, // 15 seconds
  TRANSACTION_TIMEOUT_MS: 30000, // 30 seconds
  
  // Debounce delays
  SEARCH_DEBOUNCE_MS: 300,
  INPUT_DEBOUNCE_MS: 500,
  BALANCE_FETCH_DEBOUNCE_MS: 1000,
} as const;

export const SLIPPAGE = {
  STABLECOIN: 0.5,
  VOLATILE_MIN: 1,
  VOLATILE_MAX: 3,
  DEFAULT: 0.5,
} as const;

export const FEES = {
  PRIORITY_FEE_DEFAULT: 10000, // lamports
  PRIORITY_FEE_HIGH: 50000, // lamports
  JITO_TIP_DEFAULT: 0, // lamports
  TRANSACTION_BASE: 5000, // lamports
} as const;

export const LIMITS = {
  MAX_TRANSACTION_SIZE: 1232, // bytes
  SAFE_TRANSACTION_SIZE: 1200, // bytes
  MAX_RECIPIENTS: 50,
  MAX_ADDRESSES_PER_REQUEST: 100,
  MAX_SEARCH_RESULTS: 100,
} as const;

