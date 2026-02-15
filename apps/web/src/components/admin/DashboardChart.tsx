'use client';

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

interface DashboardChartProps {
    data: Record<string, number | string>[];
    title: string;
    dataKey?: string;
    tooltipLabel?: string;
    color?: string;
    valueFormatter?: (value: number) => string;
}

export const DashboardChart = ({
    data,
    title,
    dataKey = 'revenue',
    tooltipLabel = 'Pendapatan',
    color = '#f97316',
    valueFormatter = (val) => formatCurrency(Number(val))
}: DashboardChartProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Chart Colors
    const gridColor = isDark ? '#ffffff20' : '#00000010';
    const tickColor = isDark ? '#e5e7eb' : '#6b7280';
    const tooltipBg = isDark ? '#1a1a1a' : '#ffffff';
    const tooltipBorder = isDark ? '#333' : '#e5e7eb';
    const tooltipText = isDark ? '#fff' : '#111827';

    // Unique gradient ID to avoid conflicts if multiple charts
    const gradientId = useMemo(() => `color-${dataKey}-${Math.random().toString(36).substr(2, 9)}`, [dataKey]);

    return (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-3 xl:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 xl:mb-4">
                <h3 className="font-bold text-xs xl:text-sm text-gray-900 dark:text-white">{title}</h3>
            </div>
            <div className="h-[180px] xl:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10 }} />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: tickColor, fontSize: 10 }}
                            tickFormatter={(val) => {
                                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                                return val;
                            }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipText }}
                            formatter={(value: number | string | undefined) => [valueFormatter(Number(value || 0)), tooltipLabel]}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
