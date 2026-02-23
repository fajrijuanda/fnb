'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart3,
    TrendingUp,
    PieChart,
    Lock,
    Phone,
    Receipt,
    Package,
    Clock
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OrderResponse, ApiResponse, StockLog } from '@/types/api';
import { extractApiArray } from '@/lib/api-utils';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { StatCard } from '@/components/admin/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import AnalyticsPage from '../analytics/page';

type TabType = 'sales' | 'profit_loss' | 'stock' | 'analytics';

export default function ReportsPage() {
    const { user } = useAuthStore();
    const isUnlocked = user?.role === 'superadmin' || user?.is_subscribed;

    const [activeTab, setActiveTab] = useState<TabType>('sales');
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Filter State — Sales
    const [salesFilterStatus, setSalesFilterStatus] = useState<string>('all');
    const [salesFilterMethod, setSalesFilterMethod] = useState<string>('all');

    // Filter State — Stock
    const [stockFilterType, setStockFilterType] = useState<string>('all');

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

    // Reset filters and page when switching tabs
    useEffect(() => {
        setCurrentPage(1);
        setSalesFilterStatus('all');
        setSalesFilterMethod('all');
        setStockFilterType('all');
    }, [activeTab]);

    // Filtered data
    const filteredOrders = orders.filter(order => {
        if (salesFilterStatus !== 'all' && order.status !== salesFilterStatus) return false;
        if (salesFilterMethod !== 'all' && order.payment_method !== salesFilterMethod) return false;
        return true;
    });

    const filteredStockLogs = stockLogs.filter(log => {
        if (stockFilterType !== 'all' && log.movement_type !== stockFilterType) return false;
        return true;
    });

    // Summary Stats
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalTransactions = filteredOrders.length;
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

    const SalesView = () => {
        const salesColumns: Column<OrderResponse>[] = [
            {
                header: 'Invoice',
                accessor: (item) => <span className="font-medium text-gray-900 dark:text-white">{item.invoice_number}</span>
            },
            {
                header: 'Waktu',
                accessor: (item) => <span className="text-gray-500">{formatDate(item.created_at)}</span>
            },
            {
                header: 'Total',
                accessor: (item) => <span className="font-mono">{formatCurrency(item.total_amount)}</span>
            },
            {
                header: 'Status',
                accessor: (item) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                        {item.status_display}
                    </span>
                )
            }
        ];

        return (
            <div className="space-y-4 lg:space-y-6 animation-fade-in">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                    <StatCard
                        title="Total Pendapatan"
                        value={formatCurrency(totalRevenue)}
                        icon={TrendingUp}
                        color="bg-red-100 text-red-700 dark:bg-primary/20 dark:text-red-500"
                    />
                    <StatCard
                        title="Total Transaksi"
                        value={totalTransactions}
                        icon={Receipt}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                    />
                    <StatCard
                        title="Rata-rata Order"
                        value={formatCurrency(averageOrderValue)}
                        icon={BarChart3}
                        color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                    />
                </div>

                {/* Transactions Table */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">Riwayat Transaksi</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <AdminSelect
                                    value={salesFilterStatus}
                                    onChange={(val) => { setSalesFilterStatus(val as string); setCurrentPage(1); }}
                                    options={[
                                        { value: 'all', label: 'Semua Status' },
                                        { value: 'PAID', label: 'Lunas' },
                                        { value: 'PENDING', label: 'Pending' },
                                        { value: 'CANCELLED', label: 'Batal' },
                                    ]}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <AdminSelect
                                    value={salesFilterMethod}
                                    onChange={(val) => { setSalesFilterMethod(val as string); setCurrentPage(1); }}
                                    options={[
                                        { value: 'all', label: 'Semua Metode' },
                                        { value: 'CASH', label: 'Cash' },
                                        { value: 'QRIS', label: 'QRIS' },
                                        { value: 'TRANSFER', label: 'Transfer' },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    <AdminDataTable
                        data={filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                        columns={salesColumns}
                        isLoading={isLoading}
                        emptyMessage="Tidak ada data transaksi."
                        keyExtractor={(item) => item.id}
                        mobileCardRender={(order) => (
                            <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{order.invoice_number}</div>
                                        <div className="text-xs text-gray-500">{formatDate(order.created_at)}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${order.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                        {order.status_display}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100 dark:border-white/5">
                                    <span className="text-gray-500">Total</span>
                                    <span className="font-bold font-mono">{formatCurrency(order.total_amount)}</span>
                                </div>
                            </div>
                        )}
                    />

                    {filteredOrders.length > pageSize && (
                        <AdminPagination currentPage={currentPage} totalItems={filteredOrders.length} pageSize={pageSize} onPageChange={setCurrentPage} />
                    )}
                </div>
            </div>
        );
    };

    const StockView = () => {
        const stockColumns: Column<StockLog>[] = [
            {
                header: 'Bahan / Produk',
                accessor: (item) => <span className="font-medium text-gray-900 dark:text-white">{item.ingredient_name || item.product_name || '-'}</span>
            },
            {
                header: 'Jenis',
                accessor: (item) => (
                    <span className={`px-2 py-1 rounded-xs font-bold text-[10px] ${item.movement_type === 'IN' ? 'text-green-600 bg-green-100 dark:bg-green-500/20 dark:text-green-400' :
                        item.movement_type === 'OUT' ? 'text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400' :
                            'text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                        {item.movement_type}
                    </span>
                )
            },
            {
                header: 'Jumlah',
                accessor: (item) => (
                    <span className={`font-bold ${item.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change_amount > 0 ? '+' : ''}{item.change_amount}
                    </span>
                )
            },
            {
                header: 'Stok Akhir',
                accessor: (item) => <span className="font-mono text-gray-600 dark:text-gray-400">{item.final_stock}</span>
            },
            {
                header: 'Waktu',
                accessor: (item) => <span className="text-gray-500 text-xs">{formatDate(item.created_at)}</span>
            }
        ];

        return (
            <div className="space-y-6 animation-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard
                        title="Total Perpindahan Stok"
                        value={stockLogs.length}
                        icon={Package}
                        color="bg-primary/10 text-primary dark:text-white"
                        trend="Aktivitas tercatat"
                    />
                    <StatCard
                        title="Perubahan Terakhir"
                        value={stockLogs.length > 0 ? formatDate(stockLogs[0].created_at) : '-'}
                        icon={Clock}
                        color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-white"
                    />
                </div>

                {/* Stock Table */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                        <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">Riwayat Mutasi Stok</h3>
                        <div className="flex items-center gap-3">
                            <AdminSelect
                                value={stockFilterType}
                                onChange={(val) => { setStockFilterType(val as string); setCurrentPage(1); }}
                                options={[
                                    { value: 'all', label: 'Semua Jenis' },
                                    { value: 'IN', label: 'Masuk' },
                                    { value: 'OUT', label: 'Keluar' },
                                    { value: 'ADJUSTMENT', label: 'Adjustment' },
                                ]}
                            />
                        </div>
                    </div>

                    <AdminDataTable
                        data={filteredStockLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                        columns={stockColumns}
                        isLoading={isLoading}
                        emptyMessage="Belum ada data mutasi."
                        keyExtractor={(item) => item.id}
                        mobileCardRender={(log) => (
                            <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{log.ingredient_name || log.product_name || '-'}</div>
                                        <div className="text-xs text-gray-500">{formatDate(log.created_at)}</div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${log.movement_type === 'IN' ? 'text-green-600 bg-green-100' :
                                        log.movement_type === 'OUT' ? 'text-blue-600 bg-blue-100' :
                                            'text-red-600 bg-red-100'
                                        }`}>
                                        {log.movement_type}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className={`${log.change_amount > 0 ? 'text-green-600' : 'text-red-600'} font-bold`}>
                                        {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                                    </span>
                                    <span className="text-gray-500 text-xs">Sisa: {log.final_stock}</span>
                                </div>
                            </div>
                        )}
                    />

                    {filteredStockLogs.length > pageSize && (
                        <AdminPagination currentPage={currentPage} totalItems={filteredStockLogs.length} pageSize={pageSize} onPageChange={setCurrentPage} />
                    )}
                </div>
            </div>
        );
    };

    const ProfitLossView = () => {
        const [plData, setPlData] = useState<{
            period: { start: string; end: string };
            revenue: number;
            cogs: number;
            gross_profit: number;
            expenses: number;
            net_profit: number;
            gross_margin: number;
            net_margin: number;
            product_breakdown: {
                product: string;
                qty: number;
                revenue: number;
                cogs: number;
                profit: number;
                margin_pct: number;
            }[];
            expense_breakdown: { category: string; total: number }[];
        } | null>(null);
        const [plLoading, setPlLoading] = useState(true);
        const [plStart, setPlStart] = useState(() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        });
        const [plEnd, setPlEnd] = useState(() => {
            return new Date().toISOString().split('T')[0];
        });

        const fetchPL = useCallback(async () => {
            setPlLoading(true);
            try {
                const res = await api.get(`/sales/orders/profit-loss/?start=${plStart}&end=${plEnd}`);
                setPlData(res.data?.data || res.data);
            } catch (err) {
                console.error('Failed to fetch P/L:', err);
                setPlData(null);
            } finally {
                setPlLoading(false);
            }
        }, [plStart, plEnd]);

        useEffect(() => {
            fetchPL();
        }, [fetchPL]);

        if (plLoading) {
            return (
                <div className="flex items-center justify-center py-16 animation-fade-in">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (!plData) {
            return (
                <div className="text-center py-12 text-gray-500 animation-fade-in">
                    Gagal memuat data laba rugi.
                </div>
            );
        }

        const isProfit = plData.net_profit >= 0;
        const isGrossProfit = plData.gross_profit >= 0;

        return (
            <div className="space-y-4 lg:space-y-6 animation-fade-in">

                {/* Date Range Filter */}
                <div className="flex flex-wrap items-center gap-3 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 lg:p-4">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Periode:</span>
                    <input
                        type="date"
                        value={plStart}
                        onChange={(e) => setPlStart(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-xs text-gray-400">—</span>
                    <input
                        type="date"
                        value={plEnd}
                        onChange={(e) => setPlEnd(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                    {/* Revenue */}
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 md:p-4 rounded-xl">
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Pendapatan</p>
                        <p className="text-sm md:text-base lg:text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">{formatCurrency(plData.revenue)}</p>
                    </div>
                    {/* COGS */}
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 md:p-4 rounded-xl">
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">HPP (Bahan)</p>
                        <p className="text-sm md:text-base lg:text-lg font-bold text-red-600 dark:text-red-400 mt-1 truncate">- {formatCurrency(plData.cogs)}</p>
                    </div>
                    {/* Gross Profit */}
                    <div className={`backdrop-blur-xl border p-3 md:p-4 rounded-xl ${isGrossProfit ? 'bg-green-50/50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20' : 'bg-red-50/50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Laba Kotor</p>
                        <p className={`text-sm md:text-base lg:text-lg font-bold mt-1 truncate ${isGrossProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(plData.gross_profit)}
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal ml-1">({plData.gross_margin}%)</span>
                        </p>
                    </div>
                    {/* Expenses */}
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-3 md:p-4 rounded-xl">
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Pengeluaran</p>
                        <p className="text-sm md:text-base lg:text-lg font-bold text-orange-600 dark:text-orange-400 mt-1 truncate">- {formatCurrency(plData.expenses)}</p>
                    </div>
                    {/* Net Profit */}
                    <div className={`col-span-2 md:col-span-1 backdrop-blur-xl border p-3 md:p-4 rounded-xl ${isProfit ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50/50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">Laba Bersih</p>
                        <p className={`text-sm md:text-base lg:text-xl font-bold mt-1 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(plData.net_profit)}
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal ml-1">({plData.net_margin}%)</span>
                        </p>
                    </div>
                </div>

                {/* Product Breakdown Table */}
                {plData.product_breakdown.length > 0 && (
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-white/10">
                            <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white">📊 Breakdown per Produk</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Laba kotor per produk berdasarkan resep bahan baku</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs lg:text-sm">
                                <thead>
                                    <tr className="bg-primary/10 dark:bg-white/5 text-left">
                                        <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">Produk</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 text-center">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 text-right">Pendapatan</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 text-right">HPP</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 text-right">Laba</th>
                                        <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 text-right">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {plData.product_breakdown.map((item) => (
                                        <tr key={item.product} className="hover:bg-red-50/50 dark:hover:bg-white/5">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.product}</td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{item.qty}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(item.revenue)}</td>
                                            <td className="px-4 py-3 text-right text-red-500">{formatCurrency(item.cogs)}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${item.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {formatCurrency(item.profit)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.margin_pct >= 50 ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                                    item.margin_pct >= 30 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                                    }`}>
                                                    {item.margin_pct}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Expense Breakdown */}
                {plData.expense_breakdown.length > 0 && (
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 md:p-6">
                        <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white mb-4">💸 Breakdown Pengeluaran</h3>
                        <div className="space-y-3">
                            {plData.expense_breakdown.map((exp) => {
                                const pct = plData.expenses > 0 ? (exp.total / plData.expenses * 100) : 0;
                                return (
                                    <div key={exp.category}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{exp.category.replace(/_/g, ' ')}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(exp.total)} ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hint if no data */}
                {plData.revenue === 0 && plData.cogs === 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 text-center">
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                            Belum ada transaksi di periode ini. Pastikan data resep dan harga bahan baku sudah diisi agar kalkulasi HPP akurat.
                        </p>
                    </div>
                )}
            </div>
        );
    };

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
                {user?.role !== 'superadmin' && (
                    <TabButton value="analytics" label="Analitik" icon={BarChart3} />
                )}
                <TabButton value="profit_loss" label="Laba Rugi" icon={PieChart} />
                <TabButton value="stock" label="Analisa Stok" icon={Package} />
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'sales' && <SalesView />}
                {activeTab === 'analytics' && <div className="mt-4"><AnalyticsPage /></div>}
                {activeTab === 'profit_loss' && (isUnlocked ? <ProfitLossView /> : <LockedView />)}
                {activeTab === 'stock' && (isUnlocked ? <StockView /> : <LockedView />)}
            </div>
        </div>
    );
}
