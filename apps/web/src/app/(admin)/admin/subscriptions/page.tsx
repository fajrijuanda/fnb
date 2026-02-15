'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Users, MoreHorizontal, CheckCircle, X as XIcon } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { extractApiArray } from '@/lib/api-utils';
import { Subscription, ApiResponse } from '@/types/api';

export default function SubscriptionsPage() {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'superadmin';

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubscriptions = useCallback(async () => {
        try {
            const response = await api.get<ApiResponse<Subscription[]>>('/subscriptions/');
            const data = extractApiArray(response.data);
            setSubscriptions(data);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const calculateDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Expired';
        return `${diffDays} Hari lagi`;
    };

    if (isSuperAdmin) {
        return (
            <div className="space-y-6">
                <AdminHeader
                    title="Manajemen Langganan"
                    description="Pantau dan kelola langganan mitra"
                />

                {/* Stats Cards - Simplified for now */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* ... (Keep existing stats or make dynamic later) ... */}
                    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Mitra Aktif</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{subscriptions.filter(s => s.status === 'active').length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Table */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Daftar Langganan</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Mitra</th>
                                    <th className="px-6 py-4">Lokasi</th>
                                    <th className="px-6 py-4">Paket</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Berakhir</th>
                                    <th className="px-6 py-4">Periode</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : subscriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            Belum ada data langganan.
                                        </td>
                                    </tr>
                                ) : (
                                    subscriptions.map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {item.user_details?.username || `User #${item.user}`}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                {item.user_details?.location || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${item.plan_name === 'Eksklusif'
                                                    ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30'
                                                    : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30'
                                                    }`}>
                                                    {item.plan_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {item.status === 'active' && <CheckCircle size={14} className="text-green-500" />}
                                                    {item.status === 'expired' && <XIcon size={14} className="text-red-500" />}
                                                    <span className={
                                                        item.status === 'active' ? 'text-green-600' : 'text-red-500'
                                                    }>{item.status === 'active' ? 'Aktif' : 'Expired'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{calculateDaysRemaining(item.end_date)}</td>
                                            <td className="px-6 py-4 font-medium text-gray-500">
                                                {item.start_date} - {item.end_date}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // Default view for Mitra (Pricing Plans)
    return (
        <div className="space-y-4 lg:space-y-6">
            <AdminHeader
                title="Langganan Saya"
                description="Kelola paket langganan dan tagihan Anda"
            />

            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                    <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-2xl shadow-primary/30">
                        <CreditCard className="h-12 w-12 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Segera Hadir
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
                    Fitur manajemen langganan sedang dalam pengembangan.
                    Nantikan pembaruan selanjutnya!
                </p>

                <div className="w-full max-w-md">
                    {[
                        {
                            title: 'Paket Lanjutan (Maintenance)',
                            price: 'Rp 200.000',
                            desc: 'Biaya langganan mulai Tahun ke-3',
                            features: ['Akses Penuh Sistem', 'Server & Database', 'Maintenance Rutin', 'Update Fitur Berkala']
                        },
                    ].map((plan) => (
                        <div
                            key={plan.title}
                            className="relative p-6 rounded-2xl border bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                        >
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{plan.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.desc}</p>
                            <p className="text-2xl font-bold text-primary mt-3">{plan.price}<span className="text-xs text-gray-400 font-normal">/bulan</span></p>
                            <ul className="mt-4 space-y-2">
                                {plan.features.map((f) => (
                                    <li key={f} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs text-center font-medium">
                                Tagihan ini baru akan aktif setelah periode gratis 2 tahun berakhir.
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


