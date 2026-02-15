"use client";

import { create } from "zustand";
import api from "@/lib/api";
import { Notification, PaginatedData } from "@/types/api";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  page: number;
  hasMore: boolean;

  // Actions
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  pollNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  page: 1,
  hasMore: true,

  fetchNotifications: async (page = 1) => {
    if (page === 1) set({ isLoading: true });
    try {
      // Using Notification[] because PaginatedData results is T, and we expect an array
      const response = await api.get<PaginatedData<Notification[]>>(
        `/notifications/?page=${page}`,
      );
      const newNotifications = response.data.results;

      set((state) => ({
        notifications:
          page === 1
            ? newNotifications
            : [...state.notifications, ...newNotifications],
        page: page,
        hasMore: !!response.data.next,
        unreadCount:
          page === 1
            ? newNotifications.filter((n) => !n.is_read).length
            : state.unreadCount +
              newNotifications.filter((n) => !n.is_read).length,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: number) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await api.post(`/notifications/${id}/read/`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));

    try {
      await api.post(`/notifications/read-all/`);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },

  deleteNotification: async (id: number) => {
    const notifToDelete = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount:
        notifToDelete && !notifToDelete.is_read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
    }));

    try {
      await api.delete(`/notifications/${id}/`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  },

  pollNotifications: async () => {
    try {
      const response = await api.get<PaginatedData<Notification[]>>(
        `/notifications/?page=1`,
      );
      const latestNotifications = response.data.results;

      set((state) => {
        if (
          state.notifications.length > 0 &&
          latestNotifications[0]?.id === state.notifications[0]?.id
        ) {
          return {}; // No change to state, avoids re-render
        }

        return {
          notifications: latestNotifications,
          unreadCount: latestNotifications.filter((n) => !n.is_read).length,
        };
      });
    } catch (error) {
      console.error("Polling failed:", error);
    }
  },
}));
