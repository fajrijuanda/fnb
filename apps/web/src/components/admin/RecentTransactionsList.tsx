'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OrderResponse } from '@/types/api';

interface RecentTransactionsListProps {
    orders: OrderResponse[];
    title: string;
    viewAllLink: string;
}

export const RecentTransactionsList = ({ orders, title, viewAllLink }: RecentTransactionsListProps) => {
    return (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-3 xl:p-4 shadow-sm h-full">
            <div className="flex items-center justify-between mb-3 xl:mb-4">
                <h3 className="font-bold text-xs xl:text-sm text-gray-900 dark:text-white">{title}</h3>
                <Link href={viewAllLink} className="text-[10px] xl:text-xs text-primary hover:text-red-700 font-medium">Lihat Semua</Link>
            </div>
            <div className="space-y-2 xl:space-y-3">
                {orders.length === 0 ? (
                    <p className="text-center text-gray-500 text-xs py-4">Belum ada transaksi.</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-2 xl:p-3 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-2 xl:gap-3">
                                <div className="p-1.5 xl:p-2 rounded-lg bg-red-100 text-red-700 dark:bg-primary/20 dark:text-white group-hover:scale-110 transition-transform">
                                    <Receipt size={14} className="xl:w-4 xl:h-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-[11px] xl:text-xs text-gray-900 dark:text-white truncate max-w-[100px] xl:max-w-[140px]">{order.invoice_number}</p>
                                    <p className="text-[9px] xl:text-[10px] text-gray-500 dark:text-gray-200">{formatDate(order.created_at)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-[11px] xl:text-xs text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</p>
                                <span className={`text-[8px] xl:text-[9px] px-1 py-0.5 rounded font-bold ${order.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
