"use client";

import { create } from "zustand";
import api from "@/lib/api";
import { Notification, PaginatedData } from "@/types/api";
import axios from "axios";

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
  connectWebSocket: (token: string) => void;
  disconnectWebSocket: () => void;
}

let notificationsRateLimitedUntil = 0;
let wsInstance: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let currentToken: string | null = null;

const parseRetryAfterSeconds = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getRateLimitRetryMs = (error: unknown, fallbackMs: number): number => {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) {
    return fallbackMs;
  }

  const retryAfterHeader = parseRetryAfterSeconds(
    error.response?.headers?.["retry-after"],
  );
  if (retryAfterHeader && retryAfterHeader > 0) {
    return retryAfterHeader * 1000;
  }

  const detail =
    typeof error.response?.data?.detail === "string"
      ? error.response.data.detail
      : "";
  const detailMatch = detail.match(/(\d+)\s*seconds?/i);
  if (detailMatch) {
    const seconds = Number(detailMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }

  return fallbackMs;
};

export const useNotificationStore = create<NotificationState>((set, get) => {
  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'notification' && data.data) {
        const newNotif = data.data as Notification;
        
        // Check if we already have it to avoid duplicates
        const state = get();
        if (!state.notifications.some(n => n.id === newNotif.id)) {
            set((prevState) => ({
              notifications: [newNotif, ...prevState.notifications],
              unreadCount: prevState.unreadCount + (newNotif.is_read ? 0 : 1)
            }));
        }
      }
    } catch (err) {
      console.error("WebSocket message parse error", err);
    }
  };

  const attemptConnect = () => {
    if (!currentToken) return;
    
    // Fallback to localhost if API URL is not set (useful for dev)
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Replace http:// or https:// with ws:// or wss://
    let wsUrl = baseApiUrl.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
    
    // Ensure it trailing slash is cleanly handled
    if (!wsUrl.endsWith('/')) {
        wsUrl += '/';
    }
    // E.g. ws://localhost:8000/ws/notifications/?token=...
    const fullUrl = `${wsUrl}ws/notifications/?token=${currentToken}`;

    wsInstance = new WebSocket(fullUrl);

    wsInstance.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      // On reconnect, fetch page 1 to fill any missed gaps
      get().fetchNotifications(1);
    };

    wsInstance.onmessage = handleWebSocketMessage;

    wsInstance.onclose = () => {
      wsInstance = null;
      if (currentToken) {
        // Reconnect after 5 seconds if connection died and token still exists
        reconnectTimeout = setTimeout(attemptConnect, 5000);
      }
    };

    wsInstance.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Close will be called automatically and trigger reconnect
    };
  };

  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    page: 1,
    hasMore: true,

    fetchNotifications: async (page = 1) => {
      if (Date.now() < notificationsRateLimitedUntil) {
        if (page === 1) set({ isLoading: false });
        return;
      }

      if (page === 1) set({ isLoading: true });
      try {
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
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          notificationsRateLimitedUntil =
            Date.now() + getRateLimitRetryMs(error, 5 * 60 * 1000);
        } else {
          console.error("Failed to fetch notifications:", error);
        }
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
      // Retained for backward compatibility or explicit manual refreshing, but no longer the primary realtime mode
      if (Date.now() < notificationsRateLimitedUntil) {
        return;
      }

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
            return {}; 
          }

          return {
            notifications: latestNotifications,
            unreadCount: latestNotifications.filter((n) => !n.is_read).length,
          };
        });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          notificationsRateLimitedUntil =
            Date.now() + getRateLimitRetryMs(error, 5 * 60 * 1000);
          return;
        }
        console.error("Polling failed:", error);
      }
    },

    connectWebSocket: (token: string) => {
      if (currentToken === token && wsInstance) return; // Already connected
      if (wsInstance) {
          wsInstance.close();
      }
      currentToken = token;
      attemptConnect();
    },

    disconnectWebSocket: () => {
      currentToken = null;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (wsInstance) {
        // Remove onclose listener so it doesn't trigger reconnect
        wsInstance.onclose = null;
        wsInstance.close();
        wsInstance = null;
      }
    }
  };
});

