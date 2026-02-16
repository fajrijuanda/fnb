'use client';

import { useEffect } from 'react';
import { useShiftStore } from '@/store/useShiftStore';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { OpenShiftModal } from './OpenShiftModal';

export function ShiftManager() {
    useInactivityLogout(); // Enable inactivity logout for POS
    const { fetchCurrentShift, activeShift, isLoading } = useShiftStore();

    useEffect(() => {
        fetchCurrentShift();
    }, [fetchCurrentShift]);

    if (isLoading) return null; // Or a small loader

    // If no active shift, show the modal
    if (!activeShift) {
        return <OpenShiftModal />;
    }

    return null; // Logic handled, shift is open
}
