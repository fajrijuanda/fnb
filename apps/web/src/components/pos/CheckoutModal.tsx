'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Banknote, QrCode, CreditCard, CheckCircle, Printer } from 'lucide-react';
import { useCartStore } from '@/store';
import { useNotification } from '@/context/NotificationContext';
import { formatRupiah, cn } from '@/lib/utils';
import api from '@/lib/api';
import type { CreateOrderRequest, OrderResponse, WrappedResponse, StoreSettings } from '@/types/api';
import Image from 'next/image';

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (order: OrderResponse) => void;
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const { addNotification } = useNotification();
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

    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [dynamicQris, setDynamicQris] = useState<string | null>(null);
    const [qrisLoading, setQrisLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get<StoreSettings>('/settings/store/');
                setStoreSettings(response.data);
            } catch (error) {
                console.error('Failed to fetch store settings', error);
            }
        };

        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 10);
            fetchSettings();
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

    // Fetch dynamic QRIS when payment method is QRIS
    useEffect(() => {
        const fetchDynamicQris = async () => {
            if (paymentMethod !== 'QRIS' || total <= 0) {
                setDynamicQris(null);
                return;
            }
            setQrisLoading(true);
            try {
                const response = await api.get<{ status: string; data: { qris_base64: string } }>(
                    `/settings/qris-dynamic/?amount=${Math.round(total)}`
                );
                if (response.data.status === 'success') {
                    setDynamicQris(response.data.data.qris_base64);
                } else {
                    setDynamicQris(null);
                }
            } catch {
                setDynamicQris(null);
            } finally {
                setQrisLoading(false);
            }
        };
        fetchDynamicQris();
    }, [paymentMethod, total]);

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
                const orderData = response.data.data as OrderResponse;
                onSuccess(orderData);
                addNotification({
                    type: 'success',
                    title: 'Pembayaran Berhasil',
                    message: `Transaksi #${orderData.invoice_number} berhasil diproses via ${orderData.payment_method_display || orderData.payment_method}`,
                    data: orderData
                });
            }
        } catch (err: unknown) {
            console.error('Checkout failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Gagal memproses pembayaran. Silakan coba lagi.';
            setError(errorMessage);
            addNotification({
                type: 'error',
                title: 'Pembayaran Gagal',
                message: errorMessage
            });
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
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                                    ? 'border-primary bg-red-50 dark:bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50 hover:bg-red-50/50 dark:hover:bg-primary/5'
                                    }`}
                            >
                                <method.icon
                                    className={`h-6 w-6 ${paymentMethod === method.id
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                        }`}
                                />
                                <span
                                    className={`text-sm font-medium ${paymentMethod === method.id
                                        ? 'text-primary'
                                        : 'text-card-foreground'
                                        }`}
                                >
                                    {method.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Payment Method Details */}
                {storeSettings && paymentMethod === 'QRIS' && (
                    <div className="mb-6 p-4 bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col items-center text-center">
                        {qrisLoading ? (
                            <div className="w-48 h-48 mb-3 flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : dynamicQris ? (
                            <>
                                <div className="relative w-48 h-48 mb-3">
                                    <Image
                                        src={dynamicQris}
                                        alt="QRIS Dynamic"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Scan QRIS untuk membayar</p>
                                <p className="text-lg font-bold text-primary mt-1">{formatRupiah(total)}</p>
                                <p className="text-xs text-gray-500">Dana / GoPay / OVO / ShopeePay</p>
                            </>
                        ) : storeSettings.qris_image ? (
                            <>
                                <div className="relative w-48 h-48 mb-3">
                                    <Image
                                        src={storeSettings.qris_image}
                                        alt="QRIS Code"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Scan QRIS untuk membayar</p>
                                <p className="text-lg font-bold text-primary mt-1">{formatRupiah(total)}</p>
                                <p className="text-xs text-gray-500">Dana / GoPay / OVO / ShopeePay</p>
                            </>
                        ) : (
                            <>
                                <div className="w-48 h-48 mb-3 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center">
                                    <QrCode className="text-gray-400" size={48} />
                                </div>
                                <p className="text-sm text-gray-500">QRIS belum dikonfigurasi</p>
                            </>
                        )}
                    </div>
                )}

                {storeSettings && paymentMethod === 'TRANSFER' && (
                    <div className="mb-6 space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Bank Transfer</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{storeSettings.bank_name}</span>
                                <span className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-black/20 px-2 py-1 rounded">{storeSettings.bank_account}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">a.n. {storeSettings.bank_holder}</p>
                        </div>
                        {(storeSettings.dana_number || storeSettings.gopay_number || storeSettings.ovo_number || storeSettings.shopeepay_number) && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">E-Wallet</p>
                                <div className="space-y-1">
                                    {storeSettings.dana_number && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">DANA</span>
                                            <span className="font-mono text-gray-900 dark:text-white">{storeSettings.dana_number}</span>
                                        </div>
                                    )}
                                    {storeSettings.gopay_number && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">GoPay</span>
                                            <span className="font-mono text-gray-900 dark:text-white">{storeSettings.gopay_number}</span>
                                        </div>
                                    )}
                                    {storeSettings.ovo_number && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">OVO</span>
                                            <span className="font-mono text-gray-900 dark:text-white">{storeSettings.ovo_number}</span>
                                        </div>
                                    )}
                                    {storeSettings.shopeepay_number && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">ShopeePay</span>
                                            <span className="font-mono text-gray-900 dark:text-white">{storeSettings.shopeepay_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}


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
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-red-600"
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
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-red-600">
                        {formatRupiah(order.total_amount)}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onPrint}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-primary/20 py-3 font-bold text-primary dark:text-red-400 hover:bg-red-50 dark:hover:bg-primary/10 transition-colors"
                    >
                        <Printer className="h-5 w-5" />
                        Cetak
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-primary to-red-600"
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
