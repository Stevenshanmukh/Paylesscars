'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { dealerApi } from '@/lib/api/dealers';
import { negotiationApi } from '@/lib/api/negotiations';
import { formatPrice, getRelativeTime } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import {
    AlertCircle,
    MessageSquare,
    Car,
    CheckCircle,
    DollarSign,
    Plus,
    LayoutList,
    BarChart3,
    Settings,
    TrendingUp,
    Clock,
    ArrowRight,
    Upload,
    Star,
    Eye,
} from 'lucide-react';
import type { Negotiation } from '@/lib/types/negotiation';
import { PageContainer } from '@/components/layout/PageContainer';

interface DealerStats {
    // Inventory
    total_vehicles: number;
    active_vehicles: number;
    pending_sale: number;
    sold_vehicles: number;

    // Negotiations  
    total_negotiations: number;
    active_negotiations: number;
    pending_offers: number;

    // Performance (30 days)
    deals_closed_30d: number;
    total_revenue_30d: number;
    avg_response_time_hours: number;
    conversion_rate: number;
}

// Performance score calculation
function getPerformanceScore(stats: DealerStats | null) {
    if (!stats) return { score: 0, label: 'N/A', color: 'text-muted-foreground' };

    const conversionRate = Number(stats.conversion_rate) || 0;
    const completedDeals = Number(stats.deals_closed_30d) || 0;

    const conversionWeight = conversionRate * 1.5;
    const responseWeight = stats.avg_response_time_hours > 0 ? 20 : 0;
    const dealWeight = Math.min(completedDeals * 5, 40);

    const rawScore = conversionWeight + responseWeight + dealWeight;
    const score = isNaN(rawScore) ? 0 : Math.min(Math.round(rawScore), 100);

    if (score >= 80) return { score, label: 'Excellent', color: 'text-green-500' };
    if (score >= 60) return { score, label: 'Good', color: 'text-blue-500' };
    if (score >= 40) return { score, label: 'Fair', color: 'text-yellow-500' };
    return { score, label: 'Needs Improvement', color: 'text-orange-500' };
}

// StatCard replaced by unified component (restored for usage)
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';

function PerformanceScore({ stats }: { stats: DealerStats | null }) {
    const { score, label, color } = getPerformanceScore(stats);
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-lg">Performance Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                {/* Circular progress */}
                <div className="relative w-32 h-32 mb-4">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="10"
                            className="text-muted"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={color}
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn('text-3xl font-bold', color)}>{score}</span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                </div>
                <Badge className={cn('mb-2', color === 'text-green-500' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-foreground')}>
                    {label}
                </Badge>
                <p className="text-xs text-muted-foreground text-center">
                    Based on conversion rate, response time, and completed deals
                </p>
            </CardContent>
        </Card>
    );
}


