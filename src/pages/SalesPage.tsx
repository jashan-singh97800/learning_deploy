import { useState, useEffect } from 'react';
import { getSalesReport } from '../api/orders';
import type { Order, FilterPeriod, SalesSummary } from '../types';
import toast from 'react-hot-toast';
import {
  BarChart3, TrendingUp, ShoppingBag, IndianRupee,
  Search, Calendar, User, Phone, Receipt,
  ChevronDown, ChevronUp, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';

const FILTERS: { label: string; value: FilterPeriod }[] = [
  { label: 'Today', value: 'daily' },
  { label: 'This Week', value: 'weekly' },
  { label: 'This Month', value: 'monthly' },
  { label: 'This Year', value: 'yearly' },
];

export default function SalesPage() {
  const [filter, setFilter] = useState<FilterPeriod>('daily');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = async () => {
    setLoading(true);
    setExpandedId(null);
    setCurrentPage(1);
    try {
      const data = await getSalesReport(filter, debouncedSearch || undefined);
      setOrders(data.orders);
      setSummary(data.summary);
    } catch {
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, debouncedSearch]);

  const statCards = [
    {
      label: 'Total Revenue',
      value: `₹${(summary?.totalRevenue || 0).toFixed(2)}`,
      icon: IndianRupee,
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
    {
      label: 'Total Orders',
      value: summary?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    {
      label: 'Avg Order Value',
      value: `₹${(summary?.avgOrderValue || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-500',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
    },
  ];

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const currentOrders = orders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            Sales Report
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {summary
              ? `${new Date(summary.startDate).toLocaleDateString()} — ${new Date(summary.endDate).toLocaleDateString()}`
              : 'Loading...'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-1.5 inline-flex gap-1 shadow-sm border border-gray-100 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              filter === f.value
                ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, text }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <p className={`text-2xl font-bold ${text}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
            />
          </div>
          <p className="text-sm text-gray-500 ml-auto">
            {orders.length} order{orders.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {loading && orders.length === 0 ? (
          <div className="divide-y divide-gray-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-5 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No orders found</p>
            <p className="text-sm mt-1">Try a different filter or search term</p>
          </div>
        ) : (
          <div className={`divide-y divide-gray-50 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {currentOrders.map((order) => (
              <div key={order.id}>
                <div
                  className="p-5 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-orange-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{order.customerName}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {order.customerPhone && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.customerPhone}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">₹{Number(order.total).toFixed(2)}</p>
                        <p className="text-xs text-green-500 font-medium capitalize">{order.status}</p>
                      </div>
                      {expandedId === order.id
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </div>
                </div>

                {/* Expanded items */}
                {expandedId === order.id && (
                  <div className="px-5 pb-5 bg-orange-50/50">
                    <div className="ml-15 pl-4 border-l-2 border-orange-200">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Order Items</p>
                      <div className="space-y-1.5">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.name}
                              <span className="text-gray-400 ml-1">× {item.quantity}</span>
                            </span>
                            <span className="font-medium text-gray-800">₹{Number(item.total).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-orange-200 space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Subtotal</span>
                            <span>₹{Number(order.subtotal).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Tax</span>
                            <span>₹{Number(order.tax).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span className="text-orange-600">₹{Number(order.total).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, orders.length)} of {orders.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
