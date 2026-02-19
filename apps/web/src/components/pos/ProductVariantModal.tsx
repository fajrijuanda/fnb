'use client';

import { useState } from 'react';
import { X, Minus, Plus, Check, ImageOff } from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import type { Product, ProductVariant, ModifierOption } from '@/types/api';

interface ProductVariantModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    onAddToOrder: (
        product: Product,
        quantity: number,
        variant?: ProductVariant,
        modifiers?: ModifierOption[],
        note?: string
    ) => void;
}

export function ProductVariantModal({ isOpen, onClose, product, onAddToOrder }: ProductVariantModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [modifierCounts, setModifierCounts] = useState<Record<number, number>>({});
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    // Variants Logic
    const hasVariants = product.variants && product.variants.length > 0;

    const handleVariantSelect = (id: number) => {
        setSelectedVariantId(id);
    };

    const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;

    const getGroupTotalCount = (groupId: number) => {
        let total = 0;
        const group = product.modifier_groups?.find(g => g.id === groupId);
        if (!group) return 0;

        group.options.forEach(opt => {
            total += modifierCounts[opt.id] || 0;
        });
        return total;
    };

    const handleModifierChange = (groupId: number, optionId: number, delta: number) => {
        const group = product.modifier_groups?.find(g => g.id === groupId);
        if (!group) return;

        const currentGroupCount = getGroupTotalCount(groupId);
        const currentOptionCount = modifierCounts[optionId] || 0;

        // Check limits
        if (delta > 0) {
            // Increment
            if (currentGroupCount >= group.max_selection) return; // Group max reached
        } else {
            // Decrement
            if (currentOptionCount <= 0) return;
        }

        setModifierCounts(prev => {
            const newCount = (prev[optionId] || 0) + delta;

            if (newCount <= 0) {
                const next = { ...prev };
                delete next[optionId];
                return next;
            }

            return { ...prev, [optionId]: newCount };
        });
    };

    const calculateTotal = () => {
        let total = product.price;

        // Variant
        if (selectedVariantId) {
            const variant = product.variants?.find(v => v.id === selectedVariantId);
            if (variant) total += variant.price_adjustment;
        }

        // Modifiers prices are for inventory tracking only, not added to total price
        // product.modifier_groups?.forEach(group => {
        //     group.options.forEach(opt => {
        //         const count = modifierCounts[opt.id] || 0;
        //         total += opt.price_adjustment * count;
        //     });
        // });

        return total * quantity;
    };

    const isValid = () => {
        if (hasVariants && !selectedVariantId) return false;

        // Check Min Selections for modifier groups
        let validModifiers = true;
        product.modifier_groups?.forEach(group => {
            const count = getGroupTotalCount(group.id);
            if (count < group.min_selection) validModifiers = false;
        });

        return validModifiers;
    };

    const handleSubmit = () => {
        const variant = product.variants?.find(v => v.id === selectedVariantId);
        const modifiers: ModifierOption[] = [];

        product.modifier_groups?.forEach(group => {
            group.options.forEach(opt => {
                const count = modifierCounts[opt.id] || 0;
                for (let i = 0; i < count; i++) {
                    modifiers.push(opt);
                }
            });
        });

        onAddToOrder(product, quantity, variant, modifiers, note);
        // Reset and close
        setQuantity(1);
        setSelectedVariantId(null);
        setModifierCounts({});
        setNote('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full sm:max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 font-sans">

                {/* Header */}
                <div className="flex items-start gap-4 p-5 shrink-0 border-b border-gray-100 dark:border-white/5 relative">
                    {/* Thumbnail */}
                    <div className="h-20 w-20 shrink-0 rounded-2xl bg-gray-100 dark:bg-white/5 overflow-hidden border border-gray-100 dark:border-white/10">
                        {product.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageOff size={24} />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {product.name}
                        </h2>
                        <p className="text-primary font-bold text-base mt-1">
                            {formatRupiah(product.price)}
                        </p>
                        {product.description && (
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                {product.description}
                            </p>
                        )}
                    </div>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">



                    {/* Variants */}
                    {hasVariants && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Pilih Varian
                                </label>
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                                    Wajib
                                </span>
                            </div>
                            <div className="space-y-2">
                                {product.variants?.map(variant => (
                                    <button
                                        key={variant.id}
                                        onClick={() => handleVariantSelect(variant.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm",
                                            selectedVariantId === variant.id
                                                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                                                : "border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600"
                                        )}
                                    >
                                        <span className={cn("font-medium", selectedVariantId === variant.id ? "text-primary" : "text-gray-700 dark:text-gray-300")}>
                                            {variant.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {variant.price_adjustment !== 0 && (
                                                <span className="text-xs text-gray-500">
                                                    +{formatRupiah(variant.price_adjustment)}
                                                </span>
                                            )}
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border flex items-center justify-center",
                                                selectedVariantId === variant.id ? "border-primary bg-primary text-white" : "border-gray-300 dark:border-gray-600"
                                            )}>
                                                {selectedVariantId === variant.id && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Modifier Groups */}
                    {hasModifiers && product.modifier_groups?.map(group => {
                        const currentCount = getGroupTotalCount(group.id);
                        const isMaxed = currentCount >= group.max_selection;

                        return (
                            <div key={group.id} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {group.name}
                                    </label>
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-0.5 rounded-full",
                                        isMaxed ? "text-red-500 bg-red-50" : "text-gray-500 bg-gray-100 dark:bg-white/10"
                                    )}>
                                        {currentCount} / {group.max_selection} Pcs
                                    </span>
                                </div>

                                <div className="divide-y divide-gray-100 dark:divide-white/5 border-t border-b border-gray-100 dark:border-white/5">
                                    {group.options.map(option => {
                                        const count = modifierCounts[option.id] || 0;
                                        const isDisabled = option.mitra_availability === false;
                                        // Can increment if not disabled AND (not maxed OR count > 0 for this option although logic for max is handled in handler, visual disabled state important)
                                        // Actually simplest disabled logic: can't plus if maxed.

                                        return (
                                            <div key={option.id} className="flex items-center justify-between py-3">
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-sm font-medium",
                                                        isDisabled ? "text-gray-400" : "text-gray-900 dark:text-white"
                                                    )}>
                                                        {option.name}
                                                    </span>
                                                    {/* Price hidden as per request (inventory only) */}
                                                    {/* {option.price_adjustment > 0 && (
                        <span className="text-[10px] text-gray-500">
                            +{formatRupiah(option.price_adjustment)}
                        </span>
                    )} */}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {count > 0 ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleModifierChange(group.id, option.id, -1)}
                                                                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <span className="text-sm font-bold w-4 text-center text-gray-900 dark:text-white">{count}</span>
                                                            <button
                                                                onClick={() => handleModifierChange(group.id, option.id, 1)}
                                                                disabled={isMaxed}
                                                                className="w-7 h-7 rounded-lg bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-sm font-medium text-gray-400 w-4 text-center">0</span>
                                                            <button
                                                                onClick={() => handleModifierChange(group.id, option.id, 1)}
                                                                disabled={isDisabled || isMaxed}
                                                                className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <span className="w-5 h-5 rounded bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                                {/* Message icon substitute */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            </span>
                            Catatan (Opsional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Contoh: Jangan terlalu pedas, es sedikit..."
                            className="w-full rounded-xl bg-gray-50 dark:bg-white/5 p-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all border border-gray-100 dark:border-white/10 resize-none h-24"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] shrink-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-1 border border-gray-100 dark:border-white/5">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm disabled:opacity-30 transition-all font-bold"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="text-base font-bold text-gray-900 dark:text-white min-w-[2ch] text-center">
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500">Total Harga</span>
                            <span className="font-bold text-gray-900 dark:text-white text-xl">
                                {formatRupiah(calculateTotal())}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!isValid()}
                        className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Tambah Pesanan
                    </button>
                </div>

            </div>
        </div>
    );
}
