'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Upload } from 'lucide-react';

import Link from 'next/link';
import Image from 'next/image';
import { AIGenerateButton } from '@/components/admin/ai/AIGenerateButton';
import api from '@/lib/api';
import type { Product, Category, WrappedResponse } from '@/types/api';

interface ProductFormProps {
    initialData?: Product;
    isEditing?: boolean;
}

export default function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(initialData?.image_url || null);

    // Form States
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [price, setPrice] = useState(initialData?.price?.toString() || '');
    const [categoryId, setCategoryId] = useState(initialData?.category?.toString() || '');
    const [isAvailable, setIsAvailable] = useState(initialData?.is_available ?? true);
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get<WrappedResponse<Category[]>>('/catalog/categories/');
            if (response.data.status === 'success') {
                setCategories(response.data.data as Category[]);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price);
            formData.append('category', categoryId);
            formData.append('is_available', isAvailable.toString());

            if (imageFile) {
                formData.append('image', imageFile);
            }

            if (isEditing && initialData) {
                await api.patch(`/catalog/products/${initialData.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.post('/catalog/products/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            router.push('/admin/products');
            router.refresh();
        } catch (error) {
            console.error('Failed to save product:', error);
            alert('Gagal menyimpan produk. Periksa kembali form anda.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
                <Link
                    href="/admin/products"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-700 dark:text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Image & Status */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Foto Produk
                        </label>
                        <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-orange-500 dark:hover:border-orange-500 transition-colors overflow-hidden group bg-gray-50 dark:bg-black/20">
                            {previewImage ? (
                                <>
                                    <Image
                                        src={previewImage}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="text-white text-sm font-medium flex flex-col items-center gap-2">
                                            <Upload size={24} />
                                            <span>Ganti Foto</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                    <Upload size={48} className="mb-2" />
                                    <span>Upload Foto</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <div>
                            <span className="block font-medium text-gray-900 dark:text-white">Status Produk</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {isAvailable ? 'Tersedia untuk dijual' : 'Tidak tersedia (Habis)'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAvailable(!isAvailable)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${isAvailable ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        >
                            <span
                                className={`${isAvailable ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nama Produk
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                            placeholder="Contoh: Nasi Goreng Spesial"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Kategori
                        </label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                        >
                            <option value="">Pilih Kategori</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Harga (Rp)
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            min="0"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                            placeholder="0"
                        />
                    </div>


                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Deskripsi
                            </label>
                            <AIGenerateButton
                                productName={name}
                                onGenerate={setDescription}
                            />
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white resize-none"
                            placeholder="Deskripsi singkat produk..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-white/10">
                <Link
                    href="/admin/products"
                    className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Simpan Produk
                        </>
                    )}
                </button>
            </div>
        </form >
    );
}
