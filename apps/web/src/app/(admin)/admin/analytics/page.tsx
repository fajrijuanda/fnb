
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart3,
    TrendingUp,
    PieChart,
    CreditCard,
    ShoppingBag,
    Filter
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatCard } from '@/components/admin/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

// Colors for Pie Chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const { user } = useAuthStore();
    const [dateRange, setDateRange] = useState('30'); // '7', '30', 'this_month', 'last_month'
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Mitra Filter State
    const [mitraId, setMitraId] = useState<string>('');
    const [mitraList, setMitraList] = useState<{ id: number; username: string }[]>([]);

    // Fetch Mitra List (Superadmin Only)
    useEffect(() => {
        if (user?.role === 'superadmin') {
            api.get('/users/?role=mitra').then(res => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setMitraList((res.data as any).results || []);
            }).catch(console.error);
        }
    }, [user]);

    // Calculate dates based on range
    const getDates = useCallback(() => {
        const end = new Date();
        const start = new Date();

        if (dateRange === '7') {
            start.setDate(end.getDate() - 7);
        } else if (dateRange === '30') {
            start.setDate(end.getDate() - 30);
        } else if (dateRange === 'this_month') {
            start.setDate(1);
        } else if (dateRange === 'last_month') {
            start.setMonth(start.getMonth() - 1);
            start.setDate(1);
            end.setDate(0); // Last day of previous month
        } else if (dateRange === 'custom') {
            return { start: customStart, end: customEnd };
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }, [dateRange, customStart, customEnd]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { start, end } = getDates();
            if (!start || !end) return;

            let url = `/sales/orders/analytics-summary/?start=${start}&end=${end}`;
            if (mitraId) {
                url += `&mitra_id=${mitraId}`;
            }

            const res = await api.get(url);
            setData(res.data.data);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    }, [getDates, mitraId]);

    useEffect(() => {
        if (dateRange !== 'custom' || (customStart && customEnd)) {
            fetchData();
        }
    }, [fetchData, dateRange, customStart, customEnd]);

    if (loading && !data) {
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!data) return <div className="p-8 text-center text-gray-500">Gagal memuat data.</div>;

    const { summary, daily_sales, payment_methods, top_products } = data;

    return (
        <div className="space-y-6 animation-fade-in pb-10">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analitik Penjualan</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Visualisasi performa bisnis Anda</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Mitra Filter (Superadmin Only) */}
                    {user?.role === 'superadmin' && (
                        <div className="relative">
                            <select
                                value={mitraId}
                                onChange={(e) => setMitraId(e.target.value)}
                                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/50 appearance-none pr-8 cursor-pointer"
                            >
                                <option value="">Semua Mitra</option>
                                {mitraList.map(mitra => (
                                    <option key={mitra.id} value={mitra.id}>{mitra.username}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                        {['7', '30', 'this_month', 'last_month'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setDateRange(r)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === r
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                    }`}
                            >
                                {r === '7' ? '7 Hari' : r === '30' ? '30 Hari' : r === 'this_month' ? 'Bulan Ini' : 'Bulan Lalu'}
                            </button>
                        ))}
                        <div className="h-4 w-[1px] bg-gray-300 dark:bg-white/20 mx-1"></div>
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => { setCustomStart(e.target.value); setDateRange('custom'); }}
                            className="bg-transparent text-xs outline-none text-gray-700 dark:text-gray-300"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => { setCustomEnd(e.target.value); setDateRange('custom'); }}
                            className="bg-transparent text-xs outline-none text-gray-700 dark:text-gray-300"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Pendapatan"
                    value={formatCurrency(summary.total_revenue)}
                    icon={TrendingUp}
                    color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                />
                <StatCard
                    title="Total Transaksi"
                    value={summary.total_orders}
                    icon={ShoppingBag}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                />
                <StatCard
                    title="Rata-rata Transaksi"
                    value={formatCurrency(summary.average_order_value)}
                    icon={CreditCard}
                    color="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Sales Trend */}
                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" />
                        Tren Penjualan
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily_sales}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => new Date(val).getDate().toString()}
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickFormatter={(val) => `${val / 1000}k`}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#F3F4F6' }}
                                    formatter={(val: number | string | Array<number | string> | undefined) => formatCurrency(Number(val || 0))}
                                    labelFormatter={(label) => formatDate(label)}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total_sales"
                                    stroke="#dc2626"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-500" />
                        Produk Terlaris (Top 5)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={top_products.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="product__name"
                                    type="category"
                                    width={120}
                                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#F3F4F6' }}
                                    formatter={(val: number | string | Array<number | string> | undefined) => formatCurrency(Number(val || 0))}
                                />
                                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Payment Methods */}
                <div className="lg:col-span-1 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <PieChart size={20} className="text-orange-500" />
                        Metode Pembayaran
                    </h3>
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={payment_methods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                >
                                    {payment_methods.map((entry: { payment_method: string; total: number }, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(val: number | string | Array<number | string> | undefined) => formatCurrency(Number(val || 0))}
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#F3F4F6' }}
                                />
                                <Legend />
                            </RePieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-xs text-gray-500 block">Total</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{payment_methods.length} Tipe</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Table (Mini) */}
                <div className="lg:col-span-2 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Rincian Per Hari</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Tanggal</th>
                                    <th className="px-4 py-3">Transaksi</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Total Penjualan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...daily_sales].reverse().slice(0, 5).map((day: { date: string; total_orders: number; total_sales: number }) => (
                                    <tr key={day.date} className="bg-white dark:bg-white/5 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {formatDate(day.date)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {day.total_orders}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(day.total_sales)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
