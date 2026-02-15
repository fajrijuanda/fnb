'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, MoreHorizontal, CheckCircle, X as XIcon, Activity, TrendingUp } from 'lucide-react';
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

    // Generic View for both Admin and Mitra (API handles filtering)
    return (
        <div className="space-y-6">
            <AdminHeader
                title={isSuperAdmin ? "Manajemen Langganan" : "Langganan Saya"}
                description={isSuperAdmin ? "Pantau dan kelola langganan mitra" : "Informasi paket langganan Anda"}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {isSuperAdmin ? 'Total Mitra Aktif' : 'Status Langganan'}
                            </h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isLoading ? '...' : (isSuperAdmin ? subscriptions.filter(s => s.status === 'active').length : (subscriptions.length > 0 && subscriptions[0].status === 'active' ? 'Aktif' : 'Tidak Aktif'))}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {isSuperAdmin ? 'Langganan Baru' : 'Sisa Durasi'}
                            </h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isLoading ? '...' : (isSuperAdmin ? subscriptions.filter(s => {
                                    const date = new Date(s.start_date);
                                    const now = new Date();
                                    const diffTime = Math.abs(now.getTime() - date.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    return diffDays <= 30;
                                }).length : (subscriptions.length > 0 ? calculateDaysRemaining(subscriptions[0].end_date) : '-'))}
                            </p>
                            {isSuperAdmin && <span className="text-xs text-green-500">+ Bulan ini</span>}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {isSuperAdmin ? 'Estimasi Pendapatan' : 'Biaya Langganan'}
                            </h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isLoading ? '...' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                                    isSuperAdmin ? subscriptions.reduce((acc, curr) => {
                                        const price = curr.plan_name === 'Eksklusif' ? 299000 : (curr.plan_name === 'Eksekutif' ? 199000 : 0);
                                        return acc + price;
                                    }, 0) : (subscriptions.length > 0 && subscriptions[0].plan_name === 'Eksklusif' ? 299000 : (subscriptions.length > 0 && subscriptions[0].plan_name === 'Eksekutif' ? 199000 : 0))
                                )}
                            </p>
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
                                            {item.user_details?.profile?.location || '-'}
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
                                            {isSuperAdmin && (
                                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            )}
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


