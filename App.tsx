
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StockData, ViewState, AIInsight, Trend } from './types';
import { fetchMarketData, fetchChartData, fetchCompanyNews, searchStocks, fetchStockQuote } from './services/stockService';
import { analyzeStock } from './services/geminiService';
import StockChart from './components/StockChart';
import AnalysisPanel from './components/AnalysisPanel';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Zap, 
  Bell, 
  Activity,
  ExternalLink,
  Twitter,
  Wallet,
  Share2,
  Loader2,
  Target,
  Plus,
  Settings,
  X,
  Search,
  BellRing
} from 'lucide-react';

// --- Design System Components (Slate Theme) ---

const Card = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden ${onClick ? 'cursor-pointer hover:bg-slate-800/80 transition-colors' : ''} ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, type = 'neutral' }: { children: React.ReactNode, type?: 'positive' | 'negative' | 'warning' | 'neutral' | 'purple' }) => {
  const colors = {
    positive: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    negative: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    neutral: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${colors[type]}`}>
      {children}
    </span>
  );
};

// --- Helper Components ---

const renderChange = (change: number, percent: number) => {
  const isPos = percent >= 0;
  return (
    <div className={`flex items-center text-sm font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
      {isPos ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
      {isPos ? '+' : ''}{percent.toFixed(2)}%
    </div>
  );
};

const StockCard = ({ stock, onClick, isOpportunity }: { stock: StockData, onClick: () => void, isOpportunity?: boolean }) => (
  <Card onClick={onClick} className="mb-3">
    <div className="p-4">
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${isOpportunity ? 'bg-purple-900/50 border border-purple-500/30' : 'bg-slate-700'}`}>
                    {stock.symbol[0]}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">{stock.symbol}</h3>
                        {isOpportunity && <Badge type="purple">AI Found</Badge>}
                    </div>
                    <p className="text-xs text-slate-400">{stock.name}</p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-white font-bold text-lg">${stock.price.toFixed(2)}</div>
                {renderChange(stock.change, stock.changePercent)}
            </div>
        </div>

        {/* AI Insight Snippet */}
        <div className="bg-slate-900/50 rounded-lg p-2.5 flex items-center gap-3 mt-1">
             <div className="flex-1">
                <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-slate-400 uppercase font-semibold">AI Signal</span>
                    <span className={`font-bold ${stock.signalStrength > 75 ? 'text-purple-400' : 'text-slate-400'}`}>{stock.signalStrength}/100</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${stock.signalStrength > 75 ? 'bg-gradient-to-r from-purple-600 to-blue-500' : 'bg-slate-500'}`}
                        style={{ width: `${stock.signalStrength}%` }}
                    />
                </div>
             </div>
             <div className="text-[10px] text-slate-300 border-l border-slate-700 pl-3 max-w-[120px]">
                {isOpportunity ? "High volatility breakout detected." : "Monitoring key levels."}
             </div>
        </div>
    </div>
  </Card>
);

