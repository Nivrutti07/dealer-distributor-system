import React, { useState, useEffect } from 'react';
import { getDeliveries, assignDelivery } from '../../api/deliveryApi';
import { getTravellers } from '../../api/userApi';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Filter, Search, RefreshCw, UserPlus } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';

const AdminDeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Assignment state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [travellers, setTravellers] = useState([]);
  const [selectedTraveller, setSelectedTraveller] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await getDeliveries();
      setDeliveries(res.data || []);
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async (delivery) => {
    setCurrentOrder({ id: delivery.order_id, number: delivery.order_number });
    setIsAssignModalOpen(true);
    try {
      const response = await getTravellers();
      setTravellers(response.data || []);
    } catch (err) {
      toast.error('Failed to load travellers');
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedTraveller) {
      toast.error("Please select a traveller");
      return;
    }

    const traveller = travellers.find(t => t.id === parseInt(selectedTraveller));
    if (!window.confirm(`Are you sure you want to assign order #${currentOrder?.number} to ${traveller?.name || 'this traveller'}?`)) {
      return;
    }

    try {
      setAssigning(true);
      await assignDelivery(currentOrder.id, selectedTraveller);
      toast.success('Delivery assigned successfully!');
      setIsAssignModalOpen(false);
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'unassigned': return <Badge variant="warning">Unassigned</Badge>;
      case 'assigned': return <Badge variant="purple">Assigned</Badge>;
      case 'accepted': return <Badge variant="primary">Accepted</Badge>;
      case 'picked_up': return <Badge variant="info">Picked Up</Badge>;
      case 'in_transit': return <Badge variant="orange">In Transit</Badge>;
      case 'delivered': return <Badge variant="success">Delivered</Badge>;
      case 'failed': return <Badge variant="danger">Failed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    const matchesStatus = filterStatus ? d.status === filterStatus : true;
    const matchesSearch = searchQuery 
      ? (d.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         d.traveller_name?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Overview</h1>
        <Button onClick={fetchDeliveries} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Input 
            placeholder="Search by order or traveller..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ accentColor: '#b3391e' }}
          className="rounded-lg border border-blue-200 bg-red-50 text-red-700 px-3 py-2 text-sm font-semibold shadow-sm outline-none focus:ring-2 focus:ring-red-200 hover:bg-red-100"
        >
          <option value="">All Statuses</option>
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned</option>
          <option value="accepted">Accepted</option>
          <option value="picked_up">Picked Up</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Traveller</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && deliveries.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">Loading deliveries...</td></tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No deliveries found</td></tr>
              ) : (
                filteredDeliveries.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">#{d.order_number}</td>
                    <td className="px-6 py-4">
                      {d.traveller_name ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{d.traveller_name}</span>
                          <span className="text-xs text-gray-500">{d.traveller_email}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 italic">Not Assigned</span>
                          <button 
                            onClick={() => openAssignModal(d)}
                            className="p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Assign Traveller"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{d.delivery_address}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {d.updated_at ? new Date(d.updated_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Order #${currentOrder?.number}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
            <Select
              value={selectedTraveller}
              onChange={(e) => setSelectedTraveller(e.target.value)}
              className="w-full"
            >
              <option value="">-- Choose Driver --</option>
              {travellers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.current_status || 'available'})
                </option>
              ))}
            </Select>
            <p className="mt-2 text-xs text-gray-500 italic">Only active and available drivers are shown.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button 
            onClick={() => setIsAssignModalOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssignDelivery}
            disabled={assigning || !selectedTraveller}
            variant="danger"
          >
            {assigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDeliveriesPage;
