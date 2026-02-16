'use client';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Loader2, ImageOff, X, ImagePlus, ShoppingBag, Tag, CheckCircle2, XCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import api from '@/lib/api';
import type { Product, Category, ApiResponse } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ToastContext';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { Save } from 'lucide-react';
import { extractApiArray } from '@/lib/api-utils';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSearchHeader } from '@/components/admin/AdminSearchHeader';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';
import { StatCard } from '@/components/admin/StatCard';
import { useAuthStore } from '@/store/useAuthStore';

const IconComponent = ({ name, size = 16, className = "", style = {} }: { name: string, size?: number, className?: string, style?: CSSProperties }) => {
    // Convert kebab-case to PascalCase (e.g., 'chef-hat' -> 'ChefHat', 'utensils' -> 'Utensils')
    const pascalCase = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[pascalCase]
        || (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[name]
        || LucideIcons.HelpCircle;
    return <Icon size={size} className={className} style={style} />;
};

const CATEGORY_COLORS: Record<string, { bg: string, text: string, icon: string, style?: { container?: CSSProperties, icon?: CSSProperties } }> = {
    'Dimsum': { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', icon: 'text-red-600' },
    'Gyoza': { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-600' },
    'Wonton': { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-600' },
    'Makanan Berat': { bg: 'bg-red-100 dark:bg-primary/20', text: 'text-red-800 dark:text-red-400', icon: 'text-red-700' },
    'Makanan Ringan': { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-600' },
    'Minuman': { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-600' },
    'Snack': { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-600' },
    'Paket': { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300', icon: 'text-indigo-600' },
    'Dessert': { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-700 dark:text-pink-300', icon: 'text-pink-600' },
    'Default': { bg: 'bg-gray-100 dark:bg-white/10', text: 'text-gray-700 dark:text-white', icon: 'text-gray-500' }
};

interface ColorConfig {
    bg: string;
    text: string;
    icon: string;
    style?: {
        container?: CSSProperties;
        icon?: CSSProperties;
    };
}

const CategoryBadge = ({ name, icon, color }: { name: string, icon: string, color: ColorConfig }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            // Update position on mount
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setStats({ top: rect.top + rect.height / 2, left: rect.right + 10 });
            }
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    // Handle scroll to close or update?? For simplicity, let's just close on scroll if possible?
    // Actually fixed position stays on screen. It's fine for now.

    return (
        <>
            <div
                ref={triggerRef}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color.bg || ''} ${color.text || ''} border border-transparent hover:border-current shadow-sm transition-all cursor-pointer relative select-none`}
                title={name}
                style={color.style?.container}
                onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setStats({ top: rect.top + rect.height / 2, left: rect.right + 10 });
                    setIsOpen(!isOpen);
                }}
            >
                <IconComponent name={icon} size={16} className={color.icon || ''} style={color.style?.icon} />
            </div>

            {isOpen && createPortal(
                <div
                    className="fixed z-[9999] px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 pointer-events-none transform -translate-y-1/2"
                    style={{ top: stats.top, left: stats.left }}
                >
                    {name}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>,
                document.body
            )}
        </>
    );
};

const MobileCategoryBadge = ({ name, icon, color }: { name: string, icon: string, color: ColorConfig }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setStats({ top: rect.top + rect.height / 2, left: rect.right + 10 });
            }
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            <div
                ref={triggerRef}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${color.bg || ''} ${color.text || ''} text-[10px] cursor-pointer relative select-none`}
                style={color.style?.container}
                title={name}
                onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setStats({ top: rect.top + rect.height / 2, left: rect.right + 10 });
                    setIsOpen(!isOpen);
                }}
            >
                <IconComponent name={icon} size={10} className={color.icon || ''} style={color.style?.icon} />
                <span className="font-medium">{name}</span>
            </div>
            {isOpen && createPortal(
                <div
                    className="fixed z-[9999] px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 pointer-events-none transform -translate-y-1/2"
                    style={{ top: stats.top, left: stats.left }}
                >
                    {name}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>,
                document.body
            )}
        </>
    );
};

export default function ProductsPage() {
    const { success, error: showError } = useToast();
    const { user } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterAvailability, setFilterAvailability] = useState<string>('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        stock: '0',
        description: '',
        image_url: '',
        is_available: true
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get<ApiResponse<Product[]>>('/catalog/products/'),
                api.get<ApiResponse<Category[]>>('/catalog/categories/')
            ]);

            setProducts(extractApiArray(prodRes.data));
            setCategories(extractApiArray(catRes.data));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/catalog/products/${deleteId}/`);
            success('Produk berhasil dihapus');
            fetchData();
        } catch (err) {
            console.error('Failed to delete product:', err);
            showError('Gagal menghapus produk');
        } finally {
            setDeleteId(null);
        }
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: typeof product.category === 'string' ? product.category : String(product.category),
                price: String(product.price),
                stock: String(product.stock || 0),
                description: product.description || '',
                image_url: product.image_url || '',
                is_available: product.is_available
            });
            setImageFile(null);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: categories[0]?.id ? String(categories[0].id) : '',
                price: '',
                stock: '0',
                description: '',
                image_url: '',
                is_available: true
            });
            setImageFile(null);
        }
        setIsProductModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, image_url: objectUrl }));
        }
    };

    const handleConfirmSave = async () => {
        setShowSaveConfirm(false);
        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('price', formData.price);
            data.append('stock', formData.stock);
            data.append('description', formData.description);
            // Handle availability as "true" or "false" string for FormData
            data.append('is_available', formData.is_available ? 'true' : 'false');

            // Handle category
            const catVal = isNaN(Number(formData.category)) ? formData.category : String(formData.category);
            data.append('category', catVal);
            // Also send category_id for safety if backend expects it or handles it via source
            if (!isNaN(Number(formData.category))) {
                data.append('category_id', String(formData.category));
            }

            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editingProduct) {
                await api.patch(`/catalog/products/${editingProduct.id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                success('Produk berhasil diperbarui');
            } else {
                await api.post('/catalog/products/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                success('Produk berhasil ditambahkan');
            }
            fetchData();
            setIsProductModalOpen(false);
        } catch (err) {
            console.error('Failed to save product:', err);
            showError('Gagal menyimpan produk');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
        // Category filter
        if (filterCategory !== 'all') {
            const catId = typeof product.category === 'number' ? product.category : Number(product.category);
            if (String(catId) !== filterCategory) return false;
        }

        // Availability filter
        if (filterAvailability !== 'all') {
            const isAvailable = product.stock_status?.available ?? product.is_available;
            if (filterAvailability === 'available' && !isAvailable) return false;
            if (filterAvailability === 'unavailable' && isAvailable) return false;
        }

        return product.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Pagination Logic
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize, filterCategory, filterAvailability]);

    const getCategoryConfig = (product: Product) => {
        // If product.category is a number (ID), find in categories list
        // If it's a string (Name), use it directly or find by name
        let cat: Category | undefined;

        if (typeof product.category === 'number' || !isNaN(Number(product.category))) {
            const catId = Number(product.category);
            cat = categories.find(c => c.id === catId);
        } else if (typeof product.category === 'string') {
            cat = categories.find(c => c.name === product.category);
        }

        if (!cat && product.category_details) {
            cat = product.category_details;
        }

        const name = cat?.name || (typeof product.category === 'string' ? product.category : '-');
        const icon = cat?.icon || 'Tag';

        let colorConfig = CATEGORY_COLORS[name] || CATEGORY_COLORS['Default'];

        if (cat?.color) {
            // Hex Code Check
            if (cat.color.startsWith('#')) {
                return {
                    name,
                    icon,
                    color: {
                        bg: '',
                        text: '',
                        icon: '',
                        style: {
                            container: {
                                backgroundColor: `${cat.color}20`,
                                color: cat.color,
                                borderColor: `${cat.color}50`
                            },
                            icon: { color: cat.color }
                        }
                    }
                };
            }

            const mapping: Record<string, { bg: string, text: string, icon: string }> = {
                orange: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', icon: 'text-amber-500' },
                blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-500' },
                purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', icon: 'text-purple-500' },
                green: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-500' },
                red: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', icon: 'text-red-500' },
                cyan: { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-400', icon: 'text-cyan-500' },
                pink: { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-700 dark:text-pink-400', icon: 'text-pink-500' },
                indigo: { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-400', icon: 'text-indigo-500' },
                yellow: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', icon: 'text-yellow-500' },
            };
            if (mapping[cat.color]) {
                colorConfig = mapping[cat.color];
            }
        }
        return { name, icon, color: colorConfig };
    };

    const columns: Column<Product>[] = [
        {
            header: "Gambar",
            accessor: (product) => (
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden relative shadow-inner">
                    {product.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex w-full h-full items-center justify-center text-gray-400">
                            <ImageOff size={16} />
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Nama Produk",
            accessor: "name",
            className: "font-semibold text-gray-900 dark:text-white"
        },
        {
            header: "Kategori",
            accessor: (product) => {
                const { name, icon, color } = getCategoryConfig(product);
                return <CategoryBadge name={name} icon={icon} color={color} />;
            }
        },
        {
            header: "Harga",
            accessor: (product) => formatCurrency(product.price),
            className: "text-red-700 dark:text-red-500 font-semibold"
        },
        {
            header: "Status",
            accessor: (product) => {
                const isAvailable = product.stock_status?.available ?? product.is_available;
                return (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isAvailable
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                        {isAvailable ? 'Tersedia' : 'Habis'}
                    </span>
                );
            }
        },
        ...(user?.role === 'superadmin' ? [{
            header: "Aksi",
            className: "text-right",
            accessor: (product: Product) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleOpenModal(product)}
                        className="p-1 lg:p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-500/20 dark:text-blue-400 transition-colors"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => setDeleteId(product.id)}
                        className="p-1 lg:p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-500/20 dark:text-red-400 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        } as Column<Product>] : [])
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <AdminHeader
                title="Produk"
                description="Kelola daftar menu dan produk anda"
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-4">
                <StatCard
                    title="Total Produk"
                    value={(Array.isArray(products) ? products : []).length}
                    icon={ShoppingBag}
                    color="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-white"
                />
                <StatCard
                    title="Kategori"
                    value={categories.length}
                    icon={Tag}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-white"
                />
                <StatCard
                    title="Tersedia"
                    value={(Array.isArray(products) ? products : []).filter(p => p.stock_status?.available ?? p.is_available).length}
                    icon={CheckCircle2}
                    color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-white"
                />
                <StatCard
                    title="Habis"
                    value={(Array.isArray(products) ? products : []).filter(p => !(p.stock_status?.available ?? p.is_available)).length}
                    icon={XCircle}
                    color="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-white"
                />
            </div>

            <AdminSearchHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari produk..."
                addButtonLabel={user?.role === 'superadmin' ? "Produk" : undefined}
                onAddClick={user?.role === 'superadmin' ? () => handleOpenModal() : undefined}
                extraActions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">Kategori</span>
                            <AdminSelect
                                value={filterCategory}
                                onChange={(val) => setFilterCategory(val as string)}
                                options={[
                                    { value: 'all', label: 'Semua' },
                                    ...categories.map(cat => ({ value: String(cat.id), label: cat.name }))
                                ]}
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">Status</span>
                            <AdminSelect
                                value={filterAvailability}
                                onChange={(val) => setFilterAvailability(val as string)}
                                options={[
                                    { value: 'all', label: 'Semua' },
                                    { value: 'available', label: 'Tersedia' },
                                    { value: 'unavailable', label: 'Habis' },
                                ]}
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <AdminSelect
                                value={pageSize}
                                onChange={(val) => setPageSize(val as number)}
                                options={[5, 10, 25, 50].map(size => ({ value: size, label: size.toString() }))}
                            />
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">Per Halaman</span>
                        </div>
                    </div>
                }
            />

            <AdminDataTable
                data={paginatedProducts}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(product) => product.id}
                mobileCardRender={(product) => (
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden relative shrink-0">
                                {product.image_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex w-full h-full items-center justify-center text-gray-400">
                                        <ImageOff size={20} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{product.name}</h3>
                                <div className="mt-1">
                                    {(() => {
                                        const { name, icon, color } = getCategoryConfig(product);
                                        return (
                                            // Mobile view inline replacement logic implies we should just use CategoryBadge here too?
                                            // But mobile view structure is different (flex row).
                                            // Let's use logic similar to desktop but adapted.
                                            // Actually, CategoryBadge logic allows being wrapped.
                                            // But mobile view has 'gap-1 px-1.5' styles.
                                            // I will refactor mobile render to use a simplified popover trigger or just keep it simple.
                                            // User request "bukan menggunakan toast... seperti popover".
                                            // Let's just wrap the mobile rendering in a similar logic but inline?
                                            // Or better, extract a generic `PopoverTrigger`?
                                            // For speed: Inline the state for mobile view item.

                                            // Actually, let's just make a specialized MobileCategoryBadge to keep code clean?
                                            // Or reuse CategoryBadge but pass className props?
                                            // CategoryBadge has specific dimensions w-8 h-8.
                                            // Mobile view is different.

                                            <MobileCategoryBadge name={name} icon={icon} color={color} />
                                        );
                                    })()}
                                </div>
                                <p className="text-sm font-semibold text-red-700 dark:text-red-500 mt-1">{formatCurrency(product.price)}</p>
                                {(() => {
                                    const isAvailable = product.stock_status?.available ?? product.is_available;
                                    return (
                                        <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isAvailable
                                            ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                                            }`}>
                                            {isAvailable ? 'Tersedia' : 'Habis'}
                                        </span>
                                    );
                                })()}
                            </div>

                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => handleOpenModal(product)}
                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => setDeleteId(product.id)}
                                    className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            />

            <AdminPagination
                currentPage={currentPage}
                totalItems={filteredProducts.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
            />

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animation-scale-in">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
                            </h3>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Nama Produk</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary text-sm font-medium"
                                            placeholder="Contoh: Nasi Goreng Spesial"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Kategori</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary text-sm"
                                        >
                                            {categories.map((cat: Category) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Harga (Rp)</label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary text-sm font-bold"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Stok</label>
                                            <input
                                                type="number"
                                                value={formData.stock}
                                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary text-sm font-bold"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_available}
                                                onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Status Tersedia</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Foto Produk</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-video rounded-2xl bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative group cursor-pointer hover:border-primary/50 transition-colors"
                                        >
                                            {formData.image_url ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Pencil className="text-white" size={24} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-primary transition-colors">
                                                    <ImagePlus size={32} />
                                                    <span className="text-[10px] mt-2 font-bold uppercase tracking-wider">Upload Gambar</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <p className="text-[10px] text-center text-gray-400">Klik untuk mengganti gambar. Maksimal 2MB.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Deskripsi</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary text-sm"
                                            placeholder="Penjelasan singkat produk..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50 dark:bg-white/5">
                            <button
                                onClick={() => setIsProductModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-colors font-bold text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => setShowSaveConfirm(true)}
                                disabled={isSaving}
                                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-red-700 text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Menyimpan...</span>
                                    </div>
                                ) : (
                                    'Simpan Perubahan'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Confirmation Modal */}
            <ConfirmationModal
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleConfirmSave}
                title="Simpan Perubahan?"
                message={`Apakah Anda yakin ingin menyimpan perubahan pada produk "${formData.name}"?`}
                variant="primary"
                confirmLabel="Simpan"
                icon={Save}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Produk?"
                message="Tindakan ini tidak dapat dibatalkan. Produk akan dihapus secara permanen dari sistem."
            />
        </div>
    );
}
