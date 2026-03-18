'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
    const [pendingAttempts, setPendingAttempts] = useState<LoginAttempt[]>([]);
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
                        qris_image?: string | null;
                        qris_data?: string | null;
                    } | undefined,
                });

                syncedUserIdRef.current = userId;
            } catch (err) {
                profileRateLimitedUntilRef.current = Date.now() + getRateLimitRetryMs(err, 2 * 60 * 1000);
            }
        };

        syncUserProfile();

        const profileSyncInterval = setInterval(syncUserProfile, 60 * 60 * 1000);
        return () => clearInterval(profileSyncInterval);
    }, [userId, role, accessToken, updateProfile, user?.avatar, user?.location, user?.profile, user?.payment_info]);

    const checkPendingLogins = useCallback(async () => {
        if (role !== 'mitra' && role !== 'superadmin') return;
        if (Date.now() < pendingRateLimitedUntilRef.current) return;

        try {
            const response = await api.get<{ data: LoginAttempt[] }>('/users/auth/pending/');
            if (response.data.data.length > 0) {
                setPendingAttempts(response.data.data);
            } else {
                setPendingAttempts([]);
            }
        } catch (err) {
            pendingRateLimitedUntilRef.current = Date.now() + getRateLimitRetryMs(err, 5 * 60 * 1000);
        }
    }, [role]);

    useEffect(() => {
        if (!userId || !accessToken) return;
        // Run initial check after a microtask to avoid synchronous setState cascade
        const timeout = setTimeout(checkPendingLogins, 0);

        // Poll every 10 seconds so the approval modal shows up fast
        const interval = setInterval(checkPendingLogins, 10000);

        const heartbeatInterval = setInterval(() => {
            if (Date.now() < heartbeatRateLimitedUntilRef.current) return;
            api.post('/users/auth/heartbeat/').catch((err) => {
                heartbeatRateLimitedUntilRef.current = Date.now() + getRateLimitRetryMs(err, 15 * 60 * 1000);
            });
        }, 60000); // Heartbeat every 1 minute

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
            clearInterval(heartbeatInterval);
        };
    }, [userId, role, accessToken, checkPendingLogins]);

    const handleAction = async (attemptId: string, action: 'APPROVE' | 'REJECT') => {
        try {
            await api.post('/users/auth/approve/', {
                attempt_id: attemptId,
                action
            });

            if (action === 'APPROVE') {
                success('Login berhasil disetujui');
            } else {
                success('Login ditolak');
            }
            // Remove the processed attempt from array
            setPendingAttempts(prev => prev.filter(a => a.id !== attemptId));
        } catch {
            error('Gagal memproses permintaan');
        }
    };

    if (pendingAttempts.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-red-100 dark:border-red-900/30 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-100 dark:border-red-900/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                        <ShieldAlert className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Peringatan Keamanan</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {pendingAttempts.length === 1
                                ? 'Ada upaya login baru ke akun Anda'
                                : `${pendingAttempts.length} perangkat mencoba login ke akun Anda`}
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {pendingAttempts.map((attempt) => (
                        <div key={attempt.id} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-3">
                            <div className="flex items-start gap-3">
                                <Smartphone className="text-gray-400 mt-0.5 shrink-0" size={20} />
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{attempt.device_name}</p>
                                    <p className="text-xs text-gray-500 font-mono">IP: {attempt.ip_address}</p>
                                    <p className="text-xs text-gray-400">{new Date(attempt.created_at).toLocaleString('id-ID')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleAction(attempt.id, 'REJECT')}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium text-xs"
                                >
                                    <X size={14} />
                                    Tolak
                                </button>
                                <button
                                    onClick={() => handleAction(attempt.id, 'APPROVE')}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 transition-all font-bold text-xs"
                                >
                                    <Check size={14} />
                                    Izinkan
                                </button>
                            </div>
                        </div>
                    ))}

                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-1">
                        Jika disetujui, sesi baru akan mengambil alih perangkat aktif.
                    </p>
                </div>
            </div>
        </div>
    );
}
