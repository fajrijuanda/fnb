'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/pos/ProductCard';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { AddToCartModal } from './AddToCartModal';
import { useCartStore } from '@/store';
import api from '@/lib/api';
import type { Product, Category } from '@/types/api';

interface ProductGridProps {
    searchQuery?: string;
}

export function ProductGrid({ searchQuery = '' }: ProductGridProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { addItem } = useCartStore();

    // Section Refs
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleConfirmAdd = (product: Product, quantity: number, note: string) => {
        addItem(product, quantity, note);
    };

    const handleCategoryClick = (slug: string | null) => {
        setActiveCategory(slug);
        const targetId = slug ? `category-${slug}` : 'category-all';
        const element = document.getElementById(targetId);
        const container = document.getElementById('product-scroll-container');

        if (element && container) {
            // Calculate position relative to container
            const top = element.offsetTop;
            container.scrollTo({ top, behavior: 'smooth' });
        }
    };

    // Scroll Spy
    useEffect(() => {
        const currentRefs = sectionRefs.current;

        // Determine observer root
        const scrollContainer = document.getElementById('product-scroll-container');
        const observerOptions = {
            root: scrollContainer,
            rootMargin: '0px 0px -80% 0px', // Trigger when section hits top 20%
            threshold: 0
        };

        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Extract slug from ID "category-{slug}"
                    const slug = entry.target.id.replace('category-', '');
                    setActiveCategory(slug);

                    // Also scroll the tab into view in the horizontal list
                    const tabButton = document.querySelector(`button[data-slug="${slug}"]`);
                    if (tabButton) {
                        tabButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                }
            });
        };

        const observer = new IntersectionObserver(callback, observerOptions);

        Object.values(currentRefs).forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            observer.disconnect();
        };
    }, [categories]); // Re-run when categories change

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [catRes, prodRes] = await Promise.all([
                    api.get('/catalog/categories/'),
                    api.get('/catalog/products/')
                ]);

                // Handle Categories
                let categoryList: Category[] = [];
                const catData = catRes.data;
                if (Array.isArray(catData)) categoryList = catData;
                else if (catData.results) categoryList = catData.results;
                else if (catData.data) categoryList = catData.data;

                setCategories(categoryList);

                // Handle Products
                let productList: Product[] = [];
                const prodData = prodRes.data;
                if (Array.isArray(prodData)) productList = prodData;
                else if (prodData.results) productList = prodData.results;
                else if (prodData.data) {
                    if (Array.isArray(prodData.data)) productList = prodData.data;
                    else if (prodData.data.results) productList = prodData.data.results;
                }

                setProducts(productList);
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Gagal memuat data menu.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Group Products by Category
    const groupedProducts = categories.reduce((acc, category) => {
        acc[category.slug] = products.filter(p => {
            const pCat = p.category;
            // Case 1: pCat is the Category Name string (e.g. "Paket") - Matches strict equality
            if (typeof pCat === 'string') {
                return pCat === category.name;
            }
            // Case 2: pCat is an object with ID
            if (typeof pCat === 'object' && pCat && 'id' in pCat) {
                return (pCat as { id: number }).id === category.id;
            }
            // Case 3: pCat is the ID directly (number or numeric string)
            return pCat == category.id;
        });
        return acc;
    }, {} as Record<string, Product[]>);

    // Filter products based on search query
    const filteredGroupedProducts = useMemo(() => {
        if (!searchQuery) return groupedProducts;

        const query = searchQuery.toLowerCase();
        const filtered: Record<string, Product[]> = {};

        Object.entries(groupedProducts).forEach(([catSlug, products]) => {
            const matchingProducts = products.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );

            if (matchingProducts.length > 0) {
                filtered[catSlug] = matchingProducts;
            }
        });

        return filtered;
    }, [groupedProducts, searchQuery]);

    if (error) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-center">
                <p className="text-danger">{error}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-transparent">
            {/* Category Tabs - Fixed at top */}
            <div className="z-10 flex-none bg-transparent">
                <CategoryTabs
                    categories={categories}
                    selected={activeCategory}
                    onSelect={handleCategoryClick}
                />
            </div>

            {/* Render by Sections - Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth" id="product-scroll-container">
                <div className="p-4 space-y-8 pb-32">
                    {Object.entries(filteredGroupedProducts).map(([categorySlug, categoryProducts]) => {
                        if (categoryProducts.length === 0) return null;

                        const category = categories.find(cat => cat.slug === categorySlug);
                        if (!category) return null; // Should not happen if categories are consistent

                        return (
                            <div
                                key={category.id}
                                id={`category-${category.slug}`}
                                className="scroll-mt-4"
                                ref={(el) => { sectionRefs.current[category.slug] = el; }}
                            >
                                <h2 className="mb-4 text-lg font-bold text-card-foreground uppercase tracking-wider flex items-center gap-2">
                                    <span className="h-6 w-1 bg-primary rounded-full block"></span>
                                    {category.name}
                                </h2>
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                    {categoryProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onSelect={handleProductSelect}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add To Cart Modal */}
            <AddToCartModal
                isOpen={isModalOpen}
                product={selectedProduct}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAdd}
            />
        </div>
    );
}

export default ProductGrid;
