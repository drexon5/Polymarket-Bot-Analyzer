import React, { useState, useMemo } from 'react';
import { TraderStats } from '../types';
import { ArrowUp, ArrowDown, Settings } from 'lucide-react';

interface TraderStatsTableProps {
  stats: TraderStats[];
}

type SortKey = keyof TraderStats;
type SortDirection = 'asc' | 'desc';

interface ColumnConfig {
  id: SortKey;
  label: string;
  align?: 'left' | 'right';
  render: (stat: TraderStats) => React.ReactNode;
}

export const TraderStatsTable: React.FC<TraderStatsTableProps> = ({ stats }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'totalPnl', 
    direction: 'desc' 
  });

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'name', 'favoriteCategory', 'totalPnl', 'winRate', 'profitFactor', 'sharpeRatio', 
    'totalAttempts', 'avgHoldingTimeHours', 'longShortRatio', 'avgTradesPerDay', 'avgSuccessfulBet'
  ]));
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Column Definitions
  const columns: ColumnConfig[] = [
    { 
        id: 'name', 
        label: 'Trader', 
        align: 'left',
        render: (t) => <span className="font-medium text-white">{t.name}</span>
    },
    { 
        id: 'favoriteCategory', 
        label: 'Fav Category', 
        align: 'left',
        render: (t) => (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                t.favoriteCategory === 'Sport' 
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
                {t.favoriteCategory}
            </span>
        )
    },
    { 
        id: 'totalPnl', 
        label: 'Total PnL', 
        render: (t) => (
            <span className={`font-bold ${t.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {t.totalPnl >= 0 ? '+' : ''}${t.totalPnl.toFixed(2)}
            </span>
        )
    },
    { 
        id: 'winRate', 
        label: 'Win Rate', 
        render: (t) => <span>{t.winRate.toFixed(1)}%</span>
    },
    { 
        id: 'profitFactor', 
        label: 'Profit Factor', 
        render: (t) => <span>{t.profitFactor.toFixed(2)}</span>
    },
    { 
        id: 'sharpeRatio', 
        label: 'Sharpe', 
        render: (t) => <span className={`${t.sharpeRatio > 1.5 ? 'text-green-400 font-bold' : 'text-gray-300'}`}>{t.sharpeRatio.toFixed(2)}</span>
    },
    { 
        id: 'totalAttempts', 
        label: 'Attempts', 
        render: (t) => <span className="text-white">{t.totalAttempts}</span>
    },
    { 
        id: 'avgHoldingTimeHours', 
        label: 'Avg Hold (h)', 
        render: (t) => <span>{t.avgHoldingTimeHours.toFixed(1)}</span>
    },
    { 
        id: 'longShortRatio', 
        label: 'L/S Ratio', 
        render: (t) => <span>{t.longShortRatio.toFixed(2)}</span>
    },
    { 
        id: 'avgTradesPerDay', 
        label: 'Freq (T/D)', 
        render: (t) => <span>{t.avgTradesPerDay.toFixed(1)}</span>
    },
    { 
        id: 'avgSuccessfulBet', 
        label: 'Avg Copied', 
        render: (t) => <span className="text-gray-400">${t.avgSuccessfulBet.toFixed(0)}</span>
    },
    { 
        id: 'bestTrade', 
        label: 'Best Trade', 
        render: (t) => <span className="text-green-400">+${t.bestTrade.toFixed(0)}</span>
    },
    { 
        id: 'worstTrade', 
        label: 'Worst Trade', 
        render: (t) => <span className="text-red-400">-${Math.abs(t.worstTrade).toFixed(0)}</span>
    }
  ];

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

  const toggleColumn = (id: string) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisibleColumns(newSet);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-400 ml-1 inline" /> 
      : <ArrowDown className="w-3 h-3 text-blue-400 ml-1 inline" />;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-sm flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
         <h3 className="text-lg font-bold text-gray-200">Trader Performance Summary</h3>
         
         {/* Column Toggle */}
         <div className="relative">
            <button 
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center gap-2 bg-gray-700 border border-gray-600 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded text-sm transition-all"
            >
                <Settings className="w-4 h-4" /> 
            </button>
            
            {showColumnSelector && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wider mb-1">Toggle Columns</div>
                    {columns.map(col => (
                        <label key={col.id} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={visibleColumns.has(col.id)} 
                                onChange={() => toggleColumn(col.id)}
                                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">{col.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-900/50 border-b border-gray-700">
                <tr>
                    {columns.filter(c => visibleColumns.has(c.id)).map(col => (
                        <th 
                            key={col.id}
                            className={`px-4 py-3 font-semibold cursor-pointer hover:text-white transition-colors select-none text-${col.align || 'right'}`}
                            onClick={() => handleSort(col.id)}
                        >
                            <div className={`flex items-center gap-1 ${col.align === 'left' ? 'justify-start' : 'justify-end'}`}>
                                {col.label}
                                {renderSortIcon(col.id)}
                            </div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {sortedStats.map((trader) => (
                    <tr key={trader.name} className="hover:bg-gray-700/30 transition-colors">
                        {columns.filter(c => visibleColumns.has(c.id)).map(col => (
                            <td key={col.id} className={`px-4 py-3 tabular-nums ${col.align === 'left' ? 'text-left' : 'text-right'}`}>
                                {col.render(trader)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};