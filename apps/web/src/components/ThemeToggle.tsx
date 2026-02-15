'use client';

import { useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
    dropdownAlign?: 'top' | 'bottom';
    dropdownSide?: 'left' | 'right';
}

export function ThemeToggle({ className, dropdownAlign = 'bottom', dropdownSide = 'left' }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (t: 'light' | 'dark' | 'system') => {
        setTheme(t);
        setIsOpen(false);
    };

    const verticalClass = dropdownAlign === 'top'
        ? "bottom-full mb-2"
        : "top-full mt-2";

    const horizontalClass = dropdownSide === 'right'
        ? "right-0"
        : "left-0";

    const originClass = dropdownAlign === 'top'
        ? (dropdownSide === 'right' ? 'origin-bottom-right' : 'origin-bottom-left')
        : (dropdownSide === 'right' ? 'origin-top-right' : 'origin-top-left');

    const dropdownPosition = `${verticalClass} ${horizontalClass} ${originClass}`;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "rounded-xl p-2 transition-all",
                    className || "text-gray-900 dark:text-white hover:bg-red-50 dark:hover:bg-white/10 hover:text-[#C5161D] dark:hover:text-[#C5161D]"
                )}
                title="Ganti Tema"
            >
                {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                ) : theme === 'light' ? (
                    <Sun className="h-5 w-5" />
                ) : (
                    <Monitor className="h-5 w-5" />
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className={`absolute w-40 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50 animation-scale-in ${dropdownPosition}`}>
                        <div className="p-1 space-y-0.5">
                            <button
                                onClick={() => handleSelect('light')}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${theme === 'light'
                                    ? 'bg-red-50 text-[#C5161D] dark:bg-red-500/20 dark:text-[#C5161D]'
                                    : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                                    }`}
                            >
                                <Sun size={16} />
                                <span className="font-medium">Terang</span>
                            </button>

                            <button
                                onClick={() => handleSelect('dark')}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${theme === 'dark'
                                    ? 'bg-red-50 text-[#C5161D] dark:bg-red-500/20 dark:text-[#C5161D]'
                                    : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                                    }`}
                            >
                                <Moon size={16} />
                                <span className="font-medium">Gelap</span>
                            </button>

                            <button
                                onClick={() => handleSelect('system')}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${theme === 'system'
                                    ? 'bg-red-50 text-[#C5161D] dark:bg-red-500/20 dark:text-[#C5161D]'
                                    : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                                    }`}
                            >
                                <Monitor size={16} />
                                <span className="font-medium">Sistem</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ThemeToggle;
