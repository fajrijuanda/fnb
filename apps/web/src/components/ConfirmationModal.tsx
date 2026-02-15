'use client';

import { LucideIcon, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ConfirmationVariant = 'danger' | 'primary' | 'success' | 'warning';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmationVariant;
    icon?: LucideIcon;
    isLoading?: boolean;
}

const VARIANT_STYLES: Record<ConfirmationVariant, {
    bg: string;
    text: string;
    button: string;
    buttonHover: string;
    iconBg: string;
    defaultIcon: LucideIcon;
}> = {
    danger: {
        bg: 'bg-red-500',
        text: 'text-red-500',
        button: 'bg-red-500',
        buttonHover: 'hover:bg-red-600',
        iconBg: 'bg-red-100 dark:bg-red-500/10',
        defaultIcon: Trash2
    },
    primary: {
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        button: 'bg-blue-500',
        buttonHover: 'hover:bg-blue-600',
        iconBg: 'bg-blue-100 dark:bg-blue-500/10',
        defaultIcon: Info
    },
    success: {
        bg: 'bg-green-500',
        text: 'text-green-500',
        button: 'bg-green-500',
        buttonHover: 'hover:bg-green-600',
        iconBg: 'bg-green-100 dark:bg-green-500/10',
        defaultIcon: CheckCircle
    },
    warning: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-500',
        button: 'bg-yellow-500',
        buttonHover: 'hover:bg-yellow-600',
        iconBg: 'bg-yellow-100 dark:bg-yellow-500/10',
        defaultIcon: AlertTriangle
    }
};

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Konfirmasi',
    cancelLabel = 'Batal',
    variant = 'primary',
    icon,
    isLoading = false
}: ConfirmationModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted || !isVisible) return null;

    const styles = VARIANT_STYLES[variant];
    const Icon = icon || styles.defaultIcon;

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={isLoading ? undefined : onClose}
            />

            {/* Modal Card */}
            <div className={cn(
                "relative w-full max-w-sm bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden",
                "transform transition-none" // Kept simple fading as per previous patterns
            )}>
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center mb-2",
                        styles.iconBg
                    )}>
                        <Icon className={cn("h-8 w-8", styles.text)} />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex w-full gap-3 pt-4">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                // Note: We don't close here automatically if isLoading might be handled by parent,
                                // but for this simple modal pattern usually parent handles async then closes.
                                // If parent handles close, this is fine. 
                            }}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
                                styles.button,
                                styles.buttonHover,
                                styles.bg === 'bg-red-500' ? 'shadow-red-500/20' :
                                    styles.bg === 'bg-blue-500' ? 'shadow-blue-500/20' :
                                        styles.bg === 'bg-green-500' ? 'shadow-green-500/20' : 'shadow-yellow-500/20'
                            )}
                        >
                            {isLoading ? 'Memproses...' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
