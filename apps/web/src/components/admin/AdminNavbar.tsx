'use client';

import { useState } from 'react';
import { Search, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/useAuthStore';
import { LogoutConfirmationModal } from '@/components/LogoutConfirmationModal';
import { NotificationDropdown } from './NotificationDropdown';
import Link from 'next/link';

interface AdminNavbarProps {
    onMenuClick?: () => void;
}

export function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
    const { user } = useAuthStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        const { logout } = useAuthStore.getState();
        logout();
        window.location.href = '/login';
    };

    return (
        <header className="sticky top-0 z-30 flex h-14 lg:h-16 w-full items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl px-3 lg:px-6 transition-all">
            {/* Left: Menu Button (Mobile) + Search */}
            <div className="flex items-center gap-2 lg:gap-4 flex-1">
                {/* Hamburger Menu - Mobile Only */}
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                )}

                {/* Search Bar */}
                <div className="relative flex-1 max-w-xs lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari..."
                        className="w-full rounded-xl bg-gray-100 dark:bg-white/5 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#C5161D]/50 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
                <ThemeToggle dropdownAlign="bottom" dropdownSide="right" />

                <NotificationDropdown />

                <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 rounded-xl p-1 pr-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/5"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#C5161D] to-[#A01217] text-white shadow-lg shadow-red-900/20">
                            <span className="font-bold">{user?.username?.charAt(0) || 'A'}</span>
                        </div>
                        <div className="hidden text-left sm:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username || 'Admin'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Administrator'}</p>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-2 shadow-xl z-50 animation-scale-in origin-top-right">
                                <div className="px-2 py-1.5 mb-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Akun Saya</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.username || 'admin@cloudpos.id'}</p>
                                </div>
                                <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

                                <Link
                                    href="/admin/settings"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-white/5 hover:text-[#C5161D] dark:hover:text-red-400 transition-colors"
                                >
                                    <Settings size={16} />
                                    Pengaturan
                                </Link>
                                <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                                <button
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        setShowLogoutConfirm(true);
                                    }}
                                    className="w-full flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut size={16} />
                                    Keluar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <LogoutConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
            />
        </header>
    );
}
