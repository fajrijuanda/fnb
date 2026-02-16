'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import {
    User as UserIcon,
    Mail,
    Lock,
    Globe,
    Bell,
    // Shield,
    // Zap,
    TrendingUp,
    Store,
    Sparkles,
    Crown,
    CreditCard,
    Wallet,
    Package,
    Users
} from 'lucide-react';
import { DeviceManagement } from '@/components/settings/DeviceManagement';
import { FormSelect } from '@/components/admin/FormSelect';


export default function SettingsPage() {
    const { user, updateProfile } = useAuthStore();
    const { success, error: showToastError } = useToast();
    const [name, setName] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [notifications, setNotifications] = useState(true);
    const [language, setLanguage] = useState('id');

    // Avatar state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.username); // User interface has username, not name
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
                // Fetch latest user data to get payment info if not in store
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
                        // update store (optional, but good for consistency)
                        updateProfile({ payment_info: userData.payment_info });
                    }
                }).catch(err => console.error("Failed to fetch user details", err));
            }
        }
    }, [user, updateProfile]);

    const [paymentInfo, setPaymentInfo] = useState({
        bank_name: '',
        bank_account_number: '',
        bank_account_holder: '',
        ewallet_type: '',
        ewallet_number: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const objectUrl = URL.createObjectURL(file);
            setAvatarPreview(objectUrl);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('username', name);
            formData.append('email', email);

            if (avatarFile) {
                // Send as profile[avatar] to match nested serializer expectation 
                // OR simple 'avatar' if we adjusted serializer to look for it directly.
                // Based on standard DRF nested writable behavior with source='profile.avatar':
                // It usually expects the structure. Let's send 'profile.avatar' key?
                // Actually, DRF ModelSerializer with source='...' is complex for writes.
                // Let's rely on my manual handling in update(). 
                // If I send 'profile[avatar]', request.data will have {'profile': {'avatar': ...}}.
                // Serializer validation passes?
                // Let's try sending both flat 'avatar' and Nested just in case, or stick to one.
                // My serializer logic: profile_data = validated_data.pop('profile', {}).
                // This implies validated_data has 'profile' key.
                // So I MUST send 'profile[avatar]'.
                formData.append('profile.avatar', avatarFile);
                // Note: 'profile.avatar' key in FormData might NOT be parsed automatically by basic JSON parsers,
                // but MultiPartParser in Django might treat it as a key literally unless specific nesting logic is enabled.
                // DRF default behavior: 'profile.avatar' key -> validated_data['profile.avatar']? No.
                // Use 'profile[avatar]' for extended parsing support or handle manually.
                // SAFEST: Send 'avatar' and update serializer to look for 'avatar' in validated_data if not found in profile.
                // I will update serializer logic later if it fails. For now let's try 'profile[avatar]'.
                formData.append('profile[avatar]', avatarFile);
            }

            if (user.role === 'mitra') {
                formData.append('payment_info', JSON.stringify(paymentInfo));
            }

            const res = await api.patch(`/users/${user.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local store
            // Assuming res.data is the User object with avatar url
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedUser = res.data as any; // Temporary cast until API response is strictly typed
            updateProfile({
                username: updatedUser.username,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                role: updatedUser.role,
                payment_info: updatedUser.mitra_profile ? { // Adjust based on how API returns it. Serializer returns payment_info directly now?
                    bank_name: updatedUser.payment_info?.bank_name,
                    bank_account_number: updatedUser.payment_info?.bank_account_number,
                    bank_account_holder: updatedUser.payment_info?.bank_account_holder,
                    ewallet_type: updatedUser.payment_info?.ewallet_type,
                    ewallet_number: updatedUser.payment_info?.ewallet_number
                } : undefined
            });

            success('Profil berhasil diperbarui');
        } catch (err) {
            console.error('Failed to update profile:', err);
            showToastError('Gagal memperbarui profil');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 lg:space-y-6 pb-4">
            {/* Header */}
            <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pengaturan</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kelola akun dan preferensi aplikasi Anda.</p>
            </div>

            {/* PROFILE SECTION */}
            <section className="space-y-3 lg:space-y-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-primary mb-2">
                    <UserIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                    <h2 className="font-bold text-base lg:text-lg">Profil Pengguna</h2>
                </div>

                <div className="grid gap-4 lg:gap-6 md:grid-cols-3">
                    {/* Profile Card */}
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col items-center text-center">
                            <div className="h-16 w-16 lg:h-24 lg:w-24 rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center text-white text-xl lg:text-3xl font-bold shadow-xl shadow-primary/20 mb-3 lg:mb-4 cursor-pointer hover:scale-105 transition-transform overflow-hidden relative">
                                {avatarPreview ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg">{name}</h3>
                            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Admin'}</p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-3 lg:mt-4 text-xs lg:text-sm font-medium text-red-700 dark:text-red-500 hover:text-red-800 transition-colors"
                            >
                                Ganti Foto Profil
                            </button>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="md:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <button className="w-full text-left rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-10 pr-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                        Klik untuk ubah password...
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PAYMENT SETTINGS SECTION (MITRA ONLY) */}
            {user?.role === 'mitra' && (
                <section className="space-y-3 lg:space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-primary mb-2">
                        <CreditCard className="h-4 w-4 lg:h-5 lg:w-5" />
                        <h2 className="font-bold text-base lg:text-lg">Metode Pembayaran (Rekening & E-Wallet)</h2>
                    </div>

                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Bank Account */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Store size={16} />
                                    Rekening Bank
                                </h3>
                                <div className="grid gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Nama Bank</label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: BCA, Mandiri"
                                            value={paymentInfo.bank_name || ''}
                                            onChange={(e) => setPaymentInfo({ ...paymentInfo, bank_name: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Nomor Rekening</label>
                                        <input
                                            type="text"
                                            placeholder="Nomor Rekening"
                                            value={paymentInfo.bank_account_number || ''}
                                            onChange={(e) => setPaymentInfo({ ...paymentInfo, bank_account_number: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Atas Nama</label>
                                        <input
                                            type="text"
                                            placeholder="Nama Pemilik Rekening"
                                            value={paymentInfo.bank_account_holder || ''}
                                            onChange={(e) => setPaymentInfo({ ...paymentInfo, bank_account_holder: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* E-Wallet */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Wallet size={16} />
                                    E-Wallet
                                </h3>
                                <div className="grid gap-3">
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
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Nomor E-Wallet</label>
                                        <input
                                            type="text"
                                            placeholder="Nomor HP E-Wallet"
                                            value={paymentInfo.ewallet_number || ''}
                                            onChange={(e) => setPaymentInfo({ ...paymentInfo, ewallet_number: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* PREFERENCES SECTION */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-primary mb-2 mt-4">
                    <Globe className="h-5 w-5" />
                    <h2 className="font-bold text-lg">Preferensi</h2>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm divide-y divide-gray-100 dark:divide-white/5">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Bahasa / Language</h3>
                                <p className="text-xs text-gray-500">Bahasa utama aplikasi</p>
                            </div>
                        </div>
                        <FormSelect
                            value={language}
                            onChange={setLanguage}
                            options={[
                                { value: 'id', label: 'Indonesia' },
                                { value: 'en', label: 'English' },
                            ]}
                            className="w-36"
                        />
                    </div>

                    <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setNotifications(!notifications)}>
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${notifications ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                <Bell size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Notifikasi Suara</h3>
                                <p className="text-xs text-gray-500">Bunyi saat pesanan baru masuk</p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'}`}>
                            <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </section>

            {/* DEVICE MANAGEMENT SECTION */}
            <section className="space-y-4 pt-4">
                <DeviceManagement />
            </section>

            {/* PREMIUM FEATURES (BLURRED) */}
            <section className="space-y-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                        <Sparkles className="h-5 w-5" />
                        <h2 className="font-bold text-lg">Fitur Premium</h2>
                    </div>
                    {user?.is_subscribed || user?.role === 'superadmin' ? (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs font-bold rounded-full uppercase tracking-wide">
                            Unlocked
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-xs font-bold rounded-full uppercase tracking-wide">
                            Pro Plan
                        </span>
                    )}
                </div>

                <div className="relative group overflow-hidden rounded-3xl">
                    {/* Locked Overlay */}
                    {!(user?.is_subscribed || user?.role === 'superadmin') && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm transition-opacity">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/50 mb-4 animate-bounce">
                                <Lock className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unlock Fitur Premium</h3>
                            <p className="text-gray-600 dark:text-gray-300 max-w-md text-center mb-6">
                                Tingkatkan ke CloudPOS Pro untuk akses fitur laporan keuangan lengkap, manajemen stok lanjut, dan multi-outlet.
                            </p>
                            <button className="px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all flex items-center gap-2">
                                <Crown size={20} />
                                Upgrade Sekarang
                            </button>
                        </div>
                    )}

                    {/* Content (No Blur if Subscribed) */}
                    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${!(user?.is_subscribed || user?.role === 'superadmin') ? 'filter blur-sm select-none opacity-50 pointer-events-none' : ''}`}>
                        {/* Feature 1 */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-violet-200 dark:border-violet-500/20 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <TrendingUp size={100} />
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 mb-4">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Laporan Keuangan</h3>
                            <p className="text-sm text-gray-500">Akses laporan Laba Rugi otomatis untuk memantau profitabilitas bisnis Anda secara real-time.</p>
                            <div className="mt-4 h-20 bg-violet-50 dark:bg-violet-900/10 rounded-lg w-full flex items-center justify-center text-xs text-violet-400">
                                Live Profit Graph
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-violet-200 dark:border-violet-500/20 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Users size={100} />
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-600 mb-4">
                                <Users size={24} />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Manajemen Karyawan</h3>
                            <p className="text-sm text-gray-500">Tambahkan akun kasir tak terbatas untuk membantu operasional harian outlet Anda.</p>
                            <div className="mt-4 flex gap-2 items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white dark:border-[#1a1a1a]"></div>
                                <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white dark:border-[#1a1a1a] -ml-3"></div>
                                <div className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white dark:border-[#1a1a1a] -ml-3"></div>
                                <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white dark:border-[#1a1a1a] -ml-3 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                    +5
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-violet-200 dark:border-violet-500/20 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Package size={100} />
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-4">
                                <Package size={24} />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Manajemen Stok</h3>
                            <p className="text-sm text-gray-500">Pantau stok bahan baku dengan akurat dan dapatkan peringatan stok menipis otomatis.</p>
                            <div className="mt-4 flex gap-2">
                                <div className="h-8 w-8 rounded-full bg-gray-100"></div>
                                <div className="h-8 w-full bg-gray-100 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
