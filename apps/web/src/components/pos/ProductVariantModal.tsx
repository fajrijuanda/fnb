'use client';

import { useState } from 'react';
import { X, Minus, Plus, Check } from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import type { Product, ProductVariant, ModifierGroup, ModifierOption } from '@/types/api';

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
    // Default select first variant if strictly required? Maybe not.
    // Let's force selection if variants exist.

    const handleVariantSelect = (id: number) => {
        setSelectedVariantId(id);
    };

    const handleModifierToggle = (group: ModifierGroup, optionId: number) => {
        // Find current selections for this group
        const currentGroupSelections = selectedModifierIds.filter(id =>
            group.options.some(opt => opt.id === id)
        );

        const isSelected = selectedModifierIds.includes(optionId);

        if (isSelected) {
            setSelectedModifierIds(prev => prev.filter(id => id !== optionId));
            return;
        }

        // Check Max Selection
        if (group.max_selection === 1) {
            // Radio behavior: remove other options from this group
            const newSelections = selectedModifierIds.filter(id => !group.options.some(opt => opt.id === id));
            setSelectedModifierIds([...newSelections, optionId]);
        } else {
            // Check limit
            if (currentGroupSelections.length < group.max_selection) {
                setSelectedModifierIds(prev => [...prev, optionId]);
            }
        }
    };

    const calculateTotal = () => {
        let total = product.price;

        // Variant
        if (selectedVariantId) {
            const variant = product.variants?.find(v => v.id === selectedVariantId);
            if (variant) total += variant.price_adjustment;
        }

        // Modifiers
        product.modifier_groups?.forEach(group => {
            group.options.forEach(opt => {
                if (selectedModifierIds.includes(opt.id)) {
                    total += opt.price_adjustment;
                }
            });
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

        product.modifier_groups?.forEach(group => {
            group.options.forEach(opt => {
                if (selectedModifierIds.includes(opt.id)) {
                    modifiers.push(opt);
                }
            });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                        {product.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Variants Section */}
                    {hasVariants && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                Pilih Varian <span className="text-red-500">*</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {product.variants?.map(variant => (
                                    <button
                                        key={variant.id}
                                        onClick={() => handleVariantSelect(variant.id)}
                                        className={cn(
                                            "relative flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                                            selectedVariantId === variant.id
                                                ? "border-primary bg-primary/5 dark:bg-primary/20 ring-1 ring-primary"
                                                : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                                        )}
                                    >
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {variant.name}
                                        </span>
                                        {variant.price_adjustment !== 0 && (
                                            <span className="text-xs text-primary dark:text-red-400 mt-1 font-medium">
                                                {variant.price_adjustment > 0 ? '+' : ''}{formatRupiah(variant.price_adjustment)}
                                            </span>
                                        )}
                                        {selectedVariantId === variant.id && (
                                            <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Modifiers Section */}
                    {product.modifier_groups?.map(group => (
                        <div key={group.id} className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                                {group.name}
                                {group.min_selection > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold">
                                        Wajib Pilih {group.min_selection}
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-2">
                                {group.options.map(option => {
                                    const isSelected = selectedModifierIds.includes(option.id);
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleModifierToggle(group, option.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                                                isSelected
                                                    ? "border-primary bg-primary/5 dark:bg-primary/20"
                                                    : "border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-5 w-5 rounded flex items-center justify-center border transition-colors",
                                                    isSelected ? "bg-primary border-primary" : "border-gray-300 dark:border-gray-600"
                                                )}>
                                                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                                </div>
                                                <span className="text-sm text-gray-700 dark:text-gray-200">{option.name}</span>
                                            </div>
                                            {option.price_adjustment !== 0 && (
                                                <span className="text-xs font-medium text-primary dark:text-red-400">
                                                    +{formatRupiah(option.price_adjustment)}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Quantity & Note */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Jumlah</span>
                            <div className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 rounded-full p-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="h-8 w-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="font-bold text-gray-900 dark:text-white w-6 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="h-8 w-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-900 dark:text-white">
                                Catatan (Opsional)
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Contoh: Kurangi es, cabe dipisah..."
                                className="w-full rounded-xl bg-gray-100 dark:bg-white/5 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border-none resize-none h-20"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 backdrop-blur-md">
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid()}
                        className="w-full flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-red-600 text-white font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span>Tambah ke Pesanan</span>
                        <span>{formatRupiah(calculateTotal())}</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
