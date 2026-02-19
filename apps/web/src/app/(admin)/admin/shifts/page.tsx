
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Clock,
    Search,
    AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Shift {
    id: string;
    cashier: {
        id: number;
        username: string;
        email: string;
    };
    start_time: string;
    end_time: string | null;
    initial_cash: number;
    final_cash_system: number;
    final_cash_actual: number;
    status: 'OPEN' | 'CLOSED';
    notes: string;
    status_display: string;
}

interface MitraUser {
    id: number;
    username: string;
    email: string;
    role: string;
}

export default function ShiftPage() {
    const { user } = useAuthStore();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Admin Filter
    const [mitras, setMitras] = useState<MitraUser[]>([]);
    const [selectedMitra, setSelectedMitra] = useState<string>('');

    // Pagination state (simple client-side for now or prepare for server-side)
    // const [page, setPage] = useState(1);
    // const [hasMore, setHasMore] = useState(false);

    const fetchShifts = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (selectedMitra) {
                params.cashier__cashier_profile__mitra = selectedMitra;
            }

            const res = await api.get('/sales/shifts/', { params });

            if (Array.isArray(res.data)) {
                setShifts(res.data);
            } else if (res.data.results) {
                setShifts(res.data.results);
            }
        } catch (error) {
            console.error("Failed to fetch shifts:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedMitra]);

    const fetchMitras = useCallback(async () => {
        if (user?.role !== 'superadmin') return;
        try {
            const res = await api.get('/users/');
            if (res.data.results) {
                const mitraUsers = res.data.results.filter((u: MitraUser) => u.role === 'mitra');
                setMitras(mitraUsers);
            }
        } catch (error) {
            console.error("Failed to fetch mitras:", error);
        }
    }, [user?.role]);

    useEffect(() => {
        if (user?.role === 'superadmin') {
            fetchMitras();
        }
    }, [user?.role, fetchMitras]);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]);

    const filteredShifts = shifts.filter(shift =>
        shift.cashier.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.status_display.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && shifts.length === 0) {
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="space-y-6 animation-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-primary" />
                        Shift Outlet
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring buka/tutup shift kasir</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {user?.role === 'superadmin' && (
                        <div className="bg-white dark:bg-white/5 p-1.5 rounded-xl border border-gray-200 dark:border-white/10">
                            <select
                                value={selectedMitra}
                                onChange={(e) => setSelectedMitra(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm p-1 text-gray-700 dark:text-gray-200 w-32"
                            >
                                <option value="">Semua Mitra</option>
                                {mitras.map((mitra) => (
                                    <option key={mitra.id} value={mitra.id}>{mitra.username}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1.5 rounded-xl border border-gray-200 dark:border-white/10 w-full md:w-auto">
                        <Search size={18} className="text-gray-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Cari kasir..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm p-1 text-gray-700 dark:text-gray-200 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Shift Table */}
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4">Waktu Buka</th>
                                <th className="px-6 py-4">Waktu Tutup</th>
                                <th className="px-6 py-4 text-right">Modal Awal</th>
                                <th className="px-6 py-4 text-right">Aktual Akhir</th>
                                <th className="px-6 py-4 text-right">Selisih</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredShifts.length > 0 ? (
                                filteredShifts.map((shift) => {
                                    const difference = shift.final_cash_actual - shift.final_cash_system;
                                    const isClosed = shift.status === 'CLOSED';

                                    return (
                                        <tr key={shift.id} className="bg-white dark:bg-white/5 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                <div className="flex flex-col">
                                                    <span>{shift.cashier.username}</span>
                                                    {/* <span className="text-xs text-gray-400">{shift.cashier.email}</span> */}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{new Date(shift.start_time).toLocaleDateString()}</span>
                                                    <span className="text-xs text-gray-500">{new Date(shift.start_time).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {shift.end_time ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{new Date(shift.end_time).toLocaleDateString()}</span>
                                                        <span className="text-xs text-gray-500">{new Date(shift.end_time).toLocaleTimeString()}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                {formatCurrency(shift.initial_cash)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold">
                                                {isClosed ? formatCurrency(shift.final_cash_actual) : '-'}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono font-bold ${!isClosed ? 'text-gray-400' :
                                                difference === 0 ? 'text-green-500' :
                                                    difference > 0 ? 'text-blue-500' : 'text-red-500'
                                                }`}>
                                                {!isClosed ? '-' : (
                                                    <span className="flex items-center justify-end gap-1">
                                                        {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                                                        {difference !== 0 && (
                                                            <AlertCircle size={14} />
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${shift.status === 'OPEN'
                                                    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                                    : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20'
                                                    }`}>
                                                    {shift.status_display || shift.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Tidak ada data shift yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
