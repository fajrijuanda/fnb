'use client';

import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNotification, NotificationItem } from '@/context/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import { TransactionDetailModal } from '@/components/pos/TransactionDetailModal';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
    title: string;
    description: string;
    action?: React.ReactNode;
}

export const AdminHeader = ({ title, description, action }: AdminHeaderProps) => {
    const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | undefined>(undefined);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: NotificationItem) => {
        markAsRead(notification.id);
        if (notification.data) {
            setSelectedNotification(notification);
            setIsDetailOpen(true);
        }
        setIsOpen(false);
    };

    const handleOpenDropdown = () => {
        setIsOpen(!isOpen);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="text-green-500" />;
            case 'error': return <AlertCircle size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " tahun lalu";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " bulan lalu";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " hari lalu";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " jam lalu";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " menit lalu";
        return Math.floor(seconds) + " detik lalu";
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 xl:mb-6">
                <div>
                    <h1 className="text-lg xl:text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
                    <p className="text-xs xl:text-sm text-gray-500 dark:text-gray-200">{description}</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={handleOpenDropdown}
                            className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#121212]" />
                            )}
                        </button>

                        {/* Dropdown */}
                        {isOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-100 dark:border-white/5 z-50 overflow-hidden">
                                <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-white/5">
                                    <h3 className="font-semibold text-sm">Notifikasi</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-primary hover:text-red-600 font-medium"
                                        >
                                            Tandai semua dibaca
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 text-sm">
                                            Tidak ada notifikasi
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 dark:divide-white/5">
                                            {notifications.map((notification) => (
                                                <button
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={cn(
                                                        "w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex gap-3",
                                                        !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                                                    )}
                                                >
                                                    <div className="mt-0.5 shrink-0">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={cn(
                                                            "text-sm font-medium mb-0.5 truncate",
                                                            !notification.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"
                                                        )}>
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1.5">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {timeAgo(new Date(notification.timestamp))}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {action && (
                        <div className="flex items-center gap-2">
                            {action}
                        </div>
                    )}
                </div>
            </div>

            <TransactionDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                notification={selectedNotification && {
                    ...selectedNotification,
                    message: selectedNotification.message, // Ensure type compatibility
                    timestamp: new Date(selectedNotification.timestamp)
                }}
            />
        </>
    );
};
