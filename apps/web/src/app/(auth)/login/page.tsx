'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import type { LoginResponse, WrappedResponse } from '@/types/api';
import axios from 'axios';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, user } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pending Approval State
    const [pendingAttempt, setPendingAttempt] = useState<{ id: string; expires_in: number } | null>(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'superadmin' || user.role === 'mitra') {
                router.replace('/admin');
            } else {
                router.replace('/cashier');
            }
        }
    }, [isAuthenticated, user, router]);

    // Polling for Pending Attempt
    useEffect(() => {
        if (!pendingAttempt) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await api.get<{ status: string; data: LoginResponse }>(
                    `/users/auth/status/${pendingAttempt.id}/`
                );

                if (response.data.status === 'success') {
                    // Approved!
                    clearInterval(pollInterval);
                    const data = response.data.data;
                    login(data);

                    if (data.role === 'superadmin' || data.role === 'mitra') {
                        router.replace('/admin');
                    } else {
                        router.replace('/cashier');
                    }
                } else if (response.data.status === 'rejected') {
                    clearInterval(pollInterval);
                    setPendingAttempt(null);
                    setError('Permintaan login ditolak oleh pemilik akun.');
                    setIsLoading(false);
                } else if (response.data.status === 'expired') {
                    clearInterval(pollInterval);
                    setPendingAttempt(null);
                    setError('Permintaan login kadaluarsa.');
                    setIsLoading(false);
                }
            } catch {
                // Ignore polling errors
            }
        }, 2000); // Check every 2 seconds

        return () => clearInterval(pollInterval);
    }, [pendingAttempt, login, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Ensure Device ID exists
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('device_id', deviceId);
        }

        try {
            const response = await api.post<WrappedResponse<LoginResponse> | { status: string; message: string; data: { attempt_id: string; expires_in: number } }>('/users/login/', {
                username,
                password,
                device_id: deviceId,
                device_name: navigator.userAgent
            });

            if (response.status === 202) {
                // Pending Approval
                const data = response.data as { status: string; message: string; data: { attempt_id: string; expires_in: number } };
                setPendingAttempt({
                    id: data.data.attempt_id,
                    expires_in: data.data.expires_in
                });
                return; // Keep loading true while polling
            }

            if (response.data.status === 'success') {
                const data = response.data.data as LoginResponse;
                login(data);

                if (data.role === 'superadmin' || data.role === 'mitra') {
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
            let message = 'Gagal masuk. Periksa koneksi atau credential.';
            if (axios.isAxiosError(err) && err.response?.data) {
                const data = err.response.data;
                if (data.non_field_errors) {
                    message = 'Username atau password salah.';
                } else if (data.message) {
                    message = data.message;
                }
            }
            setError(message);
            setIsLoading(false);
        }
    };

    if (isLoading && pendingAttempt) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-futuristic-theme">
                <div className="w-full max-w-md p-8 rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-primary/20 text-center animate-in fade-in zoom-in duration-300">
                    <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Menunggu Persetujuan</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Akun ini sedang aktif di perangkat lain. <br />
                        Silakan setujui notifikasi login yang muncul di perangkat tersebut.
                    </p>
                    <button
                        onClick={() => {
                            setPendingAttempt(null);
                            setIsLoading(false);
                        }}
                        className="text-sm text-red-500 hover:text-red-400 font-medium"
                    >
                        Batalkan
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-futuristic-theme relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle
                    dropdownSide="right"
                    className="text-primary dark:text-[var(--login-text)] hover:text-primary dark:hover:text-[var(--login-text)] hover:bg-red-50 dark:hover:bg-white/10"
                />
            </div>

            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[80px]" />

            <div className="w-full max-w-md p-8 relative z-10 rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10 backdrop-blur-3xl bg-white/40 dark:bg-black/40 transition-all duration-300">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-red-600 shadow-2xl shadow-primary/40 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="OMDEN Logo" className="w-full h-full object-contain filter drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight drop-shadow-md transition-colors" style={{ color: 'var(--login-text)' }}>
                        OMDEN
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--login-text-muted)' }}>Masukkan akun anda untuk melanjutkan</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="group">
                            <label htmlFor="username" className="block text-xs font-medium mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors" style={{ color: 'var(--login-text-muted)' }}>
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full rounded-xl px-4 py-3 outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50 !bg-transparent hover:bg-white/5 placeholder-gray-500 dark:placeholder-white/80 border border-gray-200 dark:border-white/20"
                                style={{ color: 'var(--login-text)' }}
                                placeholder="Masukkan username"
                            />
                        </div>

                        <div className="group">
                            <label htmlFor="password" className="block text-xs font-medium mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors" style={{ color: 'var(--login-text-muted)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-xl px-4 py-3 pr-12 outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50 !bg-transparent hover:bg-white/5 placeholder-gray-500 dark:placeholder-white/80 border border-gray-200 dark:border-white/20"
                                    style={{ color: 'var(--login-text)' }}
                                    placeholder="Masukkan password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                                    style={{ color: 'var(--login-text-muted)' }}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500 dark:text-red-300 text-center font-medium backdrop-blur-md">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-red-600 shadow-lg shadow-primary/30 glow-accent-hover mt-8"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="animate-pulse">Memproses...</span>
                            </>
                        ) : (
                            <>
                                Masuk
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-xs mt-6 text-center" style={{ color: 'var(--login-text-muted)' }}>© 2026 OMDEN. All rights reserved.</p>
            </div>
        </div>
    );
}
