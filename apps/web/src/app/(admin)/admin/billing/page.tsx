'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Subscription } from '@/types/api';
import {
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Clock,
    FileText
} from 'lucide-react';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { formatDate } from '@/lib/utils';

export default function BillingPage() {
    const { user } = useAuthStore();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const res = await api.get('/subscriptions/');
                // Check if response is array or paginated
                const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
                setSubscriptions(data);
            } catch (err) {
                console.error("Failed to fetch subscriptions:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchSubscriptions();
        }
    }, [user]);

    // Determine active subscription (latest one usually, or filter by status)
    const activeSubscription = subscriptions.find(s => s.status === 'active') || subscriptions[0];

    const columns: Column<Subscription>[] = [
        {
            header: 'Paket',
            accessor: (item) => (
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-white/10 flex items-center justify-center text-red-600 dark:text-white">
                        <FileText size={16} />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{item.plan_name}</span>
                </div>
            )
        },
        {
            header: 'Mulai',
            accessor: (item) => <span className="text-gray-500 text-sm">{item.start_date ? formatDate(item.start_date) : '-'}</span>
        },
        {
            header: 'Berakhir',
            accessor: (item) => <span className="text-gray-500 text-sm">{item.end_date ? formatDate(item.end_date) : '-'}</span>
        },
        {
            header: 'Status',
            accessor: (item) => (
                <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-bold capitalize ${item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        item.status === 'expired' ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                    {item.status}
                </span>
            )
        }
    ];

    if (!user || user.role !== 'mitra' && user.role !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
                <div className="h-16 w-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={32} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Akses Terbatas</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Halaman ini hanya tersedia untuk akun Mitra. Hubungi admin toko Anda untuk informasi langganan.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6 animation-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Langganan</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detail paket, status langganan, dan riwayat tagihan.</p>
            </div>

            {/* Active Plan Card */}
            <section className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] dark:from-white/5 dark:to-white/10 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none">
                    <CreditCard size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 shadow-lg shadow-red-900/50 flex items-center justify-center">
                                <CreditCard className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-white/60 font-medium uppercase tracking-wider mb-1">Paket Saat Ini</p>
                                <h2 className="text-2xl md:text-3xl font-bold capitalize">{activeSubscription?.plan_name || 'Free Plan'}</h2>
                            </div>
                        </div>

                        {activeSubscription?.status === 'active' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-sm font-bold shadow-lg shadow-emerald-900/20 backdrop-blur-sm self-start md:self-auto">
                                <CheckCircle2 size={16} />
                                <span>Langganan Aktif</span>
                            </div>
                        ) : activeSubscription?.status === 'pending' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm font-bold shadow-lg shadow-yellow-900/20 backdrop-blur-sm self-start md:self-auto">
                                <Clock size={16} />
                                <span>Menunggu Pembayaran</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-full text-sm font-bold shadow-lg shadow-gray-900/20 backdrop-blur-sm self-start md:self-auto">
                                <AlertCircle size={16} />
                                <span>Tidak Aktif / Expired</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
                        <div className="bg-white/5 rounded-2xl p-4 md:p-5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <p className="text-xs text-white/50 mb-1.5 uppercase font-medium tracking-wide">Mulai Langganan</p>
                            <p className="font-semibold text-lg md:text-xl tracking-tight">{activeSubscription?.start_date ? formatDate(activeSubscription.start_date) : '-'}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 md:p-5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <p className="text-xs text-white/50 mb-1.5 uppercase font-medium tracking-wide">Berakhir Pada</p>
                            <p className="font-semibold text-lg md:text-xl tracking-tight">{activeSubscription?.end_date ? formatDate(activeSubscription.end_date) : '-'}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 md:p-5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                            <p className="text-xs text-white/50 mb-1.5 uppercase font-medium tracking-wide">Pembayaran Terakhir</p>
                            <p className="font-semibold text-lg md:text-xl tracking-tight capitalize">{activeSubscription?.status === 'active' ? 'Lunas' : (activeSubscription?.status || '-')}</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <a
                            href={`https://wa.me/628112835789?text=${encodeURIComponent(`Halo Admin OMDEN, saya pemilik akun *${user?.username}* ingin memperpanjang langganan dan melakukan pembayaran.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <CreditCard size={20} />
                            Perpanjang Langganan & Bayar
                        </a>
                    </div>
                </div>
            </section>

            {/* History Table */}
            <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="text-gray-400" size={20} />
                        Riwayat Langganan
                    </h3>
                </div>

                <AdminDataTable
                    data={subscriptions}
                    columns={columns}
                    isLoading={isLoading}
                    emptyMessage="Belum ada riwayat langganan."
                    keyExtractor={(item) => item.id.toString()}
                    mobileCardRender={(item) => (
                        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                                    <FileText size={14} className="text-gray-400" />
                                    {item.plan_name}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold capitalize ${item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                        'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-100 dark:border-white/5">
                                <div>
                                    <span className="text-xs text-gray-500 block">Mulai</span>
                                    <span className="font-medium dark:text-gray-300">{item.start_date ? formatDate(item.start_date) : '-'}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 block">Berakhir</span>
                                    <span className="font-medium dark:text-gray-300">{item.end_date ? formatDate(item.end_date) : '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                />
            </section>
        </div>
    );
}
