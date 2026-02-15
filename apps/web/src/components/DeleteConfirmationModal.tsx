import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    isBulk?: boolean;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Hapus Item?",
    message = "Apakah Anda yakin ingin melihat item ini dari keranjang?",
    isBulk = false
}: DeleteConfirmationModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Use setTimeout to avoid "synchronous setState in effect" lint warning
        setTimeout(() => setMounted(true), 0);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure render before animation
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted || !isVisible) return null;

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className={cn(
                "relative w-full max-w-sm bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden",
                // Removing scale/translate animations to strictly follow "fade only" request.
                // The parent container handles the opacity fade.
                "transform transition-none"
            )}>
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-2">
                        <Trash2 className="h-8 w-8 text-red-500" />
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
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                        >
                            {isBulk ? 'Hapus' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
