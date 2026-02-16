import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Axios instance configured for OMDEN API
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get or create device ID
const getDeviceId = () => {
  if (typeof window === "undefined") return "";
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

// Request interceptor for auth token and device ID
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const deviceId = getDeviceId();
  if (deviceId) {
    config.headers["X-Device-ID"] = deviceId;
  }

  return config;
});

// Response interceptor for error handling & token refresh
let isRefreshing = false;
interface QueueItem {
  resolve: (value: string | null) => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/users/token/refresh/`,
          { refresh: refreshToken },
        );

        const { access, refresh } = response.data;

        // Update tokens
        useAuthStore.getState().setTokens(access, refresh);

        // Update auth header for original request
        api.defaults.headers.common["Authorization"] = "Bearer " + access;
        originalRequest.headers["Authorization"] = "Bearer " + access;

        processQueue(null, access);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Log more detail for debugging
    if (error.response) {
      console.error(
        `API Error (${error.response.status}):`,
        error.response.data,
      );
    } else if (error.request) {
      console.error("API Error (No Response):", error.request);
    } else {
      console.error("API Error (Setup):", error.message);
    }
    return Promise.reject(error);
  },
);

// ... existing code ...

export const subscribeToPush = async (subscription: PushSubscription) => {
  const response = await api.post(
    "/notifications/push/subscribe/",
    subscription,
  );
  return response.data;
};

export const getVapidPublicKey = async () => {
  const response = await api.get("/notifications/push/key/");
  return response.data.publicKey;
};

export default api;