// --- New Search Modal Component ---
const SearchModal = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (symbol: string) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ticker: string, name: string}[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounce Search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim().length > 0) {
        setSearching(true);
        try {
          const hits = await searchStocks(query);
          setResults(hits);
        } catch (e) {
          console.error(e);
        } finally {
          setSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol (e.g. AAPL)"
            className="w-full bg-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-slate-500"
          />
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full"
        >
          <X size={24} />
        </button>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2">
        {searching && (
          <div className="flex justify-center py-8 text-slate-500">
            <Loader2 className="animate-spin" />
          </div>
        )}
        
        {!searching && results.length === 0 && query.length > 1 && (
           <div className="text-center py-8 text-slate-500 text-sm">No results found</div>
        )}

        {results.map((item) => (
          <div 
            key={item.ticker} 
            onClick={() => onSelect(item.ticker)}
            className="p-4 border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-colors flex justify-between items-center group"
          >
            <div>
              <div className="font-bold text-white text-lg">{item.ticker}</div>
              <div className="text-slate-400 text-sm">{item.name}</div>
            </div>
            <button className="p-2 rounded-full bg-slate-800 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Notification Toast Component ---
const NotificationToast = ({ 
  message, 
  subMessage, 
  onClose,
  onClick 
}: { 
  message: string, 
  subMessage: string, 
  onClose: () => void,
  onClick: () => void 
}) => {
  return (
    <div 
      className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top duration-500 cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-slate-800 border-l-4 border-purple-500 rounded-r-lg shadow-2xl p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 rounded-full text-purple-400 shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">{message}</h4>
            <p className="text-slate-300 text-xs mt-1">{subMessage}</p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="text-slate-500 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [analysis, setAnalysis] = useState<AIInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'WATCHLIST' | 'OPPORTUNITIES'>('WATCHLIST');
  const [navIndex, setNavIndex] = useState(0);
  
  // Notification & Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notification, setNotification] = useState<{title: string, body: string, stock: StockData} | null>(null);
  const [permStatus, setPermStatus] = useState<NotificationPermission>('default');

  // Data States
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [opportunities, setOpportunities] = useState<StockData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  
  const hasApiKey = !!process.env.API_KEY;

  // Check Permission on Mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermStatus(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setPermStatus(permission);
      if (permission === 'granted') {
        new Notification("AlphaPulse Active", {
          body: "Android system notifications enabled.",
          icon: "https://cdn-icons-png.flaticon.com/512/5836/5836233.png",
          badge: "https://cdn-icons-png.flaticon.com/512/5836/5836233.png",
          vibrate: [100, 50, 100]
        } as any);
      }
    } catch (error) {
      console.error("Notification permission denied/error", error);
    }
  };

  // --- Opportunity Simulator (Demo Feature) ---
  useEffect(() => {
    // Simulates a backend push event finding a new opportunity after 10 seconds
    const timer = setTimeout(() => {
      const newDiscovery: StockData = {
        symbol: 'PLTR',
        name: 'Palantir Technologies',
        price: 24.50,
        change: 1.25,
        changePercent: 5.38,
        trend: Trend.UP,
        sector: 'AI Software',
        isHot: true,
        signalStrength: 96
      };

      // Only add if not already present
      setOpportunities(prev => {
        if (prev.some(s => s.symbol === newDiscovery.symbol)) return prev;
        
        // Trigger Notifications
        const title = `🚀 AI Signal: ${newDiscovery.symbol}`;
        const body = `Confidence 96%. Breakout detected.`;

        // 1. System Push Notification (Native Android Style)
        if (permStatus === 'granted') {
           try {
             const n = new Notification(title, { 
               body,
               icon: "https://cdn-icons-png.flaticon.com/512/5836/5836233.png", // High res icon
               badge: "https://cdn-icons-png.flaticon.com/512/5836/5836233.png", // Small icon for status bar
               vibrate: [200, 100, 200, 100, 200], // Distinct vibration pattern
               tag: 'alpha-opportunity', // Prevent stacking
               renotify: true, // Alert again even if tag matches
               requireInteraction: true, // Keep on screen until clicked
             } as any);
             n.onclick = () => {
               window.focus();
               handleStockSelect(newDiscovery);
               n.close();
             };
           } catch (e) {
             console.warn("System notification failed", e);
           }
        }

        // 2. In-App Toast (Always show)
        setNotification({ title, body, stock: newDiscovery });

        // Auto dismiss toast after 6s
        setTimeout(() => setNotification(null), 6000);

        return [newDiscovery, ...prev];
      });

    }, 10000); // 10 seconds delay for demo

    return () => clearTimeout(timer);
  }, [permStatus]);

  useEffect(() => {
    const loadData = async () => {
        setIsLoadingData(true);
        try {
            const { watchlist: w, opportunities: o } = await fetchMarketData();
            setWatchlist(w);
            setOpportunities(o);
        } catch (error) {
            console.error("Failed to load market data", error);
        } finally {
            setIsLoadingData(false);
        }
    };
    loadData();
  }, []);

  const handleStockSelect = useCallback(async (stock: StockData) => {
    setSelectedStock(stock);
    setView('DETAIL');
    setAnalysis(null);
    setIsAnalyzing(true);
    setChartData([]); 
    setNews([]); 
    window.scrollTo(0, 0);
    
    try {
      const [aiResult, chartResult, newsResult] = await Promise.all([
        analyzeStock(stock),
        fetchChartData(stock.symbol),
        fetchCompanyNews(stock.symbol)
      ]);
      
      setAnalysis(aiResult);
      setChartData(chartResult);
      setNews(newsResult);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleAddStock = async (symbol: string) => {
    setIsSearchOpen(false);
    
    if (watchlist.some(s => s.symbol === symbol)) return;

    try {
      const newStock = await fetchStockQuote(symbol);
      setWatchlist(prev => [newStock, ...prev]);
    } catch (e) {
      console.error("Failed to add stock", e);
    }
  };

  const handleNotificationClick = () => {
    if (notification) {
      handleStockSelect(notification.stock);
      setNotification(null);
    }
  };

  // --- Views ---

  const Dashboard = () => (
    <div className="pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-800/50">
        <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AlphaPulse</h1>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                MARKET LIVE
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={requestNotificationPermission}
              className={`p-2 rounded-full transition-colors relative ${permStatus === 'granted' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white bg-slate-900'}`}
              title={permStatus === 'granted' ? "Notifications Active" : "Enable Notifications"}
            >
                {permStatus === 'granted' ? <BellRing size={20} /> : <Bell size={20} />}
                {permStatus !== 'granted' && <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-slate-900"></div>}
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-6">
        {!hasApiKey && (
             <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium flex gap-3 items-start">
                <Activity size={16} className="shrink-0 mt-0.5"/>
                <div>API Key missing. Enable Gemini in env to activate AI.</div>
             </div>
        )}

        {/* Custom Tabs */}
        <div className="flex p-1 bg-slate-900 rounded-xl mb-6 border border-slate-800">
            <button 
                onClick={() => setActiveTab('WATCHLIST')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'WATCHLIST' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
            >
                Your Portfolio
            </button>
            <button 
                onClick={() => setActiveTab('OPPORTUNITIES')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${activeTab === 'OPPORTUNITIES' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
            >
                AI Finds
            </button>
        </div>

        {/* Section Header for Watchlist - Now with Add Button */}
        {activeTab === 'WATCHLIST' && (
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Watchlist ({watchlist.length})
                </h2>
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                    <Plus size={14} />
                    <span>Add Stock</span>
                </button>
            </div>
        )}
        
        {activeTab === 'OPPORTUNITIES' && (
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Zap size={14} className="fill-purple-400" />
                    High Conviction
                </h2>
            </div>
        )}

        <div className="space-y-2">
          {isLoadingData ? (
             <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse"></div>)}
             </div>
          ) : activeTab === 'WATCHLIST' ? (
            watchlist.length > 0 ? (
                watchlist.map((stock) => (
                    <StockCard key={stock.symbol} stock={stock} onClick={() => handleStockSelect(stock)} />
                ))
            ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                    <p className="mb-3">No stocks in portfolio</p>
                    <button 
                      onClick={() => setIsSearchOpen(true)}
                      className="text-emerald-400 font-bold text-sm"
                    >
                        + Add your first stock
                    </button>
                </div>
            )
          ) : (
            opportunities.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} onClick={() => handleStockSelect(stock)} isOpportunity />
            ))
          )}
        </div>
      </div>
    </div>
  );

  const DetailView = () => {
    if (!selectedStock) return null;

    return (
      <div className="pb-24 animate-in slide-in-from-right duration-300 bg-slate-950 min-h-screen">
        {/* Detail Header */}
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-800/50">
          <button onClick={() => setView('DASHBOARD')} className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h2 className="font-bold text-white">{selectedStock.symbol}</h2>
            <p className="text-[10px] text-slate-400 uppercase">{selectedStock.name}</p>
          </div>
          <button className="p-2 -mr-2 text-slate-300 hover:text-white">
            <Share2 size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Price Hero */}
          <div className="text-center py-2">
            <h1 className="text-4xl font-bold text-white mb-1">${selectedStock.price.toFixed(2)}</h1>
            <div className="flex items-center justify-center gap-2">
                <div className={`px-3 py-1 rounded-full flex items-center text-sm font-bold ${selectedStock.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {selectedStock.change >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                    {selectedStock.changePercent.toFixed(2)}%
                </div>
                <div className="text-slate-500 text-sm">Today</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 -mx-4 relative">
            {chartData.length > 0 ? (
                <StockChart data={chartData} trend={selectedStock.trend} />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Loader2 className="animate-spin" />
                </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                <Wallet size={20} />
                Buy {selectedStock.symbol}
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors border border-slate-700">
                Add to Watchlist
            </button>
          </div>

          {/* AI Analysis Section */}
          <div className="pt-4">
             <AnalysisPanel analysis={analysis} loading={isAnalyzing} />
          </div>

          {/* News Feed */}
          <div className="pt-4">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-slate-400" />
                Market Intelligence
            </h3>
            <div className="space-y-3">
                {news.length > 0 ? news.map((item: any) => (
                    <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {item.isSocial ? <Twitter size={12} className="text-blue-400" /> : <ExternalLink size={12} className="text-slate-400" />}
                                    <span className={`text-[10px] font-bold uppercase ${item.isSocial ? 'text-blue-400' : 'text-slate-500'}`}>{item.source}</span>
                                    <span className="text-[10px] text-slate-600">• {item.time}</span>
                                </div>
                                <h4 className="text-sm font-medium text-slate-200 leading-snug">{item.title}</h4>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="text-slate-600 text-center text-sm py-4">Loading news...</div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      
      {/* Main View Router */}
      {view === 'DASHBOARD' && <Dashboard />}
      {view === 'DETAIL' && <DetailView />}

      {/* Bottom Navigation - Only visible on Dashboard */}
      {view === 'DASHBOARD' && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 px-6 py-4 pb-6 flex justify-around z-30">
            <button 
              onClick={() => { setNavIndex(0); setActiveTab('WATCHLIST'); }}
              className={`flex flex-col items-center gap-1 ${navIndex === 0 ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
            >
                <Activity size={24} strokeWidth={navIndex === 0 ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Pulse</span>
            </button>
            <button 
              onClick={() => { setNavIndex(1); setActiveTab('OPPORTUNITIES'); }}
              className={`flex flex-col items-center gap-1 ${navIndex === 1 ? 'text-purple-400' : 'text-slate-600 hover:text-slate-400'}`}
            >
                <TrendingUp size={24} strokeWidth={navIndex === 1 ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Market</span>
            </button>
            <button 
              onClick={() => setNavIndex(2)}
              className={`flex flex-col items-center gap-1 ${navIndex === 2 ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
            >
                <Settings size={24} strokeWidth={navIndex === 2 ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Settings</span>
            </button>
        </div>
      )}

      {/* Modals & Overlays */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelect={handleAddStock} />
      
      {notification && (
        <NotificationToast 
          message={notification.title} 
          subMessage={notification.body} 
          onClick={handleNotificationClick}
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

export default App;
