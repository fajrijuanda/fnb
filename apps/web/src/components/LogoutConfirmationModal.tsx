'use client';

import { LogOut, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LogoutConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function LogoutConfirmationModal({ isOpen, onClose, onConfirm }: LogoutConfirmationModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        // Prevent body scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
            setMounted(false);
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-500">
                        <LogOut size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Konfirmasi Keluar
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Apakah Anda yakin ingin keluar dari aplikasi?
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={onConfirm}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
                        >
                            Ya, Keluar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
