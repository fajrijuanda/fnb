'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Banknote, QrCode, CheckCircle, Printer } from 'lucide-react';
import { useCartStore } from '@/store';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotification } from '@/context/NotificationContext';
import { formatRupiah, cn, getImageUrl } from '@/lib/utils';
import api from '@/lib/api';
import type { CreateOrderRequest, OrderResponse, WrappedResponse } from '@/types/api';
import { useNotificationStore } from '@/store/useNotificationStore';
import Image from 'next/image';
import axios from 'axios';

type PaymentMethod = 'CASH' | 'QRIS';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (order: OrderResponse) => void;
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const { addNotification } = useNotification();

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [customerName, setCustomerName] = useState('');
    const [cashReceivedInput, setCashReceivedInput] = useState('');
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [dynamicQris, setDynamicQris] = useState<string | null>(null);
    const [qrisLoading, setQrisLoading] = useState(false);
    const [dynamicQrisSupported, setDynamicQrisSupported] = useState(true);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 10);
            setError(null);
            setDynamicQrisSupported(true);
            setDynamicQris(null);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(() => setIsVisible(false), 300);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const total = getTotalPrice();
    const isQris = paymentMethod === 'QRIS';
    const cashReceived = Number(cashReceivedInput.replace(/\D/g, '')) || 0;
    const changeAmount = paymentMethod === 'CASH' ? Math.max(cashReceived - total, 0) : 0;
    const isCashInsufficient = paymentMethod === 'CASH' && cashReceived < total;
    const paymentInfo = user?.payment_info;
    const qrisImage = getImageUrl(paymentInfo?.qris_image);
    const hasDynamicQrisConfig = Boolean(paymentInfo?.qris_data?.trim());
    const canUseDynamicQris = isQris && total > 0 && hasDynamicQrisConfig && dynamicQrisSupported;

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchDynamicQris = async () => {
            if (!canUseDynamicQris) {
                setQrisLoading(false);
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
            } catch (error) {
                if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405)) {
                    setDynamicQrisSupported(false);
                }
                setDynamicQris(null);
            } finally {
                setQrisLoading(false);
            }
        };

        fetchDynamicQris();
    }, [canUseDynamicQris, total]);

    const paymentMethods = [
        { id: 'CASH' as PaymentMethod, label: 'Tunai', icon: Banknote },
        { id: 'QRIS' as PaymentMethod, label: 'QRIS', icon: QrCode },
    ];



    const handleCheckout = async () => {
        if (paymentMethod === 'CASH' && isCashInsufficient) {
            setError('Nominal uang tunai kurang dari total pembayaran.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const orderData: CreateOrderRequest = {
                payment_method: paymentMethod,
                customer_name: customerName,
                cash_received: paymentMethod === 'CASH' ? cashReceived : undefined,
                items: items.map((item) => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    note: item.note || '',
                })),
            };

            const response = await api.post<WrappedResponse<OrderResponse>>('/sales/orders/', orderData);

            if (response.data.status === 'success') {
                // Force update global notifications API silently to keep the notification bell realtime
                useNotificationStore.getState().fetchNotifications(1).catch(console.error);

                clearCart();
                const createdOrder = response.data.data as OrderResponse;

                // Play Voice Announcement (TTS)
                if ('speechSynthesis' in window) {
                    try {
                        window.speechSynthesis.cancel(); // Stop any currently playing audio
                        const nominalText = createdOrder.total_amount.toLocaleString('id-ID');
                        const textToSpeak = `Total pembayaran sebesar ${nominalText} rupiah. Terima kasih.`;
                        const utterance = new SpeechSynthesisUtterance(textToSpeak);
                        utterance.lang = 'id-ID';
                        utterance.rate = 0.95; // Slightly slower for clarity
                        utterance.pitch = 1.0;
                        window.speechSynthesis.speak(utterance);
                    } catch (e) {
                        console.error('Failed to play voice announcement:', e);
                    }
                }

                onSuccess(createdOrder);
                addNotification({
                    type: 'success',
                    title: 'Pembayaran Berhasil',
                    message: `Transaksi #${createdOrder.invoice_number} berhasil diproses via ${createdOrder.payment_method_display || createdOrder.payment_method}`,
                    data: createdOrder,
                });
            }
        } catch (err: unknown) {
            console.error('Checkout failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Gagal memproses pembayaran. Silakan coba lagi.';
            setError(errorMessage);
            addNotification({
                type: 'error',
                title: 'Pembayaran Gagal',
                message: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted || !isVisible) return null;

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(date);
    };

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center transition-all duration-300',
                isOpen ? 'opacity-100' : 'opacity-0'
            )}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div
                className={cn(
                    'relative w-[calc(100vw-2rem)] rounded-2xl bg-card shadow-elevated transition-all max-h-[92vh] overflow-y-auto max-w-4xl p-5 lg:p-6',
                    'transform-none'
                )}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-card-foreground">Pembayaran</h2>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div
                    className={cn(
                        'grid gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch'
                    )}
                >
                    <div className="min-w-0">
                        {currentTime && (
                            <div className="mb-3 flex flex-col items-center justify-center rounded-xl bg-muted/50 p-2 lg:p-3 text-center border border-border">
                                <p className="text-xs lg:text-sm font-medium text-muted-foreground">{formatDate(currentTime)}</p>
                                <p className="text-xl lg:text-2xl font-black text-primary tracking-wider font-mono">{formatTime(currentTime)}</p>
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="mb-1 block text-sm font-medium text-card-foreground">
                                Nama Pelanggan <span className="text-muted-foreground">(Opsional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Masukkan nama pelanggan..."
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="bg-muted rounded-xl p-3 mb-3">
                            <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
                            <p className="text-2xl lg:text-3xl font-bold text-primary">{formatRupiah(total)}</p>
                        </div>

                        {isQris && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-4 dark:border-red-500/20 dark:bg-red-500/10">
                                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                    Pastikan pelanggan menunjukkan bukti pembayaran berhasil dengan nominal yang sesuai sebelum menekan tombol Bayar.
                                </p>
                            </div>
                        )}

                        <div className="mb-4">
                            <p className="text-sm font-medium text-card-foreground mb-2">Pilih Metode Pembayaran</p>
                            <div className="grid grid-cols-2 gap-2 lg:gap-3">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => {
                                            setPaymentMethod(method.id);
                                            setError(null);
                                        }}
                                        className={`flex flex-col items-center gap-1.5 lg:gap-2 rounded-xl p-2.5 lg:p-3 border-2 transition-all ${paymentMethod === method.id
                                            ? 'border-primary bg-red-50 dark:bg-primary/10 text-primary'
                                            : 'border-border hover:border-primary/50 hover:bg-red-50/50 dark:hover:bg-primary/5'}`}
                                    >
                                        <method.icon
                                            className={`h-6 w-6 ${paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`}
                                        />
                                        <span
                                            className={`text-sm font-medium ${paymentMethod === method.id ? 'text-primary' : 'text-card-foreground'}`}
                                        >
                                            {method.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>



                        {error && (
                            <div className="mb-4 rounded-lg bg-red-100 dark:bg-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2 lg:gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 py-2.5 lg:py-3 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm lg:text-base"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCheckout}
                                disabled={isLoading || items.length === 0 || isCashInsufficient}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 lg:py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-red-600 text-sm lg:text-base"
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

                    {isQris && (
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 p-4 lg:sticky lg:top-0">
                            <div className="mb-3 text-center">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Scan QRIS untuk membayar</p>
                                <p className="text-xl font-bold text-primary">{formatRupiah(total)}</p>
                            </div>

                            {qrisLoading ? (
                                <div className="mx-auto mb-3 flex aspect-square w-full max-w-[320px] items-center justify-center rounded-xl border border-dashed border-border">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                </div>
                            ) : dynamicQris ? (
                                <div className="mx-auto mb-3 relative aspect-square w-full max-w-[320px] overflow-hidden rounded-xl bg-white p-2">
                                    <Image src={dynamicQris} alt="QRIS Dynamic" fill className="object-contain" unoptimized loading="eager" />
                                </div>
                            ) : qrisImage ? (
                                <div className="mx-auto mb-3 w-full max-w-[340px] overflow-hidden rounded-xl bg-white p-2 border border-border">
                                    <div className="relative aspect-square w-full rounded-lg overflow-hidden flex items-center justify-center bg-white">
                                        <Image src={qrisImage} alt="QRIS Code" fill className="object-cover scale-[1.35] lg:scale-[1.4]" unoptimized loading="eager" />
                                    </div>
                                </div>
                            ) : (
                                <div className="mx-auto mb-3 flex aspect-square w-full max-w-[320px] items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                                    <QrCode className="text-gray-400" size={56} />
                                </div>
                            )}

                            {qrisImage || dynamicQris ? (
                                <p className="text-xs text-center text-gray-500 mb-1">
                                    Scan menggunakan aplikasi E-Wallet atau M-Banking.
                                </p>
                            ) : (
                                <p className="text-sm text-center text-gray-500">QRIS belum dikonfigurasi.</p>
                            )}
                        </div>
                    )}

                    {!isQris && (
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 p-4 lg:sticky lg:top-0 flex flex-col gap-3">
                            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3 shrink-0">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-card-foreground">
                                        Uang Diterima
                                    </label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="none"
                                            placeholder="0"
                                            value={cashReceivedInput}
                                            readOnly
                                            className="w-full rounded-xl border border-border bg-background py-2 lg:py-2.5 pl-10 pr-4 text-lg lg:text-xl font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-default"
                                        />
                                    </div>
                                    {isCashInsufficient && (
                                        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                                            Uang kurang {formatRupiah(total - cashReceived)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3 border border-border/70">
                                    <span className="text-sm font-medium text-muted-foreground">Kembalian</span>
                                    <span className="text-xl font-bold text-primary">{formatRupiah(changeAmount)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 lg:gap-3 flex-1 mt-2">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            if (key === 'C') {
                                                setCashReceivedInput('');
                                            } else if (key === '⌫') {
                                                setCashReceivedInput((prev) => {
                                                    const digits = prev.replace(/\D/g, '');
                                                    if (digits.length <= 1) return '';
                                                    const newDigits = digits.slice(0, -1);
                                                    return new Intl.NumberFormat('id-ID').format(Number(newDigits));
                                                });
                                            } else {
                                                setCashReceivedInput((prev) => {
                                                    const digits = prev.replace(/\D/g, '') + key;
                                                    const amount = Number(digits);
                                                    if (amount > 999999999) return prev; // Limit to reasonable figure
                                                    return new Intl.NumberFormat('id-ID').format(amount);
                                                });
                                            }
                                        }}
                                        className={cn(
                                            "rounded-xl border border-border/50 py-2 lg:py-3 text-lg lg:text-xl font-bold transition-all shadow-sm active:scale-95",
                                            key === 'C' ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20" :
                                                key === '⌫' ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 flex flex-col items-center justify-center text-sm lg:text-base font-semibold min-h-[48px]" :
                                                    "bg-background text-card-foreground hover:bg-muted lg:hover:shadow-md min-h-[48px]"
                                        )}
                                    >
                                        {key === '⌫' ? 'Hapus' : key}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
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

                {order.payment_method === 'CASH' && order.cash_received != null && (
                    <div className="mb-8 rounded-xl border border-border/60 bg-background p-4 text-left">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Uang Diterima</span>
                            <span className="font-semibold text-card-foreground">{formatRupiah(order.cash_received)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Kembalian</span>
                            <span className="font-semibold text-card-foreground">{formatRupiah(order.change_amount || 0)}</span>
                        </div>
                    </div>
                )}

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
