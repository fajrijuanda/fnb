'use client';

import { Plus, ImageOff } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import type { Product } from '@/types/api';

interface ProductCardProps {
    product: Product;
    onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
    const isAvailable = product.stock_status?.available !== false;

    const handleClick = () => {
        if (isAvailable) {
            onSelect(product);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={!isAvailable}
            className={`group relative flex w-full h-[115px] overflow-hidden rounded-2xl text-left transition-all duration-300 
                bg-white/80 dark:bg-white/10
                backdrop-blur-xl
                border border-black/5 dark:border-white/10
                shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(197,22,29,0.15)]
                hover:border-red-300 dark:hover:border-primary/30
                ${!isAvailable ? 'cursor-not-allowed opacity-60' : ''}`}
        >
            {/* Content Section - Left (Flex-1) */}
            <div className="flex flex-1 flex-col justify-between p-3 pr-1 min-w-0">
                <div>
                    <h3 className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                        {product.name}
                    </h3>
                    {product.description && (
                        <p className="mt-1 line-clamp-2 text-[10px] text-gray-600 dark:text-white/60 leading-relaxed">
                            {product.description}
                        </p>
                    )}
                </div>

                {/* Price */}
                <span className="text-sm font-bold tracking-tight text-primary dark:text-red-400">
                    {formatRupiah(product.price)}
                </span>
            </div>

            {/* Image Section - Right (Square Centered) */}
            <div className="relative h-full w-[100px] flex items-center justify-center shrink-0">
                <div className="h-[80px] w-[80px] overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10 shadow-inner">
                    {product.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ImageOff className="h-5 w-5 text-gray-400 dark:text-white/30" />
                        </div>
                    )}
                </div>

                {/* Scoop Effect - Bottom Right of the Card */}
                <div className="absolute bottom-0 right-0 z-10 h-10 w-10 rounded-tl-[1.2rem] bg-white dark:bg-[#1a1a1a] shadow-[-2px_-2px_10px_rgba(0,0,0,0.05)]" />

                {/* Button Centered in Scoop */}
                {isAvailable ? (
                    <div className="absolute bottom-1 right-1 z-20">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-xl transition-all active:scale-95 hover:scale-110 bg-gradient-to-br from-primary to-red-600 shadow-primary/30 hover:shadow-primary/50"
                        >
                            <Plus className="h-4 w-4" strokeWidth={3} />
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm rounded-xl m-2">
                        <span className="rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md px-2 py-0.5 text-[8px] font-bold text-gray-800 dark:text-white border border-gray-200 dark:border-white/20">
                            HABIS
                        </span>
                    </div>
                )}
            </div>
        </button>
    );
}

export default ProductCard;
