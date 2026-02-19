'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { OrderResponse } from '@/types/api';

export interface NotificationItem {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    data?: OrderResponse; // Store full order data for details
}

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    // We could persist this to localStorage if needed, but for now in-memory is fine for a session
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
        const newItem: NotificationItem = {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newItem, ...prev]);
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
