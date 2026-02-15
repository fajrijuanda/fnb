'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    ShoppingBag,
    TrendingUp,
    Receipt,
    Activity
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { OrderResponse, ApiResponse, Product } from '@/types/api';
import { StatCard } from '@/components/admin/StatCard';
import { AIInsightsCard } from '@/components/admin/ai/AIInsightsCard';
import { DashboardChart } from '@/components/admin/DashboardChart';
import { RecentTransactionsList } from '@/components/admin/RecentTransactionsList';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { extractApiArray } from '@/lib/api-utils';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        todayRevenue: 0
    });
    const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
    const [salesData, setSalesData] = useState<{ date: string; revenue: number }[]>([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            // Parallel Fetch
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

            setStats({
                totalRevenue,
                totalOrders: orders.length,
                totalProducts: products.length,
                todayRevenue
            });
            setRecentOrders(orders.slice(0, 5)); // Take latest 5
            setSalesData(chartData);

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            await fetchDashboardData();
        };
        loadData();
    }, [fetchDashboardData]);

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
                    trend="+12%"
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
                    color="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-white"
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
