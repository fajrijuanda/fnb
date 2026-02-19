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
    soundEnabled: boolean;
    toggleSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    // We could persist this to localStorage if needed, but for now in-memory is fine for a session
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const unreadCount = notifications.filter(n => !n.read).length;



    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    // Sound Preference
    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sound_enabled');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('sound_enabled', JSON.stringify(newValue));
            return newValue;
        });
    }, []);

    const playNotificationSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(err => console.warn("Failed to play notification sound:", err));
        } catch (error) {
            console.error("Audio playback error:", error);
        }
    }, [soundEnabled]);

    const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
        const newItem: NotificationItem = {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newItem, ...prev]);
        playNotificationSound();
    }, [playNotificationSound]);

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
            clearNotifications,
            soundEnabled,
            toggleSound
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
