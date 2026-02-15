'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart3,
    TrendingUp,
    PieChart,
    Lock,
    Phone,
    Receipt,
    LucideIcon,
    Package
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OrderResponse, ApiResponse, StockLog } from '@/types/api';
import { extractApiArray } from '@/lib/api-utils';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';
import { useAuthStore } from '@/store/useAuthStore';

type TabType = 'sales' | 'profit_loss' | 'stock';

export default function ReportsPage() {
    const { user } = useAuthStore();
    const isUnlocked = user?.role === 'superadmin' || user?.is_subscribed;

    const [activeTab, setActiveTab] = useState<TabType>('sales');
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fetch Data based on Tab
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'sales') {
                const response = await api.get<ApiResponse<OrderResponse[]>>('/sales/orders/');
                setOrders(extractApiArray(response.data));
            } else if (activeTab === 'stock' && isUnlocked) {
                const response = await api.get<ApiResponse<StockLog[]>>('/inventory/logs/?limit=100');
                setStockLogs(extractApiArray(response.data));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setOrders([]);
            setStockLogs([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, isUnlocked]);

    useEffect(() => {
        fetchData();
        setCurrentPage(1);
    }, [fetchData, pageSize]);

    // Summary Stats
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalTransactions = orders.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Components
    const TabButton = ({ value, label, icon: Icon }: { value: TabType, label: string, icon: LucideIcon }) => (
        <button
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-all font-medium text-xs lg:text-base ${activeTab === value
                ? 'bg-gradient-to-r from-primary to-red-700 text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
        >
            <Icon size={16} className="lg:w-[18px] lg:h-[18px]" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    const SalesView = () => (
        <div className="space-y-4 lg:space-y-6 animation-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 md:p-4 lg:p-6 rounded-xl lg:rounded-2xl">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <div className="p-1.5 md:p-2 lg:p-3 rounded-lg lg:rounded-xl bg-red-100 text-red-700 dark:bg-primary/20 dark:text-red-500">
                            <TrendingUp size={16} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</p>
                            <h3 className="text-sm md:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                {formatCurrency(totalRevenue)}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 md:p-4 lg:p-6 rounded-xl lg:rounded-2xl">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <div className="p-1.5 md:p-2 lg:p-3 rounded-lg lg:rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                            <Receipt size={16} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
                            <h3 className="text-sm md:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                                {totalTransactions}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 md:p-4 lg:p-6 rounded-xl lg:rounded-2xl">
                    <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                        <div className="p-1.5 md:p-2 lg:p-3 rounded-lg lg:rounded-xl bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                            <BarChart3 size={16} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 dark:text-gray-400">Rata-rata Order</p>
                            <h3 className="text-sm md:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                {formatCurrency(averageOrderValue)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">Riwayat Transaksi</h3>
                    <div className="flex items-center gap-2">
                        <AdminSelect
                            value={pageSize}
                            onChange={(val) => setPageSize(val as number)}
                            options={[5, 10, 25, 50].map(size => ({ value: size, label: size.toString() }))}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs lg:text-sm">
                        <thead>
                            <tr className="bg-primary/10 dark:bg-white/5 text-left">
                                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Invoice</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Waktu</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Total</th>
                                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-6 text-center">Memuat...</td></tr>
                            ) : orders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((order) => (
                                <tr key={order.id} className="hover:bg-red-50 dark:hover:bg-white/5">
                                    <td className="px-4 py-3 font-medium">{order.invoice_number}</td>
                                    <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                                    <td className="px-4 py-3">{formatCurrency(order.total_amount)}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            {order.status_display}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <AdminPagination currentPage={currentPage} totalItems={orders.length} pageSize={pageSize} onPageChange={setCurrentPage} />
        </div>
    );

    const StockView = () => (
        <div className="space-y-6 animation-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Total Perpindahan Stok</h3>
                    <p className="text-3xl font-bold text-primary">{stockLogs.length}</p>
                    <p className="text-sm text-gray-500">Aktivitas tercatat</p>
                </div>
                <div className="bg-white/50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Perubahan Terakhir</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {stockLogs.length > 0 ? formatDate(stockLogs[0].created_at) : '-'}
                    </p>
                </div>
            </div>

            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-white/10">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Riwayat Mutasi Stok</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs lg:text-sm text-left">
                        <thead className="bg-primary/10 dark:bg-white/5">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Bahan / Produk</th>
                                <th className="px-4 py-3 font-semibold">Jenis</th>
                                <th className="px-4 py-3 font-semibold">Jumlah</th>
                                <th className="px-4 py-3 font-semibold">Stok Akhir</th>
                                <th className="px-4 py-3 font-semibold">Waktu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-6 text-center">Memuat...</td></tr>
                            ) : stockLogs.length === 0 ? (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada data mutasi.</td></tr>
                            ) : (
                                stockLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((log) => (
                                    <tr key={log.id} className="hover:bg-red-50 dark:hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium">
                                            {log.ingredient_name || log.product_name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-xs font-bold text-xs ${log.movement_type === 'IN' ? 'text-green-600 bg-green-100' :
                                                log.movement_type === 'OUT' ? 'text-blue-600 bg-blue-100' :
                                                    'text-red-600 bg-red-100'
                                                }`}>
                                                {log.movement_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={log.change_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                                {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono">{log.final_stock}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatDate(log.created_at)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AdminPagination currentPage={currentPage} totalItems={stockLogs.length} pageSize={pageSize} onPageChange={setCurrentPage} />
        </div>
    );

    const ProfitLossView = () => (
        <div className="space-y-6 animation-fade-in text-center py-12">
            <div className="bg-white/50 dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 max-w-2xl mx-auto">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <PieChart size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analisa Laba Rugi</h2>
                <p className="text-gray-500 mb-6">Fitur ini menghitung selisih antara Pendapatan Penjualan dan Harga Pokok Penjualan (HPP) berdasarkan resep.</p>

                <div className="grid grid-cols-2 gap-4 text-left p-6 bg-gray-50 dark:bg-white/5 rounded-2xl mb-6">
                    <div>
                        <p className="text-sm text-gray-500">Pendapatan Kotor</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Estimasi Laba Bersih</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue * 0.4)} <span className="text-xs text-gray-400 font-normal">(Est. 40%)</span></p>
                    </div>
                </div>

                <p className="text-xs text-gray-400">
                    Catatan: Input Data Resep dan Data Pembelian Bahan Baku diperlukan untuk kalkulasi akurat.
                </p>
            </div>
        </div>
    );

    const LockedView = () => (
        <div className="relative min-h-[500px] flex items-center justify-center">
            <div className="absolute inset-0 filter blur-md bg-white/50 dark:bg-white/5 opacity-50 pointer-events-none" />
            <div className="relative z-10 max-w-lg w-full bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-8 text-center shadow-2xl">
                <div className="h-16 w-16 mx-auto rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 mb-6">
                    <Lock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Fitur Premium Terkunci</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Anda perlu berlangganan paket <span className="font-bold text-primary">Eksekutif</span> atau <span className="font-bold text-primary">Eksklusif</span> untuk mengakses laporan mendalam ini.
                </p>
                <Link
                    href="https://wa.me/6285217861296"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
                >
                    <Phone size={18} /> Hubungi Sales
                </Link>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 lg:space-y-6">
            <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Laporan & Analitik</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pantau performa bisnis dan penjualan Anda</p>
            </div>

            <div className="flex flex-wrap gap-2 lg:gap-3">
                <TabButton value="sales" label="Laporan Penjualan" icon={TrendingUp} />
                <TabButton value="profit_loss" label="Laba Rugi" icon={PieChart} />
                <TabButton value="stock" label="Analisa Stok" icon={Package} />
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'sales' && <SalesView />}
                {activeTab === 'profit_loss' && (isUnlocked ? <ProfitLossView /> : <LockedView />)}
                {activeTab === 'stock' && (isUnlocked ? <StockView /> : <LockedView />)}
            </div>
        </div>
    );
}
