'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    Users,
    Receipt,
    X,
    CreditCard,
    Tags
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { AIChatWidget } from '@/components/admin/ai/AIChatWidget';

interface AdminLayoutProps {
    children: ReactNode;
}

const superadminNav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Pengguna', icon: Users },
    { href: '/admin/subscriptions', label: 'Langganan', icon: CreditCard },
    { href: '/admin/products', label: 'Produk', icon: ShoppingBag },
    { href: '/admin/categories', label: 'Kategori', icon: Tags },
    { href: '/admin/inventory', label: 'Inventori', icon: Package },
    { href: '/admin/orders', label: 'Pesanan', icon: Receipt },
    { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

const mitraNav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Produk', icon: ShoppingBag },
    // Categories managed by Admin only
    { href: '/admin/inventory', label: 'Inventori', icon: Package },
    { href: '/admin/orders', label: 'Pesanan', icon: Receipt },
    { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
    { href: '/admin/cashiers', label: 'Kasir', icon: Users },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, _hasHydrated } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = user?.role === 'superadmin' ? superadminNav : mitraNav;
    const roleLabel = user?.role === 'superadmin' ? 'SUPER ADMIN' : 'MITRA';

    // Route Protection: Redirect Cashier to /cashier
    useEffect(() => {
        if (_hasHydrated && isAuthenticated && user?.role === 'cashier') {
            router.replace('/cashier');
        }
    }, [_hasHydrated, isAuthenticated, user, router]);

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex min-h-screen bg-white dark:bg-[#050505] transition-colors duration-500 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-red-700/10 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Floating Dynamic Island */}
            <aside className={`
                ${collapsed ? 'lg:w-[72px]' : 'lg:w-52 xl:w-60'} 
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                fixed top-2 bottom-2 left-2 lg:top-4 lg:bottom-4 lg:left-4
                w-[280px]
                z-50 flex flex-col transition-[width,transform] duration-300 ease-in-out transform-gpu
                bg-gradient-to-b from-[#dc2626] via-[#7f1d1d] to-[#2b0808]
                backdrop-blur-xl border border-white/10
                rounded-2xl lg:rounded-3xl shadow-2xl
            `}>
                {/* Logo */}
                <div className="h-16 lg:h-20 flex items-center justify-between px-4 shrink-0">
                    {(!collapsed || mobileMenuOpen) && (
                        <div className="flex items-center gap-3 pl-2">
                            <div className="relative h-10 w-10 lg:h-12 lg:w-12">
                                <Image
                                    src="/logo.png"
                                    alt="OMDEN Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base lg:text-lg text-white leading-none tracking-tightCaps">OMDEN</span>
                                <span className="text-[9px] lg:text-[10px] text-white/70 font-medium tracking-widest mt-0.5">{roleLabel}</span>
                            </div>
                        </div>
                    )}

                    {/* Close button for mobile */}
                    <button
                        onClick={() => mobileMenuOpen ? setMobileMenuOpen(false) : setCollapsed(!collapsed)}
                        className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 transition-colors ${collapsed && !mobileMenuOpen ? 'mx-auto' : ''}`}
                    >
                        {mobileMenuOpen ? <X size={20} /> : (collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />)}
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 space-y-1.5 lg:space-y-2 overflow-y-auto scrollbar-hide py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        const showText = !collapsed || mobileMenuOpen;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 transition-all duration-300 group relative ${!showText
                                    ? 'justify-center p-3 w-12 h-12 rounded-xl mx-auto'
                                    : 'px-3 py-2.5 lg:py-3 w-full rounded-xl lg:rounded-2xl'
                                    } ${isActive
                                        ? 'bg-white/20 text-yellow-300 shadow-lg shadow-black/20'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <div className={`relative ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`}>
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="lg:w-[22px] lg:h-[22px]" />
                                    {isActive && <div className="absolute inset-0 bg-yellow-400/20 blur-sm rounded-full" />}
                                </div>

                                {showText && <span className="font-medium lg:font-semibold text-sm tracking-wide">{item.label}</span>}

                                {isActive && showText && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 lg:p-4 mt-auto">
                    <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/10 border border-white/10 text-center transition-all ${(collapsed && !mobileMenuOpen) ? 'opacity-0 scale-90 hidden' : 'opacity-100 block'}`}>
                        <div className="w-7 lg:w-8 h-7 lg:h-8 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto mb-2">
                            <span className="text-[10px] lg:text-xs font-bold">V1</span>
                        </div>
                        <p className="text-[11px] lg:text-xs font-bold text-white">
                            OMDEN Pro
                        </p>
                        <p className="text-[9px] lg:text-[10px] text-white/50 mt-0.5">
                            © 2026 Build v1.0.0
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content - Floating Card */}
            <div
                className={`transition-[left] duration-300 ease-in-out will-change-[left] transform-gpu
                    fixed top-2 bottom-2 right-2 left-2
                    lg:top-4 lg:bottom-4 lg:right-4
                    ${collapsed ? 'lg:left-[100px]' : 'lg:left-[236px] xl:left-[268px]'}
                    rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl 
                    bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md 
                    border border-white/20 dark:border-white/5 flex flex-col z-10
                `}
            >
                <div className="absolute inset-0 overflow-auto flex flex-col">
                    <AdminNavbar onMenuClick={() => setMobileMenuOpen(true)} />
                    <main className="flex-1 p-4 lg:p-6">
                        {user?.role !== 'superadmin' && !user?.is_subscribed ? (
                            <div className="flex flex-col items-center justify-center h-full py-20">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                                    <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center shadow-2xl shadow-primary/30">
                                        <CreditCard className="h-10 w-10 text-white" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Langganan Diperlukan</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                                    Akun Anda belum memiliki langganan aktif. Hubungi Super Admin untuk mengaktifkan akses ke fitur admin.
                                </p>
                                <button
                                    onClick={() => { useAuthStore.getState().logout(); router.replace('/login'); }}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-red-600 text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    Kembali ke Login
                                </button>
                            </div>
                        ) : children}
                    </main>
                </div>

            </div>
            <AIChatWidget />
        </div >
    );
}
