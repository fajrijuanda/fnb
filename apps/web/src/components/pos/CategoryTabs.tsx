'use client';

import { cn } from '@/lib/utils';
import type { Category } from '@/types/api';

interface CategoryTabsProps {
    categories: Category[];
    selected: string | null;
    onSelect: (slug: string | null) => void;
}

export function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
    return (
        <div className="sticky top-0 z-50 w-full overflow-hidden bg-gradient-to-b from-zinc-800/80 to-black backdrop-blur-xl border-b border-white/5 shadow-2xl">
            <div className="flex w-full overflow-x-auto scrollbar-hide">
                {/* Categories */}
                {categories.map((category) => (
                    <button
                        key={category.id}
                        data-slug={category.slug}
                        onClick={() => onSelect(category.slug)}
                        className={cn(
                            'relative h-14 px-6 text-sm font-medium transition-all duration-200 whitespace-nowrap',
                            selected === category.slug
                                ? 'text-white font-bold' // Active Text
                                : 'text-white/60 hover:text-white hover:bg-white/5' // Inactive Text
                        )}
                    >
                        {category.name}
                        {/* Bottom Highlight Line */}
                        {selected === category.slug && (
                            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default CategoryTabs;
