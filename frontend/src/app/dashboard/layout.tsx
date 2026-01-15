import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard | Payless Cars',
    description: 'Manage your vehicle negotiations, saved vehicles, and account settings.',
    robots: {
        index: false, // Don't index user dashboard
    },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
