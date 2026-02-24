'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Save, CreditCard, QrCode, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';

interface PaymentSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PaymentFormData {
    qris_data?: string;
    qris_image_file?: File;
}

export function PaymentSettingsModal({ isOpen, onClose }: PaymentSettingsModalProps) {
    const { user, updateProfile } = useAuthStore();
    const { success, error: showError } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<PaymentFormData>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Animation State
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                if (user?.id) {
                    const response = await api.get(`/users/${user.id}/`);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const userData = ((response.data as any)?.data || response.data) as any;
                    const paymentInfo = userData.payment_info || {};
                    // We also get qris_data directly from the serializer if we expose it, otherwise payment_info
                    setFormData({
                        qris_data: paymentInfo.qris_data || '',
                    });
                    if (paymentInfo.qris_image) {
                        setPreviewImage(paymentInfo.qris_image);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                showError('Gagal memuat pengaturan pembayaran');
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            setMounted(true);
            setShowDeleteConfirm(false);
            setTimeout(() => setIsVisible(true), 10);
            fetchSettings();
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, showError, user?.id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewImage(url);

            // Store file in formData
            setFormData(prev => ({ ...prev, qris_image_file: file }));
            setShowDeleteConfirm(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        setIsSaving(true);

        try {
            // Create FormData for file upload
            const data = new FormData();
            if (formData.qris_data !== undefined) {
                data.append('qris_data', formData.qris_data);
            }
            if (formData.qris_image_file) {
                data.append('qris_image', formData.qris_image_file);
            }

            const res = await api.patch(`/users/${user.id}/`, data);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const patchedUser = ((res.data as any)?.data || res.data) as any;

            updateProfile({
                payment_info: patchedUser.payment_info || user.payment_info
            });

            success('Pengaturan QRIS berhasil disimpan');
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            showError('Gagal menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteQrisConfirm = async () => {
        if (!user?.id) return;
        setPreviewImage(null);
        setFormData(prev => ({ ...prev, qris_image_file: undefined }));
        setShowDeleteConfirm(false);

        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('qris_image', '');

            const res = await api.patch(`/users/${user.id}/`, data);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const patchedUser = ((res.data as any)?.data || res.data) as any;

            updateProfile({
                payment_info: patchedUser.payment_info || user.payment_info
            });

            success('Gambar QRIS berhasil dihapus');
        } catch (error) {
            console.error('Failed to delete QRIS image:', error);
            showError('Gagal menghapus gambar QRIS');
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className={`relative w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-sm z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="text-primary" size={20} />
                            Pengaturan Pembayaran
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Konfigurasi rekening bank dan e-wallet toko</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : (
                        <form id="payment-settings-form" onSubmit={handleSubmit} className="space-y-8">

                            {/* QRIS Upload */}
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Upload QRIS</label>
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-32 h-32 rounded-xl bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden relative group"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {previewImage ? (
                                            <Image
                                                src={previewImage}
                                                alt="QRIS Preview"
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <>
                                                <QrCode className="text-gray-400 mb-2" size={24} />
                                                <span className="text-[10px] text-gray-500 text-center px-2">Ketuk untuk unggah</span>
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="text-white" size={20} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            Upload gambar QRIS statis toko Anda. Gambar ini akan ditampilkan di layar checkout saat metode pembayaran QRIS dipilih.
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                            >
                                                Pilih Gambar
                                            </button>
                                            {previewImage && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                                >
                                                    Hapus Gambar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* QRIS Data String */}
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">QRIS Data String (Dynamic)</label>
                                <textarea
                                    value={formData.qris_data || ''}
                                    onChange={e => setFormData({ ...formData, qris_data: e.target.value })}
                                    placeholder="000201010211..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-mono resize-none"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Paste data string dari QRIS statis toko (scan QR dengan QR reader biasa untuk mendapat string ini). Diperlukan agar sistem kasir bisa menampilkan QRIS dengan nominal otomatis.
                                </p>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-sm z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="payment-settings-form"
                        disabled={isSaving || isLoading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-red-700 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Custom Confirm Delete Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden transform transition-all">
                        <div className="p-6 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4">
                                <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Gambar?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">
                                Apakah Anda yakin ingin menghapus gambar QRIS ini? Pembeli tidak akan melihat QRIS statis sampai Anda mengunggahnya kembali.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-bold text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteQrisConfirm}
                                    className="flex-1 px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm shadow-lg shadow-red-500/20 flex justify-center items-center"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Ya, Hapus"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
