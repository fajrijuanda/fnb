'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Smartphone, Trash2, Shield, Laptop, Clock } from 'lucide-react';
import { useToast } from '@/components/ToastContext';

interface TrustedDevice {
    id: string;
    device_name: string;
    ip_address: string;
    last_used: string;
    created_at: string;
}

function formatDeviceName(userAgent: string) {
    if (!userAgent) return 'Perangkat Tidak Dikenal';

    // Check if it looks like a user agent string
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
    const [isLoading, setIsLoading] = useState(true);
    const { success, error } = useToast();
    const currentDeviceId = typeof window !== 'undefined' ? localStorage.getItem('device_id') : null;

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

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

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

    if (isLoading) return <div className="p-4 text-center text-gray-500">Memuat perangkat...</div>;

    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Shield size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Perangkat Terpercaya</h3>
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
                                    {device.device_name.toLowerCase().includes('mobile') ? <Smartphone size={20} /> : <Laptop size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        {formatDeviceName(device.device_name)}
                                        {currentDeviceId && device.device_name.includes('') /* We don't store Device ID in TrustedDevice model publicly exposed usually, but we can infer if we matched it? Currently ID is UUID. */}
                                        {/* Actually checking ID match is hard without exposing device_id in serializer. But we did expose 'id' which is TrustedDevice ID, not Device UUID. 
                                            Wait, Serializer exposes 'id' (TrustedDevice PK), 'device_name', 'ip_address'. 
                                            I cannot match currentDeviceId (UUID) with TrustedDevice.id (Auto/UUID?).
                                            Back in views.py, I used `device_id` field in TrustedDevice model, but serializer uses `id` (PK). 
                                            Let's check TrustedDevice model. It has `device_id` field. 
                                            I should expose `device_id` in serializer if I want to show "This Device". 
                                            Let's just show IP for now.
                                        */}
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
    );
}
