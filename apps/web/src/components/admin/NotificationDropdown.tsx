'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { NotificationListModal } from './NotificationListModal';

export function NotificationDropdown() {
    const { unreadCount, pollNotifications, fetchNotifications } = useNotificationStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Poll every 30 seconds
    useEffect(() => {
        fetchNotifications(1); // Initial fetch
        const interval = setInterval(() => {
            pollNotifications();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications, pollNotifications]);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#121212]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <NotificationListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
