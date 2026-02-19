'use client';

import { X, CheckCircle, Printer, XCircle, Clock } from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import type { OrderResponse } from '@/types/api';
import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ReceiptPrint } from './ReceiptPrint';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification?: {
        type: 'success' | 'error' | 'info';
        title: string;
        message: string;
        timestamp: Date;
        data?: OrderResponse;
    };
}

export function TransactionDetailModal({ isOpen, onClose, notification }: TransactionDetailModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: notification?.data?.invoice_number || 'Receipt',
    });

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted || !isVisible || !notification) return null;

    const order = notification.data;
    const isSuccess = notification.type === 'success';

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-[70] flex items-center justify-center transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={cn(
                "relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1a1a] p-0 shadow-2xl mx-4 overflow-hidden border border-gray-100 dark:border-white/10 transition-all",
                "transform-none"
            )}>
                {/* Header */}
                <div className={cn(
                    "p-6 text-center text-white relative",
                    isSuccess ? "bg-gradient-to-br from-green-500 to-green-700" : "bg-gradient-to-br from-red-500 to-red-700"
                )}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        {isSuccess ? <CheckCircle size={32} /> : <XCircle size={32} />}
                    </div>

                    <h2 className="text-xl font-bold mb-1">{notification.title}</h2>
                    <p className="text-white/80 text-sm">{notification.message}</p>

                    <div className="flex items-center justify-center gap-1 mt-3 text-xs text-white/70 bg-black/10 py-1 px-3 rounded-full w-fit mx-auto">
                        <Clock size={12} />
                        {new Intl.DateTimeFormat('id-ID', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        }).format(new Date(notification.timestamp))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {order ? (
                        <>
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-white/5">
                                <span className="text-gray-500 text-sm">Invoice</span>
                                <span className="font-mono font-bold text-gray-900 dark:text-white">{order.invoice_number}</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-gray-500">{item.quantity}x</span>
                                            <span className="text-gray-700 dark:text-gray-300 line-clamp-1">{item.product_name}</span>
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatRupiah(item.price_at_sale * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-xl mb-6">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Total</span>
                                <span className="text-xl font-black text-primary">{formatRupiah(order.total_amount)}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {isSuccess && (
                                    <button
                                        onClick={handlePrint}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Printer size={18} />
                                        Cetak
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity"
                                >
                                    Tutup
                                </button>
                            </div>

                            {/* Hidden Receipt */}
                            <div className="hidden print:hidden">
                                <ReceiptPrint ref={receiptRef} order={order} />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-500">Tidak ada detail transaksi.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
