'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';

import { CounterOfferModal } from '@/components/negotiations/CounterOfferModal';
import { useNegotiationStore } from '@/store/negotiationStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDate, getRelativeTime } from '@/lib/utils/formatters';
import type { Negotiation, Offer, NegotiationStatus } from '@/lib/types/negotiation';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, Clock, MessageSquare, CheckCircle } from 'lucide-react';

function getStatusBadge(status: NegotiationStatus) {
    const styles: Record<NegotiationStatus, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
        active: { variant: 'default' },
        accepted: { variant: 'secondary' },
        rejected: { variant: 'destructive' },
        expired: { variant: 'outline' },
        cancelled: { variant: 'destructive' },
        completed: { variant: 'secondary' },
    };

    const style = styles[status];
    return <Badge variant={style.variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function NegotiationTimeline({ offers }: { offers: Offer[] }) {
    return (
        <div className="space-y-4">
            {offers.map((offer) => {
                const isBuyer = offer.offered_by === 'buyer';
                const isPending = offer.status === 'pending';

                return (
                    <div key={offer.id} className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-md ${isBuyer ? 'mr-12' : 'ml-12'}`}>
                            <div className={`rounded-lg p-4 ${isBuyer
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-green-500/10 border border-green-500/20'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium ${isBuyer ? 'text-primary' : 'text-green-500'}`}>
                                        {isBuyer ? 'Buyer' : 'Dealer'}
                                    </span>
                                    {isPending && (
                                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                            Pending Response
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-foreground mb-2">
                                    {formatPrice(offer.amount)}
                                </p>
                                {offer.message && (
                                    <p className="text-sm text-muted-foreground mb-2">"{offer.message}"</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {getRelativeTime(offer.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ExpirationTimer({ expiresAt }: { expiresAt: string }) {
    const expiresDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiresDate.getTime() - now.getTime();

    if (diffMs <= 0) {
        return <span className="text-destructive">Expired</span>;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return (
        <span className={hours < 12 ? 'text-orange-500' : 'text-muted-foreground'}>
            {hours}h {minutes}m remaining
        </span>
    );
}

function NegotiationDetailContent() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { currentNegotiation, isLoading, error, fetchNegotiation, acceptOffer, rejectNegotiation, cancelNegotiation } = useNegotiationStore();
    const [showCounterModal, setShowCounterModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchNegotiation(params.id as string);
        }
    }, [params.id, fetchNegotiation]);

    const handleAccept = async () => {
        if (!currentNegotiation) return;
        try {
            setActionLoading('accept');
            await acceptOffer(currentNegotiation.id);
            toast.success('🎉 Offer accepted! Deal confirmed.');
        } catch (err: any) {
            toast.error(err.message || 'Failed to accept offer');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!currentNegotiation) return;
        try {
            setActionLoading('reject');
            await rejectNegotiation(currentNegotiation.id);
            toast.success('Negotiation rejected');
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!currentNegotiation) return;
        try {
            setActionLoading('cancel');
            await cancelNegotiation(currentNegotiation.id);
            toast.success('Negotiation cancelled');
            router.push('/negotiations');
        } catch (err: any) {
            toast.error(err.message || 'Failed to cancel');
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <header className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
                    <div className="container mx-auto px-4 py-4">
                        <Skeleton className="h-6 w-48" />
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-24 rounded-lg" />
                            <Skeleton className="h-64 rounded-lg" />
                        </div>
                        <Skeleton className="h-48 rounded-lg" />
                    </div>
                </main>
            </div>
        );
    }

    if (error || !currentNegotiation) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <header className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
                    <div className="container mx-auto px-4 py-4">
                        <Link href="/negotiations" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Negotiations
                        </Link>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-16 text-center">
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">{error || 'Negotiation not found'}</h1>
                    <Button onClick={() => router.push('/negotiations')} variant="primary" className="mt-4">
                        Back to Negotiations
                    </Button>
                </main>
            </div>
        );
    }

    const pendingOffer = currentNegotiation.offers?.find((o: Offer) => o.status === 'pending');
    const userType = user?.user_type;
    const isMyTurn = pendingOffer && ((userType === 'buyer' && pendingOffer.offered_by === 'dealer') || (userType === 'dealer' && pendingOffer.offered_by === 'buyer'));

    return (
        <div className="min-h-screen bg-background">
            <Header />
            {/* Sub-header */}
            <header className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/negotiations" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Link>
                        <span className="text-foreground font-semibold">Negotiation Details</span>
                    </div>
                    {currentNegotiation.status === 'active' && userType === 'buyer' && (
                        <Button
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={handleCancel}
                            disabled={actionLoading === 'cancel'}
                        >
                            {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Negotiation'}
                        </Button>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Vehicle Summary */}
                        <Card className="border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center text-muted-foreground overflow-hidden relative">
                                        {currentNegotiation.vehicle.primary_image ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={currentNegotiation.vehicle.primary_image}
                                                    alt={currentNegotiation.vehicle.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Link href={`/vehicles/${currentNegotiation.vehicle.id}`} className="hover:text-primary">
                                            <h2 className="text-xl font-bold text-foreground">{currentNegotiation.vehicle.title}</h2>
                                        </Link>
                                        <p className="text-muted-foreground">Asking Price: {formatPrice(currentNegotiation.vehicle.asking_price)}</p>
                                    </div>
                                    {getStatusBadge(currentNegotiation.status)}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Negotiation Timeline */}
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    Negotiation Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {currentNegotiation.offers && currentNegotiation.offers.length > 0 ? (
                                    <NegotiationTimeline offers={currentNegotiation.offers} />
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">No offers yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Actions & Info */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card className="border-border">
                            <CardContent className="p-6">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-muted-foreground mb-2">Current Offer</p>
                                    <p className="text-4xl font-bold text-foreground">
                                        {pendingOffer ? formatPrice(pendingOffer.amount) : (currentNegotiation.current_offer ? formatPrice(currentNegotiation.current_offer.amount) : '-')}
                                    </p>
                                    {pendingOffer && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            from {pendingOffer.offered_by === 'buyer' ? 'Buyer' : 'Dealer'}
                                        </p>
                                    )}
                                </div>

                                <Separator className="my-4" />

                                <div className="flex items-center justify-between text-sm mb-4">
                                    <span className="text-muted-foreground">Time Remaining</span>
                                    <ExpirationTimer expiresAt={currentNegotiation.expires_at} />
                                </div>

                                {currentNegotiation.status === 'active' && isMyTurn && (
                                    <div className="space-y-3">
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700"
                                            size="lg"
                                            onClick={handleAccept}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === 'accept' ? 'Accepting...' : `Accept ${pendingOffer ? formatPrice(pendingOffer.amount) : ''}`}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-primary text-primary hover:bg-primary/10"
                                            size="lg"
                                            onClick={() => setShowCounterModal(true)}
                                            disabled={!!actionLoading}
                                        >
                                            Counter Offer
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full text-destructive hover:bg-destructive/10"
                                            onClick={handleReject}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
                                        </Button>
                                    </div>
                                )}

                                {currentNegotiation.status === 'active' && !isMyTurn && (
                                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                                        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">Waiting for {pendingOffer?.offered_by === 'buyer' ? 'dealer' : 'buyer'} response</p>
                                    </div>
                                )}

                                {currentNegotiation.status === 'accepted' && (
                                    <div className="text-center p-4 bg-green-500/10 rounded-lg">
                                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-green-500 font-semibold">Deal Accepted!</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Final price: {formatPrice(currentNegotiation.accepted_price || '0')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Offer Summary */}
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground text-sm">Offer Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Asking Price</span>
                                    <span className="text-foreground">{formatPrice(currentNegotiation.vehicle.asking_price)}</span>
                                </div>
                                {pendingOffer && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Current Offer</span>
                                            <span className="text-foreground">{formatPrice(pendingOffer.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Potential Savings</span>
                                            <span className="text-green-500">
                                                {formatPrice(parseFloat(currentNegotiation.vehicle.asking_price) - parseFloat(pendingOffer.amount))}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Offers</span>
                                    <span className="text-foreground">{currentNegotiation.offers?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Started</span>
                                    <span className="text-foreground">{formatDate(currentNegotiation.created_at)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Counter Offer Modal */}
            {showCounterModal && currentNegotiation && (
                <CounterOfferModal
                    isOpen={showCounterModal}
                    onClose={() => setShowCounterModal(false)}
                    negotiationId={currentNegotiation.id}
                    vehicleTitle={currentNegotiation.vehicle.title}
                    askingPrice={currentNegotiation.vehicle.asking_price}
                    currentOffer={pendingOffer?.amount || currentNegotiation.current_offer?.amount || '0'}
                    myRole={userType === 'dealer' ? 'dealer' : 'buyer'}
                />
            )}
        </div>
    );
}

export default function NegotiationDetailPage() {
    return (
        <ProtectedRoute>
            <NegotiationDetailContent />
        </ProtectedRoute>
    );
}
