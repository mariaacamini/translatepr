import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getLanguageName, getLanguageFlag } from '../../constants/languages';

interface LanguageBreakdownProps {
  data: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export const LanguageBreakdown: React.FC<LanguageBreakdownProps> = ({ data }) => {
  const chartData = Object.entries(data).map(([language, count], index) => ({
    name: getLanguageName(language),
    value: count,
    language,
    color: COLORS[index % COLORS.length],
    flag: getLanguageFlag(language)
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{data.flag}</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <p className="text-sm text-gray-600">{data.value} translations</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap gap-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600 flex items-center space-x-1">
            <span>{entry.payload.flag}</span>
            <span>{entry.value}</span>
          </span>
        </div>
      ))}
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-gray-500">
        <p>No translation data available</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};