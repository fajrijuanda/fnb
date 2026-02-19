'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import { useRouter } from 'next/navigation';
import {
    User,
    Lock,
    CreditCard,
    Globe,
    Smartphone,
    Trash2,
    Upload,
    Save,
    Eye,
    EyeOff,
    AlertTriangle,
    Store,
    Wallet,
    Bell,
    FileSpreadsheet,
} from 'lucide-react';
import { DeviceManagement } from '@/components/settings/DeviceManagement';
import { FormSelect } from '@/components/admin/FormSelect';

type Tab = 'profile' | 'security' | 'payment' | 'preferences' | 'devices';

export default function SettingsPage() {
    const { user, updateProfile, logout } = useAuthStore();
    const { success, error: showToastError } = useToast();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Profile State
    const [name, setName] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Security State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    const [deleteConfirm, setDeleteConfirm] = useState('');

    // Payment State
    const [paymentInfo, setPaymentInfo] = useState({
        bank_name: '',
        bank_account_number: '',
        bank_account_holder: '',
        ewallet_type: '',
        ewallet_number: ''
    });

    // Preferences State
    const [notifications, setNotifications] = useState(true);
    const [spreadsheetUrl, setSpreadsheetUrl] = useState('');

    // Initial Load
    useEffect(() => {
        if (user) {
            setName(user.username);
            setEmail(user.email);
            if (user.avatar) setAvatarPreview(user.avatar);

            if (user.payment_info) {
                setPaymentInfo({
                    bank_name: user.payment_info.bank_name || '',
                    bank_account_number: user.payment_info.bank_account_number || '',
                    bank_account_holder: user.payment_info.bank_account_holder || '',
                    ewallet_type: user.payment_info.ewallet_type || '',
                    ewallet_number: user.payment_info.ewallet_number || ''
                });
            } else if (user.role === 'mitra') {
                api.get(`/users/${user.id}/`).then(res => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const userData = res.data as any;
                    if (userData.payment_info) {
                        const pi = userData.payment_info;
                        setPaymentInfo({
                            bank_name: pi.bank_name || '',
                            bank_account_number: pi.bank_account_number || '',
                            bank_account_holder: pi.bank_account_holder || '',
                            ewallet_type: pi.ewallet_type || '',
                            ewallet_number: pi.ewallet_number || ''
                        });
                        updateProfile({ payment_info: userData.payment_info });
                    }
                }).catch(err => console.error("Failed to fetch user details", err));
            }

            // Fetch Store Settings
            if (user.role === 'superadmin') {
                api.get('/settings/store/').then(res => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data = res.data as any;
                    if (data) {
                        setSpreadsheetUrl(data.spreadsheet_url || '');
                    }
                }).catch(console.error);
            }
        }
    }, [user, updateProfile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const objectUrl = URL.createObjectURL(file);
            setAvatarPreview(objectUrl);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('username', name);
            formData.append('email', email);
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const res = await api.patch(`/users/${user.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedUser = res.data as any;
            updateProfile({
                username: updatedUser.username,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
            });
            success('Profil berhasil diperbarui');
        } catch (err) {
            console.error(err);
            showToastError('Gagal memperbarui profil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePassword = async () => {
        if (!user) return;
        if (newPassword !== confirmPassword) {
            showToastError('Konfirmasi password tidak cocok');
            return;
        }
        if (newPassword.length < 6) {
            showToastError('Password minimal 6 karakter');
            return;
        }

        setIsSaving(true);
        try {
            await api.patch(`/users/${user.id}/`, { password: newPassword });
            success('Password berhasil diubah');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            showToastError('Gagal mengubah password');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePayment = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('payment_info', JSON.stringify(paymentInfo));

            const res = await api.patch(`/users/${user.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedUser = res.data as any;
            updateProfile({
                payment_info: updatedUser.mitra_profile ? {
                    bank_name: updatedUser.payment_info?.bank_name,
                    bank_account_number: updatedUser.payment_info?.bank_account_number,
                    bank_account_holder: updatedUser.payment_info?.bank_account_holder,
                    ewallet_type: updatedUser.payment_info?.ewallet_type,
                    ewallet_number: updatedUser.payment_info?.ewallet_number
                } : undefined
            });
            success('Metode pembayaran disimpan');
        } catch (err) {
            console.error(err);
            showToastError('Gagal menyimpan metode pembayaran');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveStoreSettings = async () => {
        setIsSaving(true);
        try {
            await api.patch('/settings/store/', { spreadsheet_url: spreadsheetUrl });
            success('Pengaturan toko disimpan');
        } catch (err) {
            console.error(err);
            showToastError('Gagal menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || deleteConfirm !== user.username) {
            showToastError('Username konfirmasi tidak cocok');
            return;
        }
        if (!window.confirm('Apakah Anda yakin ingin menghapus akun ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        setIsSaving(true);
        try {
            await api.delete(`/users/${user.id}/`);
            logout();
            router.push('/login');
            success('Akun berhasil dihapus');
        } catch (err) {
            console.error(err);
            showToastError('Gagal menghapus akun');
            setIsSaving(false);
        }
    }

    const tabs = [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'security', label: 'Keamanan', icon: Lock },
        ...(user?.role === 'mitra' ? [{ id: 'payment', label: 'Pembayaran', icon: CreditCard }] : []),
        { id: 'preferences', label: 'Preferensi', icon: Globe },
        { id: 'devices', label: 'Perangkat', icon: Smartphone },
    ];

    return (
        <div className="max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="mb-6 lg:mb-8">
                <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Pengaturan</h1>
                <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">Kelola akun dan preferensi aplikasi OMDEN Anda here.</p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Universal Horizontal Tab Bar */}
                <div className="px-1 overflow-x-auto no-scrollbar mb-2 sticky top-[60px] z-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md py-2 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2 min-w-max">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${isActive
                                        ? 'bg-[#C5161D] text-white shadow-md shadow-red-500/20'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <Icon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>



                {/* Content Area */}
                <div className="flex-1 min-w-0">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-5 lg:p-8">
                                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <User className="text-[#C5161D]" size={20} />
                                    Informasi Profil
                                </h2>

                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Avatar Upload */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative group">
                                            <div className="h-32 w-32 rounded-3xl bg-gray-100 dark:bg-white/5 overflow-hidden ring-4 ring-white dark:ring-[#1a1a1a] shadow-lg">
                                                {avatarPreview ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                                                        {name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                    <Upload className="text-white" size={24} />
                                                </div>
                                            </div>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </div>
                                        <p className="text-xs text-gray-500 text-center max-w-[150px]">
                                            Klik gambar untuk mengubah foto profil (Max 2MB)
                                        </p>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="flex-1 w-full space-y-5">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-[#C5161D]/50 transition-all"
                                                placeholder="Nama Lengkap Anda"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-[#C5161D]/50 transition-all"
                                                placeholder="alamat@email.com"
                                            />
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                                className="flex items-center gap-2 px-8 py-3 bg-[#C5161D] hover:bg-[#A01217] text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                                            >
                                                {isSaving ? (
                                                    <span className="animate-pulse">Menyimpan...</span>
                                                ) : (
                                                    <>
                                                        <Save size={18} /> Simpan
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-5 lg:p-8">
                                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Lock className="text-[#C5161D]" size={20} />
                                    Ubah Password
                                </h2>

                                <div className="space-y-5 max-w-2xl">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password Baru</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.new ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                className="w-full rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-[#C5161D]/50 transition-all"
                                                placeholder="Minimal 6 karakter"
                                            />
                                            <button
                                                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                            >
                                                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Konfirmasi Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.confirm ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                className={`w-full rounded-xl bg-gray-50 dark:bg-white/5 border pl-4 pr-12 py-3 outline-none focus:ring-2 transition-all ${confirmPassword && newPassword !== confirmPassword
                                                    ? 'border-red-500 focus:ring-red-500/50'
                                                    : 'border-gray-200 dark:border-white/10 focus:ring-[#C5161D]/50'
                                                    }`}
                                                placeholder="Ulangi password baru"
                                            />
                                            <button
                                                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                            >
                                                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {confirmPassword && newPassword !== confirmPassword && (
                                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                                <AlertTriangle size={12} /> Password tidak cocok
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={handleSavePassword}
                                            disabled={isSaving || !newPassword || newPassword !== confirmPassword}
                                            className="px-8 py-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                                        >
                                            {isSaving ? 'Menyimpan...' : 'Ubah Password'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-500/20 p-5 lg:p-8">
                                <h2 className="text-lg lg:text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="text-red-500" size={20} />
                                    Zona Bahaya
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                                    Tindakan di bawah ini tidak dapat dipulihkan. Harap berhati-hati.
                                </p>

                                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-red-100 dark:border-red-500/10">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Hapus Akun</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Menghapus akun Anda akan menghapus semua data, riwayat pesanan, dan konfigurasi toko secara permanen.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Konfirmasi Username</label>
                                            <input
                                                type="text"
                                                value={deleteConfirm}
                                                onChange={e => setDeleteConfirm(e.target.value)}
                                                className="w-full max-w-md rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/50"
                                                placeholder={`Ketik "${user?.username || ''}" untuk konfirmasi`}
                                            />
                                        </div>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirm !== user?.username}
                                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                        >
                                            <Trash2 size={18} />
                                            Hapus Akun Permanen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAYMENT TAB */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-5 lg:p-8">
                                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <CreditCard className="text-[#C5161D]" size={20} />
                                    Metode Pembayaran
                                </h2>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* Bank Account */}
                                    <div className="space-y-4 p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Store size={18} className="text-gray-500" />
                                            Rekening Bank
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">Nama Bank</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: BCA, Mandiri"
                                                    value={paymentInfo.bank_name || ''}
                                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, bank_name: e.target.value })}
                                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C5161D]/20 focus:border-[#C5161D] transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">Nomor Rekening</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nomor Rekening"
                                                    value={paymentInfo.bank_account_number || ''}
                                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, bank_account_number: e.target.value })}
                                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C5161D]/20 focus:border-[#C5161D] transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">Atas Nama</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nama Pemilik Rekening"
                                                    value={paymentInfo.bank_account_holder || ''}
                                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, bank_account_holder: e.target.value })}
                                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C5161D]/20 focus:border-[#C5161D] transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* E-Wallet */}
                                    <div className="space-y-4 p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Wallet size={18} className="text-gray-500" />
                                            E-Wallet
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">Tipe E-Wallet</label>
                                                <FormSelect
                                                    value={paymentInfo.ewallet_type || ''}
                                                    onChange={(val) => setPaymentInfo({ ...paymentInfo, ewallet_type: val as string })}
                                                    options={[
                                                        { value: '', label: 'Pilih E-Wallet' },
                                                        { value: 'GOPAY', label: 'GoPay' },
                                                        { value: 'OVO', label: 'OVO' },
                                                        { value: 'DANA', label: 'DANA' },
                                                        { value: 'SHOPEEPAY', label: 'ShopeePay' },
                                                        { value: 'LINKAJA', label: 'LinkAja' },
                                                    ]}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 mb-1 block">Nomor E-Wallet</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nomor HP E-Wallet"
                                                    value={paymentInfo.ewallet_number || ''}
                                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, ewallet_number: e.target.value })}
                                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C5161D]/20 focus:border-[#C5161D] transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <button
                                        onClick={handleSavePayment}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PREFERENCES TAB */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm divide-y divide-gray-100 dark:divide-white/5">

                                {/* Spreadsheet URL Setting */}
                                {user?.role === 'superadmin' && (
                                    <div className="p-5 lg:p-6 flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                                                <FileSpreadsheet className="w-5 h-5 lg:w-6 lg:h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base lg:text-lg text-gray-900 dark:text-white">Spreadsheet Laporan</h3>
                                                <p className="text-xs lg:text-sm text-gray-500">Shortcut ke spreadsheet laporan eksternal</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={spreadsheetUrl}
                                                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                                                placeholder="https://docs.google.com/spreadsheets/..."
                                                className="flex-1 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 outline-none focus:ring-2 focus:ring-[#C5161D]/50 transition-all text-sm"
                                            />
                                            <button
                                                onClick={handleSaveStoreSettings}
                                                disabled={isSaving}
                                                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                            >
                                                {isSaving ? '...' : 'Simpan'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="p-5 lg:p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => setNotifications(!notifications)}>
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-full flex items-center justify-center transition-colors ${notifications ? 'bg-red-50 dark:bg-red-500/10 text-[#C5161D] dark:text-red-400' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                            <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base lg:text-lg text-gray-900 dark:text-white">Notifikasi Suara</h3>
                                            <p className="text-xs lg:text-sm text-gray-500">Putar suara notifikasi saat ada pesanan baru masuk</p>
                                        </div>
                                    </div>
                                    <div className={`w-14 h-8 rounded-full p-1 transition-colors relative ${notifications ? 'bg-[#C5161D]' : 'bg-gray-200 dark:bg-white/10'}`}>
                                        <div className={`h-6 w-6 bg-white rounded-full shadow-md absolute top-1 transition-all ${notifications ? 'left-[calc(100%-28px)]' : 'left-1'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DEVICES TAB */}
                    {activeTab === 'devices' && (
                        <div className="space-y-6 animate-fade-in">
                            <DeviceManagement />
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
}
