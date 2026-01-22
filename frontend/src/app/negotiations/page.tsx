'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, resolveImageUrl } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useNegotiationStore } from '@/store/negotiationStore';
import { formatPrice, formatDate, getRelativeTime } from '@/lib/utils/formatters';
import type { NegotiationStatus } from '@/lib/types/negotiation';
import {
    AlertCircle,
    MessageSquare,
    ArrowLeft,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    Filter,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

const STATUS_CONFIG: Record<NegotiationStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    active: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Active', icon: <MessageSquare className="w-4 h-4" /> },
    accepted: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Accepted', icon: <CheckCircle className="w-4 h-4" /> },
    rejected: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
    expired: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Expired', icon: <Clock className="w-4 h-4" /> },
    cancelled: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'Cancelled', icon: <XCircle className="w-4 h-4" /> },
    completed: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
};

const STATUS_TABS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
];

function NegotiationsContent() {
    const { negotiations, isLoading, error, fetchNegotiations } = useNegotiationStore();
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNegotiations();
    }, [fetchNegotiations]);

    const filteredNegotiations = negotiations.filter(n => {
        if (filter === 'all') return true;
        return n.status === filter;
    });

    const activeCount = negotiations.filter(n => n.status === 'active').length;
    const pendingResponseCount = negotiations.filter(n => n.status === 'active' && n.current_offer?.offered_by === 'dealer').length;


    return (
        <PageContainer>



            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">My Negotiations</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage your offers with dealers
                    </p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                    {pendingResponseCount > 0 && (
                        <Badge className="bg-orange-500 text-white">
                            {pendingResponseCount} Awaiting Your Response
                        </Badge>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 p-2 bg-muted/30 rounded-lg">
                {STATUS_TABS.map(tab => (
                    <Button
                        key={tab.value}
                        variant={filter === tab.value ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter(tab.value)}
                        className={cn(filter === tab.value && 'bg-primary text-white')}
                    >
                        {tab.label}
                        {tab.value === 'active' && activeCount > 0 && (
                            <Badge className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center bg-white/20 text-xs">
                                {activeCount}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <ErrorState
                    title="Failed to load negotiations"
                    message={error}
                    onRetry={() => fetchNegotiations()}
                />
            )}

            {/* Content */}
            {!isLoading && !error && (
                <>
                    {filteredNegotiations.length === 0 ? (
                        <EmptyState
                            icon={MessageSquare}
                            title={filter === 'all' ? 'No negotiations yet' : `No ${filter} negotiations`}
                            description={filter === 'all'
                                ? 'Find a vehicle you like and make an offer to start negotiating'
                                : 'Try selecting a different filter'}
                            action={{
                                label: "Browse Vehicles",
                                onClick: () => window.location.href = '/vehicles'
                            }}
                        />
                    ) : (
                        <div className="space-y-4">
                            {filteredNegotiations.map((negotiation) => {
                                const statusConfig = STATUS_CONFIG[negotiation.status];
                                const isYourTurn = negotiation.status === 'active' && negotiation.current_offer?.offered_by === 'dealer';
                                const isActive = negotiation.status === 'active';

                                return (
                                    <Card
                                        key={negotiation.id}
                                        className={cn(
                                            'border-border hover:shadow-card-hover hover:border-primary/30 transition-all',
                                            isYourTurn && 'border-l-4 border-l-orange-500',
                                            !isActive && 'opacity-75'
                                        )}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                {/* Vehicle Info */}
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
                                                        {negotiation.vehicle.primary_image ? (
                                                            <Image
                                                                src={resolveImageUrl(negotiation.vehicle.primary_image) || ''}
                                                                alt={negotiation.vehicle.title}
                                                                width={96}
                                                                height={64}
                                                                unoptimized
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h3 className="font-semibold text-foreground">
                                                                {negotiation.vehicle.title}
                                                            </h3>
                                                            <Badge className={cn(statusConfig.bg, statusConfig.text, 'flex items-center gap-1')}>
                                                                {statusConfig.icon}
                                                                {statusConfig.label}
                                                            </Badge>
                                                            {isYourTurn && (
                                                                <Badge className="bg-orange-500/10 text-orange-500">
                                                                    Your Turn
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Listed at {formatPrice(negotiation.vehicle.asking_price)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Offer Info */}
                                                <div className="grid grid-cols-2 gap-6 text-center lg:text-right">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {negotiation.status === 'accepted'
                                                                ? 'Accepted Price'
                                                                : negotiation.current_offer?.offered_by === 'dealer'
                                                                    ? 'Dealer offered'
                                                                    : 'Your offer'}
                                                        </p>
                                                        <p className={cn(
                                                            "text-xl font-bold price",
                                                            negotiation.status === 'accepted' ? "text-green-600" : "text-foreground"
                                                        )}>
                                                            {formatPrice(
                                                                negotiation.status === 'accepted'
                                                                    ? (negotiation.accepted_price || 0)
                                                                    : (negotiation.current_offer?.amount || '0')
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {negotiation.status === 'accepted' ? 'Status' : 'Expires'}
                                                        </p>
                                                        <p className="text-foreground font-medium">
                                                            {negotiation.status === 'accepted'
                                                                ? 'Deal Complete ✓'
                                                                : getRelativeTime(negotiation.expires_at)
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/negotiations/${negotiation.id}`}>
                                                        <Button
                                                            className={cn(
                                                                isYourTurn && 'bg-orange-500 hover:bg-orange-600'
                                                            )}
                                                        >
                                                            {isYourTurn ? 'Respond' : 'View Details'}
                                                            <ArrowRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </PageContainer>
    );
}

export default function NegotiationsPage() {
    return (
        <ProtectedRoute>
            <NegotiationsContent />
        </ProtectedRoute>
    );
}
