'use client';

import { useState } from 'react';
import { Sparkles, RefreshCcw, TrendingUp, Package, BarChart3 } from 'lucide-react';
import api from '@/lib/api';

type InsightType = 'sales' | 'inventory' | 'prediction';

const INSIGHT_OPTIONS: { type: InsightType; label: string; icon: typeof TrendingUp; endpoint: string }[] = [
    { type: 'sales', label: 'Analisis Penjualan', icon: TrendingUp, endpoint: '/ai/sales-insight/' },
    { type: 'inventory', label: 'Prediksi Stok', icon: Package, endpoint: '/ai/inventory-prediction/' },
];

export function AIInsightsCard() {
    const [insight, setInsight] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [activeType, setActiveType] = useState<InsightType | null>(null);

    const fetchInsight = async (type: InsightType) => {
        setLoading(true);
        setActiveType(type);
        const option = INSIGHT_OPTIONS.find(o => o.type === type);
        if (!option) return;

        try {
            const res = await api.get<{ insight?: string; prediction?: string }>(option.endpoint);
            setInsight(res.data.insight || res.data.prediction || '');
        } catch (error: unknown) {
            console.error('Failed to fetch AI insight:', error);
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

    const handleReset = () => {
        setInsight('');
        setActiveType(null);
    };

    return (
        <div className="bg-gradient-to-br from-[#C5161D] to-[#7f1d1d] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={100} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Sparkles size={20} className="text-red-200" />
                        </div>
                        <h3 className="font-bold text-lg">AI Sales Insight</h3>
                    </div>
                    {activeType && (
                        <button
                            onClick={handleReset}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-xs flex items-center gap-1.5 bg-white/5 px-3"
                        >
                            <BarChart3 size={14} />
                            Pilih Lainnya
                        </button>
                    )}
                </div>

                {!activeType && !loading ? (
                    /* Prompt buttons - no API call until user clicks */
                    <div className="space-y-3">
                        <p className="text-sm text-white/70">Pilih jenis analisis yang ingin Anda lihat:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {INSIGHT_OPTIONS.map((option) => (
                                <button
                                    key={option.type}
                                    onClick={() => fetchInsight(option.type)}
                                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all text-left group"
                                >
                                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                                        <option.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{option.label}</p>
                                        <p className="text-[11px] text-white/50">Klik untuk menganalisis</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Result area */
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm animate-pulse">
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                                <span>Menganalisis data...</span>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm md:text-base leading-relaxed font-medium">
                                    {insight || "Tidak ada data yang cukup untuk analisis."}
                                </p>
                                <button
                                    onClick={() => activeType && fetchInsight(activeType)}
                                    disabled={loading}
                                    className="mt-3 flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                                >
                                    <RefreshCcw size={12} />
                                    Refresh
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <p className="text-xs text-red-200 mt-3 flex items-center gap-1">
                    Powered by Google Gemini 2.0 Flash
                </p>
            </div>
        </div>
    );
}
