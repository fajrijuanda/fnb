'use client';

import { useState } from 'react';
import { useShiftStore } from '@/store/useShiftStore';
import { useToast } from '@/components/ToastContext';
import { Loader2 } from 'lucide-react';

export function OpenShiftModal() {
    const { openShift, isLoading, error } = useShiftStore();
    const { success } = useToast();
    const [initialCash, setInitialCash] = useState<string>('');

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cash = parseInt(initialCash.replace(/\D/g, ''), 10);
        if (isNaN(cash)) return;

        try {
            await openShift(cash);
            success(`Shift berhasil dibuka! Modal awal: ${formatCurrency(cash)}`);
        } catch {
            // Error handled in store
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Buka Kasir (Start Shift)</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Masukkan jumlah uang tunai di laci kasir untuk memulai shift.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="initial-cash" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Modal Awal
                        </label>
                        <input
                            id="initial-cash"
                            type="text"
                            value={initialCash}
                            onChange={(e) => setInitialCash(e.target.value)}
                            placeholder="Rp 0"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            autoFocus
                            required
                        />
                    </div>

                    {initialCash && !isNaN(parseInt(initialCash.replace(/\D/g, ''))) && (
                        <p className="text-right text-sm text-gray-500">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseInt(initialCash.replace(/\D/g, '')))}
                        </p>
                    )}

                    {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">{error}</p>}

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading || !initialCash}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Membuka Shift...
                                </>
                            ) : (
                                'Buka Kasir'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
