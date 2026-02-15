/**
 * POS Layout - Fullscreen layout without sidebar
 */
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'OMDEN - Kasir',
    description: 'Point of Sale System',
};

export default function POSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    );
}
