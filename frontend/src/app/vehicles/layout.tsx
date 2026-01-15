import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Browse New Cars | Payless Cars',
    description: 'Find your perfect new vehicle from our extensive inventory. Compare prices, negotiate deals, and buy with confidence.',
    keywords: ['buy car', 'new cars', 'car deals', 'vehicle search', 'auto marketplace'],
    openGraph: {
        title: 'Browse New Cars | Payless Cars',
        description: 'Find your perfect new vehicle from our extensive inventory.',
        type: 'website',
    },
};

export default function VehiclesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
