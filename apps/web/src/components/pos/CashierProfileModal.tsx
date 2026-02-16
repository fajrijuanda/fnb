'use client';

import { useState } from 'react';
import { X, Loader2, Save, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ToastContext';
import { DeviceManagement } from '@/components/settings/DeviceManagement';
import { CloseShiftModal } from '@/components/pos/CloseShiftModal';

interface CashierProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CashierProfileModal({ isOpen, onClose }: CashierProfileModalProps) {
    const { user, updateProfile } = useAuthStore();
    const { success } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        username: user?.username || '',
        currentPassword: '',
        newPassword: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API Call
        setTimeout(() => {
            // Update Store
            updateProfile({
                username: formData.username
            });

            setIsLoading(false);
            onClose();
            success('Profil berhasil diperbaharui');
        }, 1500);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-md max-h-[90vh] bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-red-400">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">Profil Kasir</h2>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Atur informasi akun Anda</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body - Scrollable */}
                    <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1">
                        {/* Username Field */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="Username"
                                />
                            </div>
                        </div>

                        <div className="my-2 border-t border-gray-100 dark:border-white/5" />

                        {/* Change Password Section */}
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-gray-900 dark:text-white">Ganti Password</p>

                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-9 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="Password Saat Ini"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-9 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="Password Baru"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>

                            <div className="my-2 border-t border-gray-100 dark:border-white/5" />

                            {/* Device Management */}
                            <DeviceManagement />

                            <div className="my-2 border-t border-gray-100 dark:border-white/5" />

                            {/* Shift Management */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">Manajemen Shift</p>
                                <button
                                    type="button"
                                    onClick={() => setIsCloseShiftModalOpen(true)}
                                    className="w-full flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/20 rounded-xl transition-colors group"
                                >
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Tutup Kasir (End Shift)</span>
                                    <div className="h-5 w-5 rounded-lg bg-white dark:bg-red-900/40 flex items-center justify-center shadow-sm">
                                        <Lock className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="pt-3 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-red-600 hover:shadow-lg hover:shadow-primary/20 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <CloseShiftModal
                isOpen={isCloseShiftModalOpen}
                onClose={() => setIsCloseShiftModalOpen(false)}
            />
        </>
    );
}
