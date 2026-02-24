'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { ShieldAlert, Check, X, Smartphone } from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import axios from 'axios';

interface LoginAttempt {
    id: string;
    device_name: string;
    ip_address: string;
    created_at: string;
    status: string;
}

const parseRetryAfterSeconds = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
};

const getRateLimitRetryMs = (error: unknown, fallbackMs: number): number => {
    if (!axios.isAxiosError(error) || error.response?.status !== 429) {
        return fallbackMs;
    }

    const retryAfterHeader = parseRetryAfterSeconds(error.response?.headers?.['retry-after']);
    if (retryAfterHeader && retryAfterHeader > 0) {
        return retryAfterHeader * 1000;
    }

    const detail = typeof error.response?.data?.detail === 'string' ? error.response.data.detail : '';
    const detailMatch = detail.match(/(\d+)\s*seconds?/i);
    if (detailMatch) {
        const seconds = Number(detailMatch[1]);
        if (Number.isFinite(seconds) && seconds > 0) {
            return seconds * 1000;
        }
    }

    return fallbackMs;
};

export function SecurityPuller() {
    const { user, accessToken, updateProfile } = useAuthStore();
    const [pendingAttempt, setPendingAttempt] = useState<LoginAttempt | null>(null);
    const { success, error } = useToast();

    const syncedUserIdRef = useRef<number | null>(null);
    const profileRateLimitedUntilRef = useRef(0);
    const pendingRateLimitedUntilRef = useRef(0);
    const heartbeatRateLimitedUntilRef = useRef(0);

    const userId = user?.id;
    const role = user?.role;

    useEffect(() => {
        if (!userId || !accessToken) {
            syncedUserIdRef.current = null;
            return;
        }

        const hasEnoughProfileData =
            Boolean(user?.avatar) ||
            Boolean(user?.location) ||
            Boolean(user?.profile) ||
            Boolean(user?.payment_info);

        if (hasEnoughProfileData) {
            syncedUserIdRef.current = userId;
            return;
        }

        if (syncedUserIdRef.current === userId) return;
        if (Date.now() < profileRateLimitedUntilRef.current) return;

        const syncUserProfile = async () => {
            try {
                const response = await api.get(`/users/${userId}/`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const payload = ((response.data as any)?.data || response.data) as Record<string, unknown>;
                if (!payload || typeof payload !== 'object') return;

                const profile = (payload.profile as Record<string, unknown> | undefined) || undefined;
                const paymentInfo = (payload.payment_info as Record<string, unknown> | undefined) || undefined;

                updateProfile({
                    username: payload.username as string | undefined,
                    email: payload.email as string | undefined,
                    avatar: (payload.avatar as string | null | undefined) ?? (profile?.avatar as string | null | undefined) ?? null,
                    location: (payload.location as string | null | undefined) ?? (profile?.location as string | null | undefined) ?? null,
                    profile: profile as { location?: string; avatar?: string; owner?: number } | undefined,
                    payment_info: paymentInfo as {
                        bank_name?: string;
                        bank_account_number?: string;
                        bank_account_holder?: string;
                        ewallet_type?: string;
                        ewallet_number?: string;
                        qris_image?: string | null;
                    } | undefined,
                });

                syncedUserIdRef.current = userId;
            } catch (err) {
                profileRateLimitedUntilRef.current = Date.now() + getRateLimitRetryMs(err, 2 * 60 * 1000); // 2 minutes retry for profile
            }
        };

        syncUserProfile();

        // Also sync profile periodically to catch QRIS updates
        const profileSyncInterval = setInterval(syncUserProfile, 5 * 60 * 1000); // Every 5 minutes
        return () => clearInterval(profileSyncInterval);
    }, [userId, role, accessToken, updateProfile, user?.avatar, user?.location, user?.profile, user?.payment_info]);

    useEffect(() => {
        if (!userId || !accessToken) return;

        const checkPendingLogins = async () => {
            if (role !== 'mitra' && role !== 'superadmin') return; // Only owner checks pending logins
            if (Date.now() < pendingRateLimitedUntilRef.current) return;

            try {
                const response = await api.get<{ data: LoginAttempt[] }>('/users/auth/pending/');
                if (response.data.data.length > 0) {
                    setPendingAttempt(response.data.data[0]);
                } else {
                    setPendingAttempt(null);
                }
            } catch (err) {
                pendingRateLimitedUntilRef.current = Date.now() + getRateLimitRetryMs(err, 5 * 60 * 1000);
            }
        };

        checkPendingLogins();

        const interval = setInterval(checkPendingLogins, 60000);

        const heartbeatInterval = setInterval(() => {
            if (Date.now() < heartbeatRateLimitedUntilRef.current) return;
            api.post('/users/auth/heartbeat/').catch((err) => {
                heartbeatRateLimitedUntilRef.current = Date.now() + getRateLimitRetryMs(err, 5 * 60 * 1000);
            });
        }, 180000);

        return () => {
            clearInterval(interval);
            clearInterval(heartbeatInterval);
        };
    }, [userId, role, accessToken]);

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!pendingAttempt) return;

        try {
            await api.post('/users/auth/approve/', {
                attempt_id: pendingAttempt.id,
                action
            });

            if (action === 'APPROVE') {
                success('Login berhasil disetujui');
            } else {
                success('Login ditolak');
            }
            setPendingAttempt(null);
        } catch {
            error('Gagal memproses permintaan');
        }
    };

    if (!pendingAttempt) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-red-100 dark:border-red-900/30 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-100 dark:border-red-900/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                        <ShieldAlert className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Peringatan Keamanan</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ada upaya login baru ke akun Anda</p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                        <Smartphone className="text-gray-400 mt-1" size={20} />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{pendingAttempt.device_name}</p>
                            <p className="text-xs text-gray-500 font-mono">IP: {pendingAttempt.ip_address}</p>
                            <p className="text-xs text-gray-400">{new Date(pendingAttempt.created_at).toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                        Apakah ini Anda? Jika disetujui, sesi ini (perangkat ini) akan dikeluarkan.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={() => handleAction('REJECT')}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium text-sm"
                        >
                            <X size={16} />
                            Tolak
                        </button>
                        <button
                            onClick={() => handleAction('APPROVE')}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all font-bold text-sm"
                        >
                            <Check size={16} />
                            Izinkan Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
