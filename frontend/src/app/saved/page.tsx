'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Trash2, ArrowRight, Search, AlertCircle } from 'lucide-react';
import { DealBadge } from '@/components/ui/deal-badge';
import { vehicleApi } from '@/lib/api/vehicles';
import { toast } from 'sonner';
import { type DealRating } from '@/lib/design-tokens';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { VehicleCardSkeleton } from '@/components/ui/skeleton';

interface SavedVehicleData {
    id: string;
    vehicle: {
        id: string;
        title?: string;
        make: string;
        model: string;
        year: number;
        trim?: string;
        asking_price: number | string;
        msrp: number | string;
        primary_image?: string;
        dealer?: {
            city?: string;
            state?: string;
        };
        specifications?: {
            mileage?: number;
        };
    };
    created_at: string;
}

// Calculate deal rating based on discount percentage
function calculateDealRating(asking: number, msrp: number): DealRating {
    if (msrp <= 0) return 'fair';
    const discount = ((msrp - asking) / msrp) * 100;
    if (discount >= 10) return 'great';
    if (discount >= 5) return 'good';
    if (discount >= 2) return 'fair';
    return 'high';
}

function SavedVehiclesContent() {
    const [savedVehicles, setSavedVehicles] = useState<SavedVehicleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSavedVehicles = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await vehicleApi.getSaved();
            setSavedVehicles(data as SavedVehicleData[]);
        } catch (err) {
            console.error('Failed to fetch saved vehicles:', err);
            setError('Failed to load saved vehicles');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedVehicles();
    }, []);

    const handleRemove = async (vehicleId: string) => {
        try {
            await vehicleApi.removeSaved(vehicleId);
            setSavedVehicles(prev => prev.filter(sv => sv.vehicle.id !== vehicleId));
            toast.success('Vehicle removed from saved');
        } catch (err) {
            console.error('Failed to remove vehicle:', err);
            toast.error('Failed to remove vehicle');
        }
    };

    return (
        <PageContainer>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-display text-foreground">Saved Vehicles</h1>
                <p className="text-muted-foreground mt-1">
                    {savedVehicles.length} vehicles saved
                </p>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="rounded-xl border border-border overflow-hidden bg-card">
                            <VehicleCardSkeleton />
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <ErrorState
                    title="Unable to load saved vehicles"
                    message={error}
                    onRetry={fetchSavedVehicles}
                />
            )}

            {/* Empty State */}
            {!isLoading && !error && savedVehicles.length === 0 && (
                <EmptyState
                    icon={Heart}
                    title="No saved vehicles"
                    description="When you find vehicles you like, click the heart icon to save them for later."
                    action={{
                        label: "Browse Vehicles",
                        onClick: () => window.location.href = '/vehicles'
                    }}
                />
            )}

            {/* Saved Vehicles Grid */}
            {!isLoading && !error && savedVehicles.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedVehicles.map((saved) => {
                        const vehicle = saved.vehicle;
                        const askingPrice = Number(vehicle.asking_price);
                        const msrpPrice = Number(vehicle.msrp);
                        const dealRating = calculateDealRating(askingPrice, msrpPrice);
                        const title = vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
                        const mileage = vehicle.specifications?.mileage || 0;
                        const location = vehicle.dealer
                            ? `${vehicle.dealer.city || ''}, ${vehicle.dealer.state || ''}`.replace(/^, |, $/g, '')
                            : '';

                        return (
                            <Card
                                key={saved.id}
                                className="overflow-hidden border-border hover:shadow-card-hover hover:border-primary/30 transition-all group"
                            >
                                {/* Image */}
                                <div className="relative aspect-[4/3]">
                                    {vehicle.primary_image ? (
                                        <Image
                                            src={resolveImageUrl(vehicle.primary_image) || ''}
                                            alt={title}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                            No Image
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <DealBadge rating={dealRating} />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-3 right-3 bg-background/80 hover:bg-destructive hover:text-white"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleRemove(vehicle.id);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Content */}
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {mileage > 0 ? `${mileage.toLocaleString()} mi` : 'New'}
                                        {location && ` • ${location}`}
                                    </p>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-foreground price">
                                                ${askingPrice.toLocaleString()}
                                            </p>
                                            {msrpPrice > askingPrice && (
                                                <p className="text-sm text-muted-foreground">
                                                    <span className="line-through">${msrpPrice.toLocaleString()}</span>
                                                    <span className="text-green-500 ml-2">
                                                        Save ${(msrpPrice - askingPrice).toLocaleString()}
                                                    </span>
                                                </p>
                                            )}
                                        </div>

                                        <Link href={`/vehicles/${vehicle.id}`}>
                                            <Button size="sm">
                                                View
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </PageContainer>
    );
}

export default function SavedVehiclesPage() {
    return (
        <ProtectedRoute>
            <SavedVehiclesContent />
        </ProtectedRoute>
    );
}
