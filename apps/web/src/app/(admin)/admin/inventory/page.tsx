'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { InventoryPrediction } from '@/components/admin/ai/InventoryPrediction';
import {
    Lock, Phone, Plus, AlertTriangle, CheckCircle, RefreshCw,
    X, Pencil, Trash2, Loader2, Save, ShoppingCart,
    Package, ClipboardList, History, Truck, Clock, CheckCircle2, XCircle, CreditCard,
    Upload, Eye, Copy, Timer, ShieldCheck, ShieldAlert, ShieldX
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { extractApiArray } from '@/lib/api-utils';
import type { Ingredient, ApiResponse, RestockOrder, RestockOrderStatus, RestockPaymentMethod } from '@/types/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSearchHeader } from '@/components/admin/AdminSearchHeader';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { StatCard } from '@/components/admin/StatCard';
import { useToast } from '@/components/ToastContext';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { FormSelect } from '@/components/admin/FormSelect';

// ── Constants ──
const SHIPPING_RATES: Record<string, number> = {
    'jakarta': 15000, 'bandung': 20000, 'surabaya': 30000, 'semarang': 25000,
    'yogyakarta': 25000, 'jogja': 25000, 'malang': 28000, 'solo': 25000,
    'bekasi': 15000, 'tangerang': 15000, 'depok': 15000, 'bogor': 18000,
};
const DEFAULT_SHIPPING = 35000;

function estimateShipping(address: string): number {
    const lower = address.toLowerCase();
    for (const [city, cost] of Object.entries(SHIPPING_RATES)) {
        if (lower.includes(city)) return cost;
    }
    return DEFAULT_SHIPPING;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const UNIT_OPTIONS = [
    { value: 'gram', label: 'Gram' },
    { value: 'ml', label: 'Milliliter' },
    { value: 'pcs', label: 'Pieces' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'liter', label: 'Liter' },
];

const PAYMENT_OPTIONS: { value: RestockPaymentMethod; label: string }[] = [
    { value: 'TRANSFER', label: 'Transfer Bank' },
    { value: 'QRIS', label: 'QRIS' },
    { value: 'VA', label: 'Virtual Account' },
    { value: 'DANA', label: 'DANA' },
    { value: 'GOPAY', label: 'GoPay' },
    { value: 'SHOPEEPAY', label: 'ShopeePay' },
    { value: 'OVO', label: 'OVO' },
];

const STATUS_CONFIG: Record<RestockOrderStatus, { label: string; color: string; icon: typeof Clock }> = {
    PENDING: { label: 'Menunggu Pembayaran', color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-400', icon: Clock },
    PAID: { label: 'Dibayar', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400', icon: CreditCard },
    PREPARING: { label: 'Disiapkan', color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400', icon: Package },
    SHIPPED: { label: 'Dikirim', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400', icon: Truck },
    RECEIVED: { label: 'Diterima', color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400', icon: CheckCircle2 },
    CANCELLED: { label: 'Dibatalkan', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400', icon: XCircle },
};

const TRACKING_STEPS: RestockOrderStatus[] = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'RECEIVED'];

type TabId = 'ingredients' | 'tracking' | 'history';

// ── Order Item for creation form ──
interface OrderItemDraft {
    ingredientId: number;
    ingredientName: string;
    quantity: string;
    unit: string;
    unitPrice: string;
}

// ── Tracking Timeline Component ──
function TrackingTimeline({ order }: { order: RestockOrder }) {
    if (order.status === 'CANCELLED') {
        return (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
                <XCircle size={14} /> Pesanan dibatalkan
                {order.cancelled_at && <span className="font-normal text-gray-500">({formatDate(order.cancelled_at)})</span>}
            </div>
        );
    }

    const currentIdx = TRACKING_STEPS.indexOf(order.status);
    return (
        <div className="flex items-center gap-1 flex-wrap">
            {TRACKING_STEPS.map((step, idx) => {
                const cfg = STATUS_CONFIG[step];
                const isDone = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                    <div key={step} className="flex items-center gap-1">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${isDone ? cfg.color : 'text-gray-400 bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/10 dark:text-gray-600'} ${isCurrent ? 'ring-2 ring-offset-1 ring-primary/30' : ''}`}>
                            <cfg.icon size={10} />
                            <span className="hidden sm:inline">{cfg.label}</span>
                        </div>
                        {idx < TRACKING_STEPS.length - 1 && (
                            <div className={`w-3 h-0.5 rounded ${idx < currentIdx ? 'bg-green-400' : 'bg-gray-200 dark:bg-white/10'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Countdown Hook ──
function useCountdown(expiresAt: string | undefined) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!expiresAt) return;
        const update = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft('00:00:00'); setIsExpired(true); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
            setIsExpired(false);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return { timeLeft, isExpired };
}

// ── Payment Panel Component ──
function PaymentPanel({ order, onUploadSuccess }: { order: RestockOrder; onUploadSuccess: () => void }) {
    const { success, error: showError } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [bankInfo, setBankInfo] = useState<Record<string, string | null>>({});
    const [copied, setCopied] = useState(false);
    const payment = order.payment;
    const { timeLeft, isExpired } = useCountdown(payment?.expires_at);

    useEffect(() => {
        api.get(`/inventory/restock-orders/${order.id}/payment-info/`)
            .then((res) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = (res.data as any)?.data || res.data;
                setBankInfo(d.bank_info || {});
            })
            .catch(() => { });
    }, [order.id]);

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('payment_proof', file);
            const res = await api.post(`/inventory/restock-orders/${order.id}/upload-proof/`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = res.data as any;
            if (data.verification?.verified) {
                success('Pembayaran terverifikasi oleh AI! ✅');
            } else {
                showError(data.message || 'Verifikasi gagal');
            }
            onUploadSuccess();
        } catch (err) {
            console.error('Upload failed:', err);
            showError('Gagal mengunggah bukti pembayaran');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!payment) return null;

    const verificationStatus = payment.verification_status;
    const showUpload = verificationStatus === 'PENDING' || verificationStatus === 'REJECTED';

    return (
        <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/20 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <CreditCard size={14} />
                    <span>Instruksi Pembayaran</span>
                </div>
                {!isExpired && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold font-mono">
                        <Timer size={10} />
                        {timeLeft}
                    </div>
                )}
                {isExpired && (
                    <span className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold">
                        Kedaluwarsa
                    </span>
                )}
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Bayar</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</p>
                </div>
                <button onClick={() => handleCopy(String(order.total_amount))} className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors" title="Salin nominal">
                    {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
                </button>
            </div>

            {/* Bank Info */}
            {(order.payment_method === 'TRANSFER' || order.payment_method === 'VA') && bankInfo.bank_name && (
                <div className="p-3 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {order.payment_method === 'VA' ? 'Virtual Account' : 'Transfer ke'}
                    </p>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{bankInfo.bank_name} — {bankInfo.bank_account}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">a/n {bankInfo.bank_holder}</p>
                </div>
            )}

            {/* QRIS Display */}
            {order.payment_method === 'QRIS' && (
                <div className="p-3 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex flex-col items-center text-center space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Scan QRIS untuk membayar</p>
                    {bankInfo.qris_image ? (
                        <Image src={bankInfo.qris_image as string} alt="QRIS" width={160} height={160} className="object-contain rounded-lg" unoptimized />
                    ) : (
                        <div className="w-40 h-40 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">QRIS belum diatur</span>
                        </div>
                    )}
                    <p className="text-[10px] text-gray-400">Dana / GoPay / OVO / ShopeePay</p>
                </div>
            )}

            {/* Payment code */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-xs">
                <span className="text-gray-500">Kode: <span className="font-mono font-bold text-gray-900 dark:text-white">{payment.payment_code}</span></span>
                <button onClick={() => handleCopy(payment.payment_code)} className="text-primary hover:text-red-700 text-[10px] font-bold">Salin</button>
            </div>

            {/* Verification Status */}
            {verificationStatus === 'PROCESSING' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold">
                    <Loader2 size={14} className="animate-spin" />
                    AI sedang memverifikasi bukti pembayaran...
                </div>
            )}
            {verificationStatus === 'VERIFIED' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold">
                    <ShieldCheck size={14} />
                    Pembayaran terverifikasi (Confidence: {payment.verification_confidence}%)
                </div>
            )}
            {verificationStatus === 'REJECTED' && (
                <div className="space-y-2">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs">
                        <ShieldX size={14} className="mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Verifikasi Ditolak</p>
                            <p className="mt-0.5 font-normal">{payment.rejection_reason}</p>
                        </div>
                    </div>
                </div>
            )}
            {verificationStatus === 'MANUAL_REVIEW' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold">
                    <ShieldAlert size={14} />
                    Menunggu review manual oleh admin
                </div>
            )}

            {/* Upload area */}
            {showUpload && !isExpired && (
                <div className="space-y-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-500/30 bg-white dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        {isUploading ? (
                            <><Loader2 size={16} className="animate-spin" /> Memverifikasi dengan AI...</>
                        ) : (
                            <><Upload size={16} /> {verificationStatus === 'REJECTED' ? 'Upload Ulang Bukti' : 'Upload Bukti Pembayaran'}</>
                        )}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center">Screenshot/foto bukti transfer akan diverifikasi otomatis oleh AI</p>
                </div>
            )}

            {/* Preview uploaded proof */}
            {payment.payment_proof && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-xs text-gray-600 dark:text-gray-400">
                    <Eye size={12} />
                    <span>Bukti pembayaran telah diunggah</span>
                    {payment.payment_proof_uploaded_at && <span className="text-gray-400">({formatDate(payment.payment_proof_uploaded_at)})</span>}
                </div>
            )}
        </div>
    );
}

// ── Main Page ──
export default function InventoryPage() {
    const { user } = useAuthStore();
    const { success, error: showError } = useToast();
    const isUnlocked = user?.role === 'superadmin' || user?.is_subscribed;

    // Tab
    const [activeTab, setActiveTab] = useState<TabId>('ingredients');

    // Ingredients
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    // Ingredient CRUD Modal
    const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [ingredientForm, setIngredientForm] = useState({ name: '', unit: 'gram', low_stock_alert: '0', current_stock: '0' });
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Restock Orders
    const [activeOrders, setActiveOrders] = useState<RestockOrder[]>([]);
    const [historyOrders, setHistoryOrders] = useState<RestockOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Order creation modal
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([]);
    const [orderForm, setOrderForm] = useState({ address: '', notes: '', paymentMethod: 'TRANSFER' as RestockPaymentMethod });
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [showOrderConfirm, setShowOrderConfirm] = useState(false);

    // Confirm received
    const [confirmReceiveId, setConfirmReceiveId] = useState<number | null>(null);

    // ── Data Fetching ──
    const fetchIngredients = useCallback(async () => {
        if (!isUnlocked) return;
        setIsLoading(true);
        try {
            const response = await api.get<ApiResponse<Ingredient[]>>('/inventory/ingredients/');
            setIngredients(extractApiArray(response.data));
        } catch (err) {
            console.error('Failed to fetch ingredients:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isUnlocked]);

    const fetchOrders = useCallback(async (view: 'active' | 'history') => {
        if (!isUnlocked) return;
        setOrdersLoading(true);
        try {
            const response = await api.get<ApiResponse<RestockOrder[]>>(`/inventory/restock-orders/?view=${view}`);
            const data = extractApiArray(response.data);
            if (view === 'active') setActiveOrders(data);
            else setHistoryOrders(data);
        } catch (err) {
            console.error(`Failed to fetch ${view} orders:`, err);
        } finally {
            setOrdersLoading(false);
        }
    }, [isUnlocked]);

    useEffect(() => { fetchIngredients(); }, [fetchIngredients]);
    useEffect(() => {
        if (activeTab === 'tracking') fetchOrders('active');
        else if (activeTab === 'history') fetchOrders('history');
    }, [activeTab, fetchOrders]);

    const filteredIngredients = ingredients.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const paginatedIngredients = filteredIngredients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const safeCount = ingredients.filter(i => i.status === 'SAFE').length;
    const lowCount = ingredients.filter(i => i.status === 'LOW').length;
    const criticalCount = ingredients.filter(i => i.status === 'CRITICAL').length;

    // Reset page when search changes
    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    // Columns for AdminDataTable
    const ingredientColumns: Column<Ingredient>[] = [
        {
            header: 'Nama Bahan',
            accessor: (item: Ingredient) => (
                <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
            ),
        },
        {
            header: 'Stok',
            accessor: (item: Ingredient) => (
                <span className="font-mono text-gray-600 dark:text-gray-300">{item.current_stock} {item.unit}</span>
            ),
        },
        {
            header: 'Min. Alert',
            accessor: (item: Ingredient) => (
                <span className="font-mono text-gray-500">{item.low_stock_alert} {item.unit}</span>
            ),
        },
        {
            header: 'Status',
            accessor: (item: Ingredient) => (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.status === 'SAFE'
                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400'
                    : item.status === 'LOW'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400'
                    }`}>
                    {item.status === 'SAFE' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                    {item.status === 'SAFE' ? 'Aman' : item.status === 'LOW' ? 'Menipis' : 'Kritis'}
                </span>
            ),
        },
        {
            header: 'Aksi',
            className: 'text-right',
            accessor: (item: Ingredient) => (
                <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleOpenOrderModal(item)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 dark:hover:bg-green-500/20 dark:text-green-400 transition-colors" title="Pesan Stok">
                        <ShoppingCart size={14} />
                    </button>
                    <button onClick={() => handleOpenIngredientModal(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-500/20 dark:text-blue-400 transition-colors" title="Edit">
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-500/20 dark:text-red-400 transition-colors" title="Hapus">
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];

    // ── Ingredient CRUD Handlers ──
    const handleOpenIngredientModal = (ingredient?: Ingredient) => {
        if (ingredient) {
            setEditingIngredient(ingredient);
            setIngredientForm({ name: ingredient.name, unit: ingredient.unit, low_stock_alert: String(ingredient.low_stock_alert), current_stock: String(ingredient.current_stock) });
        } else {
            setEditingIngredient(null);
            setIngredientForm({ name: '', unit: 'gram', low_stock_alert: '0', current_stock: '0' });
        }
        setIsIngredientModalOpen(true);
    };

    const handleCloseIngredientModal = () => { setIsIngredientModalOpen(false); setEditingIngredient(null); };

    const handleIngredientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredientForm.name.trim()) { showError('Nama bahan baku wajib diisi'); return; }
        setShowSaveConfirm(true);
    };

    const handleConfirmSave = async () => {
        setShowSaveConfirm(false);
        setIsSaving(true);
        try {
            const payload = { name: ingredientForm.name, unit: ingredientForm.unit, low_stock_alert: parseFloat(ingredientForm.low_stock_alert) || 0, current_stock: parseFloat(ingredientForm.current_stock) || 0 };
            if (editingIngredient) { await api.patch(`/inventory/ingredients/${editingIngredient.id}/`, payload); success('Bahan baku berhasil diperbarui'); }
            else { await api.post('/inventory/ingredients/', payload); success('Bahan baku berhasil ditambahkan'); }
            fetchIngredients();
            handleCloseIngredientModal();
        } catch (err) { console.error('Failed to save ingredient:', err); showError('Gagal menyimpan bahan baku'); }
        finally { setIsSaving(false); }
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/inventory/ingredients/${deleteId}/`); success('Bahan baku berhasil dihapus'); fetchIngredients(); }
        catch (err) { console.error('Failed to delete:', err); showError('Gagal menghapus bahan baku'); }
        finally { setDeleteId(null); }
    };

    // ── Order Creation ──
    const handleOpenOrderModal = (ingredient?: Ingredient) => {
        const mitraLocation = user?.location || user?.profile?.location || '';
        const items: OrderItemDraft[] = ingredient
            ? [{ ingredientId: ingredient.id, ingredientName: ingredient.name, quantity: '', unit: ingredient.unit, unitPrice: '0' }]
            : [];
        setOrderItems(items);
        setOrderForm({ address: mitraLocation, notes: '', paymentMethod: 'TRANSFER' });
        setIsOrderModalOpen(true);
    };

    const addOrderItem = () => {
        setOrderItems(prev => [...prev, { ingredientId: 0, ingredientName: '', quantity: '', unit: 'gram', unitPrice: '0' }]);
    };

    const removeOrderItem = (idx: number) => {
        setOrderItems(prev => prev.filter((_, i) => i !== idx));
    };

    const updateOrderItem = (idx: number, field: keyof OrderItemDraft, value: string | number) => {
        setOrderItems(prev => prev.map((item, i) => {
            if (i !== idx) return item;
            if (field === 'ingredientId') {
                const ing = ingredients.find(x => x.id === Number(value));
                return { ...item, ingredientId: Number(value), ingredientName: ing?.name || '', unit: ing?.unit || 'gram' };
            }
            return { ...item, [field]: value };
        }));
    };

    const orderSubtotal = orderItems.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);
    const orderShipping = orderForm.address ? estimateShipping(orderForm.address) : 0;
    const orderTotal = orderSubtotal + orderShipping;

    const handleOrderSubmit = () => {
        if (orderItems.length === 0 || orderItems.some(it => !it.ingredientId || !it.quantity)) {
            showError('Pilih bahan baku dan jumlah untuk setiap item');
            return;
        }
        if (!orderForm.address) { showError('Alamat pengiriman wajib diisi'); return; }
        setShowOrderConfirm(true);
    };

    const handleConfirmOrder = async () => {
        setShowOrderConfirm(false);
        setIsSubmittingOrder(true);
        try {
            const payload = {
                payment_method: orderForm.paymentMethod,
                shipping_address: orderForm.address,
                shipping_cost: orderShipping,
                notes: orderForm.notes,
                items: orderItems.map(it => ({
                    ingredient: it.ingredientId,
                    quantity: parseFloat(it.quantity) || 0,
                    unit: it.unit,
                    unit_price: parseFloat(it.unitPrice) || 0,
                })),
            };
            await api.post('/inventory/restock-orders/', payload);
            success('Pesanan restock berhasil dibuat!');
            setIsOrderModalOpen(false);
            setActiveTab('tracking');
            fetchOrders('active');
        } catch (err) { console.error('Failed to create order:', err); showError('Gagal membuat pesanan'); }
        finally { setIsSubmittingOrder(false); }
    };

    // ── Confirm Received ──
    const handleConfirmReceive = async () => {
        if (!confirmReceiveId) return;
        try {
            await api.post(`/inventory/restock-orders/${confirmReceiveId}/confirm-received/`);
            success('Pesanan dikonfirmasi diterima. Stok telah diperbarui.');
            fetchOrders('active');
            fetchIngredients();
        } catch (err) { console.error('Failed to confirm:', err); showError('Gagal konfirmasi penerimaan'); }
        finally { setConfirmReceiveId(null); }
    };

    // ── Tabs Config ──
    const tabs: { id: TabId; label: string; icon: typeof Package; count?: number }[] = [
        { id: 'ingredients', label: 'Bahan Baku', icon: Package, count: ingredients.length },
        { id: 'tracking', label: 'Pesanan Restock', icon: ClipboardList, count: activeOrders.length },
        { id: 'history', label: 'Riwayat', icon: History },
    ];

    return (
        <div className="relative min-h-screen space-y-6">
            <AdminHeader title="Inventori" description="Kelola stok bahan baku, pesan kebutuhan, dan lacak pengiriman." />

            {/* AI Prediction */}
            <div className={!isUnlocked ? 'filter blur-md pointer-events-none select-none opacity-50' : ''}>
                <InventoryPrediction />
            </div>

            {/* Main Content */}
            <div className={`relative ${!isUnlocked ? 'filter blur-md pointer-events-none select-none opacity-50 h-[500px] overflow-hidden' : ''}`}>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl mb-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ═══ TAB: Bahan Baku ═══ */}
                {activeTab === 'ingredients' && (
                    <>
                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-4 mb-4">
                            <StatCard title="Total Bahan" value={ingredients.length} icon={Package} color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-white" />
                            <StatCard title="Aman" value={safeCount} icon={CheckCircle2} color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-white" />
                            <StatCard title="Menipis" value={lowCount} icon={AlertTriangle} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-white" />
                            <StatCard title="Kritis" value={criticalCount} icon={XCircle} color="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-white" />
                        </div>

                        {/* Search + Actions */}
                        <AdminSearchHeader
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            searchPlaceholder="Cari bahan baku..."
                            addButtonLabel="Tambah Bahan"
                            onAddClick={() => handleOpenIngredientModal()}
                            extraActions={
                                <>
                                    <button onClick={() => handleOpenOrderModal()} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg transition-all font-bold text-sm active:scale-95">
                                        <ShoppingCart size={16} /> Pesan Restock
                                    </button>
                                    <button onClick={fetchIngredients} className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:rotate-180 transition-all duration-500">
                                        <RefreshCw size={16} />
                                    </button>
                                </>
                            }
                        />

                        {/* Table + Mobile Cards (via AdminDataTable) */}
                        <AdminDataTable<Ingredient>
                            data={paginatedIngredients}
                            columns={ingredientColumns}
                            isLoading={isLoading}
                            emptyMessage="Belum ada bahan baku."
                            keyExtractor={(item) => item.id}
                            mobileCardRender={(item) => (
                                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{item.name}</h3>
                                            <p className="text-[10px] text-gray-500 mt-1 font-mono">Stok: {item.current_stock} {item.unit} · Min: {item.low_stock_alert}</p>
                                            <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'SAFE' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                                : item.status === 'LOW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                                                }`}>
                                                {item.status === 'SAFE' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                                                {item.status === 'SAFE' ? 'Aman' : item.status === 'LOW' ? 'Menipis' : 'Kritis'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 ml-2">
                                            <button onClick={() => handleOpenOrderModal(item)} className="p-1.5 rounded-lg bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400"><ShoppingCart size={14} /></button>
                                            <button onClick={() => handleOpenIngredientModal(item)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />

                        {/* Pagination */}
                        {filteredIngredients.length > PAGE_SIZE && (
                            <AdminPagination
                                currentPage={currentPage}
                                totalItems={filteredIngredients.length}
                                pageSize={PAGE_SIZE}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </>
                )}

                {/* ═══ TAB: Pesanan Restock (Tracking) ═══ */}
                {activeTab === 'tracking' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pesanan aktif yang sedang diproses</p>
                            <button onClick={() => fetchOrders('active')} className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:rotate-180 transition-all duration-500">
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        {ordersLoading ? (
                            <div className="flex items-center justify-center py-12 text-gray-500 gap-2"><Loader2 size={20} className="animate-spin" /><span>Memuat pesanan...</span></div>
                        ) : activeOrders.length === 0 ? (
                            <div className="text-center py-16">
                                <ClipboardList size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Tidak ada pesanan aktif</p>
                                <button onClick={() => { setActiveTab('ingredients'); handleOpenOrderModal(); }} className="mt-4 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors">
                                    <ShoppingCart size={14} className="inline mr-1" /> Buat Pesanan Baru
                                </button>
                            </div>
                        ) : activeOrders.map(order => (
                            <div key={order.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{order.order_number}</h3>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</p>
                                        <p className="text-[10px] text-gray-500">{order.payment_method_display}</p>
                                    </div>
                                </div>

                                <TrackingTimeline order={order} />

                                {/* Items summary */}
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {order.items.map(it => `${it.ingredient_name} (${it.quantity} ${it.unit})`).join(', ')}
                                </div>

                                {/* Payment panel for PENDING orders */}
                                {order.status === 'PENDING' && (
                                    <PaymentPanel order={order} onUploadSuccess={() => fetchOrders('active')} />
                                )}

                                {/* Confirm received button */}
                                {(order.status === 'SHIPPED' || order.status === 'PREPARING') && (
                                    <button onClick={() => setConfirmReceiveId(order.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors shadow-lg shadow-green-500/20">
                                        <CheckCircle2 size={16} /> Konfirmasi Diterima
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ═══ TAB: Riwayat ═══ */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Riwayat pesanan restock</p>
                            <button onClick={() => fetchOrders('history')} className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:rotate-180 transition-all duration-500">
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        {ordersLoading ? (
                            <div className="flex items-center justify-center py-12 text-gray-500 gap-2"><Loader2 size={20} className="animate-spin" /><span>Memuat riwayat...</span></div>
                        ) : historyOrders.length === 0 ? (
                            <div className="text-center py-16">
                                <History size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada riwayat pesanan</p>
                            </div>
                        ) : historyOrders.map(order => {
                            const statusCfg = STATUS_CONFIG[order.status];
                            return (
                                <div key={order.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{order.order_number}</h3>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.color}`}>
                                                <statusCfg.icon size={10} /> {statusCfg.label}
                                            </span>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {order.items.map(it => `${it.ingredient_name} (${it.quantity} ${it.unit})`).join(', ')}
                                    </div>
                                    {order.received_at && <p className="text-[10px] text-green-600 dark:text-green-400 mt-2">Diterima: {formatDate(order.received_at)}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lock Overlay */}
            {!isUnlocked && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-lg w-full bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-8 text-center shadow-2xl animation-scale-in">
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-primary/30 mb-6"><Lock className="h-10 w-10 text-white" /></div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Fitur Premium Terkunci 🔒</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">Fitur <span className="font-semibold text-red-700 dark:text-red-500">Manajemen Inventori</span> memungkinkan Anda melacak stok, memesan bahan baku, dan melacak pengiriman.</p>
                            <div className="flex flex-col w-full gap-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tertarik membuka fitur ini? Hubungi Developer:</p>
                                <Link href="https://wa.me/6285217861296?text=Halo%2C%20saya%20tertarik%20untuk%20membuka%20fitur%20Inventori" target="_blank" className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]">
                                    <Phone size={24} /> Hubungi via WhatsApp
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ ORDER CREATION MODAL ═══ */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animation-scale-in flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pesan Restock</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Buat pesanan ke Kantor Pusat</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOrderModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
                            {/* Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Item Pesanan</label>
                                    <button onClick={addOrderItem} className="text-xs font-bold text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Tambah Item</button>
                                </div>
                                <div className="space-y-3">
                                    {orderItems.map((item, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <FormSelect
                                                    value={item.ingredientId || ''}
                                                    onChange={(val) => updateOrderItem(idx, 'ingredientId', val)}
                                                    options={ingredients.map(ing => ({ value: String(ing.id), label: `${ing.name} (${ing.current_stock} ${ing.unit})` }))}
                                                    placeholder="Pilih bahan baku..."
                                                    className="flex-1"
                                                />
                                                {orderItems.length > 1 && (
                                                    <button onClick={() => removeOrderItem(idx)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><X size={14} /></button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 ml-0.5">Jumlah ({item.unit})</label>
                                                    <input type="number" value={item.quantity} onChange={e => updateOrderItem(idx, 'quantity', e.target.value)} placeholder="0" min="1" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 ml-0.5">Harga/unit (Rp)</label>
                                                    <input type="number" value={item.unitPrice} onChange={e => updateOrderItem(idx, 'unitPrice', e.target.value)} placeholder="0" min="0" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Metode Pembayaran</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PAYMENT_OPTIONS.map(opt => (
                                        <button key={opt.value} onClick={() => setOrderForm({ ...orderForm, paymentMethod: opt.value })} className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${orderForm.paymentMethod === opt.value ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary/20' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Alamat Pengiriman</label>
                                <input type="text" value={orderForm.address} onChange={e => setOrderForm({ ...orderForm, address: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder="Jl. Merdeka No. 1, Jakarta" />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Catatan (Opsional)</label>
                                <textarea value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" placeholder="Catatan untuk kantor pusat..." />
                            </div>

                            {/* Order Summary */}
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 space-y-2">
                                <div className="flex items-center gap-2"><Truck size={14} className="text-blue-600 dark:text-blue-400" /><p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Ringkasan</p></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span className="font-mono font-bold text-gray-900 dark:text-white">{formatCurrency(orderSubtotal)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Ongkos Kirim (est.)</span><span className="font-mono font-bold text-gray-900 dark:text-white">{formatCurrency(orderShipping)}</span></div>
                                <div className="border-t border-blue-200 dark:border-blue-500/30 my-1" />
                                <div className="flex justify-between text-sm"><span className="font-bold text-blue-800 dark:text-blue-300">Total</span><span className="font-mono font-bold text-lg text-blue-800 dark:text-blue-300">{formatCurrency(orderTotal)}</span></div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex gap-3 shrink-0">
                            <button onClick={() => setIsOrderModalOpen(false)} className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm">Batal</button>
                            <button onClick={handleOrderSubmit} disabled={isSubmittingOrder || orderItems.length === 0} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmittingOrder ? <><Loader2 size={16} className="animate-spin" /> Membuat...</> : <><ShoppingCart size={16} /> Buat Pesanan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ INGREDIENT ADD/EDIT MODAL ═══ */}
            {isIngredientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animation-scale-in">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</h3>
                            <button onClick={handleCloseIngredientModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleIngredientSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Nama Bahan Baku</label>
                                <input type="text" value={ingredientForm.name} onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium text-gray-900 dark:text-white" placeholder="Contoh: Tepung Terigu" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Satuan</label>
                                    <FormSelect
                                        value={ingredientForm.unit}
                                        onChange={(val) => setIngredientForm({ ...ingredientForm, unit: val })}
                                        options={UNIT_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Stok Awal</label>
                                    <input type="number" value={ingredientForm.current_stock} onChange={e => setIngredientForm({ ...ingredientForm, current_stock: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-gray-900 dark:text-white" placeholder="0" min="0" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Min. Alert</label>
                                <input type="number" value={ingredientForm.low_stock_alert} onChange={e => setIngredientForm({ ...ingredientForm, low_stock_alert: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-gray-900 dark:text-white" placeholder="0" min="0" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={handleCloseIngredientModal} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm">Batal</button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-red-700 text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isSaving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            <ConfirmationModal isOpen={showSaveConfirm} onClose={() => setShowSaveConfirm(false)} onConfirm={handleConfirmSave} title="Simpan Bahan Baku?" message={`Apakah Anda yakin ingin menyimpan ${editingIngredient ? 'perubahan pada' : ''} bahan baku "${ingredientForm.name}"?`} variant="primary" confirmLabel="Simpan" icon={Save} isLoading={isSaving} />
            <ConfirmationModal isOpen={showOrderConfirm} onClose={() => setShowOrderConfirm(false)} onConfirm={handleConfirmOrder} title="Buat Pesanan Restock?" message={`Pesanan ${orderItems.length} item senilai ${formatCurrency(orderTotal)} akan dibuat. Lanjutkan?`} variant="primary" confirmLabel="Buat Pesanan" icon={ShoppingCart} isLoading={isSubmittingOrder} />
            <ConfirmationModal isOpen={confirmReceiveId !== null} onClose={() => setConfirmReceiveId(null)} onConfirm={handleConfirmReceive} title="Konfirmasi Penerimaan?" message="Stok bahan baku akan otomatis diperbarui setelah konfirmasi. Pastikan barang sudah diterima." variant="primary" confirmLabel="Ya, Sudah Diterima" icon={CheckCircle2} />
            <DeleteConfirmationModal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleConfirmDelete} title="Hapus Bahan Baku?" message="Tindakan ini tidak dapat dibatalkan. Bahan baku akan dihapus secara permanen." />
        </div>
    );
}
