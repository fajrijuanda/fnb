'use client';

import { InventoryPrediction } from '@/components/admin/ai/InventoryPrediction';

import { Lock, Phone, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
    // Dummy Data for Background Visual
    const dummyItems = [
        { id: 1, name: 'Beras Premium', stock: 50, unit: 'kg', status: 'SAFE' },
        { id: 2, name: 'Minyak Goreng', stock: 12, unit: 'liter', status: 'LOW' },
        { id: 3, name: 'Gula Pasir', stock: 25, unit: 'kg', status: 'SAFE' },
        { id: 4, name: 'Telur Ayam', stock: 5, unit: 'kg', status: 'CRITICAL' },
        { id: 5, name: 'Tepung Terigu', stock: 30, unit: 'kg', status: 'SAFE' },
    ];

    return (
        <div className="relative min-h-screen">
            {/* Blurred Background Content */}
            <div className="p-8 max-w-7xl mx-auto filter blur-md pointer-events-none select-none opacity-50">
                <InventoryPrediction />
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventori</h1>
                        <p className="text-gray-500 dark:text-gray-400">Kelola stok bahan baku dan peringatan stok</p>
                    </div>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-primary to-red-700 text-white px-6 py-3 rounded-xl shadow-lg">
                        <Plus size={20} />
                        <span>Tambah Stok</span>
                    </button>
                </div>

                {/* Dummy Filters */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari bahan baku..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                        readOnly
                    />
                </div>

                {/* Dummy Table */}
                <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-primary/10 dark:bg-white/5 text-left">
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Nama Bahan</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Stok Saat Ini</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Satuan</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {dummyItems.map((item) => (
                                <tr key={item.id} className="hover:bg-red-50 dark:hover:bg-white/5">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.stock}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.unit}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'SAFE' ? 'bg-green-100 text-green-800' :
                                            item.status === 'LOW' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {item.status === 'SAFE' ? 'Aman' : item.status === 'LOW' ? 'Menipis' : 'Kritis'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">...</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                <div className="relative max-w-lg w-full bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-8 text-center shadow-2xl animation-scale-in">
                    {/* Decorative Background Glow */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
                            <Lock className="h-10 w-10 text-white" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Fitur Premium Terkunci 🔒
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            Maaf, fitur <span className="font-semibold text-red-700 dark:text-red-500">Manajemen Inventori</span> adalah fitur tambahan eksklusif.
                            Fitur ini memungkinkan Anda melacak stok bahan baku, mengatur peringatan stok menipis, dan manajemen resep produk secara otomatis.
                        </p>

                        <div className="flex flex-col w-full gap-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                Tertarik membuka fitur ini? Hubungi Developer:
                            </p>
                            <Link
                                href="https://wa.me/6285217861296?text=Halo%2C%20saya%20tertarik%20untuk%20membuka%20fitur%20Inventori%20pada%20aplikasi%20POS%20saya."
                                target="_blank"
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Phone size={24} />
                                <span>Hubungi via WhatsApp</span>
                            </Link>

                            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-primary/10">
                                <p className="text-xs font-mono text-red-700 dark:text-red-500">
                                    Developer Contact: 0852-1786-1296
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