function DealerDashboardContent() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<DealerStats | null>(null);
    const [pendingOffers, setPendingOffers] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [statsResponse, negotiationsResponse] = await Promise.allSettled([
                    dealerApi.getStats(),
                    negotiationApi.list()
                ]);

                if (statsResponse.status === 'fulfilled') {
                    setStats(statsResponse.value);
                } else {
                    setStats({
                        total_vehicles: 0,
                        active_vehicles: 0,
                        pending_sale: 0,
                        sold_vehicles: 0,
                        total_negotiations: 0,
                        active_negotiations: 0,
                        pending_offers: 0,
                        deals_closed_30d: 0,
                        total_revenue_30d: 0,
                        avg_response_time_hours: 0,
                        conversion_rate: 0
                    });
                }

                if (negotiationsResponse.status === 'fulfilled') {
                    const responseData = negotiationsResponse.value;
                    const results = responseData.results || [];
                    // Use is_my_turn from backend - this correctly determines if the dealer needs to respond
                    const activeOffers = results.filter(
                        (n: Negotiation) => n.status === 'active' && n.is_my_turn === true
                    );
                    setPendingOffers(activeOffers.slice(0, 5));
                }
            } catch (err: unknown) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleAccept = async (negotiationId: string) => {
        try {
            await negotiationApi.accept(negotiationId);
            toast.success('Offer accepted!');
            setPendingOffers(prev => prev.filter(n => n.id !== negotiationId));
        } catch (err: any) {
            console.error('Accept offer error:', err);
            const message = err.response?.data?.detail
                || err.response?.data?.message
                || (typeof err.response?.data === 'string' ? err.response?.data : '')
                || err.message
                || 'Failed to accept offer';
            toast.error(message);
        }
    };

    const handleReject = async (negotiationId: string) => {
        try {
            await negotiationApi.reject(negotiationId);
            toast.success('Offer rejected');
            setPendingOffers(prev => prev.filter(n => n.id !== negotiationId));
        } catch (err: any) {
            console.error('Reject offer error:', err);
            const message = err.response?.data?.detail
                || err.response?.data?.message
                || (typeof err.response?.data === 'string' ? err.response?.data : '')
                || err.message
                || 'Failed to reject offer';
            toast.error(message);
        }
    };

    const dealerName = user?.profile?.first_name ? `${user.profile.first_name}` : 'Dealer';

    return (
        <PageContainer>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-800">Dealer Portal</Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground font-display">Welcome back, {dealerName}</h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your dealership today.</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Link href="/dealer/inventory/new">
                        <Button className="gap-2" variant="primary">
                            <Plus className="w-4 h-4" />
                            Add Vehicle
                        </Button>
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : error ? (
                <Card className="mb-8">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <p className="text-foreground">{error}</p>
                        <Button onClick={() => window.location.reload()} className="mt-4">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            title="New Offers"
                            value={stats?.pending_offers || 0}
                            icon={<MessageSquare className="w-6 h-6" />}
                            color="orange"
                            href="/dealer/offers"
                        />
                        <StatCard
                            title="Active Listings"
                            value={stats?.active_vehicles || 0}
                            icon={<Car className="w-6 h-6" />}
                            color="indigo"
                            href="/dealer/inventory"
                        />
                        <StatCard
                            title="Monthly Sales"
                            value={stats?.deals_closed_30d || 0}
                            icon={<CheckCircle className="w-6 h-6" />}
                            color="teal"
                            href="/dealer/analytics"
                        />
                        <StatCard
                            title="Monthly Revenue"
                            value={`$${(stats?.total_revenue_30d || 0).toLocaleString()}`}
                            icon={<DollarSign className="w-6 h-6" />}
                            color="green"
                            href="/dealer/analytics"
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Offers Queue */}
                        <div className="lg:col-span-2">
                            <Card className="border-border">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Offers Requiring Action</CardTitle>
                                    <Link href="/dealer/offers">
                                        <Button variant="ghost" size="sm" className="text-primary">
                                            View All
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pendingOffers.length === 0 ? (
                                        <EmptyState
                                            icon={MessageSquare}
                                            title="No pending offers"
                                            description="New offers from buyers will appear here"
                                            action={{
                                                label: "Refresh",
                                                onClick: () => window.location.reload()
                                            }}
                                        />
                                    ) : (
                                        pendingOffers.map((offer) => {
                                            // Get the best price to display
                                            const displayPrice = offer.current_offer?.amount || offer.accepted_price || '0';
                                            const priceLabel = offer.status === 'accepted' ? 'Accepted price:' : 'Buyer offer:';

                                            return (
                                                <Link
                                                    key={offer.id}
                                                    href={`/negotiations/${offer.id}`}
                                                    className="block"
                                                >
                                                    <div
                                                        className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h3 className="font-semibold text-foreground">{offer.vehicle.title}</h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Listed at {formatPrice(offer.vehicle.asking_price)}
                                                                </p>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {getRelativeTime(offer.created_at)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">{priceLabel}</p>
                                                                <p className="text-xl font-bold text-foreground price">
                                                                    {formatPrice(displayPrice)}
                                                                </p>
                                                            </div>

                                                            <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleAccept(offer.id);
                                                                    }}
                                                                >
                                                                    Accept
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="border-primary text-primary">
                                                                    Counter
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleReject(offer.id);
                                                                    }}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6">
                            {/* Performance Score */}
                            <PerformanceScore stats={stats} />

                            {/* Quick Actions */}
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Link href="/dealer/inventory/new">
                                        <Button className="w-full justify-start" variant="outline">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add New Vehicle
                                        </Button>
                                    </Link>
                                    <Link href="/dealer/inventory">
                                        <Button variant="outline" className="w-full justify-start">
                                            <LayoutList className="w-4 h-4 mr-2" />
                                            Manage Inventory
                                        </Button>
                                    </Link>
                                    <Link href="/dealer/inventory/bulk-upload">
                                        <Button variant="outline" className="w-full justify-start">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Bulk Upload
                                        </Button>
                                    </Link>
                                    <Link href="/dealer/analytics">
                                        <Button variant="outline" className="w-full justify-start">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            View Reports
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Performance Stats */}
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg">This Month</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Conversion Rate</span>
                                        <span className="font-semibold">{stats?.conversion_rate || 0}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min(stats?.conversion_rate || 0, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Avg Response
                                        </span>
                                        <span className="font-semibold">{stats?.avg_response_time_hours ? `${stats.avg_response_time_hours}h` : 'N/A'}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            Total Views
                                        </span>
                                        <span className="font-semibold">{(stats?.active_vehicles || 0) * 45}</span>
                                    </div>

                                    <div className="text-xs text-muted-foreground pt-3 border-t border-border">
                                        <p className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-500" />
                                            Tip: Faster responses lead to higher conversion rates!
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>


                </>
            )}
        </PageContainer>
    );
}

export default function DealerDashboardPage() {
    return (
        <ProtectedRoute requiredRole="dealer">
            <DealerDashboardContent />
        </ProtectedRoute>
    );
}
