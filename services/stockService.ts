
import { StockData, Trend, ChartPoint, NewsItem } from '../types';

const API_KEY = process.env.POLYGON_API_KEY // || 'Pf_EULppFY9BcHBFVWWJtvLYznhiyyRT';
const BASE_URL = 'https://api.polygon.io';

// Symbols to track
const WATCHLIST_SYMBOLS = ['NVDA', 'CEG', 'MU', 'AMD', 'AVGO', 'PLTR'];
const OPPORTUNITY_SYMBOLS = ['QBTS', 'OKLO', 'RGTI', 'IONQ', 'QUBT'];

// --- Mock Data Fallback ---
const MOCK_WATCHLIST: StockData[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 135.40, change: 3.20, changePercent: 2.4, trend: Trend.UP, sector: 'Technology', isHot: true, signalStrength: 92 },
  { symbol: 'CEG', name: 'Constellation Energy', price: 182.10, change: 5.45, changePercent: 3.1, trend: Trend.UP, sector: 'Utilities', isHot: false, signalStrength: 85 },
  { symbol: 'MU', name: 'Micron Technology', price: 98.75, change: -1.20, changePercent: -1.2, trend: Trend.DOWN, sector: 'Technology', isHot: false, signalStrength: 45 },
];

const MOCK_OPPORTUNITIES: StockData[] = [
  { symbol: 'QBTS', name: 'D-Wave Quantum', price: 1.85, change: 0.35, changePercent: 23.3, trend: Trend.UP, sector: 'Quantum Computing', isHot: true, signalStrength: 98 },
  { symbol: 'OKLO', name: 'Oklo Inc.', price: 12.40, change: 1.10, changePercent: 9.7, trend: Trend.UP, sector: 'Nuclear Energy', isHot: true, signalStrength: 88 },
];

// extensive mock list for search autocomplete when offline
const MOCK_SEARCH_DB = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corp' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'AMZN', name: 'Amazon.com Inc' },
  { ticker: 'TSLA', name: 'Tesla Inc' },
  { ticker: 'META', name: 'Meta Platforms' },
  { ticker: 'TSM', name: 'Taiwan Semi' },
  { ticker: 'NVDA', name: 'NVIDIA Corp' },
  { ticker: 'AMD', name: 'Advanced Micro Devices' },
  { ticker: 'INTC', name: 'Intel Corp' },
  { ticker: 'QCOM', name: 'Qualcomm Inc' },
  { ticker: 'AVGO', name: 'Broadcom Inc' },
  { ticker: 'TXN', name: 'Texas Instruments' },
  { ticker: 'IBM', name: 'IBM Corp' },
  { ticker: 'MU', name: 'Micron Technology' },
  { ticker: 'NFLX', name: 'Netflix Inc' },
  { ticker: 'DIS', name: 'Walt Disney Co' },
  { ticker: 'NKE', name: 'Nike Inc' },
  { ticker: 'JPM', name: 'JPMorgan Chase' },
  { ticker: 'V', name: 'Visa Inc' },
  { ticker: 'PLTR', name: 'Palantir Technologies' },
  { ticker: 'COIN', name: 'Coinbase Global' },
  { ticker: 'MSTR', name: 'MicroStrategy' },
  { ticker: 'HOOD', name: 'Robinhood Markets' },
  { ticker: 'GME', name: 'GameStop Corp' },
  { ticker: 'AMC', name: 'AMC Entertainment' },
];

// --- Helper Functions ---

const getPreviousTradingDate = (daysBack = 1): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  
  // Adjust for weekends (if Saturday/Sunday, go back to Friday)
  while(date.getDay() === 0 || date.getDay() === 6) {
     date.setDate(date.getDate() - 1);
  }
  return date.toISOString().split('T')[0];
};

const subtractDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - days);
     // Ensure we skip weekends when stepping back too
     while(date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() - 1);
     }
    return date.toISOString().split('T')[0];
};

// --- API Service ---

