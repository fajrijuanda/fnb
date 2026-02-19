'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const success = (message: string) => addToast(message, 'success');
    const error = (message: string) => addToast(message, 'error');
    const warning = (message: string) => addToast(message, 'warning');
    const info = (message: string) => addToast(message, 'info');

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const [isExiting, setIsExiting] = useState(false);

    // Auto-dismiss timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Handle removal after exit animation
    useEffect(() => {
        if (isExiting) {
            const timer = setTimeout(() => {
                onRemove(toast.id);
            }, 500); // Match exit animation duration
            return () => clearTimeout(timer);
        }
    }, [isExiting, toast.id, onRemove]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const borderColors = {
        success: 'border-green-500/20 bg-green-50 dark:bg-green-900/10',
        error: 'border-red-500/20 bg-red-50 dark:bg-red-900/10',
        warning: 'border-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10',
        info: 'border-blue-500/20 bg-blue-50 dark:bg-blue-900/10',
    };

    return (
        <div
            className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-500 ease-in-out transform",
                isExiting
                    ? "opacity-0 translate-x-full"
                    : "opacity-100 translate-x-0",
                "bg-white dark:bg-[#1a1a1a] dark:text-white",
                borderColors[toast.type]
            )}
        >
            <div className="shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
                onClick={() => setIsExiting(true)}
                className="shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
                <X className="h-4 w-4 opacity-50" />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
