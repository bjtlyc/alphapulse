import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartPoint, Trend } from '../types';

interface StockChartProps {
  data: ChartPoint[];
  trend: Trend;
}

const StockChart: React.FC<StockChartProps> = ({ data, trend }) => {
  const isUp = trend === Trend.UP;
  // Emerald-400 (#34d399) for Up, Rose-400 (#fb7185) for Down
  const color = isUp ? '#34d399' : '#fb7185'; 
  const gradientId = `colorValue-${isUp ? 'up' : 'down'}`;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            hide={true} 
          />
          <YAxis 
            hide={true} 
            domain={['dataMin', 'dataMax']} 
          />
          <Tooltip 
            contentStyle={{ 
                backgroundColor: '#1e293b', // Slate-800
                borderColor: '#334155', // Slate-700
                color: '#f8fafc',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            itemStyle={{ color: '#f8fafc' }}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '12px' }}
            cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;