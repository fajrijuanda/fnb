'use client';

import { CreditCard, Sparkles, Users, Activity, TrendingUp, Search, Filter, MoreHorizontal, CheckCircle, Clock } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRupiah } from '@/lib/utils';

export default function SubscriptionsPage() {
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'superadmin';

    if (isSuperAdmin) {
        return (
            <div className="space-y-6">
                <AdminHeader
                    title="Manajemen Langganan"
                    description="Pantau dan kelola langganan mitra"
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Mitra Aktif</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">124</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Langganan Baru</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">+12</p>
                                <span className="text-xs text-green-500">Bulan ini</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendapatan</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">Rp 45.2jt</p>
                                <span className="text-xs text-green-500">+8% dari bulan lalu</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Table */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Daftar Langganan</h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari mitra..."
                                    className="pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border-none text-sm focus:ring-1 focus:ring-primary w-48"
                                />
                            </div>
                            <button className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Mitra</th>
                                    <th className="px-6 py-4">Paket</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Berakhir</th>
                                    <th className="px-6 py-4">Tagihan</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {[
                                    { name: 'Kopi Kenangan', plan: 'Business', status: 'Active', end: '24 Okt 2024', bill: 199000 },
                                    { name: 'Janji Jiwa', plan: 'Enterprise', status: 'Active', end: '12 Nov 2024', bill: 499000 },
                                    { name: 'Es Teh Indonesia', plan: 'Starter', status: 'Expiring', end: '2 Hari lagi', bill: 99000 },
                                    { name: 'Mixue', plan: 'Business', status: 'Inactive', end: 'Expired', bill: 199000 },
                                    { name: 'Fore Coffee', plan: 'Enterprise', status: 'Active', end: '01 Des 2024', bill: 499000 },
                                ].map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${item.plan === 'Enterprise' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-900/30' :
                                                item.plan === 'Business' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30' :
                                                    'bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:border-white/10'
                                                }`}>
                                                {item.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {item.status === 'Active' && <CheckCircle size={14} className="text-green-500" />}
                                                {item.status === 'Expiring' && <Clock size={14} className="text-orange-500" />}
                                                {item.status === 'Inactive' && <XIcon size={14} className="text-red-500" />}
                                                <span className={
                                                    item.status === 'Active' ? 'text-green-600' :
                                                        item.status === 'Expiring' ? 'text-orange-600' : 'text-gray-500'
                                                }>{item.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{item.end}</td>
                                        <td className="px-6 py-4 font-medium">{formatRupiah(item.bill)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // Default view for Mitra (Pricing Plans)
    return (
        <div className="space-y-4 lg:space-y-6">
            <AdminHeader
                title="Langganan Saya"
                description="Kelola paket langganan dan tagihan Anda"
            />

            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                    <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-2xl shadow-primary/30">
                        <CreditCard className="h-12 w-12 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Segera Hadir
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
                    Fitur manajemen langganan sedang dalam pengembangan.
                    Nantikan pembaruan selanjutnya!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                    {[
                        { title: 'Starter', price: 'Rp 99.000', desc: 'Untuk usaha kecil', features: ['1 Kasir', '100 Transaksi/bulan', 'Laporan Dasar'] },
                        { title: 'Business', price: 'Rp 199.000', desc: 'Untuk usaha menengah', features: ['3 Kasir', 'Unlimited Transaksi', 'AI Insights', 'Laporan Lengkap'] },
                        { title: 'Enterprise', price: 'Rp 499.000', desc: 'Untuk usaha besar', features: ['Unlimited Kasir', 'Unlimited Transaksi', 'AI Priority', 'Support Dedicated'] },
                    ].map((plan) => (
                        <div
                            key={plan.title}
                            className={`relative p-6 rounded-2xl border transition-all ${plan.title === 'Business'
                                ? 'bg-gradient-to-br from-primary/10 to-red-500/5 border-primary/30 shadow-lg shadow-primary/10 scale-105'
                                : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                                }`}
                        >
                            {plan.title === 'Business' && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                    <Sparkles size={10} />
                                    POPULER
                                </div>
                            )}
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{plan.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.desc}</p>
                            <p className="text-2xl font-bold text-primary mt-3">{plan.price}<span className="text-xs text-gray-400 font-normal">/bulan</span></p>
                            <ul className="mt-4 space-y-2">
                                {plan.features.map((f) => (
                                    <li key={f} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                disabled
                                className="w-full mt-6 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/30 font-bold text-sm cursor-not-allowed"
                            >
                                Segera Hadir
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function XIcon({ className, size }: { className?: string; size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 18 18" />
        </svg>
    )
}
