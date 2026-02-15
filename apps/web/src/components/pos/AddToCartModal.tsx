'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, MessageSquare, X } from 'lucide-react';
import { Product } from '@/types/api';
import { formatRupiah } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AddToCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onConfirm: (product: Product, quantity: number, note: string) => void;
}

export function AddToCartModal({ isOpen, onClose, product, onConfirm }: AddToCartModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuantity(1);
            setNote('');
            setIsAnimating(true);
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    if (!product) return null;

    const handleConfirm = () => {
        onConfirm(product, quantity, note);
        onClose();
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
                                src={product.image_url}
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
                    <label className="text-sm font-medium text-card-foreground">Jumlah</label>
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
                        rows={3}
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
