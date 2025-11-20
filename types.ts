
export enum Trend {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL',
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: Trend;
  sector: string;
  isHot: boolean; // For "Opportunity" list
  signalStrength: number; // 0-100 AI Interest Score
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  time: string;
  isSocial: boolean; // True if from Twitter/Influencer
  author?: string;
}

export interface ChartPoint {
  time: string;
  value: number;
}

// Gemini Analysis Result Structure
export interface AIInsight {
  confidenceScore: number; // 0-100
  action: 'BUY' | 'SELL' | 'HOLD';
  summary: string;
  keyDrivers: string[];
  riskFactors: string[];
  socialSentimentAnalysis: string; // Summary of "influencer" chatter
  buyZone: string;
  sellZone: string;
}

export type ViewState = 'DASHBOARD' | 'DETAIL' | 'TRADING';
