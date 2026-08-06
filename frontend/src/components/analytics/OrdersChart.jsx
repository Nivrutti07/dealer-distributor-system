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

const OrdersChart = ({ data = [] }) => {
  const chartData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="date"
            type="category"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={90}
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            }}
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
            dataKey="orders"
            radius={[0, 4, 4, 0]}
            fill="#22c55e"
            barSize={18}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#16a34a' : '#86efac'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersChart;
