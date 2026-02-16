'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, CheckCircle2, Layers, Tags } from 'lucide-react';
import api from '@/lib/api';
import type { ModifierOption, ModifierGroup, ApiResponse } from '@/types/api';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ToastContext';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { extractApiArray } from '@/lib/api-utils';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSearchHeader } from '@/components/admin/AdminSearchHeader';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';
import { StatCard } from '@/components/admin/StatCard';
import { useAuthStore } from '@/store/useAuthStore';

export default function ModifiersPage() {
    const { success, error: showError } = useToast();
    const { user } = useAuthStore();
    const [modifiers, setModifiers] = useState<ModifierOption[]>([]);
    const [groups, setGroups] = useState<ModifierGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGroup, setFilterGroup] = useState<string>('all');
    const [filterAvailability, setFilterAvailability] = useState<string>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ModifierOption | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        group: '',
        price_adjustment: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [modRes, groupRes] = await Promise.all([
                api.get<ApiResponse<ModifierOption[]>>('/catalog/modifier-options/'),
                api.get<ApiResponse<ModifierGroup[]>>('/catalog/modifier-groups/')
            ]);
            setModifiers(extractApiArray(modRes.data));
            setGroups(extractApiArray(groupRes.data));
        } catch (error) {
            console.error('Failed to fetch modifiers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAvailability = async (modifier: ModifierOption) => {
        // Optimistic Update
        const oldStatus = modifier.mitra_availability ?? true; // Default to true if undefined
        const newStatus = !oldStatus;

        setModifiers(prev => prev.map(m => m.id === modifier.id ? { ...m, mitra_availability: newStatus } : m));

        try {
            await api.post(`/catalog/modifier-options/${modifier.id}/toggle_availability/`, {
                available: newStatus
            });
            success('Status diperbarui');
        } catch {
            showError('Gagal mengubah status');
            // Revert
            setModifiers(prev => prev.map(m => m.id === modifier.id ? { ...m, mitra_availability: oldStatus } : m));
        }
    };

    const handleOpenModal = (item?: ModifierOption) => {
        if (item) {
            setEditingItem(item);
            // find group id from group object if populated or just ID?
            // API returns flat modifier options? Usually serializer includes ID or specialized structure.
            // Let's assume serializer returns group ID or object.
            // My default serializer: fields = ['id', 'name', 'price_adjustment', 'mitra_availability'].
            // Wait, does it return `group`?
            // I need to check serializer. `ModifierOptionSerializer` usually has `group`.
            // If not, I should update serializer (step for later if needed).
            // Assuming it returns `group` ID.
            // Actually, my `ModifierOptionViewSet` uses `ModifierOptionSerializer` which has `fields = ['id', 'name', 'price_adjustment', 'mitra_availability']`.
            // IT IS MISSING `group`!
            // I need to fix backend serializer first? Or fetch logic?
            // The `ModifierOption` model has foreign key `group`. 
            // I MUST include it in serializer.

            // For now, I'll write the frontend code assuming I'll fix the serializer immediately after.
            // Or I can update serializer now?

            // Let's assume `group` is returned as ID.
            setFormData({
                name: item.name,
                group: item.group ? String(item.group) : '',
                price_adjustment: String(item.price_adjustment)
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                group: groups[0]?.id ? String(groups[0].id) : '',
                price_adjustment: '0'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                group: Number(formData.group),
                price_adjustment: Number(formData.price_adjustment)
            };

            if (editingItem) {
                await api.patch(`/catalog/modifier-options/${editingItem.id}/`, payload);
                success('Berhasil diperbarui');
            } else {
                await api.post('/catalog/modifier-options/', payload);
                success('Berhasil ditambahkan');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save:', err);
            showError('Gagal menyimpan');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/catalog/modifier-options/${deleteId}/`);
            success('Berhasil dihapus');
            fetchData();
        } catch {
            showError('Gagal menghapus');
        } finally {
            setDeleteId(null);
        }
    };

    const filteredModifiers = modifiers.filter(item => {
        if (filterGroup !== 'all') {
            const grpId = item.group;
            if (String(grpId) !== filterGroup) return false;
        }
        if (filterAvailability !== 'all') {
            // For SuperAdmin, availability might not be relevant (no mitra_availability).
            // But for Mitra, it is.
            // If User is SuperAdmin, this filter might check? 
            // Mitra see their availability.
            // Let's use mitra_availability if present.
            const isAvail = item.mitra_availability ?? true;
            if (filterAvailability === 'available' && !isAvail) return false;
            if (filterAvailability === 'unavailable' && isAvail) return false;
        }
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const paginated = filteredModifiers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Columns
    const columns: Column<ModifierOption>[] = [
        {
            header: "Nama Topping",
            accessor: "name",
            className: "font-semibold text-gray-900 dark:text-white"
        },
        {
            header: "Grup",
            accessor: (item) => {
                const grpId = item.group;
                const grp = groups.find(g => g.id === grpId);
                return (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                        {grp?.name || '-'}
                    </span>
                );
            }
        },
        {
            header: "Harga (+)",
            accessor: (item) => formatCurrency(item.price_adjustment),
            className: "text-gray-600 dark:text-gray-400 font-medium"
        },
        {
            header: "Status",
            accessor: (item) => {
                const isAvailable = item.mitra_availability ?? true;

                if (user?.role === 'mitra') {
                    return (
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isAvailable}
                                onChange={() => handleToggleAvailability(item)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                                {isAvailable ? 'Aktif' : 'Habis'}
                            </span>
                        </label>
                    );
                } else {
                    // SuperAdmin View
                    // Just show 'Active' (manual toggle by Mitra, so global status?)
                    // Actually Modifiers don't have global 'is_available' field in models.py?
                    // Let's check model. No, only 'is_available' in Pivot.
                    // So SuperAdmin sees ? Nothing? Or maybe we should add global availability?
                    // Task says "Manual Topping Availability (Mitra)".
                    // So Global is assumed always available unless Mitra toggles off?
                    // Or assumes stock?
                    // Let's just show "Available" or "-" for Admin.
                    return <span className="text-xs text-gray-400">-</span>;
                }
            }
        },
        ...(user?.role === 'superadmin' ? [{
            header: "Aksi",
            className: "text-right",
            accessor: (item: ModifierOption) => (
                <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        } as Column<ModifierOption>] : [])
    ];

    return (
        <div className="space-y-6">
            <AdminHeader title="Topping / Modifier" description="Kelola topping dan varian tambahan" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard title="Total Topping" value={modifiers.length} icon={Layers} color="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-white" />
                <StatCard title="Grup" value={groups.length} icon={Tags} color="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-white" />
                <StatCard title="Aktif (Mitra)" value={modifiers.filter(m => m.mitra_availability).length} icon={CheckCircle2} color="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-white" />
            </div>

            <AdminSearchHeader
                searchQuery={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Cari topping..."
                addButtonLabel={user?.role === 'superadmin' ? "Topping" : undefined}
                onAddClick={user?.role === 'superadmin' ? () => handleOpenModal() : undefined}
                extraActions={
                    <div className="flex items-center gap-3">
                        <AdminSelect value={filterGroup} onChange={val => setFilterGroup(String(val))}
                            options={[{ value: 'all', label: 'Semua Grup' }, ...groups.map(g => ({ value: String(g.id), label: g.name }))]}
                        />
                        {user?.role === 'mitra' && (
                            <AdminSelect value={filterAvailability} onChange={val => setFilterAvailability(String(val))}
                                options={[{ value: 'all', label: 'Semua Status' }, { value: 'available', label: 'Aktif' }, { value: 'unavailable', label: 'Habis' }]}
                            />
                        )}
                    </div>
                }
            />

            <AdminDataTable
                data={paginated} columns={columns} isLoading={isLoading} keyExtractor={item => item.id}
                mobileCardRender={(item) => (
                    <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</h4>
                            <p className="text-xs text-red-600 font-semibold mt-1">+{formatCurrency(item.price_adjustment)}</p>
                            <span className="text-[10px] text-gray-500 mt-1 block">{(groups.find(g => g.id === item.group) || {}).name}</span>
                        </div>
                        <div>
                            {user?.role === 'mitra' ? (
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={item.mitra_availability ?? true} onChange={() => handleToggleAvailability(item)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                            ) : (
                                user?.role === 'superadmin' && (
                                    <button onClick={() => handleOpenModal(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Pencil size={16} /></button>
                                )
                            )}
                        </div>
                    </div>
                )}
            />

            <AdminPagination currentPage={currentPage} totalItems={filteredModifiers.length} pageSize={pageSize} onPageChange={setCurrentPage} />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-white/10">
                        <h3 className="text-lg font-bold mb-4">{editingItem ? 'Edit Topping' : 'Tambah Topping'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nama</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Grup</label>
                                <select value={formData.group} onChange={e => setFormData({ ...formData, group: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 focus:ring-2 focus:ring-primary">
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tambahan Harga</label>
                                <input type="number" value={formData.price_adjustment} onChange={e => setFormData({ ...formData, price_adjustment: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 focus:ring-2 focus:ring-primary" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border font-bold text-sm">Batal</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20">
                                {isSaving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Hapus Topping ini?" message="Topping tidak dapat dipulihkan." />
        </div>
    );
}
