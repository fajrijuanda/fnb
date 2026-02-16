'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    ShoppingBag,
    TrendingUp,
    Receipt,
    Activity,
    Users,
    CreditCard,
    UserPlus
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { OrderResponse, ApiResponse, Product, User, Subscription } from '@/types/api';
import { StatCard } from '@/components/admin/StatCard';
import { AIInsightsCard } from '@/components/admin/ai/AIInsightsCard';
import { DashboardChart } from '@/components/admin/DashboardChart';
import { RecentTransactionsList } from '@/components/admin/RecentTransactionsList';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { extractApiArray } from '@/lib/api-utils';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'superadmin';

    // State for Mitra Dashboard
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        todayRevenue: 0,
        revenueTrend: ''
    });
    const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
    const [salesData, setSalesData] = useState<{ date: string; revenue: number }[]>([]);

    // State for SuperAdmin Dashboard
    const [adminStats, setAdminStats] = useState({
        totalUsers: 0,
        totalMitra: 0,
        activeSubs: 0,
        monthlyRevenue: 0
    });
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [userGrowthData, setUserGrowthData] = useState<{ date: string; value: number }[]>([]);
    const [adminTrends, setAdminTrends] = useState({ userTrend: '', mitraTrend: '', subsTrend: '', revTrend: '' });

    const fetchDashboardData = useCallback(async () => {
        try {
            if (isSuperAdmin) {
                // Fetch Users and Subscriptions for Superadmin
                const [usersRes, subsRes] = await Promise.all([
                    api.get<ApiResponse<User[]>>('/users/'),
                    api.get<ApiResponse<Subscription[]>>('/subscriptions/')
                ]);
                const users = extractApiArray(usersRes.data);
                const subs = extractApiArray(subsRes.data);

                const activeSubs = subs.filter(s => s.status === 'active').length;
                const monthlyRevenue = 0; // Free for first 2 years

                // Compute trends based on data joined in last 30 vs 30-60 days
                const now = new Date();
                const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
                const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(now.getDate() - 60);

                const usersThisMonth = users.filter(u => u.date_joined && new Date(u.date_joined) >= thirtyDaysAgo).length;
                const usersLastMonth = users.filter(u => {
                    if (!u.date_joined) return false;
                    const d = new Date(u.date_joined);
                    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
                }).length;

                const mitraThisMonth = users.filter(u => u.role === 'mitra' && u.date_joined && new Date(u.date_joined) >= thirtyDaysAgo).length;

                const subsThisMonth = subs.filter(s => s.status === 'active' && new Date(s.start_date) >= thirtyDaysAgo).length;

                const calcTrend = (current: number, previous: number) => {
                    if (previous > 0) {
                        const pct = Math.round(((current - previous) / previous) * 100);
                        return pct >= 0 ? `+${pct}%` : `${pct}%`;
                    }
                    return current > 0 ? `+${current} baru` : '';
                };

                setAdminTrends({
                    userTrend: calcTrend(usersThisMonth, usersLastMonth) || `${usersThisMonth} baru`,
                    mitraTrend: mitraThisMonth > 0 ? `+${mitraThisMonth} bulan ini` : 'Live',
                    subsTrend: subsThisMonth > 0 ? `+${subsThisMonth} bulan ini` : '',
                    revTrend: ''
                });

                // Compute User Growth Chart (last 7 days)
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                const growthData = last7Days.map(date => {
                    const dayUsers = users.filter(u => u.date_joined && u.date_joined.startsWith(date)).length;
                    return {
                        date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
                        value: dayUsers
                    };
                });
                setUserGrowthData(growthData);

                setAdminStats({
                    totalUsers: users.length,
                    totalMitra: users.filter(u => u.role === 'mitra').length,
                    activeSubs,
                    monthlyRevenue
                });
                setRecentUsers(users.slice(0, 2));
            } else {
                // Fetch Sales/Products for Mitra
                const [ordersRes, productsRes] = await Promise.all([
                    api.get<ApiResponse<OrderResponse[]>>('/sales/orders/'),
                    api.get<ApiResponse<Product[]>>('/catalog/products/')
                ]);

                const orders = extractApiArray(ordersRes.data);
                const products = extractApiArray(productsRes.data);

                // Calculate Stats
                const totalRevenue = orders.reduce((sum: number, o: OrderResponse) => sum + o.total_amount, 0);

                // Calculate Today's Revenue
                const today = new Date().toISOString().split('T')[0];
                const todayRevenue = orders
                    .filter(o => o.created_at.startsWith(today))
                    .reduce((sum: number, o: OrderResponse) => sum + o.total_amount, 0);

                // Prepare Chart Data (Last 7 Days)
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                const chartData = last7Days.map(date => {
                    const dayRevenue = orders
                        .filter(o => o.created_at.startsWith(date))
                        .reduce((sum: number, o: OrderResponse) => sum + o.total_amount, 0);
                    return {
                        date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
                        revenue: dayRevenue
                    };
                });

                // Calculate week-over-week trend
                const now = new Date();
                const thisWeekStart = new Date(now);
                thisWeekStart.setDate(now.getDate() - 7);
                const lastWeekStart = new Date(now);
                lastWeekStart.setDate(now.getDate() - 14);

                const thisWeekRevenue = orders
                    .filter(o => new Date(o.created_at) >= thisWeekStart)
                    .reduce((sum: number, o: OrderResponse) => sum + o.total_amount, 0);
                const lastWeekRevenue = orders
                    .filter(o => {
                        const d = new Date(o.created_at);
                        return d >= lastWeekStart && d < thisWeekStart;
                    })
                    .reduce((sum: number, o: OrderResponse) => sum + o.total_amount, 0);

                let revenueTrend = '';
                if (lastWeekRevenue > 0) {
                    const pctChange = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(0);
                    revenueTrend = Number(pctChange) >= 0 ? `+${pctChange}%` : `${pctChange}%`;
                } else if (thisWeekRevenue > 0) {
                    revenueTrend = 'Baru';
                }

                setStats({
                    totalRevenue,
                    totalOrders: orders.length,
                    totalProducts: products.length,
                    todayRevenue,
                    revenueTrend
                });
                setRecentOrders(orders.slice(0, 5)); // Take latest 5
                setSalesData(chartData);
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        const loadData = async () => {
            await fetchDashboardData();
        };
        loadData();
    }, [fetchDashboardData]);

    if (isSuperAdmin) {
        return (
            <div className="space-y-3 xl:space-y-4">
                <AdminHeader
                    title="Dashboard Superadmin"
                    description="Ringkasan pertumbuhan pengguna dan langganan."
                />

                {/* AI Insights */}
                <AIInsightsCard />

                {/* Superadmin Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xl:gap-4">
                    <StatCard
                        title="Total Pengguna"
                        value={adminStats.totalUsers}
                        icon={Users}
                        color="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-white"
                        trend={adminTrends.userTrend || undefined}
                    />
                    <StatCard
                        title="Mitra Aktif"
                        value={adminStats.totalMitra}
                        icon={UserPlus}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-white"
                        trend={adminTrends.mitraTrend || 'Live'}
                    />
                    <StatCard
                        title="Langganan Aktif"
                        value={adminStats.activeSubs}
                        icon={CreditCard}
                        color="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-white"
                        trend={adminTrends.subsTrend || undefined}
                    />
                    <StatCard
                        title="Estimasi Pendapatan"
                        value={formatCurrency(adminStats.monthlyRevenue)}
                        icon={TrendingUp}
                        color="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-white"
                        trend={adminTrends.revTrend || undefined}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xl:gap-4">
                    {/* Chart Section - User Growth (Mocked) */}
                    <div className="md:col-span-2">
                        <DashboardChart
                            data={userGrowthData}
                            title="Pertumbuhan Pengguna Baru (7 Hari)"
                            dataKey="value"
                            tooltipLabel="Pengguna Baru"
                            color="#8b5cf6"
                            valueFormatter={(val) => `${val}`}
                        />
                    </div>

                    {/* Recent Users List */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 xl:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white">Pengguna Terbaru</h3>
                            <a href="/admin/users" className="text-xs font-medium text-primary hover:underline">Lihat Semua</a>
                        </div>
                        <div className="space-y-3">
                            {recentUsers.slice(0, 2).map(u => (
                                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {u.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{u.username}</p>
                                            <p className="text-xs text-gray-500">{u.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400">Baru saja</span>
                                </div>
                            ))}
                            {recentUsers.length === 0 && (
                                <p className="text-center text-gray-500 text-sm py-4">Belum ada pengguna.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 xl:space-y-4">
            <AdminHeader
                title="Dashboard Overview"
                description="Ringkasan performa bisnis Anda hari ini."
            />

            {/* AI Insights */}
            <AIInsightsCard />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xl:gap-4">
                <StatCard
                    title="Total Pendapatan"
                    value={formatCurrency(stats.totalRevenue)}
                    icon={TrendingUp}
                    color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-white"
                    trend={stats.revenueTrend || undefined}
                />
                <StatCard
                    title="Pendapatan Hari Ini"
                    value={formatCurrency(stats.todayRevenue)}
                    icon={Activity}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-white"
                    trend="Live"
                />
                <StatCard
                    title="Total Pesanan"
                    value={stats.totalOrders}
                    icon={Receipt}
                    color="bg-red-100 text-red-700 dark:bg-primary/20 dark:text-white"
                />
                <StatCard
                    title="Total Produk"
                    value={stats.totalProducts}
                    icon={ShoppingBag}
                    color="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-white"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xl:gap-4">
                {/* Chart Section */}
                <div className="md:col-span-2">
                    <DashboardChart
                        data={salesData}
                        title="Trend Penjualan (7 Hari)"
                    />
                </div>

                {/* Recent Activity / Recent Orders */}
                <div>
                    <RecentTransactionsList
                        orders={recentOrders}
                        title="Transaksi Terakhir"
                        viewAllLink="/admin/orders"
                    />
                </div>
            </div>
        </div>
    );
}
