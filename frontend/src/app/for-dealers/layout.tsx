import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'For Dealers | Payless Cars',
    description: 'Grow your dealership with Payless Cars. Connect with motivated buyers, streamline negotiations, and close more deals with our dealer platform.',
    keywords: ['dealer platform', 'sell cars', 'auto dealer', 'car dealership', 'dealer leads', 'automotive CRM'],
    openGraph: {
        title: 'For Dealers | Payless Cars',
        description: 'Grow your dealership with Payless Cars. Higher conversion, lower costs, faster sales.',
        type: 'website',
    },
};

export default function ForDealersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
