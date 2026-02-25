import { useState } from 'react';
import { X, Calendar, Link as LinkIcon, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Notification, OrderResponse } from '@/types/api';
import api from '@/lib/api';
import { TransactionDetailModal } from './TransactionDetailModal';

interface NotificationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
}

export function NotificationDetailModal({ isOpen, onClose, notification }: NotificationDetailModalProps) {
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
    const [orderData, setOrderData] = useState<OrderResponse | null>(null);

    if (!isOpen || !notification) return null;

    const handleViewDetail = async () => {
        if (!notification.related_link) return;

        // If it's an order link, fetch the receipt and show it in a modal
        if (notification.related_link.includes('/orders/')) {
            setIsLoadingReceipt(true);
            try {
                const response = await api.get(notification.related_link);
                const fetchedOrder = (response.data?.data || response.data) as OrderResponse;
                setOrderData(fetchedOrder);
                setIsReceiptOpen(true);
            } catch (error) {
                console.error('Failed to fetch order details:', error);
                // Fallback to normal routing if fetch fails
                window.location.href = notification.related_link;
            } finally {
                setIsLoadingReceipt(false);
            }
        } else {
            // Normal fallback for other links
            window.location.href = notification.related_link;
        }
    };

    const getIcon = () => {
        switch (notification.notification_type) {
            case 'success':
                return <CheckCircle2 className="w-12 h-12 text-green-500" />;
            case 'warning':
                return <AlertCircle className="w-12 h-12 text-yellow-500" />;
            case 'error':
                return <AlertCircle className="w-12 h-12 text-red-500" />;
            default:
                return <Info className="w-12 h-12 text-blue-500" />;
        }
    };

    const getColorClass = () => {
        switch (notification.notification_type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
            case 'error':
                return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400';
            default:
                return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative px-6 py-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className={`p-4 rounded-2xl mb-4 ${getColorClass()}`}>
                        {getIcon()}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {notification.title}
                    </h3>

                    <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 font-medium">
                        <Calendar size={14} />
                        <span>
                            {formatDate(notification.created_at)}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                        {notification.message}
                    </p>

                    {notification.related_link && notification.related_link !== '#' && (
                        <div className="mt-6">
                            <button
                                onClick={handleViewDetail}
                                disabled={isLoadingReceipt}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-bold text-sm disabled:opacity-50"
                            >
                                {isLoadingReceipt ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                                {isLoadingReceipt ? 'Memuat Detail...' : 'Lihat Detail'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-white/20 transition-colors shadow-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>

            {/* Receipt Modal Overlay */}
            <TransactionDetailModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                notification={orderData ? {
                    type: notification.notification_type as 'success' | 'error' | 'info',
                    title: notification.title,
                    message: notification.message,
                    timestamp: new Date(notification.created_at),
                    data: orderData
                } : undefined}
            />
        </div>
    );
}
