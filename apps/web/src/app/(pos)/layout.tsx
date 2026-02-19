/**
 * POS Layout - Fullscreen layout without sidebar
 */
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'OMDEN - Kasir',
    description: 'Point of Sale System',
};

import { ShiftManager } from '@/components/pos/ShiftManager';
import { NotificationProvider } from '@/context/NotificationContext';

export default function POSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NotificationProvider>
            <div className="min-h-screen bg-background">
                <ShiftManager />
                {children}
            </div>
        </NotificationProvider>
    );
}
