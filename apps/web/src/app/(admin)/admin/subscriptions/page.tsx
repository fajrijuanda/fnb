'use client';

import { CreditCard, Sparkles } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function SubscriptionsPage() {
    return (
        <div className="space-y-4 lg:space-y-6">
            <AdminHeader
                title="Langganan"
                description="Kelola paket langganan mitra OMDEN"
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
                    Fitur manajemen langganan mitra sedang dalam pengembangan.
                    Anda akan dapat mengelola paket, masa aktif, dan pembayaran mitra di sini.
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
