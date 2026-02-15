'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCheck, Trash2, Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { cn } from '@/lib/utils';
import { Notification } from '@/types/api';

interface NotificationListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationListModal({ isOpen, onClose }: NotificationListModalProps) {
    const { notifications, fetchNotifications, markAllAsRead, markAsRead, deleteNotification, isLoading, hasMore, page } = useNotificationStore();
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Delay mount slightly to avoid synchronous state update warning and ensure animation works
            const timer = setTimeout(() => {
                setMounted(true);
                // Trigger visibility after mount
                requestAnimationFrame(() => setIsVisible(true));
            }, 0);

            fetchNotifications(1); // Refresh on open
            return () => clearTimeout(timer);
        } else {
            // Delay visibility change to avoid sync state update warning
            const timerVisible = setTimeout(() => setIsVisible(false), 0);
            const timerMounted = setTimeout(() => setMounted(false), 300);
            return () => {
                clearTimeout(timerVisible);
                clearTimeout(timerMounted);
            };
        }
    }, [isOpen, fetchNotifications]);

    const handleLoadMore = () => {
        if (hasMore && !isLoading) {
            fetchNotifications(page + 1);
        }
    };

    const getIcon = (type: Notification['notification_type']) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-green-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
            case 'error': return <XCircle className="text-red-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:justify-end sm:p-4 transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0"
        )}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Panel (Slide from right on desktop, bottom on mobile) */}
            <div className={cn(
                "relative w-full max-w-md bg-white dark:bg-[#1a1a1a] sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh] sm:h-[600px] transition-all duration-300 transform",
                isVisible ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
            )}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-sm z-10 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bell className="text-primary" size={20} />
                            Notifikasi
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => markAllAsRead()}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 text-xs font-medium flex items-center gap-1 transition-colors"
                            title="Tandai semua sudah dibaca"
                        >
                            <CheckCheck size={16} />
                            <span className="hidden sm:inline">Baca Semua</span>
                        </button>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-3">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 py-12">
                            <Bell size={48} className="mb-4 opacity-20" />
                            <p>Tidak ada notifikasi</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={cn(
                                    "relative group flex gap-4 p-4 rounded-xl border transition-all hover:bg-gray-50 dark:hover:bg-white/5",
                                    notif.is_read
                                        ? "bg-white dark:bg-transparent border-gray-100 dark:border-white/5 opacity-75"
                                        : "bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
                                )}
                            >
                                <div className="mt-1 shrink-0">
                                    {getIcon(notif.notification_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className={cn("text-sm font-semibold truncate pr-6", notif.is_read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white")}>
                                            {notif.title}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 shrink-0">
                                            {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                        {notif.message}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Tandai dibaca
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notif.id)}
                                            className="text-[10px] font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
                                        >
                                            <Trash2 size={10} /> Hapus
                                        </button>
                                    </div>
                                </div>
                                {!notif.is_read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                                )}
                            </div>
                        ))
                    )}

                    {hasMore && (
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoading}
                            className="w-full py-3 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {isLoading ? "Memuat..." : "Muat Lebih Banyak"}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
