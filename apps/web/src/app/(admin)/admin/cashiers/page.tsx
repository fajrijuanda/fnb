'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, X, Loader2, Save, UserCircle } from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import api from '@/lib/api';
import type { User, ApiResponse } from '@/types/api';
import { extractApiArray } from '@/lib/api-utils';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSearchHeader } from '@/components/admin/AdminSearchHeader';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';

export default function UsersPage() {
    const { success, error: showError } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        role: 'cashier'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get<ApiResponse<User[]>>('/users/');
            setUsers(extractApiArray(response.data));
        } catch (error) {
            console.error('Failed to fetch users:', error);
            showError('Gagal memuat data kasir');
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '', // Don't show password
                email: user.email || '',
                role: 'cashier'
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                email: '',
                role: 'cashier'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({ username: '', password: '', email: '', role: 'cashier' });
    };

    const handleConfirmSave = async () => {
        setShowSaveConfirm(false);
        setIsSaving(true);
        try {
            const dataToSend = { ...formData, role: 'cashier' };

            if (editingUser) {
                const updateData: Partial<typeof formData> = { ...dataToSend };
                if (!updateData.password) delete updateData.password;
                await api.patch(`/users/${editingUser.id}/`, updateData);
                success('Kasir berhasil diperbarui');
            } else {
                await api.post('/users/', dataToSend);
                success('Kasir berhasil ditambahkan');
            }
            fetchUsers();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save user:', error);
            showError('Gagal menyimpan kasir');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/users/${deleteId}/`);
            success('Kasir berhasil dihapus');
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            showError('Gagal menghapus kasir');
        } finally {
            setDeleteId(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSaveConfirm(true);
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Logic
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize]);

    const columns: Column<User>[] = [
        {
            header: "Username",
            accessor: (user) => (
                <div className="flex items-center gap-2 lg:gap-3">
                    <div className="h-7 w-7 lg:h-8 lg:w-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-gray-500 dark:text-white/70">
                        <UserCircle size={18} className="lg:w-5 lg:h-5" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px] lg:max-w-none">{user.username}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Email",
            accessor: (user) => user.email || '-'
        },
        {
            header: "Aksi",
            className: "text-right",
            accessor: (user) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleOpenModal(user)}
                        className="p-1 lg:p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-500/20 dark:text-blue-400 transition-colors"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => setDeleteId(user.id)}
                        className="p-1 lg:p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-500/20 dark:text-red-400 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <AdminHeader
                title="Manajemen Kasir"
                description="Kelola akun kasir untuk outlet Anda"
            />

            <AdminSearchHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari kasir..."
                addButtonLabel="Tambah Kasir"
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
                data={paginatedUsers}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(user) => user.id}
                mobileCardRender={(user) => (
                    <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <UserCircle size={24} className="text-gray-400" />
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{user.username}</h3>
                                    <p className="text-[10px] text-gray-500">{user.email || 'Tanpa email'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-white/5 pt-2">
                            <button onClick={() => handleOpenModal(user)} className="p-2 text-blue-600"><Pencil size={16} /></button>
                            <button onClick={() => setDeleteId(user.id)} className="p-2 text-red-600"><Trash2 size={16} /></button>
                        </div>
                    </div>
                )}
            />

            <AdminPagination
                currentPage={currentPage}
                totalItems={filteredUsers.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animation-scale-in">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingUser ? 'Edit Kasir' : 'Tambah Kasir'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                                    placeholder="Username kasir"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email (Opsional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                                    placeholder="Password"
                                />
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
                message={`Apakah Anda yakin ingin menyimpan perubahan pada kasir "${formData.username}"?`}
                variant="primary"
                confirmLabel="Simpan"
                icon={Save}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Hapus Kasir?"
                message="Tindakan ini tidak dapat dibatalkan. Kasir akan dihapus secara permanen."
            />
        </div>
    );
}
