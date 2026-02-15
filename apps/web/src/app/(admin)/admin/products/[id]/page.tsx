'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import type { Product, WrappedResponse } from '@/types/api';

export default function EditProductPage() {
    const params = useParams();
    const id = params.id as string;
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get<WrappedResponse<Product>>(`/catalog/products/${id}/`);
                if (response.data.status === 'success') {
                    setProduct(response.data.data as Product);
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-gray-500">
                Produk tidak ditemukan
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <ProductForm initialData={product} isEditing />
        </div>
    );
}
