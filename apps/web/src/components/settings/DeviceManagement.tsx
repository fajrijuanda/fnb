'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Smartphone, Trash2, Shield, Laptop, Clock, ShieldAlert, Check, X, Bell } from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { useAuthStore } from '@/store/useAuthStore';

interface TrustedDevice {
    id: string;
    device_id: string;
    device_name: string;
    ip_address: string;
    last_used: string;
    created_at: string;
}

interface LoginAttempt {
    id: string;
    device_name: string;
    ip_address: string;
    created_at: string;
    status: string;
}

function formatDeviceName(userAgent: string) {
    if (!userAgent) return 'Perangkat Tidak Dikenal';

    const isUserAgent = userAgent.includes('Mozilla') || userAgent.includes('AppleWebKit');
    if (!isUserAgent && userAgent.length < 30) return userAgent;

    let os = '';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Macintosh')) os = 'macOS';
    else if (userAgent.includes('Linux') && !userAgent.includes('Android')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    let browser = '';
    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('OPR') || userAgent.includes('Opera')) browser = 'Opera';
    else if (userAgent.includes('Chrome') && !userAgent.includes('Edg/') && !userAgent.includes('OPR') && !userAgent.includes('Opera')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome') && !userAgent.includes('Edg/') && !userAgent.includes('OPR') && !userAgent.includes('Opera')) browser = 'Safari';

    if (os && browser) return `${browser} di ${os}`;
    if (os) return `Perangkat ${os}`;
    if (browser) return `Browser ${browser}`;

    return userAgent;
}

export function DeviceManagement() {
    const [devices, setDevices] = useState<TrustedDevice[]>([]);
    const [pendingAttempts, setPendingAttempts] = useState<LoginAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { success, error } = useToast();
    const currentDeviceId = typeof window !== 'undefined' ? localStorage.getItem('device_id') : null;
    const { user } = useAuthStore();

    const fetchDevices = useCallback(async () => {
        try {
            const response = await api.get<{ data: TrustedDevice[] }>('/users/devices/');
            setDevices(response.data.data);
        } catch {
            error('Gagal memuat perangkat terpercaya');
        } finally {
            setIsLoading(false);
        }
    }, [error]);

    const fetchPendingAttempts = useCallback(async () => {
        if (user?.role !== 'mitra' && user?.role !== 'superadmin') return;
        try {
            const response = await api.get<{ data: LoginAttempt[] }>('/users/auth/pending/');
            setPendingAttempts(response.data.data);
        } catch {
            // Silently fail — not critical
        }
    }, [user?.role]);

    useEffect(() => {
        fetchDevices();
        fetchPendingAttempts();
    }, [fetchDevices, fetchPendingAttempts]);

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus perangkat ini? Anda perlu login dan verifikasi ulang jika ingin menggunakan perangkat ini lagi.')) return;

        try {
            await api.delete(`/users/devices/${id}/`);
            success('Perangkat berhasil dihapus');
            fetchDevices();
        } catch {
            error('Gagal menghapus perangkat');
        }
    };

    const handleApproval = async (attemptId: string, action: 'APPROVE' | 'REJECT') => {
        setProcessingId(attemptId);
        try {
            await api.post('/users/auth/approve/', {
                attempt_id: attemptId,
                action
            });
            if (action === 'APPROVE') {
                success('Perangkat diizinkan masuk');
            } else {
                success('Permintaan login ditolak');
            }
            setPendingAttempts(prev => prev.filter(a => a.id !== attemptId));
        } catch {
            error('Gagal memproses permintaan');
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) return <div className="p-4 text-center text-gray-500">Memuat perangkat...</div>;

    return (
        <div className="space-y-4">
            {/* Pending Login Requests */}
            {pendingAttempts.length > 0 && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-amber-300 dark:border-amber-500/30 shadow-sm overflow-hidden">
                    <div className="p-5 lg:p-6 border-b border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 flex items-center gap-3">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <ShieldAlert size={20} />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[10px] font-bold items-center justify-center">
                                    {pendingAttempts.length}
                                </span>
                            </span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg lg:text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                <Bell size={16} className="text-amber-500" />
                                Permintaan Login
                            </h3>
                            <p className="text-sm text-gray-500">
                                {pendingAttempts.length} perangkat menunggu persetujuan Anda
                            </p>
                        </div>
                    </div>

                    <div className="divide-y divide-amber-100 dark:divide-amber-500/10">
                        {pendingAttempts.map((attempt) => (
                            <div key={attempt.id} className="p-4 flex items-center justify-between hover:bg-amber-50/50 dark:hover:bg-amber-900/5 transition-colors">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                            {formatDeviceName(attempt.device_name)}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                            <span className="font-mono">IP: {attempt.ip_address}</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} /> {new Date(attempt.created_at).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <button
                                        onClick={() => handleApproval(attempt.id, 'REJECT')}
                                        disabled={processingId === attempt.id}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                                        title="Tolak login"
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleApproval(attempt.id, 'APPROVE')}
                                        disabled={processingId === attempt.id}
                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all disabled:opacity-50"
                                        title="Izinkan login"
                                    >
                                        <Check size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trusted Devices */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-5 lg:p-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg lg:text-xl text-gray-900 dark:text-white">Perangkat Terpercaya</h3>
                        <p className="text-sm text-gray-500">Kelola perangkat yang memiliki akses ke akun ini.</p>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {devices.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Belum ada perangkat terpercaya.
                        </div>
                    ) : (
                        devices.map((device) => (
                            <div key={device.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        {device.device_name.toLowerCase().includes('mobile') || device.device_name.toLowerCase().includes('android') || device.device_name.toLowerCase().includes('iphone')
                                            ? <Smartphone size={20} />
                                            : <Laptop size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {formatDeviceName(device.device_name)}
                                            {currentDeviceId && device.device_id === currentDeviceId && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold">
                                                    Ini
                                                </span>
                                            )}
                                        </h4>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Shield size={12} /> {device.ip_address}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} /> {new Date(device.last_used).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(device.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                    title="Hapus perangkat"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
