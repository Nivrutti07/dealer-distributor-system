import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { getAllUsers } from '../../api/userApi';
import { getAllOrders } from '../../api/orderApi';
import { getDeliveries } from '../../api/deliveryApi';
import { getPayments } from '../../api/paymentApi';
import { Users, ShoppingCart, DollarSign, Truck, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    revenue: 0,
    totalDeliveries: 0,
    deliveries: 0,
    salesData: [],
    statusData: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, ordersRes, deliveriesRes, paymentsRes] = await Promise.all([
          getAllUsers().catch(() => ({ data: [] })),
          getAllOrders().catch(() => ({ data: [] })),
          getDeliveries().catch(() => ({ data: [] })),
          getPayments().catch(() => ({ data: [] }))
        ]);

        const usersData = usersRes.data || usersRes || [];
        const ordersData = ordersRes.data || ordersRes || [];
        const deliveriesData = deliveriesRes.data || deliveriesRes || [];
        const paymentsData = paymentsRes.data || paymentsRes || [];

        const verifiedPayments = Array.isArray(paymentsData) ? paymentsData.filter(p => p.status === 'verified') : [];
        const totalRevenue = verifiedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const pendingDeliveries = Array.isArray(deliveriesData) ? deliveriesData.filter(d => ['unassigned', 'assigned', 'picked_up', 'in_transit'].includes(d.status)).length : 0;

        // Process sales data for chart
        const salesByDate = {};
        verifiedPayments.forEach(p => {
          const date = new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          salesByDate[date] = (salesByDate[date] || 0) + parseFloat(p.amount);
        });
        const salesData = Object.keys(salesByDate).map(date => ({ date, amount: salesByDate[date] })).reverse();

        // Process status data for chart
        const statusCount = {};
        ordersData.forEach(o => {
          statusCount[o.status] = (statusCount[o.status] || 0) + 1;
        });
        const statusData = Object.keys(statusCount).map(name => ({ name, value: statusCount[name] }));

        setStats({
          users: Array.isArray(usersData) ? usersData.length : 0,
          orders: Array.isArray(ordersData) ? ordersData.length : 0,
          revenue: totalRevenue,
          totalDeliveries: Array.isArray(deliveriesData) ? deliveriesData.length : 0,
          deliveries: pendingDeliveries,
          salesData,
          statusData
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Total Revenue', value: `₹${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Deliveries', value: stats.totalDeliveries, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Pending Deliveries', value: stats.deliveries, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="recharts-sector">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading statistics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <p className="text-sm font-medium text-gray-500 mb-4 truncate">{card.title}</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${card.bg} ${card.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`min-w-0 text-right ${card.title === 'Total Revenue' ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 leading-tight whitespace-nowrap tracking-normal`}>
                      {card.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Status Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4f46e5', '#35b910', '#f59e0b', '#ef4444', '#6366f1'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
