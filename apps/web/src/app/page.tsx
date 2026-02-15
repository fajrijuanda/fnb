'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Check Authentication
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/cashier'); // Default for cashier and others
      }
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
