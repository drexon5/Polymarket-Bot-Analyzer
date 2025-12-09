import React, { useState, useMemo } from 'react';
import { ProcessedTrade, TradeStatus } from '../types';
import { 
  ExternalLink, 
  XCircle, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  ArrowUp,
  ArrowDown,
  Settings,
  Search,
  Filter
} from 'lucide-react';

interface TradeTableProps {
  trades: ProcessedTrade[];
}

type SortKey = keyof ProcessedTrade | 'execAmt' | 'execPrice' | 'latency' | 'signalAmt' | 'market' | 'trader' | 'totalAttempted';
type SortDirection = 'asc' | 'desc';

interface ColumnConfig {
  id: string;
  label: string;
  sortable: boolean;
  minWidth?: string;
  render: (trade: ProcessedTrade) => React.ReactNode;
}

export const TradeTable: React.FC<TradeTableProps> = ({ trades }) => {
  // State
  const [filterText, setFilterText] = useState('');
  const [hideFailed, setHideFailed] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'date', 'trader', 'category', 'action', 'market', 'signalAmt', 'totalAttempted', 'execAmt', 'price', 'status', 'result', 'pnl', 'latency', 'link'
  ]));
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Column Definitions
  const columns: ColumnConfig[] = [
    {
      id: 'date',
      label: 'Date',
      sortable: true,
      render: (t) => <span className="whitespace-nowrap text-gray-400">{new Date(t.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    },
    {
      id: 'trader',
      label: 'Trader',
      sortable: true,
      render: (t) => <span className="font-medium text-white">{t.traderName}</span>
    },
    {
      id: 'category',
      label: 'Cat',
      sortable: true,
      render: (t) => (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
            t.category === 'Sport' 
            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
        }`}>
            {t.category === 'Sport' ? 'Sport' : 'Other'}
        </span>
      )
    },
    {
      id: 'market',
      label: 'Market',
      sortable: true,
      render: (t) => <span className="max-w-[200px] truncate block text-gray-300" title={t.marketTitle}>{t.marketTitle}</span>
    },
    {
      id: 'action',
      label: 'Side / Outcome',
      sortable: true,
      render: (t) => (
        <span className={`font-bold text-xs px-2 py-1 rounded border ${
          t.action === 'BUY' 
          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
          : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {t.action} {t.outcome}
        </span>
      )
    },
    {
      id: 'signalAmt',
      label: 'Signal $',
      sortable: true,
      render: (t) => <span className="tabular-nums text-gray-300">${t.amount.toFixed(2)}</span>
    },
    {
      id: 'totalAttempted',
      label: 'Tot. Attempted',
      sortable: true,
      render: (t) => (
          <span className="tabular-nums text-yellow-500/80 font-medium">
              {t.totalAttemptedAmount ? `$${t.totalAttemptedAmount.toFixed(0)}` : '-'}
          </span>
      )
    },
    {
      id: 'execAmt',
      label: 'Exec $',
      sortable: true,
      render: (t) => (
        <span className={`tabular-nums ${t.matchedExecutionAmount ? 'text-white' : 'text-gray-600'}`}>
          {t.matchedExecutionAmount ? `$${t.matchedExecutionAmount.toFixed(2)}` : '-'}
        </span>
      )
    },
    {
      id: 'price',
      label: 'Price',
      sortable: true,
      render: (t) => (
        <span className="text-gray-300 tabular-nums">
          {t.matchedExecutionPrice ? `${(t.matchedExecutionPrice * 100).toFixed(1)}¢` : '-'}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (t) => (
        <div className="flex items-center gap-2">
            {t.status === TradeStatus.SUCCESS ? <CheckCircle className="w-4 h-4 text-green-500" /> :
             t.status === TradeStatus.MISSING ? <AlertCircle className="w-4 h-4 text-yellow-500" /> :
             <XCircle className="w-4 h-4 text-red-500" />}
            <div className="flex flex-col">
                <span className={`text-xs font-medium ${t.status === TradeStatus.SUCCESS ? 'text-green-400' : 'text-red-400'}`}>{t.status}</span>
                {t.failureReason && <span className="text-[10px] text-gray-500 max-w-[100px] truncate" title={t.failureReason}>{t.failureReason}</span>}
            </div>
        </div>
      )
    },
    {
      id: 'result',
      label: 'Result',
      sortable: true,
      render: (t) => (
        t.result ? (
            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                t.result === 'WIN' ? 'bg-green-600/20 text-green-400' : 
                t.result === 'LOSS' ? 'bg-red-600/20 text-red-400' : 
                'bg-blue-600/20 text-blue-400'
            }`}>
                {t.result}
            </span>
        ) : '-'
      )
    },
    {
      id: 'pnl',
      label: 'PnL',
      sortable: true,
      render: (t) => (
        t.pnl !== undefined ? (
            <div className={`tabular-nums font-bold ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
            </div>
        ) : <span className="text-gray-600">-</span>
      )
    },
    {
      id: 'value',
      label: 'Value',
      sortable: true,
      render: (t) => <span className="tabular-nums text-gray-400">{t.currentValue ? `$${t.currentValue.toFixed(2)}` : '-'}</span>
    },
    {
      id: 'latency',
      label: 'Latency',
      sortable: true,
      render: (t) => (
        t.latencySeconds !== undefined ? (
            <span className={`text-xs tabular-nums ${Math.abs(t.latencySeconds) > 60 ? 'text-yellow-500' : 'text-gray-400'}`}>
                {t.latencySeconds.toFixed(1)}s
            </span>
        ) : '-'
      )
    },
    {
      id: 'tx',
      label: 'Tx',
      sortable: false,
      render: (t) => t.matchedTxHash ? (
        <a href={`https://polygonscan.com/tx/${t.matchedTxHash}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors">
            <FileText className="w-4 h-4" />
        </a>
      ) : '-'
    },
    {
      id: 'link',
      label: 'Link',
      sortable: false,
      render: (t) => (
        <a href={t.marketUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors">
            <ExternalLink className="w-4 h-4" />
        </a>
      )
    }
  ];

  // Handling Sorting
  const handleSort = (key: string) => {
    let direction: SortDirection = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key: key as SortKey, direction });
  };

  // Handling Filter & Sort Logic
  const filteredAndSortedTrades = useMemo(() => {
    let result = [...trades];

    if (hideFailed) {
        result = result.filter(t => t.status === TradeStatus.SUCCESS && t.matchedPositionStatus !== 'None');
    }

    if (filterText) {
      const lower = filterText.toLowerCase();
      result = result.filter(t => 
        t.traderName.toLowerCase().includes(lower) ||
        t.marketTitle.toLowerCase().includes(lower) ||
        t.action.toLowerCase().includes(lower) ||
        t.outcome.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower)
      );
    }

    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch(sortConfig.key) {
        case 'execAmt': aVal = a.matchedExecutionAmount || 0; bVal = b.matchedExecutionAmount || 0; break;
        case 'execPrice': aVal = a.matchedExecutionPrice || 0; bVal = b.matchedExecutionPrice || 0; break;
        case 'latency': aVal = a.latencySeconds || 0; bVal = b.latencySeconds || 0; break;
        case 'signalAmt': aVal = a.amount; bVal = b.amount; break;
        case 'totalAttempted': aVal = a.totalAttemptedAmount || 0; bVal = b.totalAttemptedAmount || 0; break;
        case 'market': aVal = a.marketTitle; bVal = b.marketTitle; break;
        case 'trader': aVal = a.traderName; bVal = b.traderName; break;
        case 'action': aVal = a.action; bVal = b.action; break;
        case 'result': aVal = a.result || ''; bVal = b.result || ''; break;
        case 'category': aVal = a.category; bVal = b.category; break;
        default: aVal = a[sortConfig.key as keyof ProcessedTrade] || 0; bVal = b[sortConfig.key as keyof ProcessedTrade] || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [trades, filterText, sortConfig, hideFailed]);

  const toggleColumn = (id: string) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisibleColumns(newSet);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 p-4 border-b border-gray-700 bg-gray-800">
            {/* Filter Input */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search trades..." 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded pl-10 pr-4 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                />
            </div>
            
            <div className="flex items-center gap-3">
                {/* Toggle Failed */}
                <button
                    onClick={() => setHideFailed(!hideFailed)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm border transition-all ${
                        hideFailed 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    <Filter className="w-4 h-4" />
                    {hideFailed ? 'Successful Only' : 'All Trades'}
                </button>

                {/* Columns Selector */}
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-900/50 border-b border-gray-700">
                    <tr>
                        {columns.filter(c => visibleColumns.has(c.id)).map(col => (
                            <th 
                                key={col.id} 
                                className={`px-4 py-3 font-semibold tracking-wider ${col.sortable ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}`}
                                onClick={() => col.sortable && handleSort(col.id)}
                            >
                                <div className="flex items-center gap-1">
                                    {col.label}
                                    {sortConfig.key === col.id && (
                                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {filteredAndSortedTrades.map((trade) => (
                        <tr key={trade.id} className="hover:bg-gray-700/30 transition-colors">
                            {columns.filter(c => visibleColumns.has(c.id)).map(col => (
                                <td key={col.id} className="px-4 py-3 whitespace-nowrap">
                                    {col.render(trade)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {filteredAndSortedTrades.length === 0 && (
                        <tr>
                            <td colSpan={visibleColumns.size} className="px-4 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Search className="w-6 h-6 opacity-50" />
                                    <p>No trades found matching your filters.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};