"use client";

import { useEffect, useState, useCallback } from "react";
import { getVapidPublicKey, subscribeToPush } from "@/lib/api";

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export default function NotificationManager() {
    const [, setIsSubscribed] = useState(false);
    // Initialize permission state lazily to avoid setting it in useEffect
    const [permission, setPermission] = useState<NotificationPermission>(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission;
        }
        return "default";
    });

    const subscribeUser = useCallback(async () => {
        if (!("serviceWorker" in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const publicKey = await getVapidPublicKey();

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            await subscribeToPush(subscription);
            setIsSubscribed(true);
            console.log("User subscribed to push notifications");
        } catch (error) {
            console.error("Failed to subscribe the user: ", error);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Register Service Worker
            navigator.serviceWorker
                .register("/sw.js")
                .then(async (registration) => {
                    console.log("Service Worker registered with scope:", registration.scope);

                    // Check if already subscribed
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        setIsSubscribed(true);
                    } else if (Notification.permission === 'granted') {
                        subscribeUser();
                    }
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
        }
    }, [subscribeUser]);



    const requestPermission = async () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
            return;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
            subscribeUser();
        }
    };

    if (permission === 'granted') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={requestPermission}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
                Enable Notifications
            </button>
        </div>
    );
}
