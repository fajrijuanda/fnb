'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, X as XIcon, Activity, TrendingUp, UserCircle } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { AdminSearchHeader } from '@/components/admin/AdminSearchHeader';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { extractApiArray } from '@/lib/api-utils';
import { Subscription, ApiResponse } from '@/types/api';

export default function SubscriptionsPage() {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'superadmin';

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPlan, setFilterPlan] = useState<string>('all');

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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const filteredSubscriptions = subscriptions.filter(item => {
        const username = item.user_details?.username || '';
        const location = item.user_details?.location || '';
        const plan = item.plan_name || '';
        const q = searchQuery.toLowerCase();

        // Status filter
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;

        // Plan filter
        if (filterPlan !== 'all' && item.plan_name !== filterPlan) return false;

        return username.toLowerCase().includes(q) || location.toLowerCase().includes(q) || plan.toLowerCase().includes(q);
    });

    const paginatedSubscriptions = filteredSubscriptions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize, filterStatus, filterPlan]);

    const columns: Column<Subscription>[] = [
        {
            header: "Mitra",
            accessor: (item) => (
                <div className="flex items-center gap-2 lg:gap-3">
                    <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-gray-500 dark:text-white/70">
                        <UserCircle size={18} className="lg:w-5 lg:h-5" />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px] lg:max-w-none">
                        {item.user_details?.username || `User #${item.user}`}
                    </div>
                </div>
            )
        },
        {
            header: "Lokasi",
            accessor: (item) => item.user_details?.location || '-'
        },
        {
            header: "Paket",
            accessor: (item) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${item.plan_name === 'Eksklusif'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                    }`}>
                    {item.plan_name}
                </span>
            )
        },
        {
            header: "Status",
            accessor: (item) => (
                <div className="flex items-center gap-1.5">
                    {item.status === 'active' && <CheckCircle size={14} className="text-green-500" />}
                    {item.status === 'expired' && <XIcon size={14} className="text-red-500" />}
                    <span className={item.status === 'active' ? 'text-green-600' : 'text-red-500'}>
                        {item.status === 'active' ? 'Aktif' : 'Expired'}
                    </span>
                </div>
            )
        },
        {
            header: "Berakhir",
            accessor: (item) => calculateDaysRemaining(item.end_date)
        },
        {
            header: "Periode",
            accessor: (item) => (
                <span className="whitespace-nowrap">
                    {formatDate(item.start_date)} — {formatDate(item.end_date)}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <AdminHeader
                title={isSuperAdmin ? "Manajemen Langganan" : "Langganan Saya"}
                description={isSuperAdmin ? "Pantau dan kelola langganan mitra" : "Informasi paket langganan Anda"}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1a1a1a] p-4 lg:p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <div className="p-2 lg:p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            <Users size={24} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div>
                            <h3 className="text-xs md:text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">
                                {isSuperAdmin ? 'Total Mitra Aktif' : 'Status Langganan'}
                            </h3>
                            <p className="text-lg md:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                                {isLoading ? '...' : (isSuperAdmin ? subscriptions.filter(s => s.status === 'active').length : (subscriptions.length > 0 && subscriptions[0].status === 'active' ? 'Aktif' : 'Tidak Aktif'))}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] p-4 lg:p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <div className="p-2 lg:p-3 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                            <Activity size={24} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div>
                            <h3 className="text-xs md:text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">
                                {isSuperAdmin ? 'Langganan Baru' : 'Sisa Durasi'}
                            </h3>
                            <p className="text-lg md:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
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

                <div className="bg-white dark:bg-[#1a1a1a] p-4 lg:p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <div className="p-2 lg:p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                            <TrendingUp size={24} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div>
                            <h3 className="text-xs md:text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">
                                {isSuperAdmin ? 'Estimasi Pendapatan' : 'Biaya Langganan'}
                            </h3>
                            <p className="text-lg md:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                                {isLoading ? '...' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                                    isSuperAdmin ? 0 : 0
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Pagination Controls */}
            <AdminSearchHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari mitra, lokasi, paket..."
                extraActions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">Status</span>
                            <AdminSelect
                                value={filterStatus}
                                onChange={(val) => setFilterStatus(val as string)}
                                options={[
                                    { value: 'all', label: 'Semua' },
                                    { value: 'active', label: 'Aktif' },
                                    { value: 'expired', label: 'Expired' },
                                ]}
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">Paket</span>
                            <AdminSelect
                                value={filterPlan}
                                onChange={(val) => setFilterPlan(val as string)}
                                options={[
                                    { value: 'all', label: 'Semua' },
                                    { value: 'Eksekutif', label: 'Eksekutif' },
                                    { value: 'Eksklusif', label: 'Eksklusif' },
                                ]}
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <AdminSelect
                                value={pageSize}
                                onChange={(val) => setPageSize(val as number)}
                                options={[5, 10, 25, 50].map(size => ({ value: size, label: size.toString() }))}
                            />
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">Per Halaman</span>
                        </div>
                    </div>
                }
            />

            {/* Subscription Table */}
            <AdminDataTable
                data={paginatedSubscriptions}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="Belum ada data langganan."
                keyExtractor={(item) => item.id}
                mobileCardRender={(item) => (
                    <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <UserCircle size={24} className="text-gray-400" />
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{item.user_details?.username || `User #${item.user}`}</h3>
                                    <p className="text-[10px] text-gray-500">{item.user_details?.location || 'Tanpa lokasi'}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${item.plan_name === 'Eksklusif'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                                }`}>
                                {item.plan_name}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-gray-100 dark:border-white/5 pt-2">
                            <div className="flex items-center gap-1.5">
                                {item.status === 'active' && <CheckCircle size={12} className="text-green-500" />}
                                {item.status === 'expired' && <XIcon size={12} className="text-red-500" />}
                                <span className={item.status === 'active' ? 'text-green-600' : 'text-red-500'}>
                                    {item.status === 'active' ? 'Aktif' : 'Expired'}
                                </span>
                            </div>
                            <span className="text-gray-500">
                                {formatDate(item.start_date)} — {formatDate(item.end_date)}
                            </span>
                        </div>
                    </div>
                )}
            />

            {/* Pagination */}
            <AdminPagination
                currentPage={currentPage}
                totalItems={filteredSubscriptions.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
