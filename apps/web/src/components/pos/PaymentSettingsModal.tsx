'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Save, CreditCard, Wallet, Smartphone, QrCode, Upload } from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import api from '@/lib/api';
import type { StoreSettings, WrappedResponse } from '@/types/api';
import Image from 'next/image';

interface PaymentSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PaymentSettingsModal({ isOpen, onClose }: PaymentSettingsModalProps) {
    const { success, error: showError } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<StoreSettings>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Animation State
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setTimeout(() => setIsVisible(true), 10);
            fetchSettings();
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<StoreSettings>('/settings/store/');
            setFormData(response.data);
            if (response.data.qris_image) {
                setPreviewImage(response.data.qris_image);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            showError('Gagal memuat pengaturan pembayaran');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewImage(url);

            // Store file in formData (we'll need to handle multipart/form-data on submit)
            setFormData(prev => ({ ...prev, qris_image_file: file } as any));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Create FormData for file upload
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'qris_image_file') {
                    data.append('qris_image', value as File);
                } else if (key !== 'qris_image' && value !== null && value !== undefined) {
                    data.append(key, value.toString());
                }
            });

            await api.patch('/settings/store/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            success('Pengaturan pembayaran berhasil disimpan');
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            showError('Gagal menyimpan pengaturan');
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

                            {/* Bank Section */}
                            <section className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-white/10">
                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        <CreditCard size={14} />
                                    </div>
                                    Rekening Bank (Transfer)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Bank</label>
                                        <input
                                            type="text"
                                            value={formData.bank_name || ''}
                                            onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                            placeholder="Contoh: BCA, Mandiri, BRI"
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor Rekening</label>
                                        <input
                                            type="text"
                                            value={formData.bank_account || ''}
                                            onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
                                            placeholder="1234567890"
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Atas Nama</label>
                                        <input
                                            type="text"
                                            value={formData.bank_holder || ''}
                                            onChange={e => setFormData({ ...formData, bank_holder: e.target.value })}
                                            placeholder="Nama Pemilik Rekening"
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* E-Wallet Section */}
                            <section className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-white/10">
                                    <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                        <Smartphone size={14} />
                                    </div>
                                    E-Wallet & QRIS
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">DANA</label>
                                        <input
                                            type="text"
                                            value={formData.dana_number || ''}
                                            onChange={e => setFormData({ ...formData, dana_number: e.target.value })}
                                            placeholder="08..."
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">GoPay</label>
                                        <input
                                            type="text"
                                            value={formData.gopay_number || ''}
                                            onChange={e => setFormData({ ...formData, gopay_number: e.target.value })}
                                            placeholder="08..."
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ShopeePay</label>
                                        <input
                                            type="text"
                                            value={formData.shopeepay_number || ''}
                                            onChange={e => setFormData({ ...formData, shopeepay_number: e.target.value })}
                                            placeholder="08..."
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">OVO</label>
                                        <input
                                            type="text"
                                            value={formData.ovo_number || ''}
                                            onChange={e => setFormData({ ...formData, ovo_number: e.target.value })}
                                            placeholder="08..."
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                                        />
                                    </div>
                                </div>

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
                                                    <span className="text-[10px] text-gray-500 text-center px-2">Tap to upload</span>
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
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                            >
                                                Pilih Gambar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
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
        </div>
    );
}
