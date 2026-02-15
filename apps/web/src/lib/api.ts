import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Axios instance configured for CloudPOS API
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
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

export default api;
