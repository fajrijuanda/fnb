'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export function InventoryPrediction() {
    const [prediction, setPrediction] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPrediction = async () => {
            setLoading(true);
            try {
                const res = await api.get<{ prediction: string }>('/ai/inventory-prediction/');
                setPrediction(res.data.prediction);
            } catch (error) {
                console.error('Failed to fetch prediction:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrediction();
    }, []);

    if (!prediction || prediction.includes("Stok aman")) return null;

    return (
        <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-xl p-4 flex items-start gap-4 shadow-sm">
            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-orange-800 dark:text-orange-200 text-sm mb-1 flex items-center gap-2">
                    Prediksi AI: Peringatan Stok
                    <span className="px-1.5 py-0.5 bg-orange-200 dark:bg-orange-500/40 rounded text-[10px] uppercase">
                        Action Required
                    </span>
                </h4>
                {loading ? (
                    <div className="h-4 w-3/4 bg-orange-200 dark:bg-orange-500/30 rounded animate-pulse" />
                ) : (
                    <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                        {prediction}
                    </p>
                )}
            </div>
        </div>
    );
}
