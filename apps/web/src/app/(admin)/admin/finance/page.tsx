'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Wallet,
    Calendar,
    TrendingDown,
    Trash2,
    X,
    Receipt,
    Fuel,
    PackageOpen,
    Truck,
    Wrench,
    HelpCircle,
    Upload,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ToastContext';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSearchHeader } from '@/components/admin/AdminSearchHeader';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';
import { StatCard } from '@/components/admin/StatCard';

interface Expense {
    id: string;
    mitra: number;
    amount: number;
    category: string;
    category_display: string;
    description: string;
    notes: string | null;
    proof_image: string | null;
    date: string;
    shift: string | null;
    created_at: string;
    updated_at: string;
}

interface ExpenseSummary {
    today: number;
    this_week: number;
    this_month: number;
    category_breakdown: { category: string; total: number }[];
}

const CATEGORY_OPTIONS = [
    { value: 'GAS', label: 'Gas LPG', icon: Fuel },
    { value: 'BAHAN_DARURAT', label: 'Bahan Baku Darurat', icon: PackageOpen },
    { value: 'PACKAGING', label: 'Kemasan & Packaging', icon: Receipt },
    { value: 'TRANSPORT', label: 'Transportasi', icon: Truck },
    { value: 'MAINTENANCE', label: 'Perawatan Alat', icon: Wrench },
    { value: 'LAINNYA', label: 'Lainnya', icon: HelpCircle },
];

function getCategoryIcon(category: string) {
    const found = CATEGORY_OPTIONS.find(c => c.value === category);
    return found ? found.icon : HelpCircle;
}

function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
        'GAS': 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
        'BAHAN_DARURAT': 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
        'PACKAGING': 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
        'TRANSPORT': 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
        'MAINTENANCE': 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
        'LAINNYA': 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
    };
    return colors[category] || colors['LAINNYA'];
}

export default function FinancePage() {
    const { success: showSuccess, error: showError } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState<ExpenseSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Form State
    const [formData, setFormData] = useState({
        amount: '',
        category: 'GAS',
        description: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [formImage, setFormImage] = useState<File | null>(null);
    const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/finances/expenses/');
            const data = response.data;
            const results = Array.isArray(data) ? data : (data.results || []);
            setExpenses(results);
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
            showError('Gagal memuat data pengeluaran');
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    const fetchSummary = useCallback(async () => {
        try {
            const response = await api.get('/finances/expenses/summary/');
            setSummary(response.data);
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
        fetchSummary();
    }, [fetchExpenses, fetchSummary]);

    // Filtered & searched expenses
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = searchQuery === '' ||
            expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.category_display.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Pagination
    const paginatedExpenses = filteredExpenses.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) {
            showError('Jumlah dan deskripsi wajib diisi');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('amount', formData.amount);
            payload.append('category', formData.category);
            payload.append('description', formData.description);
            payload.append('notes', formData.notes);
            payload.append('date', formData.date);
            if (formImage) {
                payload.append('proof_image', formImage);
            }

            await api.post('/finances/expenses/', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showSuccess('Pengeluaran berhasil dicatat');
            setShowAddModal(false);
            resetForm();
            fetchExpenses();
            fetchSummary();
        } catch (error) {
            console.error('Failed to add expense:', error);
            showError('Gagal mencatat pengeluaran');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/finances/expenses/${deleteId}/`);
            showSuccess('Pengeluaran berhasil dihapus');
            setDeleteId(null);
            fetchExpenses();
            fetchSummary();
        } catch (error) {
            console.error('Failed to delete expense:', error);
            showError('Gagal menghapus pengeluaran');
        }
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            category: 'GAS',
            description: '',
            notes: '',
            date: new Date().toISOString().split('T')[0],
        });
        setFormImage(null);
        setFormImagePreview(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setFormImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const columns: Column<Expense>[] = [
        {
            header: 'Kategori',
            accessor: (expense) => {
                const IconComponent = getCategoryIcon(expense.category);
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${getCategoryColor(expense.category)}`}>
                        <IconComponent size={12} />
                        {expense.category_display}
                    </span>
                );
            }
        },
        {
            header: 'Deskripsi',
            accessor: (expense) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{expense.description}</p>
                    {expense.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{expense.notes}</p>
                    )}
                </div>
            )
        },
        {
            header: 'Jumlah',
            className: 'text-right',
            accessor: (expense) => (
                <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                    - {formatCurrency(expense.amount)}
                </span>
            )
        },
        {
            header: 'Tanggal',
            accessor: (expense) => (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(expense.date)}
                </span>
            )
        },
        {
            header: 'Aksi',
            className: 'text-right',
            accessor: (expense) => (
                <button
                    onClick={() => setDeleteId(expense.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Hapus"
                >
                    <Trash2 size={14} />
                </button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Keuangan"
                description="Catat dan kelola pengeluaran operasional harian"
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <StatCard
                    title="Hari Ini"
                    value={formatCurrency(summary?.today || 0)}
                    icon={Wallet}
                    color="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-white"
                />
                <StatCard
                    title="Minggu Ini"
                    value={formatCurrency(summary?.this_week || 0)}
                    icon={Calendar}
                    color="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-white"
                />
                <StatCard
                    title="Bulan Ini"
                    value={formatCurrency(summary?.this_month || 0)}
                    icon={TrendingDown}
                    color="bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-white"
                />
            </div>

            {/* Search & Filters */}
            <AdminSearchHeader
                searchQuery={searchQuery}
                onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
                searchPlaceholder="Cari pengeluaran..."
                addButtonLabel="Tambah"
                onAddClick={() => setShowAddModal(true)}
                extraActions={
                    <AdminSelect
                        value={filterCategory}
                        onChange={(val) => { setFilterCategory(val as string); setCurrentPage(1); }}
                        options={[
                            { value: 'all', label: 'Semua Kategori' },
                            ...CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label }))
                        ]}
                    />
                }
            />

            {/* Data Table */}
            <AdminDataTable
                columns={columns}
                data={paginatedExpenses}
                isLoading={isLoading}
                emptyMessage="Belum ada data pengeluaran"
                keyExtractor={(expense) => expense.id}
            />

            {/* Pagination */}
            <AdminPagination
                currentPage={currentPage}
                totalItems={filteredExpenses.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
            />

            {/* Add Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Catat Pengeluaran</h2>
                            <button
                                onClick={() => { setShowAddModal(false); resetForm(); }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Jumlah (Rp) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="22000"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition text-lg font-bold"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Kategori
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CATEGORY_OPTIONS.map((cat) => {
                                        const isSelected = formData.category === cat.value;
                                        const Icon = cat.icon;
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium ${isSelected
                                                    ? 'border-primary bg-primary/10 text-primary dark:text-red-400'
                                                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon size={18} />
                                                {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Deskripsi *
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Beli Gas LPG 3kg"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                                    required
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Catatan (Opsional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Catatan tambahan..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition resize-none"
                                />
                            </div>

                            {/* Proof Image */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Bukti Pengeluaran (Opsional)
                                </label>
                                {formImagePreview ? (
                                    <div className="relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={formImagePreview}
                                            alt="Preview"
                                            className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setFormImage(null); setFormImagePreview(null); }}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-lg"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 cursor-pointer hover:border-primary transition-colors">
                                        <div className="p-2 rounded-full bg-gray-100 dark:bg-white/10">
                                            <Upload size={20} className="text-gray-400" />
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Upload foto struk/nota
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-red-600 text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSubmitting ? 'Menyimpan...' : '💰 Catat Pengeluaran'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-white/10 p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Pengeluaran?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Data pengeluaran yang dihapus tidak dapat dikembalikan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
