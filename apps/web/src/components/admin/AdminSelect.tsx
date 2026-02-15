'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSelectOption {
    value: number | string;
    label: string;
}

interface AdminSelectProps {
    value: number | string;
    onChange: (value: number | string) => void;
    options: AdminSelectOption[];
    className?: string;
}

export function AdminSelect({ value, onChange, options, className }: AdminSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("relative inline-block", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-900 dark:text-white hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm min-w-[60px] justify-between"
            >
                <span>{activeOption?.label || value}</span>
                <ChevronDown size={14} className={cn("text-gray-400 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-full min-w-[70px] bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 animation-scale-in origin-top">
                    <div className="p-1 space-y-0.5">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold transition-all",
                                    value === option.value
                                        ? "bg-red-50 text-red-800 dark:bg-primary/20 dark:text-red-500"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
