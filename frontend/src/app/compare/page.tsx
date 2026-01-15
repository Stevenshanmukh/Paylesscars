'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { DealBadge } from '@/components/ui/deal-badge';
import { PriceComparisonBar } from '@/components/ui/price-comparison-bar';
import { calculateDealRating } from '@/lib/design-tokens';
import { formatPrice } from '@/lib/utils/formatters';
import { vehicleApi } from '@/lib/api/vehicles';
import type { Vehicle } from '@/lib/types/vehicle';
import { ArrowLeft, GitCompare, X, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to generate market data
function getMarketData(askingPrice: number) {
    const variance = askingPrice * 0.15;
    return {
        marketLow: Math.round(askingPrice - variance),
        marketHigh: Math.round(askingPrice + variance * 0.5),
        marketAverage: Math.round(askingPrice - variance * 0.2),
    };
}

// Comparison specs
const comparisonSpecs = [
    { key: 'price', label: 'Price', highlight: true },
    { key: 'year', label: 'Year' },
    { key: 'mileage', label: 'Mileage' },
    { key: 'bodyType', label: 'Body Type' },
    { key: 'exteriorColor', label: 'Exterior Color' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'drivetrain', label: 'Drivetrain' },
    { key: 'fuelType', label: 'Fuel Type' },
    { key: 'engine', label: 'Engine' },
    { key: 'mpgCity', label: 'MPG City' },
    { key: 'mpgHighway', label: 'MPG Highway' },
];

function getSpecValue(vehicle: Vehicle, specKey: string): string {
    switch (specKey) {
        case 'price':
            return formatPrice(vehicle.asking_price);
        case 'year':
            return String(vehicle.year);
        case 'mileage':
            return vehicle.specifications?.mileage
                ? `${Number(vehicle.specifications.mileage).toLocaleString()} mi`
                : 'N/A';
        case 'bodyType':
            return String(vehicle.body_type || 'N/A');
        case 'exteriorColor':
            return String(vehicle.exterior_color || 'N/A');
        case 'transmission':
            return String(vehicle.specifications?.transmission || 'N/A');
        case 'drivetrain':
            return String(vehicle.specifications?.drivetrain || 'N/A');
        case 'fuelType':
            return String(vehicle.specifications?.fuel_type || 'N/A');
        case 'engine':
            return String(vehicle.specifications?.engine || 'N/A');
        case 'mpgCity':
            return vehicle.specifications?.mpg_city ? String(vehicle.specifications.mpg_city) : 'N/A';
        case 'mpgHighway':
            return vehicle.specifications?.mpg_highway ? String(vehicle.specifications.mpg_highway) : 'N/A';
        default:
            return 'N/A';
    }
}

function CompareContent() {
    const searchParams = useSearchParams();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const idsParam = searchParams.get('ids') || '';

    useEffect(() => {
        const vehicleIds = idsParam.split(',').filter(Boolean);

        const fetchVehicles = async () => {
            if (vehicleIds.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const vehiclePromises = vehicleIds.map((id) => vehicleApi.get(id));
                const results = await Promise.allSettled(vehiclePromises);

                const fetchedVehicles: Vehicle[] = [];
                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        fetchedVehicles.push(result.value);
                    }
                });

                setVehicles(fetchedVehicles);
            } catch (err) {
                console.error('Failed to fetch vehicles:', err);
                setError('Failed to load vehicles for comparison');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVehicles();
    }, [idsParam]);

    const vehicleIds = idsParam.split(',').filter(Boolean);

    const removeVehicle = (id: string) => {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
    };

    if (isLoading) {
        return (
            <PageContainer>
                <div className="mb-8">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-80 rounded-xl" />
                    ))}
                </div>
            </PageContainer>
        );
    }

    if (vehicleIds.length === 0 || vehicles.length === 0) {
        return (
            <PageContainer>
                <EmptyState
                    icon={GitCompare}
                    title="No vehicles to compare"
                    description="Select vehicles from the browse page to compare them side by side."
                    action={{
                        label: 'Browse Vehicles',
                        onClick: () => (window.location.href = '/vehicles'),
                    }}
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/vehicles"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to vehicles
                </Link>
                <h1 className="text-3xl font-bold font-display text-foreground">
                    Compare Vehicles
                </h1>
                <p className="text-muted-foreground mt-1">
                    Side-by-side comparison of {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Unified Comparison Layout */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: `${160 + vehicles.length * 220}px` }}>
                        <colgroup>
                            <col style={{ width: '160px' }} />
                            {vehicles.map((vehicle) => (
                                <col key={vehicle.id} style={{ width: `${100 / vehicles.length}%` }} />
                            ))}
                            {vehicles.length < 4 && <col style={{ width: `${100 / (vehicles.length + 1)}%` }} />}
                        </colgroup>

                        {/* Vehicle Cards as Header */}
                        <thead>
                            <tr>
                                <th className="p-4 align-top bg-muted/30 border-b border-border">
                                    <div className="text-left">
                                        <p className="text-sm text-muted-foreground mb-2">Comparing</p>
                                        <p className="text-2xl font-bold text-foreground">{vehicles.length}</p>
                                        <p className="text-sm text-muted-foreground">vehicle{vehicles.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </th>
                                {vehicles.map((vehicle) => {
                                    const askingPrice = parseFloat(vehicle.asking_price);
                                    const marketData = getMarketData(askingPrice);
                                    const { rating } = calculateDealRating(askingPrice, marketData.marketLow, marketData.marketHigh);
                                    const primaryImage = vehicle.images?.[0]?.image || vehicle.primary_image || '/placeholder-car.jpg';

                                    return (
                                        <th key={vehicle.id} className="p-2 align-top border-b border-border">
                                            <Card className="overflow-hidden border-border group relative">
                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeVehicle(vehicle.id)}
                                                    className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>

                                                {/* Image */}
                                                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                                                    <Image
                                                        src={primaryImage}
                                                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute top-2 left-2">
                                                        <DealBadge rating={rating} size="sm" />
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <CardContent className="p-3">
                                                    <h3 className="font-semibold text-foreground text-sm leading-tight">
                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                    </h3>
                                                    <p className="text-xl font-bold text-foreground mt-1 price">
                                                        {formatPrice(vehicle.asking_price)}
                                                    </p>
                                                    <div className="mt-2">
                                                        <PriceComparisonBar
                                                            askingPrice={askingPrice}
                                                            marketLow={marketData.marketLow}
                                                            marketHigh={marketData.marketHigh}
                                                            size="sm"
                                                            showLabels={false}
                                                        />
                                                    </div>
                                                    <Link href={`/vehicles/${vehicle.id}`} className="block mt-3">
                                                        <Button className="w-full" variant="primary" size="sm">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                </CardContent>
                                            </Card>
                                        </th>
                                    );
                                })}

                                {/* Add More Card */}
                                {vehicles.length < 4 && (
                                    <th className="p-2 align-top border-b border-border">
                                        <Link href={`/vehicles?compareIds=${vehicles.map(v => v.id).join(',')}`} className="block h-full">
                                            <Card className="h-full min-h-[200px] border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 transition-colors flex items-center justify-center cursor-pointer">
                                                <div className="text-center p-4">
                                                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <GitCompare className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <p className="font-medium text-muted-foreground text-sm">Add Vehicle</p>
                                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                                        Compare up to 4
                                                    </p>
                                                </div>
                                            </Card>
                                        </Link>
                                    </th>
                                )}
                            </tr>

                            {/* Specifications Header */}
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="text-left p-4 font-semibold text-foreground" colSpan={vehicles.length + (vehicles.length < 4 ? 2 : 1)}>
                                    Specifications Comparison
                                </th>
                            </tr>

                            {/* Column Labels */}
                            <tr className="border-b border-border">
                                <th className="text-left p-3 font-medium text-muted-foreground bg-muted/30 text-sm">
                                    Feature
                                </th>
                                {vehicles.map((vehicle) => (
                                    <th key={vehicle.id} className="p-3 text-center font-medium text-primary text-sm">
                                        {vehicle.year} {vehicle.make}
                                    </th>
                                ))}
                                {vehicles.length < 4 && <th className="p-3 bg-muted/10"></th>}
                            </tr>
                        </thead>

                        <tbody>
                            {comparisonSpecs.map((spec) => (
                                <tr
                                    key={spec.key}
                                    className={cn(
                                        'border-b border-border/50 transition-colors hover:bg-muted/30',
                                        spec.highlight && 'bg-primary/5'
                                    )}
                                >
                                    <td className="p-3 font-medium text-muted-foreground bg-muted/30 text-sm">
                                        {spec.label}
                                    </td>
                                    {vehicles.map((vehicle) => {
                                        const value = getSpecValue(vehicle, spec.key);
                                        return (
                                            <td
                                                key={vehicle.id}
                                                className={cn(
                                                    'p-3 text-center',
                                                    spec.highlight ? 'font-bold text-lg text-foreground' : 'text-foreground',
                                                    value === 'N/A' && 'text-muted-foreground'
                                                )}
                                            >
                                                {value}
                                            </td>
                                        );
                                    })}
                                    {vehicles.length < 4 && <td className="p-3 bg-muted/10"></td>}
                                </tr>
                            ))}

                            {/* Features Row */}
                            <tr className="border-b border-border/50">
                                <td className="p-3 font-medium text-muted-foreground bg-muted/30 align-top text-sm">
                                    Features
                                </td>
                                {vehicles.map((vehicle) => (
                                    <td key={vehicle.id} className="p-3">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {vehicle.features?.slice(0, 4).map((feature, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {feature}
                                                </Badge>
                                            ))}
                                            {vehicle.features && vehicle.features.length > 4 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{vehicle.features.length - 4}
                                                </Badge>
                                            )}
                                            {(!vehicle.features || vehicle.features.length === 0) && (
                                                <span className="text-muted-foreground text-sm">N/A</span>
                                            )}
                                        </div>
                                    </td>
                                ))}
                                {vehicles.length < 4 && <td className="p-3 bg-muted/10"></td>}
                            </tr>

                            {/* Dealer Info Row */}
                            <tr>
                                <td className="p-3 font-medium text-muted-foreground bg-muted/30 text-sm">
                                    Dealer
                                </td>
                                {vehicles.map((vehicle) => (
                                    <td key={vehicle.id} className="p-3 text-center">
                                        <p className="font-medium text-foreground text-sm">
                                            {vehicle.dealer?.business_name || 'N/A'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {vehicle.dealer ? `${vehicle.dealer.city}, ${vehicle.dealer.state}` : ''}
                                        </p>
                                    </td>
                                ))}
                                {vehicles.length < 4 && <td className="p-3 bg-muted/10"></td>}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Bottom Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/vehicles?compareIds=${vehicles.map(v => v.id).join(',')}`}>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Add More Vehicles
                    </Button>
                </Link>
            </div>
        </PageContainer>
    );
}

export default function ComparePage() {
    return (
        <Suspense
            fallback={
                <PageContainer>
                    <div className="mb-8">
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-80 rounded-xl" />
                        ))}
                    </div>
                </PageContainer>
            }
        >
            <CompareContent />
        </Suspense>
    );
}
