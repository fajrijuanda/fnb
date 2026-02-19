'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, MessageSquare, X } from 'lucide-react';
import { Product } from '@/types/api';
import { formatRupiah, cn, getImageUrl } from '@/lib/utils';
import { TOPPING_OPTIONS, PRODUCT_VARIANT_MAP, MAX_TOPPINGS } from '@/lib/constants';

interface AddToCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onConfirm: (product: Product, quantity: number, note: string) => void;
}

export function AddToCartModal({ isOpen, onClose, product, onConfirm }: AddToCartModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    const [toppings, setToppings] = useState<Record<string, number>>({});
    const [isAnimating, setIsAnimating] = useState(false);

    // Determine max toppings based on product name, capped at MAX_TOPPINGS (7)
    const maxToppings = product ? Math.min(PRODUCT_VARIANT_MAP[product.name] || 0, MAX_TOPPINGS) : 0;
    const currentToppingCount = Object.values(toppings).reduce((a, b) => a + b, 0);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuantity(1);
            setNote('');
            setToppings({});
            setIsAnimating(true);
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    if (!product) return null;

    const handleConfirm = () => {
        let finalNote = note;

        // Append toppings to note if any selected
        if (currentToppingCount > 0) {
            const toppingSummary = Object.entries(toppings)
                .filter(([, count]) => count > 0)
                .map(([name, count]) => `${count} ${name}`)
                .join(', ');

            if (toppingSummary) {
                finalNote = finalNote ? `${finalNote} | Varian: ${toppingSummary}` : `Varian: ${toppingSummary}`;
            }
        }

        onConfirm(product, quantity, finalNote);
        onClose();
    };

    const handleToppingChange = (topping: string, delta: number) => {
        setToppings(prev => {
            const current = prev[topping] || 0;
            const newCount = Math.max(0, current + delta);

            // Check if adding exceeds max limit
            if (delta > 0 && currentToppingCount >= maxToppings) {
                return prev;
            }

            return { ...prev, [topping]: newCount };
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-sm rounded-[2rem] bg-card p-6 shadow-2xl transition-all duration-300 transform",
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                )}
            >
                {/* Close Button */}
                <div className="absolute right-4 top-4 z-10">
                    <button
                        onClick={onClose}
                        className="rounded-full bg-black/5 p-2 text-foreground/50 transition-colors hover:bg-black/10 hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Product Info */}
                <div className="mt-4 flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={getImageUrl(product.image_url)}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                                🍽️
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-card-foreground">{product.name}</h3>
                        <p className="font-bold text-lg text-primary">
                            {formatRupiah(product.price)}
                        </p>
                        {product.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {product.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quantity */}
                <div className="mt-6">
                    <label className="text-sm font-medium text-card-foreground">Jumlah Paket</label>
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-border p-2">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
                            disabled={quantity <= 1}
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-lg font-bold text-card-foreground">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors bg-gradient-to-r from-primary to-red-600 shadow-md shadow-primary/20 hover:scale-105 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Topping Mix Selection */}
                {maxToppings > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-card-foreground">
                                Pilih Varian Topping
                            </label>
                            <span className={cn(
                                "text-xs font-bold px-2 py-1 rounded-full",
                                currentToppingCount === maxToppings
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-red-50 text-primary dark:bg-primary/10"
                            )}>
                                {currentToppingCount} / {maxToppings} Pcs
                            </span>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
                            {TOPPING_OPTIONS.map((topping) => {
                                const count = toppings[topping] || 0;
                                return (
                                    <div key={topping} className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
                                        <span className="text-sm text-card-foreground">{topping}</span>
                                        <div className="flex items-center gap-3">
                                            {count > 0 && (
                                                <button
                                                    onClick={() => handleToppingChange(topping, -1)}
                                                    className="h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                            )}
                                            <span className={cn("text-sm font-bold w-4 text-center", count > 0 ? "text-primary" : "text-muted-foreground")}>
                                                {count}
                                            </span>
                                            <button
                                                onClick={() => handleToppingChange(topping, 1)}
                                                disabled={currentToppingCount >= maxToppings}
                                                className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div className="mt-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                        <MessageSquare className="h-4 w-4" />
                        Catatan (Opsional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Contoh: Jangan terlalu pedas, es sedikit..."
                        className="mt-2 text-card-foreground w-full resize-none rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        rows={2}
                    />
                </div>

                {/* Total & Action */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Total Harga</span>
                        <span className="text-lg font-bold text-card-foreground">
                            {formatRupiah(product.price * quantity)}
                        </span>
                    </div>

                    <button
                        onClick={handleConfirm}
                        className="flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-red-600"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        Tambah Pesanan
                    </button>
                </div>
            </div>
        </div>
    );
}
