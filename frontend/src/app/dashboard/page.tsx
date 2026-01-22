'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn, resolveImageUrl } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/layout/PageContainer';
import { formatPrice, getRelativeTime } from '@/lib/utils/formatters';
import { negotiationApi } from '@/lib/api/negotiations';
import type { Negotiation } from '@/lib/types/negotiation';
import {
    MessageSquare,
    Clock,
    CheckCircle,
    Heart,
    Car,
    ArrowRight,
    TrendingUp,
    DollarSign,
    Eye,
    AlertCircle,
} from 'lucide-react';
import { vehicleApi } from '@/lib/api/vehicles';
import { toast } from 'sonner';

interface BuyerStats {
    active: number;
    total: number;
    accepted: number;
    pending_response: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Active' },
    accepted: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Accepted' },
    rejected: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Rejected' },
    expired: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Expired' },
};

interface SavedVehicle {
    id: string;
    vehicle: {
        id: string;
        title?: string;
        make: string;
        model: string;
        year: number;
        asking_price: number | string;
        primary_image?: string;
    };
}

function BuyerDashboardContent() {
    const router = useRouter();
    const { user } = useAuth();
    const { logout } = useAuthStore();
    const [stats, setStats] = useState<BuyerStats>({ active: 0, total: 0, accepted: 0, pending_response: 0 });
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch stats
                const statsData = await negotiationApi.getStats();
                setStats({
                    active: statsData.active || 0,
                    total: statsData.total || 0,
                    accepted: statsData.accepted || 0,
                    pending_response: 0,
                });

                // Fetch recent negotiations
                const negsData = await negotiationApi.list();
                setNegotiations((negsData.results || []).slice(0, 5));

                // Fetch saved vehicles
                const savedData = await vehicleApi.getSaved();
                setSavedVehicles((savedData as any[]).slice(0, 3)); // Show top 3
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const firstName = user?.profile?.first_name || 'there';
    const pendingCount = negotiations.filter(n => n.status === 'active' && n.current_offer?.offered_by === 'dealer').length;

    return (
        <PageContainer>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground font-display">
                        Welcome back, {firstName}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track your negotiations and find your next car.
                    </p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Link href="/vehicles">
                        <Button className="gap-2" variant="primary">
                            <Car className="w-4 h-4" />
                            Browse Cars
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Active Negotiations"
                        value={stats.active}
                        icon={<MessageSquare className="w-6 h-6" />}
                        color="indigo"
                        href="/negotiations"
                    />
                    <StatCard
                        title="Pending Responses"
                        value={stats.pending_response || pendingCount}
                        icon={<Clock className="w-6 h-6" />}
                        color="orange"
                        href="/negotiations"
                    />
                    <StatCard
                        title="Completed Deals"
                        value={stats.accepted}
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="green"
                        href="/negotiations"
                    />
                    <StatCard
                        title="Saved Vehicles"
                        value={savedVehicles.length}
                        icon={<Heart className="w-6 h-6" />}
                        color="teal"
                        href="/saved"
                    />
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Active Negotiations */}
                <div className="lg:col-span-2">
                    <Card className="border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Active Negotiations</CardTitle>
                            <Link href="/negotiations">
                                <Button variant="ghost" size="sm" className="text-primary">
                                    View All
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-24" />
                                    ))}
                                </div>
                            ) : negotiations.length === 0 ? (
                                <EmptyState
                                    icon={MessageSquare}
                                    title="No active negotiations"
                                    description="Start by browsing vehicles and making an offer"
                                    action={{
                                        label: "Browse Vehicles",
                                        onClick: () => router.push('/vehicles')
                                    }}
                                />
                            ) : (
                                <div className="space-y-4">
                                    {negotiations.map(neg => {
                                        const statusConfig = STATUS_CONFIG[neg.status] || STATUS_CONFIG['active'];
                                        const isYourTurn = neg.status === 'active' && neg.current_offer?.offered_by === 'dealer';

                                        return (
                                            <Link
                                                key={neg.id}
                                                href={`/negotiations/${neg.id}`}
                                                className="block"
                                            >
                                                <div className={cn(
                                                    'p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all',
                                                    isYourTurn && 'border-l-4 border-l-orange-500'
                                                )}>
                                                    <div className="flex items-start gap-4">
                                                        {/* Vehicle Image */}
                                                        <div className="w-20 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
                                                            <Image
                                                                src={resolveImageUrl(neg.vehicle?.primary_image) || '/placeholder-car.jpg'}
                                                                alt={neg.vehicle?.title || 'Vehicle'}
                                                                width={80}
                                                                height={56}
                                                                unoptimized
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-medium text-foreground truncate">
                                                                    {neg.vehicle?.title || 'Vehicle'}
                                                                </h3>
                                                                <Badge className={cn(statusConfig.bg, statusConfig.text, 'text-xs')}>
                                                                    {statusConfig.label}
                                                                </Badge>
                                                                {isYourTurn && (
                                                                    <Badge className="bg-orange-500/10 text-orange-500 text-xs">
                                                                        Your Turn
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <span className="text-muted-foreground">
                                                                    {neg.status === 'accepted' ? 'Accepted:' : 'Current:'} <span className={cn(
                                                                        "font-medium price",
                                                                        neg.status === 'accepted' ? "text-green-600" : "text-foreground"
                                                                    )}>
                                                                        {formatPrice(
                                                                            neg.status === 'accepted'
                                                                                ? (neg.accepted_price || 0)
                                                                                : (neg.current_offer?.amount || 0)
                                                                        )}
                                                                    </span>
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {getRelativeTime(neg.updated_at)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Saved Vehicles */}
                    <Card className="border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Saved Vehicles</CardTitle>
                            <Link href="/saved">
                                <Button variant="ghost" size="sm" className="text-primary">
                                    View All
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {savedVehicles.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">No saved vehicles yet.</p>
                            ) : (
                                savedVehicles.map(saved => {
                                    const vehicle = saved.vehicle;
                                    const title = vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
                                    const price = Number(vehicle.asking_price);

                                    return (
                                        <Link key={saved.id} href={`/vehicles/${vehicle.id}`}>
                                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0 relative">
                                                    {vehicle.primary_image ? (
                                                        <Image
                                                            src={resolveImageUrl(vehicle.primary_image) || ''}
                                                            alt={title}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                            No Img
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {title}
                                                    </p>
                                                    <p className="text-sm text-primary font-semibold price">
                                                        {formatPrice(price)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/vehicles">
                                <Button className="w-full justify-start" variant="outline">
                                    <Car className="w-4 h-4 mr-2" />
                                    Browse Vehicles
                                </Button>
                            </Link>
                            <Link href="/negotiations">
                                <Button variant="outline" className="w-full justify-start">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    My Negotiations
                                </Button>
                            </Link>
                            <Link href="/settings">
                                <Button variant="outline" className="w-full justify-start">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Profile Settings
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Tips Card */}
                    <Card className="border-border bg-primary/5">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground text-sm">Negotiation Tip</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Dealers respond faster to offers within 10-15% of asking price.
                                        Start competitive for better results!
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}

// Redirect dealers to their dashboard
function DealerRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.push('/dealer');
    }, [router]);
    return null;
}

function DashboardContent() {
    const { isBuyer, isDealer } = useAuth();

    if (isDealer) {
        return <DealerRedirect />;
    }

    return <BuyerDashboardContent />;
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
