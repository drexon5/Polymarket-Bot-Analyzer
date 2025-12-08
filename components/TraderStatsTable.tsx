import React, { useState, useMemo } from 'react';
import { TraderStats } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TraderStatsTableProps {
  stats: TraderStats[];
}

type SortKey = keyof TraderStats;
type SortDirection = 'asc' | 'desc';

export const TraderStatsTable: React.FC<TraderStatsTableProps> = ({ stats }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'totalPnl', 
    direction: 'desc' 
  });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStats = useMemo(() => {
    const sorted = [...stats];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [stats, sortConfig]);

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-400 ml-1 inline" /> 
      : <ArrowDown className="w-3 h-3 text-blue-400 ml-1 inline" />;
  };

  const HeaderCell = ({ label, id, align = 'right' }: { label: string, id: SortKey, align?: 'left' | 'right' }) => (
    <th 
      className={`px-4 py-3 font-semibold cursor-pointer hover:text-white transition-colors select-none text-${align}`}
      onClick={() => handleSort(id)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {renderSortIcon(id)}
      </div>
    </th>
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center gap-2">
         <h3 className="text-lg font-bold text-gray-200">Trader Performance Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-900/50 border-b border-gray-700">
                <tr>
                    <HeaderCell label="Trader" id="name" align="left" />
                    <HeaderCell label="Total PnL" id="totalPnl" />
                    <HeaderCell label="Win Rate" id="winRate" />
                    <HeaderCell label="Profit Factor" id="profitFactor" />
                    <HeaderCell label="Attempts" id="totalAttempts" />
                    <HeaderCell label="Avg Hold (h)" id="avgHoldingTimeHours" />
                    <HeaderCell label="L/S Ratio" id="longShortRatio" />
                    <HeaderCell label="Freq (T/D)" id="avgTradesPerDay" />
                    <HeaderCell label="Avg Copied" id="avgSuccessfulBet" />
                    <HeaderCell label="Best Trade" id="bestTrade" />
                    <HeaderCell label="Worst Trade" id="worstTrade" />
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {sortedStats.map((trader) => (
                    <tr key={trader.name} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{trader.name}</td>
                        <td className={`px-4 py-3 text-right font-bold tabular-nums ${trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trader.totalPnl >= 0 ? '+' : ''}${trader.totalPnl.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{trader.winRate.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums">{trader.profitFactor.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-white">{trader.totalAttempts}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{trader.avgHoldingTimeHours.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{trader.longShortRatio.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{trader.avgTradesPerDay.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-400">${trader.avgSuccessfulBet.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-green-400">+${trader.bestTrade.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-red-400">-${Math.abs(trader.worstTrade).toFixed(0)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};