export const searchStocks = async (query: string): Promise<{ticker: string, name: string}[]> => {
  if (!query || query.length < 1) return [];
  const upperQuery = query.toUpperCase();

  // 1. Try API if available
  if (API_KEY) {
    try {
      const url = `${BASE_URL}/v3/reference/tickers?search=${query}&active=true&limit=10&apiKey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results) {
        return data.results.map((item: any) => ({
          ticker: item.ticker,
          name: item.name
        }));
      }
    } catch (e) {
      console.warn("Search API failed, falling back to local DB");
    }
  }

  // 2. Fallback to local mock DB
  return MOCK_SEARCH_DB.filter(s => 
    s.ticker.includes(upperQuery) || 
    s.name.toUpperCase().includes(upperQuery)
  ).slice(0, 10);
};

export const fetchStockQuote = async (symbol: string): Promise<StockData> => {
  // Default empty object
  const baseStock: StockData = {
      symbol: symbol,
      name: symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      trend: Trend.NEUTRAL,
      sector: 'Unknown',
      isHot: false,
      signalStrength: 50
  };

  if (!API_KEY) {
      // Generate a random realistic price for demo if no API key
      const mockPrice = 50 + Math.random() * 150;
      return {
          ...baseStock,
          name: MOCK_SEARCH_DB.find(s => s.ticker === symbol)?.name || symbol,
          price: mockPrice,
          change: 1.5,
          changePercent: 1.2,
          trend: Trend.UP,
          signalStrength: 65
      };
  }

  // Fetch Previous Close to get price data (simplest endpoint for single stock)
  try {
      const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
          const res = data.results[0];
          const change = res.c - res.o;
          const changePercent = (change / res.o) * 100;
          
          return {
              ...baseStock,
              price: res.c,
              change: change,
              changePercent: changePercent,
              trend: change >= 0 ? Trend.UP : Trend.DOWN,
              signalStrength: 50 + Math.floor(Math.random() * 40) // Simulated AI score
          };
      }
  } catch (e) {
      console.error(`Failed to fetch quote for ${symbol}`, e);
  }

  return baseStock;
};

export const fetchMarketData = async (): Promise<{ watchlist: StockData[], opportunities: StockData[] }> => {
  if (!API_KEY) {
     console.warn("Polygon API Key missing. Using mock data.");
     return { watchlist: MOCK_WATCHLIST, opportunities: MOCK_OPPORTUNITIES };
  }

  let currentDate = getPreviousTradingDate(1); // Start with "yesterday"
  let attempts = 0;
  const maxAttempts = 5; // Retry up to 5 times (covers long holidays like Thanksgiving/Christmas)

  while (attempts < maxAttempts) {
    // Using Grouped Daily to get all tickers in 1 call (saves API quota)
    const url = `${BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${currentDate}?adjusted=true&apiKey=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Check if data is valid and contains results
        if (data.status === 'OK' && data.resultsCount > 0) {
            const results = data.results || [];
            
            const mapToStockData = (ticker: any, isHot: boolean): StockData => {
                const change = ticker.c - ticker.o;
                const changePercent = ticker.o ? (change / ticker.o) * 100 : 0;
                // Simulate AI Signal Strength based on volatility and movement
                // In a real app, this would come from a backend AI analysis
                const baseStrength = 50;
                const volBonus = Math.min(Math.abs(changePercent) * 5, 40);
                const signalStrength = Math.floor(baseStrength + volBonus + (Math.random() * 10));

                return {
                    symbol: ticker.T,
                    name: ticker.T, // Polygon grouped doesn't return names, strictly symbols
                    price: ticker.c,
                    change: change,
                    changePercent: changePercent,
                    trend: change >= 0 ? Trend.UP : Trend.DOWN,
                    sector: 'Tech',
                    isHot,
                    signalStrength: Math.min(signalStrength, 99)
                };
            };

            const watchlist = results
                .filter((r: any) => WATCHLIST_SYMBOLS.includes(r.T))
                .map((r: any) => mapToStockData(r, false));

            const opportunities = results
                .filter((r: any) => OPPORTUNITY_SYMBOLS.includes(r.T))
                .map((r: any) => mapToStockData(r, true));
            
            return { watchlist, opportunities };
        } else {
             // API returned OK but no results, or a status like NOT_FOUND/DELAYED
             console.log(`Polygon data unavailable for ${currentDate} (Status: ${data.status}). Trying previous day...`);
             currentDate = subtractDays(currentDate, 1);
             attempts++;
        }

    } catch (e) {
        console.error(`Network/API error fetching ${currentDate}:`, e);
        // If network error, try previous day just in case, or fail gracefully after max attempts
        currentDate = subtractDays(currentDate, 1);
        attempts++;
    }
  }

  console.warn("Could not fetch live market data after multiple attempts. Falling back to mocks.");
  return { watchlist: MOCK_WATCHLIST, opportunities: MOCK_OPPORTUNITIES };
};

export const fetchChartData = async (symbol: string): Promise<ChartPoint[]> => {
    if (!API_KEY) return generateMockChartData(100);

    // Fetch hourly bars for the last 4 days
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 4); 
    const from = fromDate.toISOString().split('T')[0];

    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/hour/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.results) return generateMockChartData(100);

        return data.results.map((item: any) => ({
            time: new Date(item.t).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric' }),
            value: item.c
        }));

    } catch (error) {
        console.error("Chart fetch error", error);
        return generateMockChartData(100);
    }
};

