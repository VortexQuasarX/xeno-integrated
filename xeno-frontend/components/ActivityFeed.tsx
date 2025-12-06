'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, UserPlus, Clock, Package, Star } from 'lucide-react';
import axios from 'axios';

interface ActivityItem {
    id: string;
    type: 'ORDER_PLACED' | 'NEW_CUSTOMER' | 'TOP_PRODUCT';
    message: string;
    amount?: number;
    date: string;
    image?: string;
}

interface ActivityFeedProps {
    searchQuery?: string;
}

export default function ActivityFeed({ searchQuery = '' }: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('Recent Activity');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                // 1. Try fetching Recent Activity
                const activityRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/events`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (activityRes.data && activityRes.data.length > 0) {
                    setActivities(activityRes.data);
                    setTitle('Recent Activity');
                } else {
                    // 2. Fallback: Fetch Top Selling Products
                    // We can reuse the products endpoint or create a specific one. Using products list for now.
                    const productsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/products`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    // Sort by inventory or just take first 5 for "Featured"
                    const featured = productsRes.data.slice(0, 5).map((p: any) => ({
                        id: `prod_${p.id}`,
                        type: 'TOP_PRODUCT',
                        message: `Best Seller: ${p.title} ($${p.price})`,
                        amount: p.price,
                        date: new Date().toISOString(),
                        image: p.image
                    }));

                    setActivities(featured);
                    setTitle('Featured Products');
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredActivities = activities.filter(item => {
        if (!searchQuery) return true;
        return item.message.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (loading) {
        return (
            <div className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-xl p-6 h-full">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-slate-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-xl p-6 h-[380px] flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex-shrink-0">{title}</h2>
            <div className="flow-root overflow-y-auto pr-2 custom-scrollbar flex-1">
                <ul role="list" className="-mb-8">
                    {filteredActivities.map((item, idx) => {
                        let Icon = Clock;
                        let iconBg = 'bg-gray-100';

                        switch (item.type) {
                            case 'ORDER_PLACED':
                                Icon = ShoppingCart;
                                iconBg = 'bg-green-100';
                                break;
                            case 'NEW_CUSTOMER':
                                Icon = UserPlus;
                                iconBg = 'bg-blue-100';
                                break;
                            case 'TOP_PRODUCT':
                                Icon = Star;
                                iconBg = 'bg-yellow-100';
                                break;
                        }

                        return (
                            <li key={item.id}>
                                <div className="relative pb-8">
                                    {idx !== filteredActivities.length - 1 ? (
                                        <span
                                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            {item.image ? (
                                                <img src={item.image} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white" />
                                            ) : (
                                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${iconBg}`}>
                                                    <Icon className="h-4 w-4 text-slate-600" aria-hidden="true" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <div>
                                                <p className="text-sm text-slate-500">
                                                    {item.message}
                                                </p>
                                            </div>
                                            {item.type !== 'TOP_PRODUCT' && (
                                                <div className="whitespace-nowrap text-right text-sm text-slate-500">
                                                    <time dateTime={item.date}>
                                                        {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </time>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                    {filteredActivities.length === 0 && (
                        <li className="text-sm text-slate-500 text-center py-4">
                            No data available.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
