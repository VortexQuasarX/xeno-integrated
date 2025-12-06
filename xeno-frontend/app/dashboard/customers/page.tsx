'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';

interface Customer {
    id: string;
    shopifyCustomerId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    totalSpent: string;
    ordersCount: number;
    currency: string;
    addresses?: string;
    orders?: {
        id: string;
        shopifyOrderId: string;
        totalPrice: number;
        orderDate: string;
        status: string;
        orderItems: {
            title: string;
            quantity: number;
            price: number;
        }[];
    }[];
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/');
                    return;
                }
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/customers`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCustomers(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching customers:', error);
                setLoading(false);
            }
        };
        fetchCustomers();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const filteredCustomers = customers.filter(c =>
        (c.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header
                    startDate="" endDate="" setStartDate={() => { }} setEndDate={() => { }} onLogout={handleLogout} onSearch={setSearchQuery}
                />
                <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            View and manage your customer base ({customers.length} total).
                        </p>
                    </div>

                    {loading ? (
                        <div className="min-h-[400px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCustomers.map((customer) => {
                                let addresses = [];
                                try {
                                    addresses = customer.addresses ? JSON.parse(customer.addresses) : [];
                                } catch (e) {
                                    addresses = [];
                                }
                                const primaryAddress = addresses.length > 0 ? addresses[0] : null;

                                return (
                                    <div
                                        key={customer.id}
                                        onClick={() => setSelectedCustomer(customer)}
                                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg group-hover:scale-110 transition-transform">
                                                    {(customer.firstName?.[0] || customer.email?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {customer.firstName} {customer.lastName}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {customer.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 border-t border-slate-100 pt-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Total Spent</span>
                                                <span className="font-semibold text-slate-900">
                                                    {customer.currency} {Number(customer.totalSpent).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Orders</span>
                                                <span className="font-semibold text-slate-900">{customer.ordersCount || customer.orders?.length || 0}</span>
                                            </div>
                                            {customer.phone && (
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {customer.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {(selectedCustomer.firstName?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</h2>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                            <UserIcon className="w-3 h-3" /> Customer
                                        </span>
                                        <span className="text-sm text-slate-500">{selectedCustomer.email}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
                        </div>

                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column: Stats & Products */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Lifetime Stats</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-slate-500">Total Spent</p>
                                            <p className="text-2xl font-bold text-emerald-600">${Number(selectedCustomer.totalSpent).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Total Orders</p>
                                            <p className="text-xl font-bold text-slate-900">{selectedCustomer.orders?.length || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Avg. Order Value</p>
                                            <p className="text-lg font-bold text-slate-700">
                                                ${(selectedCustomer.orders?.length ? Number(selectedCustomer.totalSpent) / selectedCustomer.orders.length : 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchased Products</h3>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-2">
                                        {/* Derived Unique Products */}
                                        {Array.from(new Set(selectedCustomer.orders?.flatMap(o => o.orderItems.map(i => i.title)) || [])).map((productName, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                                                <div className="h-8 w-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                    P{idx + 1}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 truncate">{productName}</span>
                                            </div>
                                        ))}
                                        {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) && (
                                            <p className="p-4 text-center text-sm text-slate-400">No products yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Order History */}
                            <div className="lg:col-span-2">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Order History</h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-50">
                                            {selectedCustomer.orders?.map(order => (
                                                <tr key={order.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">#{order.shopifyOrderId}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                            {order.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">${Number(order.totalPrice).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) && (
                                        <div className="p-8 text-center text-slate-400">No orders found.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
