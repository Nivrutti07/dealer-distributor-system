import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const TopProductsChart = ({ data = [] }) => {
  const chartData = [...data]
    .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0))
    .slice(0, 5);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey="quantity" 
            radius={[0, 4, 4, 0]}
            fill="#22c55e"
            barSize={20}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#16a34a' : '#86efac'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopProductsChart;
