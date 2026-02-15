'use client';

import { useState, useEffect, useCallback } from 'react';
import { InventoryPrediction } from '@/components/admin/ai/InventoryPrediction';
import {
    Lock, Phone, Plus, Search, AlertTriangle, CheckCircle, RefreshCw,
    X, Pencil, Trash2, Mail, Loader2, Save, Send, Truck
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { extractApiArray } from '@/lib/api-utils';
import { Ingredient, ApiResponse } from '@/types/api';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useToast } from '@/components/ToastContext';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';

// Simple shipping cost lookup by city keyword
const SHIPPING_RATES: Record<string, number> = {
    'jakarta': 15000,
    'bandung': 20000,
    'surabaya': 30000,
    'semarang': 25000,
    'yogyakarta': 25000,
    'jogja': 25000,
    'malang': 28000,
    'solo': 25000,
    'bekasi': 15000,
    'tangerang': 15000,
    'depok': 15000,
    'bogor': 18000,
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

const UNIT_OPTIONS = [
    { value: 'gram', label: 'Gram' },
    { value: 'ml', label: 'Milliliter' },
    { value: 'pcs', label: 'Pieces' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'liter', label: 'Liter' },
];

export default function InventoryPage() {
    const { user } = useAuthStore();
    const { success, error: showError } = useToast();
    const isUnlocked = user?.role === 'superadmin' || user?.is_subscribed;

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Ingredient CRUD Modal
    const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [ingredientForm, setIngredientForm] = useState({ name: '', unit: 'gram', low_stock_alert: '0', current_stock: '0' });
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    // Delete
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Order (Email) Modal
    const [orderIngredient, setOrderIngredient] = useState<Ingredient | null>(null);
    const [orderForm, setOrderForm] = useState({ qty: '', address: '', notes: '' });

    const fetchIngredients = useCallback(async () => {
        if (!isUnlocked) return;
        setIsLoading(true);
        try {
            const response = await api.get<ApiResponse<Ingredient[]>>('/inventory/ingredients/');
            const data = extractApiArray(response.data);
            setIngredients(data);
        } catch (error) {
            console.error('Failed to fetch ingredients:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isUnlocked]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    const filteredIngredients = ingredients.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Ingredient CRUD ---
    const handleOpenIngredientModal = (ingredient?: Ingredient) => {
        if (ingredient) {
            setEditingIngredient(ingredient);
            setIngredientForm({
                name: ingredient.name,
                unit: ingredient.unit,
                low_stock_alert: String(ingredient.low_stock_alert),
                current_stock: String(ingredient.current_stock)
            });
        } else {
            setEditingIngredient(null);
            setIngredientForm({ name: '', unit: 'gram', low_stock_alert: '0', current_stock: '0' });
        }
        setIsIngredientModalOpen(true);
    };

    const handleCloseIngredientModal = () => {
        setIsIngredientModalOpen(false);
        setEditingIngredient(null);
        setIngredientForm({ name: '', unit: 'gram', low_stock_alert: '0', current_stock: '0' });
    };

    const handleIngredientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredientForm.name.trim()) {
            showError('Nama bahan baku wajib diisi');
            return;
        }
        setShowSaveConfirm(true);
    };

    const handleConfirmSave = async () => {
        setShowSaveConfirm(false);
        setIsSaving(true);
        try {
            const payload = {
                name: ingredientForm.name,
                unit: ingredientForm.unit,
                low_stock_alert: parseFloat(ingredientForm.low_stock_alert) || 0,
                current_stock: parseFloat(ingredientForm.current_stock) || 0,
            };
            if (editingIngredient) {
                await api.patch(`/inventory/ingredients/${editingIngredient.id}/`, payload);
                success('Bahan baku berhasil diperbarui');
            } else {
                await api.post('/inventory/ingredients/', payload);
                success('Bahan baku berhasil ditambahkan');
            }
            fetchIngredients();
            handleCloseIngredientModal();
        } catch (error) {
            console.error('Failed to save ingredient:', error);
            showError('Gagal menyimpan bahan baku');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/inventory/ingredients/${deleteId}/`);
            success('Bahan baku berhasil dihapus');
            fetchIngredients();
        } catch (error) {
            console.error('Failed to delete ingredient:', error);
            showError('Gagal menghapus bahan baku');
        } finally {
            setDeleteId(null);
        }
    };

    // --- Order Stock (Email) ---
    const handleOpenOrderModal = (ingredient: Ingredient) => {
        setOrderIngredient(ingredient);
        const mitraLocation = user?.location || user?.profile?.location || '';
        setOrderForm({ qty: '', address: mitraLocation, notes: '' });
    };

    const handleCloseOrderModal = () => {
        setOrderIngredient(null);
        setOrderForm({ qty: '', address: '', notes: '' });
    };

    const handleSendOrder = () => {
        if (!orderIngredient || !orderForm.qty || !orderForm.address) {
            showError('Jumlah dan alamat pengiriman wajib diisi');
            return;
        }

        const qty = orderForm.qty;
        const unit = orderIngredient.unit;
        const shippingCost = estimateShipping(orderForm.address);

        const subject = encodeURIComponent(`[OMDEN] Pesanan Stok Bahan Baku - ${orderIngredient.name}`);
        const body = encodeURIComponent(
            `Yth. Samden Homemade,\n\n` +
            `Saya ingin memesan bahan baku berikut:\n\n` +
            `Bahan: ${orderIngredient.name}\n` +
            `Jumlah: ${qty} ${unit}\n` +
            `Alamat Pengiriman: ${orderForm.address}\n` +
            `Estimasi Ongkos Kirim: ${formatCurrency(shippingCost)}\n` +
            `${orderForm.notes ? `\nCatatan: ${orderForm.notes}\n` : ''}` +
            `\nTerima kasih.\n` +
            `${user?.username || 'Mitra'}`
        );

        const mailtoUrl = `mailto:samdenihomemade@gmail.com?subject=${subject}&body=${body}`;
        window.open(mailtoUrl, '_blank');

        success('Email order dibuka. Silakan kirim melalui email client Anda.');
        handleCloseOrderModal();
    };

    const shippingEstimate = orderForm.address ? estimateShipping(orderForm.address) : 0;

    return (
        <div className="relative min-h-screen space-y-6">
            <AdminHeader
                title="Inventori"
                description="Kelola stok bahan baku dan pesan kebutuhan dari kantor pusat."
            />

            {/* AI Prediction (Always visible if unlocked, blurred if locked) */}
            <div className={!isUnlocked ? 'filter blur-md pointer-events-none select-none opacity-50' : ''}>
                <InventoryPrediction />
            </div>

            {/* Main Content */}
            <div className={`relative ${!isUnlocked ? 'filter blur-md pointer-events-none select-none opacity-50 h-[500px] overflow-hidden' : ''}`}>

                {/* Actions & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari bahan baku..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleOpenIngredientModal()}
                            className="flex items-center gap-2 bg-gradient-to-r from-primary to-red-700 text-white px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform font-bold text-sm"
                        >
                            <Plus size={18} />
                            <span>Tambah Bahan Baku</span>
                        </button>
                        <button onClick={fetchIngredients} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:rotate-180 transition-all duration-500">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Table — Desktop */}
                <div className="hidden md:block bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Nama Bahan</th>
                                <th className="px-6 py-4">Stok Saat Ini</th>
                                <th className="px-6 py-4">Min. Alert</th>
                                <th className="px-6 py-4">Satuan</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Memuat data inventori...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredIngredients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada bahan baku. Klik &quot;Tambah Bahan Baku&quot; untuk menambahkan.
                                    </td>
                                </tr>
                            ) : (
                                filteredIngredients.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">{item.current_stock}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono">{item.low_stock_alert}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${item.status === 'SAFE' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400' :
                                                item.status === 'LOW' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400'
                                                }`}>
                                                {item.status === 'SAFE' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                                {item.status === 'SAFE' ? 'Aman' : item.status === 'LOW' ? 'Menipis' : 'Kritis'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenOrderModal(item)}
                                                    className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 dark:hover:bg-green-500/20 dark:text-green-400 transition-colors"
                                                    title="Pesan Stok"
                                                >
                                                    <Send size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenIngredientModal(item)}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-500/20 dark:text-blue-400 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-500/20 dark:text-red-400 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Cards — Mobile */}
                <div className="md:hidden space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                            <Loader2 size={20} className="animate-spin" />
                            <span>Memuat...</span>
                        </div>
                    ) : filteredIngredients.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            Belum ada bahan baku.
                        </div>
                    ) : (
                        filteredIngredients.map((item) => (
                            <div key={item.id} className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{item.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1 font-mono">
                                            Stok: {item.current_stock} {item.unit} · Min: {item.low_stock_alert}
                                        </p>
                                        <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'SAFE' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' :
                                            item.status === 'LOW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                                'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                                            }`}>
                                            {item.status === 'SAFE' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                                            {item.status === 'SAFE' ? 'Aman' : item.status === 'LOW' ? 'Menipis' : 'Kritis'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 ml-2">
                                        <button
                                            onClick={() => handleOpenOrderModal(item)}
                                            className="p-2 rounded-lg bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                                        >
                                            <Send size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenIngredientModal(item)}
                                            className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(item.id)}
                                            className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Lock Overlay (Only if Locked) */}
            {!isUnlocked && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-lg w-full bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-8 text-center shadow-2xl animation-scale-in">
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
                                <Lock className="h-10 w-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Fitur Premium Terkunci 🔒
                            </h2>

                            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                Maaf, fitur <span className="font-semibold text-red-700 dark:text-red-500">Manajemen Inventori</span> adalah fitur tambahan eksklusif.
                                Fitur ini memungkinkan Anda melacak stok bahan baku, mengatur peringatan stok menipis, dan memesan bahan baku dari kantor pusat.
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Tertarik membuka fitur ini? Hubungi Developer:
                                </p>
                                <Link
                                    href="https://wa.me/6285217861296?text=Halo%2C%20saya%20tertarik%20untuk%20membuka%20fitur%20Inventori%20pada%20aplikasi%20POS%20saya."
                                    target="_blank"
                                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Phone size={24} />
                                    <span>Hubungi via WhatsApp</span>
                                </Link>

                                <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-primary/10">
                                    <p className="text-xs font-mono text-red-700 dark:text-red-500">
                                        Developer Contact: 0852-1786-1296
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== INGREDIENT ADD/EDIT MODAL ===== */}
            {isIngredientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animation-scale-in">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                            </h3>
                            <button onClick={handleCloseIngredientModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleIngredientSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Nama Bahan Baku</label>
                                <input
                                    type="text"
                                    value={ingredientForm.name}
                                    onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium text-gray-900 dark:text-white"
                                    placeholder="Contoh: Tepung Terigu"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Satuan</label>
                                    <select
                                        value={ingredientForm.unit}
                                        onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm text-gray-900 dark:text-white"
                                    >
                                        {UNIT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Stok Awal</label>
                                    <input
                                        type="number"
                                        value={ingredientForm.current_stock}
                                        onChange={(e) => setIngredientForm({ ...ingredientForm, current_stock: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-gray-900 dark:text-white"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Min. Alert (Notifikasi Stok Menipis)</label>
                                <input
                                    type="number"
                                    value={ingredientForm.low_stock_alert}
                                    onChange={(e) => setIngredientForm({ ...ingredientForm, low_stock_alert: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-gray-900 dark:text-white"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseIngredientModal}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-red-700 text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== ORDER STOCK (EMAIL) MODAL ===== */}
            {orderIngredient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animation-scale-in">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pesan Stok</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">via Email ke Kantor Pusat</p>
                                </div>
                            </div>
                            <button onClick={handleCloseOrderModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Ingredient Info */}
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Bahan Baku</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{orderIngredient.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Stok saat ini: <span className="font-mono font-bold">{orderIngredient.current_stock} {orderIngredient.unit}</span>
                                </p>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
                                    Jumlah Pesanan ({orderIngredient.unit})
                                </label>
                                <input
                                    type="number"
                                    value={orderForm.qty}
                                    onChange={(e) => setOrderForm({ ...orderForm, qty: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold text-gray-900 dark:text-white"
                                    placeholder="0"
                                    min="1"
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
                                    Alamat Pengiriman
                                </label>
                                <input
                                    type="text"
                                    value={orderForm.address}
                                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-900 dark:text-white"
                                    placeholder="Contoh: Jl. Merdeka No. 1, Jakarta Selatan"
                                />
                            </div>

                            {/* Shipping Estimate */}
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <Truck size={14} className="text-blue-600 dark:text-blue-400" />
                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Estimasi Ongkos Kirim</p>
                                </div>
                                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                                    {orderForm.address ? formatCurrency(shippingEstimate) : '—'}
                                </p>
                                <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1">
                                    *Estimasi berdasarkan kota tujuan. Biaya final akan dikonfirmasi oleh kantor pusat.
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
                                    Catatan (Opsional)
                                </label>
                                <textarea
                                    value={orderForm.notes}
                                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-900 dark:text-white resize-none"
                                    placeholder="Catatan tambahan untuk order..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCloseOrderModal}
                                    className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSendOrder}
                                    disabled={!orderForm.qty || !orderForm.address}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                                >
                                    <Mail size={16} />
                                    Kirim Email Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Confirmation */}
            <ConfirmationModal
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleConfirmSave}
                title="Simpan Bahan Baku?"
                message={`Apakah Anda yakin ingin menyimpan ${editingIngredient ? 'perubahan pada' : ''} bahan baku "${ingredientForm.name}"?`}
                variant="primary"
                confirmLabel="Simpan"
                icon={Save}
                isLoading={isSaving}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Bahan Baku?"
                message="Tindakan ini tidak dapat dibatalkan. Bahan baku akan dihapus secara permanen."
            />
        </div>
    );
}
