'use client';

import { Search, Bell, Menu, Calendar, X, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

interface HeaderProps {
    startDate: string;
    endDate: string;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    onLogout: () => void;
    onSearch: (query: string) => void;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'order' | 'info';
}

export default function Header({ startDate, endDate, setStartDate, setEndDate, onLogout, onSearch }: HeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Fetch notifications on mount
    useState(() => {
        const fetchNotifications = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/dashboard/notifications', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setNotifications(res.data);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };
        fetchNotifications();
    });

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await axios.post('http://localhost:5000/api/dashboard/sync', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert(res.data.message); // Show proof of data count
            window.location.reload();
        } catch (error) {
            console.error('Sync failed', error);
            alert('Sync failed - check console');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
                {/* Search Bar */}
                <div className="flex-1 max-w-lg hidden lg:block">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                            placeholder="Global search..."
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Sync Button */}
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`p-2 text-slate-400 hover:text-indigo-600 transition-colors ${isSyncing ? 'animate-spin text-indigo-600' : ''}`}
                        title="Sync Data"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>

                    {/* Date Range Picker */}
                    <div className="hidden md:flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <button
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setStartDate(today);
                                setEndDate(today);
                            }}
                            className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors mr-2"
                        >
                            Today
                        </button>
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-sm text-slate-600 focus:outline-none font-medium"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-sm text-slate-600 focus:outline-none font-medium"
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3 text-slate-500" />
                            </button>
                        )}
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative"
                        >
                            <Bell className="h-6 w-6" />
                            {notifications.length > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-slate-500">No new notifications</div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div key={n.id} className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                                                <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                                                <p className="text-xs text-slate-400 mt-1 text-right">{new Date(n.time).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors"
                        >
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold border border-indigo-200">
                                JD
                            </div>
                            <div className="hidden text-left md:block">
                                <p className="text-sm font-semibold text-slate-700">John Doe</p>
                                <p className="text-xs text-slate-500">Admin</p>
                            </div>
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={onLogout}
                                    className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
