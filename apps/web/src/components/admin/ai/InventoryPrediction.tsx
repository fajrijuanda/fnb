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
        <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-primary/30 rounded-xl p-4 flex items-start gap-4 shadow-sm">
            <div className="p-2 bg-red-100 dark:bg-primary/20 rounded-lg text-red-700 dark:text-red-500 shrink-0">
                <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-red-900 dark:text-red-300 text-sm mb-1 flex items-center gap-2">
                    Prediksi AI: Peringatan Stok
                    <span className="px-1.5 py-0.5 bg-red-300 dark:bg-primary/40 rounded text-[10px] uppercase">
                        Action Required
                    </span>
                </h4>
                {loading ? (
                    <div className="h-4 w-3/4 bg-red-300 dark:bg-primary/30 rounded animate-pulse" />
                ) : (
                    <p className="text-sm text-red-800 dark:text-red-400 leading-relaxed">
                        {prediction}
                    </p>
                )}
            </div>
        </div>
    );
}
