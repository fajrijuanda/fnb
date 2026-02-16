'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Loader2, Save, Search } from 'lucide-react';
import api from '@/lib/api';
import type { Category, ApiResponse } from '@/types/api';
import * as LucideIcons from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { extractApiArray } from '@/lib/api-utils';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSearchHeader } from '@/components/admin/AdminSearchHeader';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';


const COMMON_ICONS = [
    { name: 'Utensils', label: 'Makanan' },
    { name: 'Coffee', label: 'Kopi/Minuman' },
    { name: 'Pizza', label: 'Pizza' },
    { name: 'Sandwich', label: 'Burger/Sandwich' },
    { name: 'Soup', label: 'Sup/Kuah' },
    { name: 'Salad', label: 'Salad' },
    { name: 'IceCream', label: 'Es Krim' },
    { name: 'Cake', label: 'Kue' },
    { name: 'Croissant', label: 'Roti' },
    { name: 'Cookie', label: 'Biskuit' },
    { name: 'Apple', label: 'Buah' },
    { name: 'Milk', label: 'Susu' },
    { name: 'Beef', label: 'Daging' },
    { name: 'Fish', label: 'Ikan' },
    { name: 'Carrot', label: 'Sayur' },
    { name: 'Egg', label: 'Telur' },
    { name: 'Wheat', label: 'Gandum' },
    { name: 'Drumstick', label: 'Ayam' },
    { name: 'Beer', label: 'Alkohol' },
    { name: 'Wine', label: 'Wine' },
    { name: 'Martini', label: 'Cocktail' },
    { name: 'CupSoda', label: 'Soda' },
    { name: 'Package', label: 'Paket' },
    { name: 'Tag', label: 'Promo' },
    { name: 'ShoppingBag', label: 'Takeaway' },
    { name: 'EggFried', label: 'Gyoza/Goreng' },
    { name: 'ChefHat', label: 'Chef' },
];

// Helper to determine if color is hex or legacy preset
const getCategoryStyles = (colorName: string | null | undefined) => {
    const color = colorName || '#C5161D'; // Default orange hex

    // Check if it's a hex code
    if (color.startsWith('#')) {
        return {
            container: {
                backgroundColor: `${color}20`, // 20% opacity using hex alpha
                color: color,
                borderColor: `${color}50` // 50% opacity
            },
            icon: { color: color }
        };
    }

    // Legacy fallback
    const mapping: Record<string, string> = {
        orange: 'bg-red-100 dark:bg-primary/20 text-red-700 dark:text-red-500 border-red-300/50 dark:border-primary/30',
        blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/30',
        purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/30',
        green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-500/30',
        red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-500/30',
        cyan: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-500/30',
        pink: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-200/50 dark:border-pink-500/30',
        indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/30',
    };

    // Convert legacy class string to object style for consistency if needed, 
    // but here we just return the class string for legacy support
    return { className: mapping[color] || mapping['orange'] };
};

const IconComponent = ({ name, size = 16, className = "" }: { name: string, size?: number, className?: string }) => {
    // Convert kebab-case to PascalCase (e.g., 'egg-fried' -> 'EggFried', 'utensils' -> 'Utensils')
    const pascalCase = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[pascalCase]
        || (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name]
        || LucideIcons.HelpCircle;
    return <Icon size={size} className={className} />;
};

