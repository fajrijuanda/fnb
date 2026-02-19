'use client';

import { forwardRef } from 'react';
import { formatRupiah, formatDate } from '@/lib/utils';
import type { OrderResponse } from '@/types/api';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptPrintProps {
    order: OrderResponse;
    storeName?: string;
    storeAddress?: string;
}

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(
    ({ order, storeName = 'Warung Jawa', storeAddress = 'Jl. Contoh No. 123' }, ref) => {
        return (
            <div
                ref={ref}
                className="w-[58mm] bg-white p-2 font-mono text-[10px] text-black print:block"
                style={{ fontFamily: 'monospace' }}
            >
                {/* Header */}
                <div className="text-center mb-3 border-b border-dashed border-gray-400 pb-2">
                    <h1 className="text-sm font-bold uppercase">{storeName}</h1>
                    <p className="text-[9px]">{storeAddress}</p>
                </div>

                {/* Invoice Info */}
                <div className="mb-3 text-[9px]">
                    <div className="flex justify-between">
                        <span>No:</span>
                        <span className="font-semibold">{order.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tanggal:</span>
                        <span>{formatDate(order.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Bayar:</span>
                        <span>{order.payment_method_display}</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-b border-dashed border-gray-400 mb-2" />

                {/* Items */}
                <div className="mb-3">
                    {order.items.map((item) => (
                        <div key={item.id} className="mb-1">
                            <div className="font-semibold">{item.product_name}</div>
                            <div className="flex justify-between text-[9px]">
                                <span>
                                    {item.quantity} x {formatRupiah(item.price_at_sale)}
                                </span>
                                <span>{formatRupiah(item.subtotal)}</span>
                            </div>
                            {item.note && (
                                <div className="text-[8px] italic text-gray-600">
                                    Catatan: {item.note}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-b border-dashed border-gray-400 mb-2" />

                {/* Total */}
                <div className="mb-3">
                    <div className="flex justify-between font-bold text-sm">
                        <span>TOTAL</span>
                        <span>{formatRupiah(order.total_amount)}</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-b border-dashed border-gray-400 mb-2" />

                {/* Footer */}
                <div className="text-center text-[9px]">
                    <p className="mb-1">Terima kasih!</p>
                    <p className="text-[8px] text-gray-500 mb-2">Selamat menikmati</p>

                    {/* QRIS Code */}
                    {order.qris_data && (
                        <div className="flex flex-col items-center justify-center pt-2 border-t border-dashed border-gray-400">
                            <p className="mb-1 font-bold">SCAN QRIS</p>
                            <QRCodeSVG value={order.qris_data} size={100} level="M" />
                            <p className="mt-1 text-[8px]">{order.payment_method_display}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

ReceiptPrint.displayName = 'ReceiptPrint';

export default ReceiptPrint;
