export interface PortfolioRow {
  Category: string;
  proxyWallet?: string;
  asset?: string;
  title: string;
  slug: string;
  size?: number; // Shares
  avgPrice?: number;
  currentValue?: number;
  cashPnl?: number;
  realizedPnl?: number;
  outcome?: string;
  timestamp?: number; // Unix timestamp
  side?: string;
  usdcSize?: number;
  transactionHash?: string;
  price?: number;
  curPrice?: number; // Added for new CSV format (Settlement Price)
  date?: string; // Scrape_Date or endDate
}

export interface ChatLog {
  date: string;
  sender_id: string;
  content: string;
}

export enum TradeStatus {
  SUCCESS = 'Success',
  FAILED = 'Failed',
  PENDING = 'Pending/Skipped',
  MISSING = 'Not Executed'
}

export interface ProcessedTrade {
  id: string;
  date: string; // ISO String
  closedDate?: string; // ISO String for closed positions
  traderName: string;
  action: 'BUY' | 'SELL' | 'Unknown';
  outcome: string;
  amount: number; // Signal Amount
  marketTitle: string;
  marketSlug: string;
  marketUrl: string;
  status: TradeStatus;
  failureReason?: string;
  
  // Categorization
  category: 'Sport' | 'Non-Sport';

  // Matching Details
  matchedTxHash?: string;
  matchedExecutionPrice?: number;
  matchedExecutionAmount?: number;
  
  // Unit Economics
  shares?: number;
  
  // Position Details
  matchedPositionStatus: 'Active' | 'Closed' | 'None';
  pnl?: number; // Calculated per trade: (Exit/Current - Entry) * Shares
  currentValue?: number; // Shares * CurrentPrice
  matchConfidence?: 'Exact (Activity)' | 'Inferred (Position)' | 'None';
  latencySeconds?: number;
  
  // Result
  result?: 'WIN' | 'LOSS' | 'OPEN';
  
  // Aggregates
  totalAttemptedAmount?: number; // Sum of all attempts (failed or success) for this market/trader
}

export interface TimeSeriesPoint {
  date: string;
  timestamp: number;
  value: number; // PnL or Balance
  winRate?: number;
  trader?: string;
}

export interface TraderStats {
  name: string;
  totalPnl: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  avgHoldingTimeHours: number;
  longShortRatio: number; // Ratio of Yes vs No bets
  avgTradesPerDay: number;
  totalAttempts: number; // Replaces maxBet/avgBet
  bestTrade: number;
  worstTrade: number;
  avgSuccessfulBet: number;
  favoriteCategory: string; // 'Sport' or 'Non-Sport'
}

export interface AnalyticsResult {
  traderStats: TraderStats[];
  overallTimeSeries: TimeSeriesPoint[];
  pnlOverTimeByTrader: TimeSeriesPoint[];
  winRateOverTimeByTrader: TimeSeriesPoint[];
  dailyTradeCounts: TimeSeriesPoint[];
}