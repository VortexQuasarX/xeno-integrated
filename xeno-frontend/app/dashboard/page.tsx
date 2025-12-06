'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import KPICards from '../../components/KPICards';
import RevenueChart from '../../components/RevenueChart';
import CustomersTable from '../../components/CustomersTable';
import ActivityFeed from '../../components/ActivityFeed';

interface OverviewData {
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    draftOrdersCount: number;
    confirmedOrdersCount: number;
}

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    totalSpent: string;
}

interface TrendData {
    date: string;
    revenue: number;
}

export default function Dashboard() {
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [trend, setTrend] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        const fetchData = async () => {
            try {
                // Mock Data Override for Demo User
                if (token === 'demo-token-bypass') {
                    setOverview({
                        totalCustomers: 128,
                        totalOrders: 45,
                        totalRevenue: 15430.50,
                        draftOrdersCount: 5,
                        confirmedOrdersCount: 40
                    });
                    setCustomers([
                        { id: '1', firstName: 'Russell', lastName: 'Wilson', email: 'russell@example.com', totalSpent: '1200.00' },
                        { id: '2', firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', totalSpent: '850.50' },
                        { id: '3', firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', totalSpent: '540.00' },
                        { id: '4', firstName: 'Emma', lastName: 'Davis', email: 'emma@example.com', totalSpent: '320.00' },
                        { id: '5', firstName: 'Michael', lastName: 'Brown', email: 'michael@example.com', totalSpent: '210.00' }
                    ]);

                    const mockTrend = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        mockTrend.push({
                            date: d.toISOString().split('T')[0],
                            revenue: Math.floor(Math.random() * 2000) + 500
                        });
                    }
                    setTrend(mockTrend);
                    setLoading(false);
                    return;
                }

                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { startDate, endDate },
                };

                const [overviewRes, customersRes, trendRes] = await Promise.all([
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/overview`, config),
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/customers/top`, config),
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/revenue-trend`, config),
                ]);

                setOverview(overviewRes.data);
                setCustomers(customersRes.data);
                setTrend(trendRes.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('token');
                    router.push('/');
                }
                setLoading(false);
            }
        };

        fetchData();
    }, [router, startDate, endDate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const filteredCustomers = customers.filter(c =>
        (c.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-sm font-medium text-slate-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />

            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    onLogout={handleLogout}
                    onSearch={setSearchQuery}
                />

                <main className="flex-1 py-8">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Track your store's performance and customer insights.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {/* KPI Cards */}
                            <KPICards data={overview} />

                            {/* Charts & Activity Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <RevenueChart data={trend} />
                                </div>
                                <div className="lg:col-span-1">
                                    <ActivityFeed searchQuery={searchQuery} />
                                </div>
                            </div>

                            {/* Tables */}
                            <div className="grid grid-cols-1 gap-8">
                                <CustomersTable customers={filteredCustomers} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
