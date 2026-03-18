'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Clock, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Notification } from '@/types/api';
import { NotificationDetailModal } from './NotificationDetailModal';
import { useAuthStore } from '@/store/useAuthStore';

export function CashierNotificationDropdown() {
    const { unreadCount, notifications, fetchNotifications, markAsRead, markAllAsRead, connectWebSocket } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const accessToken = useAuthStore(state => state.accessToken);

    // Initial fetch and WebSocket connect
    useEffect(() => {
        fetchNotifications(1);
        
        if (accessToken) {
            connectWebSocket(accessToken);
        }

        return () => {
             // Let the store handle global connection reuse or teardown.
             // Usually we don't disconnect on every unmount if we want global realtime,
             // but if we do, call disconnectWebSocket() here.
             // We'll keep it globally connected until explicit logout.
        };
    }, [fetchNotifications, accessToken, connectWebSocket]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        const closeDropdown = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.notification-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
    }, [isOpen]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        setSelectedNotification(notification);
        setIsOpen(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'baru saja';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} menit yang lalu`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} jam yang lalu`;
        const days = Math.floor(hours / 24);
        return `${days} hari yang lalu`;
    };

    return (
        <div className="relative notification-container">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors relative"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#121212] animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Notifikasi</h3>
                            <p className="text-xs text-gray-500">Update terbaru untuk anda</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                                <Check size={14} />
                                Tandai dibaca semua
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                <Bell size={32} className="opacity-20 mb-2" />
                                <p className="text-sm">Belum ada notifikasi</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-white/5">
                                {notifications.map(notification => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex gap-3 ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
                                    >
                                        <div className="shrink-0 mt-1">
                                            {getIcon(notification.notification_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className={`text-sm font-semibold truncate ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.is_read && (
                                                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                <Clock size={10} />
                                                <span>{formatTimeAgo(notification.created_at)}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <NotificationDetailModal
                isOpen={!!selectedNotification}
                onClose={() => setSelectedNotification(null)}
                notification={selectedNotification}
            />
        </div>
    );
}
