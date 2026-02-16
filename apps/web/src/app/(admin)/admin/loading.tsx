'use client';

export default function AdminLoading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] animation-fade-in">
            <div className="flex flex-col items-center gap-4">
                {/* Spinning Logo */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-lg shadow-primary/20">
                        <svg className="w-8 h-8 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Memuat halaman...</p>
            </div>
        </div>
    );
}
