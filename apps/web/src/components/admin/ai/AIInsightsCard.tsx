'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import api from '@/lib/api';

export function AIInsightsCard() {
    const [insight, setInsight] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const fetchInsight = async () => {
        setLoading(true);
        try {
            const res = await api.get<{ insight: string }>('/ai/sales-insight/');
            setInsight(res.data.insight);
        } catch (error: unknown) {
            console.error('Failed to fetch AI insight:', error);
            // Check for rate limit or quota errors
            const err = error as { response?: { status?: number; data?: { error?: string } } };
            if (err.response?.status === 429 || err.response?.data?.error?.includes('429') || err.response?.data?.error?.includes('quota')) {
                setInsight('⏳ Batas penggunaan AI tercapai. Silakan coba lagi dalam beberapa menit.');
            } else {
                setInsight('Gagal memuat insight. Silakan coba lagi nanti.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsight();
    }, []);

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={100} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Sparkles size={20} className="text-yellow-300" />
                        </div>
                        <h3 className="font-bold text-lg">AI Sales Insight</h3>
                    </div>
                    <button
                        onClick={fetchInsight}
                        disabled={loading}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                    >
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    {loading && !insight ? (
                        <div className="flex items-center gap-2 text-sm animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                            <span>Menganalisis data penjualan...</span>
                        </div>
                    ) : (
                        <p className="text-sm md:text-base leading-relaxed font-medium">
                            {insight || "Tidak ada data yang cukup untuk analisis."}
                        </p>
                    )}
                </div>

                <p className="text-xs text-indigo-200 mt-3 flex items-center gap-1">
                    Powered by Google Gemini 2.0 Flash
                </p>
            </div>
        </div>
    );
}
