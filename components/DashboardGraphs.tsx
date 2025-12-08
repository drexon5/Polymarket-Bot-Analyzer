import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeriesPoint } from '../types';

interface DashboardGraphsProps {
  data: TimeSeriesPoint[];
}

export const DashboardGraphs: React.FC<DashboardGraphsProps> = ({ data }) => {
  if (data.length === 0) return null;

  const cardClass = "bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* PnL Chart */}
      <div className={cardClass}>
        <h3 className="text-lg font-bold text-gray-200 mb-4">Overall PnL Over Time</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                fontSize={12} 
                tickMargin={15} 
                minTickGap={40} 
                axisLine={false}
                tickLine={false}
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
                itemStyle={{ color: '#818cf8' }}
                formatter={(val: number) => [`$${val.toFixed(2)}`, 'Cumulative PnL']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#818cf8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPnl)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win Rate Chart */}
      <div className={cardClass}>
        <h3 className="text-lg font-bold text-gray-200 mb-4">Overall Win Rate Over Time</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
               <defs>
                <linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                fontSize={12} 
                tickMargin={15} 
                minTickGap={40} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={12} 
                tickFormatter={(val) => `${val.toFixed(0)}%`} 
                domain={[0, 100]} 
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                itemStyle={{ color: '#34d399' }}
                formatter={(val: number) => [`${val.toFixed(1)}%`, 'Win Rate']}
              />
              <Area 
                type="monotone" 
                dataKey="winRate" 
                stroke="#34d399" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorWin)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};