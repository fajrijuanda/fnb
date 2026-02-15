'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface AIGenerateButtonProps {
    productName: string;
    ingredients?: string; // Optional, might be derived or passed
    onGenerate: (desc: string) => void;
}

export function AIGenerateButton({ productName, ingredients, onGenerate }: AIGenerateButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission
        if (!productName) return;

        setLoading(true);
        try {
            const res = await api.post<{ description: string }>('/ai/generate-description/', {
                product_name: productName,
                ingredients: ingredients || 'Standard ingredients'
            });
            onGenerate(res.data.description);
        } catch (error) {
            console.error('Failed to generate description:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={loading || !productName}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generate description with OMDEN AI"
        >
            {loading ? (
                <Loader2 size={12} className="animate-spin" />
            ) : (
                <Sparkles size={12} />
            )}
            {loading ? 'Generating...' : 'Auto-Generate'}
        </button>
    );
}
