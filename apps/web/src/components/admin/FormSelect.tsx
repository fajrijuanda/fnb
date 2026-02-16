'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormSelectOption {
    value: string | number;
    label: string;
}

interface FormSelectProps {
    value: string | number;
    onChange: (value: string) => void;
    options: FormSelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function FormSelect({
    value,
    onChange,
    options,
    placeholder = 'Pilih...',
    className,
    disabled = false,
}: FormSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeOption = options.find(
        (opt) => String(opt.value) === String(value)
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKey);
            return () => document.removeEventListener('keydown', handleKey);
        }
    }, [isOpen]);

    return (
        <div className={cn('relative', className)} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between gap-2',
                    'px-4 py-3 rounded-xl text-sm font-medium text-left',
                    'bg-gray-50 dark:bg-white/5',
                    'border border-gray-200 dark:border-white/10',
                    'hover:border-gray-300 dark:hover:border-white/20',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    'transition-all duration-200',
                    disabled && 'opacity-50 cursor-not-allowed',
                    isOpen && 'ring-2 ring-primary/30 border-primary'
                )}
            >
                <span
                    className={cn(
                        activeOption
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-500'
                    )}
                >
                    {activeOption?.label || placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={cn(
                        'text-gray-400 dark:text-gray-500 transition-transform duration-300 flex-shrink-0',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute z-50 top-full mt-1.5 left-0 w-full',
                        'bg-white dark:bg-[#1e1e1e]',
                        'rounded-xl shadow-xl',
                        'border border-gray-200 dark:border-white/10',
                        'overflow-hidden',
                        'animation-scale-in origin-top'
                    )}
                >
                    <div className="max-h-56 overflow-y-auto scrollbar-hide p-1 space-y-0.5">
                        {options.map((option) => {
                            const isSelected =
                                String(option.value) === String(value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(String(option.value));
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                                        isSelected
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-red-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                    )}
                                >
                                    <span>{option.label}</span>
                                    {isSelected && (
                                        <Check
                                            size={14}
                                            className="text-primary dark:text-red-400 flex-shrink-0"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
