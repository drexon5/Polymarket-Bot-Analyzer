import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimeSeriesPoint } from '../types';

interface TraderGraphsProps {
  pnlData: TimeSeriesPoint[];
  winRateData: TimeSeriesPoint[];
  tradeCountsData: TimeSeriesPoint[];
  traders: string[];
}

const COLORS = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#818cf8'];

export const TraderGraphs: React.FC<TraderGraphsProps> = ({ pnlData, winRateData, tradeCountsData, traders }) => {
  const [activeTraders, setActiveTraders] = useState<Set<string>>(new Set());

  // Initialize all traders as active when props change
  useEffect(() => {
    setActiveTraders(new Set(traders));
  }, [traders]);

  const toggleTrader = (trader: string) => {
    const newSet = new Set(activeTraders);
    if (newSet.has(trader)) {
      newSet.delete(trader);
    } else {
      newSet.add(trader);
    }
    setActiveTraders(newSet);
  };

  const toggleAll = () => {
    if (activeTraders.size === traders.length) {
        setActiveTraders(new Set());
    } else {
        setActiveTraders(new Set(traders));
    }
  };

  // Helper: Prepare Cumulative Data (Line Charts)
  // Forward fills data so lines don't break
  const prepareCumulativeChartData = (flatData: TimeSeriesPoint[]) => {
    const uniqueTimestamps = Array.from(new Set(flatData.map(d => d.timestamp))).sort((a, b) => a - b);
    const lastValues: Record<string, number> = {};
    traders.forEach(t => lastValues[t] = 0); // Start at 0

    return uniqueTimestamps.map(ts => {
        const point: any = { 
            timestamp: ts, 
            date: new Date(ts).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
        };

        const updates = flatData.filter(d => d.timestamp === ts);
        updates.forEach(u => {
            if (u.trader) {
                lastValues[u.trader] = u.value;
            }
        });

        traders.forEach(t => {
            point[t] = lastValues[t];
        });

        return point;
    });
  };

  // Helper: Prepare Discrete Data (Bar Charts)
  // Fills missing data with 0 instead of previous value
  const prepareDiscreteChartData = (flatData: TimeSeriesPoint[]) => {
    const uniqueTimestamps = Array.from(new Set(flatData.map(d => d.timestamp))).sort((a, b) => a - b);
    
    return uniqueTimestamps.map(ts => {
        const point: any = { 
            timestamp: ts, 
            date: new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric' }) 
        };

        traders.forEach(t => point[t] = 0); // Initialize to 0

        const updates = flatData.filter(d => d.timestamp === ts);
        updates.forEach(u => {
            if (u.trader) {
                point[u.trader] = u.value;
            }
        });

        return point;
    });
  };

  const processedPnlData = useMemo(() => prepareCumulativeChartData(pnlData), [pnlData, traders]);
  const processedWinData = useMemo(() => prepareCumulativeChartData(winRateData), [winRateData, traders]);
  const processedCountData = useMemo(() => prepareDiscreteChartData(tradeCountsData), [tradeCountsData, traders]);

  const cardClass = "bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-sm";

  return (
    <div className="space-y-6">
      {/* Trader Filter Toggles */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="flex flex-wrap gap-2">
            {traders.map((trader, idx) => {
                const isActive = activeTraders.has(trader);
                const color = COLORS[idx % COLORS.length];
                return (
                    <button
                        key={trader}
                        onClick={() => toggleTrader(trader)}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                            ${isActive 
                                ? 'bg-gray-700 text-white border-gray-600 shadow-sm' 
                                : 'bg-gray-900 text-gray-500 border-gray-800 opacity-60'
                            }
                        `}
                        style={{ borderColor: isActive ? color : 'transparent' }}
                    >
                        <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: color, opacity: isActive ? 1 : 0.5 }} 
                        />
                        {trader}
                    </button>
                );
            })}
        </div>
        <button 
            onClick={toggleAll}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap px-3 py-1.5 hover:bg-gray-700 rounded transition-colors"
        >
            {activeTraders.size === traders.length ? 'Hide All' : 'Show All'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* PnL Per Trader */}
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-gray-200 mb-4">PnL Growth per Trader</h3>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedPnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickFormatter={(val) => `$${val}`} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                />
                {traders.map((trader, idx) => (
                   activeTraders.has(trader) && (
                    <Line
                        key={trader}
                        type="stepAfter"
                        dataKey={trader}
                        name={trader}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        connectNulls
                    />
                   )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate Per Trader */}
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-gray-200 mb-4">Win Rate per Trader</h3>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedWinData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  domain={[0, 100]} 
                  tickFormatter={(val) => `${val}%`} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`]} 
                />
                {traders.map((trader, idx) => (
                  activeTraders.has(trader) && (
                    <Line
                        key={trader}
                        type="monotone"
                        dataKey={trader}
                        name={trader}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        connectNulls
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trades Per Day Bar Chart */}
        <div className={cardClass}>
          <h3 className="text-lg font-bold text-gray-200 mb-4">Trades per Day</h3>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedCountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  allowDecimals={false}
                />
                <Tooltip 
                    cursor={{fill: '#374151', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                />
                {traders.map((trader, idx) => (
                   activeTraders.has(trader) && (
                    <Bar
                        key={trader}
                        dataKey={trader}
                        name={trader}
                        fill={COLORS[idx % COLORS.length]}
                        stackId="a"
                        maxBarSize={60}
                    />
                   )
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};