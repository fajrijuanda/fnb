'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Banknote, QrCode, CreditCard, CheckCircle, Printer } from 'lucide-react';
import { useCartStore } from '@/store';
import { formatRupiah, cn } from '@/lib/utils';
import api from '@/lib/api';
import type { CreateOrderRequest, OrderResponse, WrappedResponse } from '@/types/api';

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (order: OrderResponse) => void;
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [customerName, setCustomerName] = useState('');
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Animation State
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
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

    const total = getTotalPrice();

    // Live Clock
    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const paymentMethods = [
        { id: 'CASH' as PaymentMethod, label: 'Tunai', icon: Banknote },
        { id: 'QRIS' as PaymentMethod, label: 'QRIS', icon: QrCode },
        { id: 'TRANSFER' as PaymentMethod, label: 'Transfer', icon: CreditCard },
    ];

    const handleCheckout = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const orderData: CreateOrderRequest = {
                payment_method: paymentMethod,
                customer_name: customerName,
                items: items.map((item) => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    note: item.note || '',
                })),
            };

            const response = await api.post<WrappedResponse<OrderResponse>>(
                '/sales/orders/',
                orderData
            );

            if (response.data.status === 'success') {
                clearCart();
                onSuccess(response.data.data as OrderResponse);
            }
        } catch (err: unknown) {
            console.error('Checkout failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Gagal memproses pembayaran. Silakan coba lagi.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted || !isVisible) return null;

    // Date formatting
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    };

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={cn(
                "relative w-full max-w-md rounded-2xl bg-card p-6 shadow-elevated mx-4 transition-all",
                // Fade only
                "transform-none"
            )}>
                {/* ... (rest of content) ... */}
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-card-foreground">Pembayaran</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Digital Clock */}
                {currentTime && (
                    <div className="mb-6 flex flex-col items-center justify-center rounded-xl bg-muted/50 p-3 text-center border border-border">
                        <p className="text-sm font-medium text-muted-foreground">
                            {formatDate(currentTime)}
                        </p>
                        <p className="text-2xl font-black text-primary tracking-wider font-mono">
                            {formatTime(currentTime)}
                        </p>
                    </div>
                )}

                {/* Customer Name Input */}
                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                        Nama Pelanggan <span className="text-muted-foreground">(Opsional)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Masukkan nama pelanggan..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>

                {/* Total */}
                <div className="bg-muted rounded-xl p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
                    <p className="text-3xl font-bold text-primary">{formatRupiah(total)}</p>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                    <p className="text-sm font-medium text-card-foreground mb-3">
                        Pilih Metode Pembayaran
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all ${paymentMethod === method.id
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600'
                                    : 'border-border hover:border-orange-500/50 hover:bg-orange-50/50 dark:hover:bg-orange-500/5'
                                    }`}
                            >
                                <method.icon
                                    className={`h-6 w-6 ${paymentMethod === method.id
                                        ? 'text-orange-600'
                                        : 'text-muted-foreground'
                                        }`}
                                />
                                <span
                                    className={`text-sm font-medium ${paymentMethod === method.id
                                        ? 'text-orange-600'
                                        : 'text-card-foreground'
                                        }`}
                                >
                                    {method.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 rounded-lg bg-red-100 dark:bg-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 py-3 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={isLoading || items.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-orange-600"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-5 w-5" />
                                Bayar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Success Modal Component
interface SuccessModalProps {
    isOpen: boolean;
    order: OrderResponse | null;
    onClose: () => void;
    onPrint: () => void;
}

export function CheckoutSuccessModal({ isOpen, order, onClose, onPrint }: SuccessModalProps) {
    // Animation State
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
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

    if (!mounted || !isVisible) return null;
    if (!order) return null; // Logic check

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0"
        )}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className={cn(
                "relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-elevated mx-4 text-center border border-white/10 transition-all",
                "transform-none"
            )}>
                {/* Success Icon */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30">
                    <CheckCircle className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-card-foreground mb-2">
                    Pembayaran Berhasil!
                </h2>

                <p className="text-muted-foreground mb-6">
                    Invoice: <span className="font-semibold text-card-foreground font-mono">{order.invoice_number}</span>
                </p>

                <div className="bg-muted/50 rounded-2xl p-6 mb-8 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-medium">Total Pembayaran</p>
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                        {formatRupiah(order.total_amount)}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onPrint}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-orange-500/20 py-3 font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                    >
                        <Printer className="h-5 w-5" />
                        Cetak
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-500 to-orange-600"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default CheckoutModal;
