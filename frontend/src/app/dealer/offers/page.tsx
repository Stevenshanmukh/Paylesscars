'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { negotiationApi } from '@/lib/api/negotiations';
import { formatPrice, getRelativeTime } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import {
    ArrowLeft,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    ArrowRight,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Negotiation } from '@/lib/types/negotiation';

const STATUS_TABS = [
    { value: 'all', label: 'All Offers' },
    { value: 'pending', label: 'Pending Response' },
    { value: 'active', label: 'Active' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    active: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', label: 'Active', icon: <MessageSquare className="w-4 h-4" /> },
    accepted: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Accepted', icon: <CheckCircle className="w-4 h-4" /> },
    rejected: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
    expired: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Expired', icon: <Clock className="w-4 h-4" /> },
    cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Cancelled', icon: <XCircle className="w-4 h-4" /> },
};

function DealerOffersContent() {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchNegotiations();
    }, []);

    const fetchNegotiations = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await negotiationApi.list();
            setNegotiations(response.results || []);
        } catch {
            setError('Failed to load offers');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (negotiationId: string) => {
        try {
            await negotiationApi.accept(negotiationId);
            toast.success('Offer accepted!');
            fetchNegotiations();
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error.message || 'Failed to accept offer');
        }
    };

    const handleReject = async (negotiationId: string) => {
        try {
            await negotiationApi.reject(negotiationId);
            toast.success('Offer rejected');
            fetchNegotiations();
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error.message || 'Failed to reject offer');
        }
    };

    const filteredNegotiations = negotiations.filter(n => {
        if (filter === 'all') return true;
        // Use is_my_turn from backend for pending filter
        if (filter === 'pending') return n.status === 'active' && n.is_my_turn === true;
        return n.status === filter;
    });

    const pendingCount = negotiations.filter(n => n.status === 'active' && n.is_my_turn === true).length;

    return (
        <PageContainer>
            {/* Page Header */}
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dealer" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Incoming Offers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and respond to buyer offers on your vehicles
                    </p>
                </div>
                {pendingCount > 0 && (
                    <Badge className="bg-orange-500 text-white mt-4 md:mt-0">
                        {pendingCount} Awaiting Response
                    </Badge>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 p-2 bg-muted/30 rounded-lg">
                {STATUS_TABS.map(tab => (
                    <Button
                        key={tab.value}
                        variant={filter === tab.value ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter(tab.value)}
                        className={cn(
                            filter === tab.value && 'bg-primary text-white'
                        )}
                    >
                        {tab.label}
                        {tab.value === 'pending' && pendingCount > 0 && (
                            <Badge className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center bg-white/20 text-xs">
                                {pendingCount}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <p className="text-foreground mb-4">{error}</p>
                        <Button onClick={fetchNegotiations}>Retry</Button>
                    </CardContent>
                </Card>
            )}

            {/* Offers List */}
            {!isLoading && !error && (
                <div className="space-y-4">
                    {filteredNegotiations.length === 0 ? (
                        <EmptyState
                            icon={MessageSquare}
                            title="No offers found"
                            description={filter === 'all'
                                ? 'When buyers make offers on your vehicles, they will appear here.'
                                : `No ${filter} offers at this time.`}
                        />
                    ) : (
                        filteredNegotiations.map(negotiation => {
                            const statusConfig = STATUS_CONFIG[negotiation.status] || STATUS_CONFIG['active'];
                            const isPending = negotiation.status === 'active' && negotiation.current_offer?.offered_by === 'buyer';

                            return (
                                <Card
                                    key={negotiation.id}
                                    className={cn(
                                        'border-border hover:shadow-card-hover transition-all',
                                        isPending && 'border-l-4 border-l-orange-500'
                                    )}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Vehicle Info */}
                                            <div className="flex gap-4 flex-1">
                                                {/* Vehicle Image */}
                                                <div className="w-24 h-18 bg-muted rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
                                                    <Image
                                                        src={negotiation.vehicle?.primary_image || '/placeholder-car.jpg'}
                                                        alt={negotiation.vehicle?.title || 'Vehicle'}
                                                        width={96}
                                                        height={72}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-foreground text-lg">
                                                            {negotiation.vehicle?.title || 'Vehicle'}
                                                        </h3>
                                                        <Badge className={cn(statusConfig.bg, statusConfig.text, 'flex items-center gap-1')}>
                                                            {statusConfig.icon}
                                                            {statusConfig.label}
                                                        </Badge>
                                                        {isPending && (
                                                            <Badge className="bg-orange-500/10 text-orange-500">
                                                                Your Turn
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Listed Price</p>
                                                            <p className="text-foreground font-medium price">
                                                                {formatPrice(negotiation.vehicle?.asking_price || 0)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">
                                                                {negotiation.status === 'accepted' ? 'Accepted Price' : 'Current Offer'}
                                                            </p>
                                                            <p className={cn(
                                                                "text-foreground font-bold price text-lg",
                                                                negotiation.status === 'accepted' && "text-green-600"
                                                            )}>
                                                                {formatPrice(
                                                                    negotiation.status === 'accepted'
                                                                        ? (negotiation.accepted_price || 0)
                                                                        : (negotiation.current_offer?.amount || 0)
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">
                                                                {negotiation.status === 'accepted' ? 'Buyer' : 'From'}
                                                            </p>
                                                            <p className="text-foreground font-medium">
                                                                {negotiation.buyer?.email || negotiation.current_offer?.offered_by || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Updated</p>
                                                            <p className="text-foreground font-medium">
                                                                {negotiation.updated_at ? getRelativeTime(negotiation.updated_at) : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 lg:flex-col lg:items-end">
                                                {isPending ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => handleAccept(negotiation.id)}
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Link href={`/negotiations/${negotiation.id}`}>
                                                            <Button size="sm" variant="outline" className="border-primary text-primary">
                                                                Counter
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleReject(negotiation.id)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Link href={`/negotiations/${negotiation.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            View Details
                                                            <ArrowRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}
        </PageContainer>
    );
}

export default function DealerOffersPage() {
    return (
        <ProtectedRoute requiredRole="dealer">
            <DealerOffersContent />
        </ProtectedRoute>
    );
}
