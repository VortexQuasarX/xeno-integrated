'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { Bell, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function SettingsPage() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/');
                    return;
                }
                console.log('Fetching profile...');
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Profile fetched:', response.data);
                setFirstName(response.data.firstName || '');
                setLastName(response.data.lastName || '');
                setLoading(false);
            } catch (error) {
                console.error('Error fetching profile:', error);
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
                firstName,
                lastName
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Profile updated');
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header
                    startDate="" endDate="" setStartDate={() => { }} setEndDate={() => { }} onLogout={handleLogout} onSearch={() => { }}
                />
                <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">Loading settings...</div>
                    ) : (
                        <div className="space-y-6 max-w-4xl">
                            <div className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-slate-400" /> Account
                                </h2>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                    <div className="sm:col-span-3">
                                        <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-slate-900">First name</label>
                                        <div className="mt-2">
                                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-slate-900">Last name</label>
                                        <div className="mt-2">
                                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button onClick={handleSave} disabled={saving} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
