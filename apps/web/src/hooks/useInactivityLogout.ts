import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastContext";

const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour in milliseconds
const CHECK_INTERVAL = 60 * 1000; // Check every 1 minute

export function useInactivityLogout() {
  const { logout, isAuthenticated, lastActivity, updateActivity } =
    useAuthStore();
  const router = useRouter();
  const { error } = useToast();

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/login");
    error("Sesi Anda telah berakhir karena tidak ada aktivitas.");
  }, [logout, router, error]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastActivity > INACTIVITY_LIMIT) {
        handleLogout();
      }
    };

    const interval = setInterval(checkInactivity, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];

    const resetTimer = () => {
      updateActivity();
    };

    // Throttle updates to avoid spamming store updates on every pixel scroll
    let lastUpdate = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastUpdate > 5000) {
        // Update max once every 5 seconds
        resetTimer();
        lastUpdate = now;
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledReset);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledReset);
      });
    };
  }, [isAuthenticated, updateActivity]);
}
