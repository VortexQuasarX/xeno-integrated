'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    Package,
    Settings,
    LogOut
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Products', href: '/dashboard/products', icon: Package },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [storeName, setStoreName] = useState('Loading...');
    const [initials, setInitials] = useState('...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const user = response.data;
                    const name = user.tenant?.name || 'My Store';
                    setStoreName(name);

                    // Calculate initials from store name
                    const words = name.split(' ');
                    const init = words.length > 1
                        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
                        : name.substring(0, 2).toUpperCase();
                    setInitials(init);
                }
            } catch (error) {
                console.error('Error fetching sidebar profile:', error);
                setStoreName('My Store');
                setInitials('MS');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
                <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 rounded-lg">
                            <LayoutDashboard className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900">Xeno</span>
                    </div>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                    <nav className="mt-5 flex-1 space-y-1 px-3">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                                >
                                    <item.icon
                                        className={`
                      mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                      ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}
                    `}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex flex-shrink-0 border-t border-slate-200 p-4">
                    <a href="https://demo-store.myshopify.com" target="_blank" rel="noopener noreferrer" className="group block w-full flex-shrink-0">
                        <div className="flex items-center">
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                                {initials}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                    {loading ? 'Loading...' : storeName}
                                </p>
                                <p className="text-xs font-medium text-slate-500 group-hover:text-indigo-600">View Store</p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
