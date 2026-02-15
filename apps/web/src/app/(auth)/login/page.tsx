'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Loader2, ArrowRight, Store, Shield } from 'lucide-react';
import api from '@/lib/api';
import type { LoginResponse, WrappedResponse } from '@/types/api';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, user } = useAuthStore();
    const [view, setView] = useState<'SELECTION' | 'ADMIN_LOGIN'>('SELECTION');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                router.replace('/admin');
            } else {
                router.replace('/cashier');
            }
        }
    }, [isAuthenticated, user, router]);

    const performLogin = async (user: string, pass: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<WrappedResponse<LoginResponse>>('/users/login/', {
                username: user,
                password: pass
            });

            if (response.data.status === 'success') {
                const data = response.data.data as LoginResponse;
                login(data);

                if (data.role === 'admin') {
                    router.replace('/admin');
                } else {
                    router.replace('/cashier');
                }
            } else {
                setError(response.data.message || 'Login gagal.');
                setIsLoading(false);
            }
        } catch (err: unknown) {
            console.error('Login Error:', err);
            setError('Gagal masuk. Periksa koneksi atau credential.');
            setIsLoading(false);
        }
    };

    const handleCashierLogin = () => {
        performLogin('kasir', 'kasir123');
    };

    const handleAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performLogin(username, password);
    };

    // New function to handle role selection
    const handleRoleSelect = (role: 'cashier' | 'admin') => {
        if (role === 'cashier') {
            handleCashierLogin();
        } else {
            setView('ADMIN_LOGIN');
        }
    };

    if (view === 'SELECTION') {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-futuristic-orange relative overflow-hidden transition-colors duration-500">
                {/* Theme Toggle - Absolute Top Right */}
                <div className="absolute top-6 right-6 z-50">
                    <ThemeToggle />
                </div>

                {/* Ambient Background Glows */}
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[80px]" />

                {/* Main Card */}
                <div className="w-full max-w-lg p-8 relative z-10 rounded-2xl border border-orange-500/20 shadow-2xl shadow-orange-500/10 backdrop-blur-3xl bg-white/40 dark:bg-black/40 transition-all duration-300">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-orange-500/40">
                            <span className="text-4xl animate-bounce">🍚</span>
                        </div>
                        <h1 className="mb-2 text-4xl font-bold tracking-tight drop-shadow-md transition-colors" style={{ color: 'var(--login-text)' }}>
                            CloudPOS
                        </h1>
                        <p className="font-medium tracking-wide transition-colors" style={{ color: 'var(--login-text-muted)' }}>Sistem Point of Sale Modern</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Cashier Button */}
                        <button
                            onClick={() => handleRoleSelect('cashier')}
                            className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all hover:-translate-y-1 bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/5 hover:border-orange-500/30 hover:shadow-lg"
                        >
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/0 to-orange-500/0 opacity-0 transition-opacity group-hover:from-orange-500/10 group-hover:to-orange-500/5 group-hover:opacity-100" />

                            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 transition-transform group-hover:scale-110 group-hover:shadow-orange-500/50">
                                <Store className="h-8 w-8 text-white" />
                            </div>
                            <div className="relative text-center">
                                <h3 className="text-lg font-bold group-hover:text-orange-600 dark:group-hover:text-orange-100 transition-colors" style={{ color: 'var(--login-text)' }}>Kasir</h3>
                                <p className="text-xs" style={{ color: 'var(--login-text-muted)' }}>Masuk otomatis ke POS</p>
                            </div>
                        </button>

                        {/* Admin Button */}
                        <button
                            onClick={() => handleRoleSelect('admin')}
                            className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all hover:-translate-y-1 bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/5 hover:border-orange-500/30 hover:shadow-lg"
                        >
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/0 to-orange-500/0 opacity-0 transition-opacity group-hover:from-orange-500/10 group-hover:to-orange-500/5 group-hover:opacity-100" />

                            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/40 dark:bg-white/10 shadow-lg transition-transform group-hover:scale-110 group-hover:bg-white/60 dark:group-hover:bg-white/20">
                                <Shield className="h-8 w-8 text-gray-700 dark:text-white group-hover:text-orange-600 dark:group-hover:text-white" />
                            </div>
                            <div className="relative text-center">
                                <h3 className="text-lg font-bold group-hover:text-orange-600 dark:group-hover:text-orange-100 transition-colors" style={{ color: 'var(--login-text)' }}>Admin</h3>
                                <p className="text-xs" style={{ color: 'var(--login-text-muted)' }}>Masuk dengan password</p>
                            </div>
                        </button>
                    </div>

                    <p className="text-sm mt-8 text-center" style={{ color: 'var(--login-text-muted)' }}>© 2026 CloudPOS. All rights reserved.</p>
                </div>
            </div>
        );
    }

    // ADMIN LOGIN FORM
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-futuristic-orange relative overflow-hidden transition-colors duration-500">
            {/* Theme Toggle - Absolute Top Right */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle
                    dropdownSide="right"
                    className="text-orange-500 dark:text-[var(--login-text)] hover:text-orange-600 dark:hover:text-[var(--login-text)] hover:bg-orange-50 dark:hover:bg-white/10"
                />
            </div>

            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[80px]" />

            <div className="w-full max-w-md p-8 relative z-10 rounded-2xl border border-orange-500/20 shadow-2xl shadow-orange-500/10 backdrop-blur-3xl bg-white/40 dark:bg-black/40 transition-all duration-300">
                <button
                    onClick={() => setView('SELECTION')}
                    className="group flex items-center gap-2 text-sm hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
                    style={{ color: 'var(--login-text-muted)' }}
                >
                    <div className="rounded-full bg-white/20 p-1 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <ArrowRight className="h-4 w-4 rotate-180" />
                    </div>
                    Kembali
                </button>

                <div className="text-center mb-8">
                    <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 blur-lg opacity-50" />
                        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight" style={{ color: 'var(--login-text)' }}>
                        Login Admin
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--login-text-muted)' }}>Masukkan kredensial keamanan</p>
                </div>

                <form className="space-y-5" onSubmit={handleAdminSubmit}>
                    <div className="space-y-4">
                        <div className="group">
                            <label htmlFor="username" className="block text-xs font-medium mb-2 uppercase tracking-wider group-focus-within:text-orange-400 transition-colors" style={{ color: 'var(--login-text-muted)' }}>
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full rounded-xl px-4 py-3 outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 !bg-transparent hover:bg-white/5 placeholder-gray-500 dark:placeholder-white/80 border border-gray-200 dark:border-white/20"
                                style={{ color: 'var(--login-text)' }}
                                placeholder="Masukkan username"
                            />
                        </div>

                        <div className="group">
                            <label htmlFor="password" className="block text-xs font-medium mb-2 uppercase tracking-wider group-focus-within:text-orange-400 transition-colors" style={{ color: 'var(--login-text-muted)' }}>
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-xl px-4 py-3 outline-none transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 !bg-transparent hover:bg-white/5 placeholder-gray-500 dark:placeholder-white/80 border border-gray-200 dark:border-white/20"
                                style={{ color: 'var(--login-text)' }}
                                placeholder="Masukkan password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300 text-center font-medium backdrop-blur-md">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 glow-accent-hover mt-8"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Masuk...
                            </>
                        ) : (
                            <>
                                Masuk Dashboard
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
