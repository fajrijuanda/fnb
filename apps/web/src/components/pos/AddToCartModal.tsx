'use client';

import { useState } from 'react';
import { Minus, Plus, X, MessageSquare, ShoppingCart } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import type { Product } from '@/types/api';

interface AddToCartModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
    onConfirm: (product: Product, quantity: number, note: string) => void;
}

export function AddToCartModal({ isOpen, product, onClose, onConfirm }: AddToCartModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    if (!isOpen || !product) return null;

    // Reset state when opening (this might need useEffect if component persists)
    // But since we render conditionally or key it, simplified here.
    // Better to use key={product.id} in parent.

    const handleConfirm = () => {
        onConfirm(product, quantity, note);
        setQuantity(1); // Reset for next use
        setNote('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-2xl bg-card p-6 opacity-100 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <h2 className="text-lg font-bold text-card-foreground">Tambah Pesanan</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Product Info */}
                <div className="mt-4 flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {product.image_url ? (
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
                        <p className="font-bold text-lg text-orange-600">
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
                            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95"
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
                        className="mt-2 text-card-foreground w-full resize-none rounded-xl border border-border bg-background p-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
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
                        className="flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-orange-600"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        Tambah Pesanan
                    </button>
                </div>
            </div>
        </div>
    );
}
