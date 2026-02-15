'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Download, FileText } from 'lucide-react';
import api from '@/lib/api';

interface DailySummary {
    date: string;
    total_orders: number;
    total_revenue: number;
    payment_breakdown: Array<{
        payment_method: string;
        count: number;
        total: number;
    }>;
    top_products: Array<{
        product__name: string;
        quantity_sold: number;
        revenue: number;
    }>;
}

export default function ReportsPage() {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [summary, setSummary] = useState<DailySummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/sales/orders/daily-report/?date=${selectedDate}`);
            setSummary(res.data.data);
        } catch (error) {
            console.error('Failed to fetch report:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleExport = async (format: 'excel' | 'pdf') => {
        try {
            const response = await api.get(`/sales/orders/download-report/?date=${selectedDate}&format=${format}`, {
                responseType: 'blob',
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Sales_Report_${selectedDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Gagal mengunduh laporan.');
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Laporan Penjualan</h1>
                    <p className="text-muted-foreground">Ringkasan penjualan harian</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors"
                        title="Export Excel"
                    >
                        <FileText size={18} />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors text-red-500"
                        title="Export PDF"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">PDF</span>
                    </button>

                    <div className="h-8 w-px bg-border mx-2"></div>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 border border-border rounded-lg bg-card text-foreground"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : summary ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Total Orders */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent/10 rounded-lg">
                                    <ShoppingCart className="text-accent" size={24} />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Total Pesanan</p>
                                    <p className="text-2xl font-bold text-foreground">{summary.total_orders}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Revenue */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-success/10 rounded-lg">
                                    <DollarSign className="text-success" size={24} />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Total Pendapatan</p>
                                    <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.total_revenue)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Average Order */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <TrendingUp className="text-primary" size={24} />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Rata-rata per Pesanan</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {summary.total_orders > 0
                                            ? formatCurrency(summary.total_revenue / summary.total_orders)
                                            : formatCurrency(0)
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Breakdown & Top Products */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Payment Breakdown */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Metode Pembayaran</h3>
                            {summary.payment_breakdown.length > 0 ? (
                                <div className="space-y-3">
                                    {summary.payment_breakdown.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                            <span className="text-foreground">{item.payment_method}</span>
                                            <div className="text-right">
                                                <p className="font-semibold text-foreground">{formatCurrency(item.total)}</p>
                                                <p className="text-sm text-muted-foreground">{item.count} transaksi</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Tidak ada data pembayaran</p>
                            )}
                        </div>

                        {/* Top Products */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Produk Terlaris</h3>
                            {summary.top_products.length > 0 ? (
                                <div className="space-y-3">
                                    {summary.top_products.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="text-foreground">{item.product__name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-foreground">{item.quantity_sold}x</p>
                                                <p className="text-sm text-muted-foreground">{formatCurrency(item.revenue)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Tidak ada data penjualan</p>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    Tidak ada data untuk tanggal ini
                </div>
            )}
        </div>
    );
}
