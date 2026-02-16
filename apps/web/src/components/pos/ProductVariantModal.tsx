'use client';

import { useState } from 'react';
import { X, Minus, Plus, Check, ImageOff } from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import type { Product, ProductVariant, ModifierGroup, ModifierOption } from '@/types/api';

const MAX_TOPPINGS = 3;

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
    const [selectedModifierIds, setSelectedModifierIds] = useState<number[]>([]);
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    // Variants Logic
    const hasVariants = product.variants && product.variants.length > 0;

    const handleVariantSelect = (id: number) => {
        setSelectedVariantId(id);
    };

    // Collect all topping options across all modifier groups
    const allModifierOptions: { option: ModifierOption; group: ModifierGroup }[] = [];
    product.modifier_groups?.forEach(group => {
        group.options.forEach(opt => {
            allModifierOptions.push({ option: opt, group });
        });
    });
    const hasModifiers = allModifierOptions.length > 0;

    const handleModifierToggle = (optionId: number) => {
        const isSelected = selectedModifierIds.includes(optionId);

        if (isSelected) {
            setSelectedModifierIds(prev => prev.filter(id => id !== optionId));
            return;
        }

        // Enforce max 3 toppings globally
        if (selectedModifierIds.length >= MAX_TOPPINGS) {
            return;
        }

        setSelectedModifierIds(prev => [...prev, optionId]);
    };

    const calculateTotal = () => {
        let total = product.price;

        // Variant
        if (selectedVariantId) {
            const variant = product.variants?.find(v => v.id === selectedVariantId);
            if (variant) total += variant.price_adjustment;
        }

        // Modifiers
        allModifierOptions.forEach(({ option }) => {
            if (selectedModifierIds.includes(option.id)) {
                total += option.price_adjustment;
            }
        });

        return total * quantity;
    };

    const isValid = () => {
        if (hasVariants && !selectedVariantId) return false;

        // Check Min Selections for modifier groups
        let validModifiers = true;
        product.modifier_groups?.forEach(group => {
            const count = selectedModifierIds.filter(id => group.options.some(opt => opt.id === id)).length;
            if (count < group.min_selection) validModifiers = false;
        });

        return validModifiers;
    };

    const handleSubmit = () => {
        const variant = product.variants?.find(v => v.id === selectedVariantId);
        const modifiers: ModifierOption[] = [];

        allModifierOptions.forEach(({ option }) => {
            if (selectedModifierIds.includes(option.id)) {
                modifiers.push(option);
            }
        });

        onAddToOrder(product, quantity, variant, modifiers, note);
        // Reset and close
        setQuantity(1);
        setSelectedVariantId(null);
        setSelectedModifierIds([]);
        setNote('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full sm:max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

                {/* Drag Handle (Mobile) */}
                <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
                    <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
                </div>

                {/* Product Image & Info Header */}
                <div className="relative shrink-0">
                    {product.image_url ? (
                        <div className="h-40 sm:h-48 w-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>
                    ) : (
                        <div className="h-32 w-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                            <ImageOff className="h-10 w-10 text-gray-300 dark:text-white/20" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        </div>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors"
                    >
                        <X className="h-4 w-4 text-white" />
                    </button>

                    {/* Product Name & Description overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h2 className="text-lg font-bold text-white drop-shadow-lg line-clamp-1">
                            {product.name}
                        </h2>
                        {product.description && (
                            <p className="text-xs text-white/80 mt-0.5 line-clamp-2 drop-shadow">
                                {product.description}
                            </p>
                        )}
                        <p className="text-sm font-bold text-white mt-1 drop-shadow-lg">
                            {formatRupiah(product.price)}
                        </p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">

                    {/* Variants Section */}
                    {hasVariants && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                Pilih Varian <span className="text-red-500">*</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {product.variants?.map(variant => (
                                    <button
                                        key={variant.id}
                                        onClick={() => handleVariantSelect(variant.id)}
                                        className={cn(
                                            "relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all",
                                            selectedVariantId === variant.id
                                                ? "border-primary bg-primary/5 dark:bg-primary/20 ring-1 ring-primary"
                                                : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                        )}
                                    >
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                                            {variant.name}
                                        </span>
                                        {variant.price_adjustment !== 0 && (
                                            <span className="text-[10px] text-primary dark:text-red-400 mt-0.5 font-medium">
                                                {variant.price_adjustment > 0 ? '+' : ''}{formatRupiah(variant.price_adjustment)}
                                            </span>
                                        )}
                                        {selectedVariantId === variant.id && (
                                            <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Toppings / Modifiers Section */}
                    {hasModifiers && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Pilih Topping
                                </h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium">
                                    {selectedModifierIds.length}/{MAX_TOPPINGS}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {allModifierOptions.map(({ option }) => {
                                    const isSelected = selectedModifierIds.includes(option.id);
                                    const isDisabled = option.mitra_availability === false;
                                    const isMaxed = !isSelected && selectedModifierIds.length >= MAX_TOPPINGS;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleModifierToggle(option.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all",
                                                isSelected
                                                    ? "border-primary bg-primary/5 dark:bg-primary/20"
                                                    : "border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5",
                                                isDisabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-white/5",
                                                isMaxed && !isDisabled && "opacity-40 cursor-not-allowed"
                                            )}
                                            disabled={isDisabled || isMaxed}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn(
                                                    "h-4 w-4 rounded flex items-center justify-center border transition-colors shrink-0",
                                                    isSelected ? "bg-primary border-primary" : "border-gray-300 dark:border-gray-600"
                                                )}>
                                                    {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                                </div>
                                                <span className="text-xs text-gray-700 dark:text-gray-200">{option.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {option.price_adjustment !== 0 && (
                                                    <span className="text-[10px] font-medium text-primary dark:text-red-400">
                                                        +{formatRupiah(option.price_adjustment)}
                                                    </span>
                                                )}
                                                {isDisabled && (
                                                    <span className="text-[10px] font-bold text-red-500">HABIS</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Note */}
                    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">Jumlah</span>
                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 rounded-full p-0.5">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="h-7 w-7 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="font-bold text-sm text-gray-900 dark:text-white w-5 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="h-7 w-7 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-900 dark:text-white">
                                Catatan (Opsional)
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Contoh: Kurangi es, cabe dipisah..."
                                className="w-full rounded-xl bg-gray-50 dark:bg-white/5 p-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-gray-100 dark:border-white/10 resize-none h-16"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid()}
                        className="w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-red-600 text-white font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                        <span className="text-sm">Tambah ke Pesanan</span>
                        <span className="text-sm">{formatRupiah(calculateTotal())}</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
