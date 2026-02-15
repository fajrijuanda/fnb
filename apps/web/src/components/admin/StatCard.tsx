'use client';

import { ArrowUpRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, color }: StatCardProps) => (
    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-2.5 md:p-3 xl:p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-1.5 md:mb-2 xl:mb-3">
            <div className={`p-1.5 md:p-1.5 xl:p-2 rounded-lg ${color}`}>
                <Icon size={14} className="md:w-4 md:h-4 xl:w-5 xl:h-5" />
            </div>
            {trend && (
                <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 px-1 py-0.5 rounded text-[8px] md:text-[9px] xl:text-[10px] font-bold">
                    <ArrowUpRight size={8} className="md:w-2.5 md:h-2.5 xl:w-3 xl:h-3" />
                    {trend}
                </div>
            )}
        </div>
        <p className="text-gray-500 dark:text-gray-100 text-[9px] md:text-[10px] xl:text-xs font-medium truncate">{title}</p>
        <h3 className="text-xs md:text-sm xl:text-lg font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</h3>
    </div>
);
