'use client';

import { useState } from 'react';
import { useShiftStore } from '@/store/useShiftStore';
import { Loader2, X } from 'lucide-react';

interface CloseShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CloseShiftModal({ isOpen, onClose }: CloseShiftModalProps) {
    const { closeShift, isLoading, error } = useShiftStore();
    const [actualCash, setActualCash] = useState<string>('');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cash = parseInt(actualCash.replace(/\D/g, ''), 10);
        if (isNaN(cash)) return;

        try {
            await closeShift(cash, notes);
            onClose();
        } catch {
            // Error handled in store
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tutup Kasir (End Shift)</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Hitung total uang tunai di laci.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="actual-cash" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total Uang Fisik
                        </label>
                        <input
                            id="actual-cash"
                            type="text"
                            value={actualCash}
                            onChange={(e) => setActualCash(e.target.value)}
                            placeholder="Rp 0"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="notes" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Catatan
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Selisih, pengeluaran kas kecil, dll."
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[80px]"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">{error}</p>}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !actualCash}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Menutup...
                                </>
                            ) : (
                                'Tutup Kasir & Logout'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
