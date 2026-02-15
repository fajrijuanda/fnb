'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2,
    Eye,
    Receipt,
    Calendar,
    CreditCard,
    X,
    Printer,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ToastContext';
import type { OrderResponse, ApiResponse } from '@/types/api';
import { extractApiArray } from '@/lib/api-utils';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSearchHeader } from '@/components/admin/AdminSearchHeader';
import { AdminDataTable, Column } from '@/components/admin/AdminDataTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';

export default function OrdersPage() {
    const { error: showError } = useToast();
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get<ApiResponse<OrderResponse[]>>('/sales/orders/');
            setOrders(extractApiArray(response.data));
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            showError('Gagal memuat data pesanan');
        } finally {
            setIsLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleViewDetail = async (id: string) => {
        try {
            const response = await api.get<ApiResponse<OrderResponse>>(`/sales/orders/${id}/`);
            const resData = response.data as unknown as { status?: string; data?: OrderResponse; id?: string; invoice_number?: string };
            let orderDetail: OrderResponse | null = null;

            if (resData.status === 'success' && resData.data) {
                orderDetail = resData.data as OrderResponse;
            } else if (resData.id && resData.invoice_number) {
                // Direct response
                orderDetail = resData as unknown as OrderResponse;
            } else if (resData.data && !resData.status) {
                // Only data wrapper
                orderDetail = resData.data as OrderResponse;
            }

            if (orderDetail) {
                setSelectedOrder(orderDetail);
            }
        } catch (error) {
            console.error('Failed to fetch order detail:', error);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Logic
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize]);

    const columns: Column<OrderResponse>[] = [
        {
            header: "Invoice",
            accessor: (order) => (
                <span className="font-mono font-medium text-gray-900 dark:text-white group-hover:text-red-700 transition-colors">
                    {order.invoice_number}
                </span>
            )
        },
        {
            header: "Waktu",
            accessor: (order) => formatDate(order.created_at)
        },
        {
            header: "Metode",
            accessor: (order) => (
                <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${order.payment_method === 'QRIS'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                    : order.payment_method === 'TRANSFER'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200'
                        : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200'
                    }`}>
                    {order.payment_method === 'QRIS' && <CreditCard size={10} />}
                    {order.payment_method}
                </span>
            )
        },
        {
            header: "Total",
            accessor: (order) => formatCurrency(order.total_amount),
            className: "font-semibold text-gray-900 dark:text-white whitespace-nowrap"
        },
        {
            header: "Status",
            accessor: (order) => (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${order.status === 'PAID'
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                    : order.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                    }`}>
                    {order.status === 'PAID' && <CheckCircle2 size={10} />}
                    {order.status === 'PAID' ? 'Lunas' : order.status === 'PENDING' ? 'Pending' : 'Dibatalkan'}
                </span>
            )
        },
        {
            header: "Aksi",
            className: "text-right",
            accessor: (order) => (
                <button
                    onClick={() => handleViewDetail(order.id)}
                    className="p-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-200 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                    title="Lihat Detail"
                >
                    <Eye size={14} />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-4 lg:space-y-6">
            <AdminHeader
                title="Pesanan"
                description="Kelola dan pantau riwayat pesanan"
            />

            <AdminSearchHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari No. Invoice..."
                extraActions={
                    <div className="flex items-center gap-2">
                        <AdminSelect
                            value={pageSize}
                            onChange={(val) => setPageSize(val as number)}
                            options={[5, 10, 25, 50].map(size => ({ value: size, label: size.toString() }))}
                        />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Per Halaman</span>
                    </div>
                }
            />

            <AdminDataTable
                data={paginatedOrders}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(order) => order.id}
                mobileCardRender={(order) => (
                    <div className="bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{order.invoice_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${order.status === 'PAID'
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                                }`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{formatDate(order.created_at)}</p>
                                <p className="text-sm font-bold text-red-700 dark:text-red-500">{formatCurrency(order.total_amount)}</p>
                            </div>
                            <button
                                onClick={() => handleViewDetail(order.id)}
                                className="p-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-200 rounded-lg"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>
                )}
            />

            <AdminPagination
                currentPage={currentPage}
                totalItems={filteredOrders.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
            />

            {/* Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animation-fade-in" onClick={() => setSelectedOrder(null)}>
                    <div
                        className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-primary/20 rounded-lg text-red-700 dark:text-red-400">
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Detail Pesanan</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-300 font-mono">{selectedOrder.invoice_number}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-gray-500 dark:text-gray-300" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Status Pembayaran</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold ${selectedOrder.status === 'PAID'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                                        }`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Waktu Transaksi</p>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                        <Calendar size={14} />
                                        {formatDate(selectedOrder.created_at)}
                                    </p>
                                </div>
                            </div>

                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Item Pesanan</h4>
                            <div className="border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden mb-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-white/5 text-left">
                                            <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Produk</th>
                                            <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-center">Qty</th>
                                            <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Harga</th>
                                            <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {selectedOrder.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-gray-900 dark:text-white">{item.product_name}</td>
                                                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-200">x{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-200">{formatCurrency(item.price_at_sale)}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-red-50 dark:bg-primary/10 border-t border-red-100 dark:border-primary/20">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Total Akhir</td>
                                            <td className="px-4 py-3 text-right font-bold text-red-700 dark:text-red-500 text-lg">
                                                {formatCurrency(selectedOrder.total_amount)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {selectedOrder.notes && (
                                <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20">
                                    <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1">Catatan:</p>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex gap-3 justify-end">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                                <Printer size={16} />
                                Cetak
                            </button>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-primary/20 font-medium text-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
