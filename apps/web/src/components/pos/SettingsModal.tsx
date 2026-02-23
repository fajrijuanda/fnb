'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Save, User, Lock, Eye, EyeOff, Smartphone, Clock, RotateCcw, Bluetooth, Monitor, Moon, Sun, Plus, Receipt, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useShiftStore } from '@/store/useShiftStore';
import { usePrinter } from '@/hooks/usePrinter';
import { useToast } from '@/components/ToastContext';
import { useTheme } from '@/components/ThemeProvider';
import { DeviceManagement } from '@/components/settings/DeviceManagement';
import { CloseShiftModal } from '@/components/pos/CloseShiftModal';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'shift' | 'device' | 'printer' | 'account' | 'appearance';
}

type Tab = 'shift' | 'device' | 'printer' | 'account' | 'appearance';

export function SettingsModal({ isOpen, onClose, initialTab = 'shift' }: SettingsModalProps) {
    const { user, updateProfile } = useAuthStore();
    const { activeShift } = useShiftStore();
    const {
        isConnected,
        printerName,
        settings: printerSettings,
        updateSettings: updatePrinterSettings,
        connect: connectPrinter,
        disconnect: disconnectPrinter,
        print
    } = usePrinter();
    const { success, error } = useToast();
    const { theme, setTheme } = useTheme();

    const [activeTab, setActiveTab] = useState<Tab>('shift');
    const [isLoading, setIsLoading] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

    // Account Form States
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        currentPassword: '',
        newPassword: '',
    });

    // Printer States
    const [localPrinterSettings, setLocalPrinterSettings] = useState(printerSettings);
    const [isTestingPrinter, setIsTestingPrinter] = useState(false);

    // Expense States
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDescription, setExpenseDescription] = useState('');
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const { fetchCurrentShift } = useShiftStore();

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setFormData({
                username: user?.username || '',
                currentPassword: '',
                newPassword: '',
            });
            setLocalPrinterSettings(printerSettings);
        }
    }, [isOpen, initialTab, user, printerSettings]);

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API Call
        setTimeout(() => {
            updateProfile({
                username: formData.username
            });

            setIsLoading(false);
            success('Profil berhasil diperbaharui');
        }, 1500);
    };

    const handleSavePrinterSettings = () => {
        updatePrinterSettings(localPrinterSettings);
        success('Pengaturan printer disimpan');
    };

    const handleTestPrint = async () => {
        setIsTestingPrinter(true);
        try {
            await print(
                `<div style="text-align:center; font-family:monospace;">
                    <h3>TES PRINT</h3>
                    <p>Printer Terhubung!</p>
                    <p>----------------</p>
                    <p>FNB System</p>
                </div>`
            );
            success('Test print dikirim');
        } catch (err) {
            console.error(err);
            error('Gagal melakukan test print');
        } finally {
            setIsTestingPrinter(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(expenseAmount.replace(/\D/g, ''), 10);
        if (isNaN(amount) || amount <= 0) {
            error('Masukkan nominal yang valid');
            return;
        }
        if (!expenseDescription) {
            error('Masukkan deskripsi pengeluaran');
            return;
        }

        setIsAddingExpense(true);
        try {
            await api.post('/finances/expenses/', {
                amount,
                description: expenseDescription,
                category: 'LAINNYA',
                date: new Date().toISOString().split('T')[0]
            });
            success('Pengeluaran berhasil dicatat');
            setExpenseAmount('');
            setExpenseDescription('');
            await fetchCurrentShift();
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            error(errorMessage || 'Gagal mencatat pengeluaran');
        } finally {
            setIsAddingExpense(false);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Hapus catatan pengeluaran ini?')) return;
        try {
            await api.delete(`/finances/expenses/${id}/`);
            success('Pengeluaran dihapus');
            await fetchCurrentShift();
        } catch {
            error('Gagal menghapus pengeluaran');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pengaturan</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Kelola shift, perangkat, printer, dan akun</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 dark:border-white/5 px-4">
                        <button
                            onClick={() => setActiveTab('shift')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shift'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Info Shift
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'appearance'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Tampilan
                        </button>
                        <button
                            onClick={() => setActiveTab('device')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'device'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Perangkat
                        </button>
                        <button
                            onClick={() => setActiveTab('printer')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'printer'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Printer
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'account'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            Akun
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'shift' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Waktu Mulai</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {activeShift ? new Date(activeShift.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {activeShift ? new Date(activeShift.start_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Kasir</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {user?.username || '-'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {activeShift?.cashier_name || 'Active'}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Saldo Saat Ini (Sistem)</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {activeShift ? formatRupiah(activeShift.current_cash) : 'Rp 0'}
                                    </p>
                                </div>

                                {/* Quick Expense Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-primary" />
                                        Catat Pengeluaran Kas Kecil
                                    </h3>
                                    <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nominal (Rp)</label>
                                            <input
                                                type="text"
                                                value={expenseAmount}
                                                onChange={(e) => setExpenseAmount(e.target.value)}
                                                placeholder="Contoh: 15.000"
                                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Keperluan</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={expenseDescription}
                                                    onChange={(e) => setExpenseDescription(e.target.value)}
                                                    placeholder="Contoh: Beli Es Batu"
                                                    className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isAddingExpense || !expenseAmount || !expenseDescription}
                                                    className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all flex-shrink-0"
                                                >
                                                    {isAddingExpense ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </form>

                                    {/* Expense List */}
                                    {activeShift && activeShift.expenses && activeShift.expenses.length > 0 && (
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                            {activeShift.expenses.map((expense) => (
                                                <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                                            <Receipt className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{expense.description}</p>
                                                            <p className="text-[10px] text-gray-500">{new Date(expense.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatRupiah(expense.amount)}</p>
                                                        <button
                                                            onClick={() => handleDeleteExpense(expense.id)}
                                                            className="p-1 px-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsCloseShiftModalOpen(true)}
                                    className="w-full py-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 rounded-2xl transition-all text-white font-bold"
                                >
                                    <Lock className="h-4 w-4" />
                                    Tutup Kasir (End Shift)
                                </button>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tema Aplikasi</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            <Sun className="h-6 w-6" />
                                            <span className="text-sm font-medium">Terang</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            <Moon className="h-6 w-6" />
                                            <span className="text-sm font-medium">Gelap</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('system')}
                                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'system'
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            <Monitor className="h-6 w-6" />
                                            <span className="text-sm font-medium">Sistem</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'device' && (
                            <DeviceManagement />
                        )}

                        {activeTab === 'printer' && (
                            <div className="space-y-6">
                                {/* Status Section */}
                                <div className={`p-4 rounded-xl border ${isConnected
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20'
                                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status Koneksi</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isConnected
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                            : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                                            }`}>
                                            {isConnected ? 'TERHUBUNG' : 'TERPUTUS'}
                                        </span>
                                    </div>

                                    {isConnected ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Bluetooth className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{printerName || 'Perangkat Tidak Dikenal'}</span>
                                            </div>
                                            <button
                                                onClick={disconnectPrinter}
                                                className="text-xs text-red-500 hover:text-red-400 font-medium"
                                            >
                                                Putuskan
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pilih metode koneksi:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => connectPrinter('bluetooth').catch(() => error('Gagal terhubung ke printer Bluetooth'))}
                                                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                                                >
                                                    <Bluetooth className="h-4 w-4" />
                                                    <span className="text-xs font-bold">Bluetooth</span>
                                                </button>
                                                <button
                                                    onClick={() => connectPrinter('rawbt')}
                                                    className="flex items-center justify-center gap-2 p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                                                >
                                                    <Smartphone className="h-4 w-4" />
                                                    <span className="text-xs font-bold">RawBT (Android)</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Preferences */}
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preferensi</label>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Koneksi Otomatis</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Hubungkan otomatis saat login</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={localPrinterSettings.autoConnect}
                                                onChange={(e) => setLocalPrinterSettings({ ...localPrinterSettings, autoConnect: e.target.checked })}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleTestPrint}
                                        disabled={!isConnected || isTestingPrinter}
                                        className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <RotateCcw className={`h-3.5 w-3.5 ${isTestingPrinter ? 'animate-spin' : ''}`} />
                                        Tes Print
                                    </button>
                                    <button
                                        onClick={handleSavePrinterSettings}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                    >
                                        <Save className="h-3.5 w-3.5" />
                                        Simpan Pengaturan Printer
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <form onSubmit={handleAccountSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Pengguna</label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            placeholder="Nama Pengguna"
                                        />
                                    </div>
                                </div>

                                <div className="my-2 border-t border-gray-100 dark:border-white/5" />

                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Ganti Kata Sandi</p>

                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-9 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            placeholder="Kata Sandi Saat Ini"
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
                                            placeholder="Kata Sandi Baru"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary to-red-600 hover:shadow-lg hover:shadow-primary/20 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <CloseShiftModal
                isOpen={isCloseShiftModalOpen}
                onClose={() => setIsCloseShiftModalOpen(false)}
            />
        </>
    );
}
