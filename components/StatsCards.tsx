import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from 'lucide-react';
import { ProcessedTrade, TradeStatus } from '../types';

interface StatsCardsProps {
  trades: ProcessedTrade[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ trades }) => {
  // Calculate Aggregates
  const executedTrades = trades.filter(t => 
    t.status === TradeStatus.SUCCESS && 
    (t.matchedPositionStatus === 'Active' || t.matchedPositionStatus === 'Closed')
  );

  const totalTrades = executedTrades.length;
  const totalVolume = executedTrades.reduce((sum, t) => sum + (t.matchedExecutionAmount || 0), 0);
  const totalPnL = executedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  const winningTrades = executedTrades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const cards = [
    {
      label: 'Total PnL',
      value: totalPnL,
      type: 'currency',
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: totalPnL >= 0 ? 'border-green-500/20' : 'border-red-500/20'
    },
    {
      label: 'Win Rate',
      value: winRate,
      type: 'percent',
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Total Volume',
      value: totalVolume,
      type: 'currency',
      icon: DollarSign,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      label: 'Executed Trades',
      value: totalTrades,
      type: 'number',
      icon: BarChart3,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className={`rounded-xl border ${card.borderColor} bg-gray-800/50 p-5 shadow-sm backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-400">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold text-white`}>
                    {card.type === 'currency' 
                        ? `${card.value >= 0 ? '' : '-'}$${Math.abs(card.value).toFixed(2)}`
                        : card.type === 'percent'
                            ? `${card.value.toFixed(1)}%`
                            : card.value
                    }
                </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};