'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2, X, ShoppingBag, Check } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useCartStore, type CartItem } from '@/store';
import { formatRupiah, cn } from '@/lib/utils';
import { CheckoutModal, CheckoutSuccessModal } from './CheckoutModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { ReceiptPrint } from './ReceiptPrint';
import { useToast } from '@/components/ToastContext';
import type { OrderResponse } from '@/types/api';

// Primary color constant (Red)
const PRIMARY = '#C5161D';

interface CartSheetProps {
    onClose?: () => void;
}

export function CartSheet({ onClose }: CartSheetProps) {
    const { items, updateQuantity, clearCart, getTotalPrice, removeItem } = useCartStore();
    const { success, warning } = useToast();
    const total = getTotalPrice();

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<OrderResponse | null>(null);

    // Selection & Deletion State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string; cartId: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBulkDelete, setIsBulkDelete] = useState(false);
    const [isClearAll, setIsClearAll] = useState(false);

    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: completedOrder?.invoice_number || 'Receipt',
    });

    // Handle Quantity Update with Safety Check
    const handleUpdateQuantity = (cartId: string, item: CartItem, newQuantity: number) => {
        if (newQuantity === 0) {
            setItemToDelete({ id: item.product.id, name: item.product.name, cartId: cartId });
            setIsBulkDelete(false);
            setIsDeleteModalOpen(true);
        } else {
            updateQuantity(cartId, newQuantity);
        }
    };

    // Handle Checkbox Selection
    const toggleSelection = (cartId: string) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(cartId)) {
            newSelection.delete(cartId);
        } else {
            newSelection.add(cartId);
        }
        setSelectedItems(newSelection);
    };

    // Trigger Bulk Delete
    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return;
        setIsBulkDelete(true);
        setIsDeleteModalOpen(true);
    };

    // Trigger Clear All
    const handleClearAll = () => {
        setIsBulkDelete(false); // Reuse this or add specific flag? Let's use specific flag or just modal message logic.
        // Let's add isClearAll state to be explicit
        setIsClearAll(true);
        setIsDeleteModalOpen(true);
    };

    // Handle Delete Confirmation
    const handleConfirmDelete = () => {
        if (isClearAll) {
            clearCart();
            success('Keranjang berhasil dikosongkan');
            setIsClearAll(false);
        } else if (isBulkDelete) {
            // Delete all selected
            items.forEach(item => {
                if (selectedItems.has(item.cartId)) {
                    removeItem(item.cartId);
                }
            });
            success(`Berhasil menghapus ${selectedItems.size} item`);
            setSelectedItems(new Set());
        } else if (itemToDelete) {
            // Delete single item
            removeItem(itemToDelete.cartId);
            warning(`Item "${itemToDelete.name}" dihapus`);
        }
        setItemToDelete(null);
    };

    const handleCheckoutSuccess = (order: OrderResponse) => {
        setIsCheckoutOpen(false);
        setCompletedOrder(order);
        setIsSuccessOpen(true);
    };

    const handleSuccessClose = () => {
        setIsSuccessOpen(false);
        setCompletedOrder(null);
    };

    return (
        <>
            <div className="flex h-full flex-col bg-transparent">
                {/* Header - Fixed height to match main navbar (h-14 / 56px) */}
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        <h2 className="text-base font-bold text-card-foreground">Keranjang</h2>
                        {items.length > 0 && (
                            <span
                                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white bg-primary"
                            >
                                {items.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {selectedItems.size > 0 ? (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                                title="Hapus item terpilih"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Hapus ({selectedItems.size})</span>
                            </button>
                        ) : (
                            items.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="rounded-lg p-1.5 text-primary hover:bg-red-50 dark:hover:bg-white/5 transition-colors"
                                    title="Kosongkan keranjang"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )
                        )}

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 hover:bg-muted transition-colors lg:hidden"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-3">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <ShoppingBag className="mb-3 h-12 w-12 opacity-30" />
                            <p className="text-xs">Keranjang kosong</p>
                            <p className="mt-1 text-[10px]">Tap produk untuk menambahkan</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {items.map((item) => (
                                <div key={item.product.id} className="flex items-center gap-3 group">
                                    {/* Rounded Checkbox */}
                                    <button
                                        onClick={() => toggleSelection(item.cartId)}
                                        className={cn(
                                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                                            selectedItems.has(item.cartId)
                                                ? "border-primary bg-primary text-white"
                                                : "border-gray-300 dark:border-white/20 hover:border-red-400"
                                        )}
                                    >
                                        {selectedItems.has(item.cartId) && <Check className="h-3.5 w-3.5" />}
                                    </button>

                                    {/* Product Image */}
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                        {item.product.image_url ? (
                                            <Image
                                                src={item.product.image_url}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 48px, 48px"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-lg">
                                                🍽️
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex flex-1 flex-col min-w-0">
                                        <h3 className="line-clamp-1 text-sm font-bold text-gray-900 dark:text-white">
                                            {item.product.name}
                                        </h3>
                                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                                            {item.variant && (
                                                <p className="font-medium text-primary dark:text-red-400">
                                                    {item.variant.name} ({formatRupiah(item.variant.price_adjustment)})
                                                </p>
                                            )}
                                            {item.modifiers && item.modifiers.length > 0 && (
                                                <p className="italic">
                                                    {item.modifiers.map(m => m.name).join(', ')}
                                                </p>
                                            )}
                                            {item.note && (
                                                <p className="italic text-gray-400">
                                                    &quot;{item.note}&quot;
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium mt-1" style={{ color: PRIMARY }}>
                                            {formatRupiah(item.totalPrice)}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="mt-auto flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.cartId, item, item.quantity - 1)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-white"
                                                >
                                                    <Minus className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-colors hover:scale-105 active:scale-95 bg-gradient-to-r from-primary to-red-600 shadow-md shadow-primary/20"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <span className="font-bold text-sm text-gray-900 dark:text-white tracking-tight">
                                                {formatRupiah(item.product.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Total & Checkout */}
                <div className="border-t border-border bg-transparent p-3">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-gray-600 dark:text-white/60 text-xs font-medium">Total</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {formatRupiah(total)}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsCheckoutOpen(true)}
                        disabled={items.length === 0}
                        className="w-full rounded-full py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-red-600"
                    >
                        Bayar Sekarang
                    </button>
                </div>
            </div>

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSuccess={handleCheckoutSuccess}
            />

            {/* Success Modal */}
            <CheckoutSuccessModal
                isOpen={isSuccessOpen}
                order={completedOrder}
                onClose={handleSuccessClose}
                onPrint={handlePrint}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={isClearAll ? "Kosongkan Keranjang?" : (isBulkDelete ? "Hapus Item Terpilih?" : "Hapus Item?")}
                message={isClearAll
                    ? "Apakah Anda yakin ingin menghapus SEMUA item di keranjang?"
                    : (isBulkDelete
                        ? `Apakah Anda yakin ingin menghapus ${selectedItems.size} item yang dipilih dari keranjang?`
                        : `Apakah Anda yakin ingin menghapus "${itemToDelete?.name}" dari keranjang?`
                    )
                }
                isBulk={isBulkDelete || isClearAll}
            />

            {/* Hidden Receipt for Printing */}
            <div className="hidden print:hidden">
                {completedOrder && (
                    <ReceiptPrint ref={receiptRef} order={completedOrder} />
                )}
            </div>
        </>
    );
}

export default CartSheet;