export default function CategoriesPage() {
    const { success, error: showError } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', icon: 'Utensils', color: '#C5161D' });
    const [isSaving, setIsSaving] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<ApiResponse<Category[]>>('/catalog/categories/');
            setCategories(extractApiArray(response.data));
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                icon: category.icon || 'Utensils',
                color: category.color || '#C5161D'
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', icon: 'Utensils', color: '#C5161D' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', slug: '', icon: 'Utensils', color: '#C5161D' });
        setIconSearch('');
    };

    const handleConfirmSave = async () => {
        setShowSaveConfirm(false);
        setIsSaving(true);
        try {
            if (editingCategory) {
                await api.patch(`/catalog/categories/${editingCategory.id}/`, formData);
                success('Kategori berhasil diperbarui');
            } else {
                await api.post('/catalog/categories/', formData);
                success('Kategori berhasil ditambahkan');
            }
            fetchCategories();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save category:', error);
            showError('Gagal menyimpan kategori');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/catalog/categories/${deleteId}/`);
            success('Kategori berhasil dihapus');
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            showError('Gagal menghapus kategori');
        } finally {
            setDeleteId(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSaveConfirm(true);
    };

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            name,
            slug: editingCategory ? prev.slug : name.toLowerCase().replace(/\s+/g, '-')
        }));
    };

    const filteredCategories = (Array.isArray(categories) ? categories : []).filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Logic
    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize]);

    const columns: Column<Category>[] = [
        {
            header: "Ikon",
            accessor: (category) => {
                const styles = getCategoryStyles(category.color);
                return (
                    <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm border ${styles.className || ''}`}
                        style={styles.container}
                    >
                        <IconComponent name={category.icon || 'Tag'} size={20} />
                    </div>
                );
            }
        },
        {
            header: "Nama Kategori",
            accessor: "name",
            className: "font-bold text-gray-900 dark:text-white"
        },
        {
            header: "Slug",
            accessor: (category) => (
                <code className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] font-mono text-gray-600 dark:text-gray-400">
                    {category.slug}
                </code>
            )
        },
        {
            header: "Aksi",
            className: "text-right",
            accessor: (category) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleOpenModal(category)}
                        className="p-1.5 lg:p-2 rounded-xl hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-500/20 dark:text-blue-400 transition-all active:scale-90"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => setDeleteId(category.id)}
                        className="p-1.5 lg:p-2 rounded-xl hover:bg-red-50 text-red-600 dark:hover:bg-red-500/20 dark:text-red-400 transition-all active:scale-90"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <AdminHeader
                title="Kategori"
                description="Kelola kategori produk untuk menu POS"
            />



            <AdminSearchHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari kategori..."
                addButtonLabel="Kategori"
                onAddClick={() => handleOpenModal()}
                extraActions={
                    <div className="flex items-center gap-2">
                        <AdminSelect
                            value={pageSize}
                            onChange={(val) => setPageSize(val as number)}
                            options={[5, 10, 25, 50].map(size => ({ value: size, label: size.toString() }))}
                        />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">Per Halaman</span>
                    </div>
                }
            />

            <AdminDataTable
                data={paginatedCategories}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(category) => category.id}
                mobileCardRender={(category) => {
                    const styles = getCategoryStyles(category.color);
                    return (
                        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${styles.className || ''}`}
                                    style={styles.container}
                                >
                                    <IconComponent name={category.icon || 'Tag'} size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{category.name}</h3>
                                    <code className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                        {category.slug}
                                    </code>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(category.id)}
                                        className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }}
            />

            <AdminPagination
                currentPage={currentPage}
                totalItems={filteredCategories.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animation-scale-in">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nama Kategori
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                                    placeholder="Contoh: Minuman"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Slug (URL Friendly)
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white font-mono text-sm"
                                    placeholder="contoh: minuman"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Pilih Icon
                                </label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Cari icon..."
                                            value={iconSearch}
                                            onChange={(e) => setIconSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                                        {COMMON_ICONS.filter(i => i.label.toLowerCase().includes(iconSearch.toLowerCase()) || i.name.toLowerCase().includes(iconSearch.toLowerCase())).map((icon) => (
                                            <button
                                                key={icon.name}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: icon.name })}
                                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${formData.icon === icon.name
                                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400 hover:border-primary/50'
                                                    }`}
                                            >
                                                <IconComponent name={icon.name} size={18} />
                                                <span className="text-[8px] mt-1 hidden sm:block truncate w-full text-center">{icon.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Warna Label
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-white/10 relative">
                                        <input
                                            type="color"
                                            value={formData.color.startsWith('#') ? formData.color : '#C5161D'}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white font-mono uppercase"
                                            placeholder="#C5161D"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-red-700 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Save Confirmation */}
            <ConfirmationModal
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleConfirmSave}
                title="Simpan Perubahan?"
                message={`Apakah Anda yakin ingin menyimpan perubahan pada kategori "${formData.name}"?`}
                variant="primary"
                confirmLabel="Simpan"
                icon={Save}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Kategori?"
                message="Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus secara permanen."
            />
        </div>
    );
}
