import React from 'react';
import { AIInsight } from '../types';
import { Target, AlertTriangle, TrendingUp, MessageCircle, Brain } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AIInsight | null;
  loading: boolean;
}

// Reusable Card Component matching new aesthetic
const Card: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
);

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="animate-pulse p-6 space-y-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        <div className="h-32 bg-slate-700 rounded w-full"></div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* AI Thesis - "The Convincer" */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Brain size={20} className="text-purple-400" />
          AI Investment Thesis
        </h3>
        <Card className="p-5 border-purple-500/30 bg-purple-900/10">
          <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
            <div className="text-center flex-1">
              <div className={`text-2xl font-bold ${analysis.confidenceScore > 75 ? 'text-purple-400' : 'text-yellow-400'}`}>
                {analysis.confidenceScore}
              </div>
              <div className="text-[10px] text-purple-300 uppercase tracking-wider">Confidence</div>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-center flex-1">
              <div className={`text-xl font-bold ${analysis.action === 'BUY' ? 'text-emerald-400' : analysis.action === 'SELL' ? 'text-rose-400' : 'text-amber-400'}`}>
                {analysis.action}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Verdict</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-purple-400 font-bold">Why now: </span>
              {analysis.summary}
            </p>
            
            {/* Confidence Bar Visual */}
            <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-1000"
                    style={{ width: `${analysis.confidenceScore}%` }}
                ></div>
            </div>

          </div>
        </Card>
      </div>

      {/* Price Targets - Slate Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-1 text-emerald-400">
                <Target size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Buy Zone</span>
            </div>
            <p className="text-lg font-bold text-white">{analysis.buyZone}</p>
        </Card>
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-1 text-rose-400">
                <Target size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Sell Target</span>
            </div>
            <p className="text-lg font-bold text-white">{analysis.sellZone}</p>
        </Card>
      </div>

      {/* Drivers & Risks List */}
      <Card className="p-5 space-y-5">
        <div className="space-y-3">
            <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Key Drivers</h4>
            {analysis.keyDrivers.map((driver, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-200">
                    <TrendingUp size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{driver}</span>
                </div>
            ))}
        </div>
        <div className="h-px bg-slate-700/50"></div>
        <div className="space-y-3">
            <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Risk Factors</h4>
            {analysis.riskFactors.map((risk, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-200">
                    <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                    <span>{risk}</span>
                </div>
            ))}
        </div>
      </Card>

      {/* Social Sentiment */}
      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-200 p-5 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
            <MessageCircle size={18} className="text-blue-400" />
            <h3 className="font-bold text-sm text-blue-400">Influencer Consensus</h3>
        </div>
        <p className="text-sm leading-relaxed opacity-90">
            {analysis.socialSentimentAnalysis}
        </p>
      </div>
    </div>
  );
};

export default AnalysisPanel;