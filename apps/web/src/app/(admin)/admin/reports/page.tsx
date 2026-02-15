'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    PieChart,
    Lock,
    Phone,
    Receipt,
    Loader2,
    Ghost,
    Printer,
    LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OrderResponse, ApiResponse, PaginatedData, WrappedResponse } from '@/types/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';

type TabType = 'sales' | 'profit_loss' | 'stock';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('sales');
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fetch Orders for Sales Report
    useEffect(() => {
        if (activeTab === 'sales') {
            fetchOrders();
        }
        setCurrentPage(1);
    }, [activeTab, pageSize]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<ApiResponse<OrderResponse[]>>('/sales/orders/');
            const resData = response.data;
            if (Array.isArray(resData)) {
                setOrders(resData);
            } else if ('results' in resData) {
                setOrders((resData as PaginatedData<OrderResponse[]>).results);
            } else if ('data' in resData) {
                const innerData = (resData as WrappedResponse<OrderResponse[]>).data;
                if (Array.isArray(innerData)) {
                    setOrders(innerData);
                } else if ('results' in innerData) {
                    setOrders(innerData.results);
                }
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate Summary Stats
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalTransactions = orders.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Sub-components
    const TabButton = ({ value, label, icon: Icon }: { value: TabType, label: string, icon: LucideIcon }) => (
        <button
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-all font-medium text-xs lg:text-base ${activeTab === value
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
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
                        <div className="p-1.5 md:p-2 lg:p-3 rounded-lg lg:rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
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

            {/* Transactions Table - Desktop */}
            <div className="hidden md:block bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">Riwayat Transaksi</h3>
                    <div className="flex items-center gap-2">
                        <AdminSelect
                            value={pageSize}
                            onChange={(val) => setPageSize(val as number)}
                            options={[5, 10, 25, 50].map(size => ({ value: size, label: size.toString() }))}
                        />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Per Halaman</span>
                    </div>
                </div>

                <table className="w-full text-xs lg:text-base">
                    <thead>
                        <tr className="bg-orange-500/10 dark:bg-white/5 text-left text-xs lg:text-sm">
                            <th className="px-3 lg:px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Invoice</th>
                            <th className="px-3 lg:px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Waktu</th>
                            <th className="px-3 lg:px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Metode</th>
                            <th className="px-3 lg:px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Total</th>
                            <th className="px-3 lg:px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                            <th className="px-3 lg:px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Memuat data transaksi...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <Ghost className="h-8 w-8 opacity-50" />
                                        <p>Belum ada data penjualan hari ini</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            orders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((order) => (
                                <tr key={order.id} className="hover:bg-orange-50 dark:hover:bg-white/5 transition-colors text-xs lg:text-sm">
                                    <td className="px-3 lg:px-4 py-2">
                                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                                            {order.invoice_number}
                                        </span>
                                    </td>
                                    <td className="px-3 lg:px-4 py-2 text-gray-600 dark:text-gray-300">
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td className="px-3 lg:px-4 py-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${order.payment_method === 'QRIS'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                            : order.payment_method === 'TRANSFER'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                            {order.payment_method}
                                        </span>
                                    </td>
                                    <td className="px-3 lg:px-4 py-2 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                        {formatCurrency(order.total_amount)}
                                    </td>
                                    <td className="px-3 lg:px-4 py-2">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" />
                                            {order.status_display}
                                        </span>
                                    </td>
                                    <td className="px-3 lg:px-4 py-2 text-right">
                                        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                            <Printer size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6">
                <AdminPagination
                    currentPage={currentPage}
                    totalItems={orders.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Transactions Cards - Mobile */}
            <div className="md:hidden space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Riwayat Transaksi</h3>
                    <button className="text-xs text-orange-600 dark:text-orange-400 hover:underline">
                        Lihat Semua
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center gap-2 py-8 text-gray-500 dark:text-gray-400">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">Memuat...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-gray-500 dark:text-gray-400">
                        <Ghost className="h-6 w-6 opacity-50" />
                        <p className="text-sm">Belum ada data penjualan</p>
                    </div>
                ) : (
                    orders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((order) => (
                        <div key={order.id} className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-mono font-medium text-sm text-gray-900 dark:text-white">
                                        {order.invoice_number}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
                                    <div className="w-1 h-1 rounded-full bg-green-600 dark:bg-green-400" />
                                    {order.status_display}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${order.payment_method === 'QRIS'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                        : order.payment_method === 'TRANSFER'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        }`}>
                                        {order.payment_method}
                                    </span>
                                </div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white">
                                    {formatCurrency(order.total_amount)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const LockedView = () => (
        <div className="relative min-h-[500px]">
            {/* Blurred Dummy Content */}
            <div className="filter blur-md pointer-events-none select-none opacity-40">
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="h-40 bg-white dark:bg-white/5 rounded-2xl p-6" />
                    <div className="h-40 bg-white dark:bg-white/5 rounded-2xl p-6" />
                </div>
                <div className="h-96 bg-white dark:bg-white/5 rounded-2xl p-6" />
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <div className="relative max-w-lg w-full bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-8 text-center shadow-2xl animation-scale-in">
                    {/* Decorative Background Glow */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6">
                            <Lock className="h-10 w-10 text-white" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Fitur Laporan Premium 🔒
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            Fitur <span className="font-semibold text-orange-600 dark:text-orange-400">
                                {activeTab === 'profit_loss' ? 'Analisa Laba Rugi' : 'Analisa Stok'}
                            </span> hanya tersedia untuk pengguna Premium.
                            Dapatkan wawasan mendalam tentang keuntungan bisnis dan perputaran stok Anda secara real-time.
                        </p>

                        <div className="flex flex-col w-full gap-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                Hubungi Developer untuk Upgrade:
                            </p>
                            <Link
                                href="https://wa.me/6285217861296?text=Halo%2C%20saya%20tertarik%20upgrade%20fitur%20Laporan%20Premium%20CloudPOS."
                                target="_blank"
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Phone size={24} />
                                <span>Hubungi via WhatsApp</span>
                            </Link>

                            <div className="mt-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/10">
                                <p className="text-xs font-mono text-orange-600 dark:text-orange-400">
                                    Developer Contact: 0852-1786-1296
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Laporan & Analitik</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pantau performa bisnis dan penjualan Anda</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 lg:gap-3">
                <TabButton value="sales" label="Laporan Penjualan" icon={TrendingUp} />
                <TabButton value="profit_loss" label="Laba Rugi" icon={PieChart} />
                <TabButton value="stock" label="Analisa Stok" icon={BarChart3} />
            </div>

            {/* Content Area */}
            {activeTab === 'sales' ? <SalesView /> : <LockedView />}
        </div>
    );
}
