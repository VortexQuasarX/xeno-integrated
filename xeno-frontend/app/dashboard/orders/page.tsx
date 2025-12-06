'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';

interface OrderItem {
    id: string;
    quantity: number;
    price: number | string;
    productId?: string;
    product: {
        title: string;
        shopifyProductId: string;
    };
    title?: string;
}

interface Order {
    id: string;
    shopifyOrderId: string;
    totalPrice: number;
    orderDate: string;
    status?: string;
    customer?: {
        firstName: string;
        lastName: string;
        email: string;
        totalSpent?: string | number;
        shopifyCustomerId?: string;
    };
    orderItems?: OrderItem[];
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    // Default to empty (all time)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/');
                    return;
                }
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/orders`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { startDate, endDate }
                });
                setOrders(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching orders:', error);
                setLoading(false);
            }
        };
        fetchOrders();
    }, [router, startDate, endDate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const filteredOrders = orders.filter(order =>
        order.shopifyOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.status?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    // Calcs for creative stats
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
                <Header
                    startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} onLogout={handleLogout} onSearch={setSearchQuery}
                />

                <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
                    {/* Creative Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Orders</h1>
                            <p className="mt-2 text-slate-500 text-lg">Manage and track your store's sales performance.</p>
                        </div>

                        {/* Quick Stats Ribbon */}
                        <div className="flex bg-white rounded-2xl shadow-sm p-2 ring-1 ring-slate-900/5 divide-x divide-slate-100">
                            <div className="px-6 py-2">
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Revenue</p>
                                <p className="text-xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="px-6 py-2">
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Orders</p>
                                <p className="text-xl font-bold text-indigo-600">{orders.length}</p>
                            </div>
                            <div className="px-6 py-2 hidden sm:block">
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Avg. Value</p>
                                <p className="text-xl font-bold text-slate-900">${avgOrderValue.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <p className="mt-4 text-slate-500 animate-pulse">Syncing your data...</p>
                        </div>
                    ) : (
                        <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden border border-slate-100">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/80 backdrop-blur">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-50">
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                    No orders found. Try adjusting the date range or clicking Sync.
                                                </td>
                                            </tr>
                                        ) : filteredOrders.map((order) => (
                                            <tr
                                                key={order.id}
                                                onClick={() => setSelectedOrder(order)}
                                                className="group hover:bg-indigo-50/30 cursor-pointer transition-all duration-200"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm group-hover:scale-105 transition-transform">
                                                            #{order.shopifyOrderId.slice(-2)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">#{order.shopifyOrderId}</p>
                                                            <p className="text-xs text-slate-400">Shopify ID</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {new Date(order.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    <p className="text-xs text-slate-400">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 mr-3 ring-2 ring-white">
                                                            {order.customer?.firstName?.[0] || 'G'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900">
                                                                {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest'}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{order.customer?.email || 'No email'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ring-1 ring-inset ${(order.status === 'paid' || order.status === 'financial_status')
                                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                                        : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${(order.status === 'paid' || order.status === 'financial_status') ? 'bg-emerald-500' : 'bg-amber-500'
                                                            }`}></span>
                                                        {order.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    <div className="flex -space-x-2 overflow-hidden">
                                                        {order.orderItems?.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] text-slate-600" title={item.title}>
                                                                {item.title?.[0]}
                                                            </div>
                                                        ))}
                                                        {order.orderItems && order.orderItems.length > 3 && (
                                                            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-50 flex items-center justify-center text-[10px] text-slate-500">
                                                                +{order.orderItems.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {(!order.orderItems || order.orderItems.length === 0) && <span className="text-xs italic text-slate-400">No items</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-bold text-slate-900">${Number(order.totalPrice).toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Order Details Modal (Enhanced) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ring-1 ring-slate-900/5" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-2xl font-bold text-slate-900">Order #{selectedOrder.shopifyOrderId}</h2>
                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md font-medium">#{selectedOrder.id.slice(0, 8)}</span>
                                </div>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <span>📅 {new Date(selectedOrder.orderDate).toLocaleString()}</span>
                                    <span>•</span>
                                    <span>💳 {selectedOrder.status}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white hover:shadow-sm transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                                {/* Left Content: Customer & Shipping (Simulated) */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Customer</h3>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                                                {selectedOrder.customer?.firstName?.[0] || 'G'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {selectedOrder.customer ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` : 'Guest Customer'}
                                                </p>
                                                <p className="text-xs text-slate-500 max-w-[150px] truncate" title={selectedOrder.customer?.email}>{selectedOrder.customer?.email}</p>
                                            </div>
                                        </div>
                                        {selectedOrder.customer && (
                                            <div className="text-xs text-slate-500 space-y-1">
                                                <p>Total Spent: <b>${selectedOrder.customer.totalSpent}</b></p>
                                                <p>ID: {selectedOrder.customer.shopifyCustomerId}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Placeholder for Location/Shipping */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Shipping To</h3>
                                        <p className="text-sm text-slate-700 italic">Address data synced from Shopify...</p>
                                    </div>
                                </div>

                                {/* Right Content: Items */}
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider flex items-center justify-between">
                                        <span>Order Items</span>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{selectedOrder.orderItems?.length || 0} Items</span>
                                    </h3>

                                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                                        {selectedOrder.orderItems?.map((item) => (
                                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                        📦
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{item.title}</p>
                                                        <p className="text-xs text-slate-500">SKU: {item.productId?.slice(0, 6) || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-slate-900">${Number(item.price).toFixed(2)}</p>
                                                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedOrder.orderItems || selectedOrder.orderItems.length === 0) && (
                                            <div className="p-8 text-center text-slate-400 italic">No items linked.</div>
                                        )}
                                    </div>

                                    {/* Totals */}
                                    <div className="mt-6 flex justify-end">
                                        <div className="w-64 space-y-3">
                                            <div className="flex justify-between text-sm text-slate-500">
                                                <span>Subtotal</span>
                                                <span>${Number(selectedOrder.totalPrice).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-500">
                                                <span>Shipping</span>
                                                <span>--</span>
                                            </div>
                                            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                                <span className="font-bold text-slate-900">Grand Total</span>
                                                <span className="font-bold text-xl text-indigo-600">${Number(selectedOrder.totalPrice).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
