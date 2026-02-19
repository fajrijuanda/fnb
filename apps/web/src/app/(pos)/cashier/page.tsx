'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, LogOut, Search, Settings, User, ChevronDown, CreditCard } from 'lucide-react';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSheet } from '@/components/pos/CartSheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutConfirmationModal } from '@/components/LogoutConfirmationModal';
import { PaymentSettingsModal } from '@/components/pos/PaymentSettingsModal';
import { SettingsModal } from '@/components/pos/SettingsModal';
import { CloseShiftModal } from '@/components/pos/CloseShiftModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useCartStore } from '@/store';
import { useAuthStore } from '@/store/useAuthStore';
import { useShiftStore } from '@/store/useShiftStore';
import { usePrinter } from '@/hooks/usePrinter';
import { cn, formatRupiah } from '@/lib/utils';
import { useRef, useEffect } from 'react';

export default function CashierPage() {
    const router = useRouter();
    const { logout, isAuthenticated, user, _hasHydrated } = useAuthStore();
    const { activeShift } = useShiftStore();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const totalItems = useCartStore((state) => state.getTotalItems());

    const [searchQuery, setSearchQuery] = useState('');

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Settings Modal State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsInitialTab, setSettingsInitialTab] = useState<'shift' | 'device' | 'printer' | 'account'>('shift');

    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [showPaymentSettingsModal, setShowPaymentSettingsModal] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { autoConnect } = usePrinter();

    // Auto-connect printer on mount
    useEffect(() => {
        autoConnect();
    }, [autoConnect]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Show loading screen until hydration completes
    if (!_hasHydrated) {
        return <LoadingScreen />;
    }

    // Protect Route - only check after hydration
    if (!isAuthenticated) {
        router.replace('/login');
        return <LoadingScreen />;
    }

    // Subscription Gate
    if (!user?.is_subscribed) {
        return (
            <div className="h-screen w-full bg-white dark:bg-[#050505] flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-500">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 dark:bg-primary/30 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
                <div className="flex flex-col items-center justify-center relative z-10 px-6">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                        <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-2xl shadow-primary/30">
                            <ShoppingCart className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Langganan Diperlukan</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                        Akun Anda belum memiliki langganan aktif. Hubungi mitra atau admin Anda untuk mengaktifkan akses ke sistem kasir.
                    </p>
                    <button
                        onClick={() => { logout(); router.replace('/login'); }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-red-600 text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        Kembali ke Login
                    </button>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    const openSettings = (tab: 'shift' | 'device' | 'printer' | 'account') => {
        setSettingsInitialTab(tab);
        setShowSettingsModal(true);
        setIsProfileDropdownOpen(false);
    };

    return (
        <div className="h-screen w-full bg-white dark:bg-[#050505] relative overflow-hidden font-sans transition-colors duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 dark:bg-primary/30 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 dark:bg-primary/20 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Main Flex Layout */}
            <div className="relative z-10 flex flex-col md:flex-row h-full gap-3 lg:gap-4 p-2 lg:p-4">

                {/* Left Panel: Header & Product Grid */}
                <main className="flex-1 flex flex-col rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl bg-white/90 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-white/5 transition-all w-full min-w-0">
                    {/* Header */}
                    <header className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6 shrink-0 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-red-600 flex items-center justify-center shadow-lg shadow-primary/20 p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/logo.png" alt="OMDEN" className="w-full h-full object-contain filter drop-shadow-sm" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">OMDEN</h1>
                                    <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Sistem Kasir Modern</p>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-sm mx-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl bg-gray-100 dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border-none"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <ThemeToggle
                                dropdownSide="right"
                                className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                            />

                            {/* Admin Link (Only for Admin Role) */}
                            {(user?.role === 'superadmin' || user?.role === 'mitra') && (
                                <button
                                    onClick={() => router.push('/admin')}
                                    title="Admin Panel"
                                    className="hidden lg:flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <Settings className="h-5 w-5" />
                                </button>
                            )}

                            {/* Profile Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center gap-2 h-9 px-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/5"
                                >
                                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 text-primary dark:text-red-400 flex items-center justify-center">
                                        <User className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-sm font-medium hidden lg:block">{user?.username || 'Kasir'}</span>
                                    <ChevronDown className="h-3.5 w-3.5 opacity-50 hidden lg:block" />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-[#1a1a1a] shadow-xl border border-gray-100 dark:border-white/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Saldo Shift</p>
                                            <p className="text-sm font-bold text-primary dark:text-white">
                                                {activeShift ? formatRupiah(activeShift.current_cash || 0) : 'Rp 0'}
                                            </p>
                                        </div>

                                        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 lg:hidden">
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{user?.username}</p>
                                            <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
                                        </div>

                                        <button
                                            onClick={() => openSettings('account')}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Pengaturan
                                        </button>

                                        <div className="my-1 border-t border-gray-100 dark:border-white/5" />

                                        {/* Payment Settings - Only for Superadmin/Mitra */}
                                        {(user?.role === 'superadmin' || user?.role === 'mitra') && (
                                            <button
                                                onClick={() => {
                                                    setShowPaymentSettingsModal(true);
                                                    setIsProfileDropdownOpen(false);
                                                }}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Pengaturan Pembayaran
                                            </button>
                                        )}

                                        <div className="my-1 border-t border-gray-100 dark:border-white/5" />

                                        <button
                                            onClick={() => {
                                                setShowLogoutConfirm(true);
                                                setIsProfileDropdownOpen(false);
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Keluar
                                        </button>
                                    </div>
                                )}
                            </div>


                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-red-600 text-white transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95 md:hidden"
                            >
                                <ShoppingCart className="h-5 w-5" />
                                {totalItems > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary shadow-sm border border-red-100">
                                        {totalItems}
                                    </span>
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Product Grid Area */}
                    <div className="flex-1 overflow-hidden relative">
                        <ProductGrid searchQuery={searchQuery} />
                    </div>
                </main>

                {/* Right Panel: Cart */}
                <aside className="hidden md:flex flex-col w-[300px] lg:w-[320px] xl:w-[360px] shrink-0 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl bg-white/90 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-white/5 h-full">
                    <CartSheet />
                </aside>
            </div>

            {/* Mobile Cart Overlay */}
            <div
                className={cn(
                    'fixed inset-0 z-50 md:hidden',
                    isCartOpen ? 'block' : 'hidden'
                )}
            >
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsCartOpen(false)}
                />

                <div
                    className={cn(
                        'absolute bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl bg-white dark:bg-[#1a1a1a] shadow-2xl transition-transform duration-300 flex flex-col',
                        isCartOpen ? 'translate-y-0' : 'translate-y-full'
                    )}
                >
                    <div className="flex justify-center py-3 shrink-0">
                        <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-white/20" />
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <CartSheet onClose={() => setIsCartOpen(false)} />
                    </div>
                </div>
            </div>

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                initialTab={settingsInitialTab}
            />

            <PaymentSettingsModal
                isOpen={showPaymentSettingsModal}
                onClose={() => setShowPaymentSettingsModal(false)}
            />

            <CloseShiftModal
                isOpen={showCloseShiftModal}
                onClose={() => setShowCloseShiftModal(false)}
            />

            <LogoutConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
}
