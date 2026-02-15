'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prev + Math.random() * 15;
            });
        }, 100);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-mesh">
            {/* Logo Container */}
            <div className="relative mb-8">
                {/* Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-[#C5161D]/20 blur-2xl animate-pulse" />

                {/* Logo Circle */}
                {/* Logo Circle */}
                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[#C5161D] to-[#A01217] flex items-center justify-center shadow-2xl shadow-red-900/30 animate-bounce p-4 border-2 border-white/10 ring-1 ring-red-500/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="OMDEN" className="w-full h-full object-contain drop-shadow-md animate-pulse" />
                </div>

                {/* Spinning Ring */}
                <div className="absolute inset-0 -m-2">
                    <svg className="h-28 w-28 animate-spin" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="rgba(197, 22, 29, 0.2)"
                            strokeWidth="2"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="70 200"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#C5161D" />
                                <stop offset="100%" stopColor="#A01217" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>

            {/* Brand Name */}
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tighter">
                OMDEN
            </h1>
            <p className="text-white/60 text-sm mb-8">Memuat sistem...</p>

            {/* Progress Bar */}
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                    className="h-full bg-gradient-to-r from-[#C5161D] to-[#A01217] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>

            {/* Loading Dots */}
            <div className="flex gap-1.5 mt-6">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-[#C5161D] animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                    />
                ))}
            </div>
        </div>
    );
}

export default LoadingScreen;
