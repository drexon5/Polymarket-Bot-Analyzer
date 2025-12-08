import React, { useState, useMemo } from 'react';
import { DataInput } from './components/DataInput';
import { TradeTable } from './components/TradeTable';
import { DashboardGraphs } from './components/DashboardGraphs';
import { TraderStatsTable } from './components/TraderStatsTable';
import { TraderGraphs } from './components/TraderGraphs';
import { StatsCards } from './components/StatsCards';
import { parseInputData, processTrades, exportToCSV } from './services/parser';
import { calculateAnalytics } from './services/analytics';
import { ProcessedTrade } from './types';
import { Download, RefreshCw, AlertTriangle, PenTool } from 'lucide-react';

const App: React.FC = () => {
  const [trades, setTrades] = useState<ProcessedTrade[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = (portfolio: string, chat: string) => {
    try {
      setError(null);
      const { activePositions, closedPositions, activityHistory, chatLogs } = parseInputData(portfolio, chat);
      const processed = processTrades(chatLogs, activePositions, closedPositions, activityHistory);
      setTrades(processed);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred while parsing the data.');
    }
  };

  const handleExport = () => {
    if (trades.length > 0) {
      exportToCSV(trades);
    }
  };

  const analytics = useMemo(() => calculateAnalytics(trades), [trades]);

  return (
    <div className="min-h-screen p-6 font-sans text-gray-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold tracking-tight text-blue-400 flex items-center gap-2">
               Polymarket Bot Success Analyzer
               <PenTool className="w-5 h-5 text-gray-500" />
             </h1>
          </div>
          
          {trades.length > 0 && (
            <div className="flex gap-3">
                <button
                    onClick={() => setTrades([])}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700 transition-all"
                >
                    <RefreshCw className="w-4 h-4" /> Reset
                </button>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-sm transition-all"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-200 p-4 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
            </div>
        )}

        {/* Input Section */}
        {trades.length === 0 && (
            <div className="py-8">
                <DataInput onProcess={handleProcess} />
            </div>
        )}

        {/* Results Section */}
        {trades.length > 0 && (
            <div className="space-y-8">
                {/* 1. High Level Stats */}
                <StatsCards trades={trades} />

                {/* 2. Overall Graphs */}
                <DashboardGraphs data={analytics.overallTimeSeries} />

                {/* 3. Trader Stats Table */}
                <TraderStatsTable stats={analytics.traderStats} />

                {/* 4. Trader Comparative Graphs */}
                <TraderGraphs 
                    pnlData={analytics.pnlOverTimeByTrader} 
                    winRateData={analytics.winRateOverTimeByTrader} 
                    tradeCountsData={analytics.dailyTradeCounts}
                    traders={analytics.traderStats.map(t => t.name)}
                />

                {/* 5. Detailed Trades Table */}
                <div className="space-y-4">
                   <h3 className="text-xl font-bold text-gray-200">Trade Log Details</h3>
                   <TradeTable trades={trades} />
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;