export const fetchCompanyNews = async (symbol: string): Promise<NewsItem[]> => {
    if (!API_KEY) return getMockRelatedNews(symbol);

    const url = `${BASE_URL}/v2/reference/news?ticker=${symbol}&limit=5&apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.results) return getMockRelatedNews(symbol);

        const polygonNews = data.results.map((item: any) => ({
            id: item.id,
            title: item.title,
            source: item.publisher?.name || 'News',
            sentiment: 'NEUTRAL', 
            time: new Date(item.published_utc).toLocaleDateString(),
            isSocial: false,
            author: item.author
        }));

        // Inject some "Social" fake news as Polygon doesn't track Twitter
        const socialFake = [
            { 
                id: `social-${Date.now()}`, 
                title: `${symbol} mentions are spiking on X (+400% volume). Whales are accumulating.`, 
                source: 'X (Twitter)', 
                sentiment: 'POSITIVE', 
                time: '15m ago', 
                isSocial: true,
                author: '@Stock_Guru_AI'
            }
        ];

        return [...socialFake, ...polygonNews];

    } catch (error) {
        return getMockRelatedNews(symbol);
    }
};

// --- Legacy Mocks ---

export const generateMockChartData = (basePrice: number): ChartPoint[] => {
  const points: ChartPoint[] = [];
  let currentPrice = basePrice * 0.9;
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const time = new Date(now.getTime() - (50 - i) * 15 * 60000);
    const randomChange = (Math.random() - 0.45) * (basePrice * 0.02);
    currentPrice += randomChange;
    points.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: parseFloat(currentPrice.toFixed(2)),
    });
  }
  points[points.length - 1].value = basePrice;
  return points;
};

export const getMockRelatedNews = (symbol: string): NewsItem[] => {
  return [
    { id: '4', title: `High social volume detected for ${symbol}. Institutions are loading up.`, source: 'X (Twitter)', author: '@StockWizard_AI', sentiment: 'POSITIVE', time: '15m ago', isSocial: true },
    { id: '1', title: `${symbol} shows strong momentum breaking key resistance`, source: 'Bloomberg', sentiment: 'POSITIVE', time: '2h ago', isSocial: false },
    { id: '2', title: `Earnings expectations rising for ${symbol}`, source: 'Reuters', sentiment: 'POSITIVE', time: '4h ago', isSocial: false },
  ];
};
