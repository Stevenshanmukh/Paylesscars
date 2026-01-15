'use client';

import { memo } from 'react';
// Using native img instead of Next.js Image to bypass optimization issues
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DealBadge } from '@/components/ui/deal-badge';
import { PriceComparisonBar } from '@/components/ui/price-comparison-bar';
import { calculateDealRating, type DealRating } from '@/lib/design-tokens';
import type { Vehicle } from '@/lib/types/vehicle';
import { formatPrice, calculateDiscount } from '@/lib/utils/formatters';
import { getVehicleImageUrl, getVehicleImageAlt } from '@/lib/utils/image';
import { Heart, GitCompare, CheckCircle, Eye } from 'lucide-react';

interface VehicleCardProps {
    vehicle: Vehicle;
    variant?: 'grid' | 'list';
    onSave?: (id: string) => void;
    onCompare?: (id: string) => void;
    isSaved?: boolean;
    isComparing?: boolean;
}

// Helper to generate market data (in production, this would come from API)
function getMarketData(askingPrice: number) {
    const variance = askingPrice * 0.15;
    return {
        marketLow: Math.round(askingPrice - variance),
        marketHigh: Math.round(askingPrice + variance * 0.5),
        marketAverage: Math.round(askingPrice - variance * 0.2),
    };
}



// ... (imports)

// ...

export const VehicleCard = memo(function VehicleCard({
    vehicle,
    variant = 'grid',
    onSave,
    onCompare,
    isSaved = false,
    isComparing = false,
}: VehicleCardProps) {
    const primaryImage = getVehicleImageUrl(vehicle, 'medium');
    const askingPrice = parseFloat(vehicle.asking_price);
    const msrp = parseFloat(vehicle.msrp);
    const discount = calculateDiscount(vehicle.msrp, vehicle.asking_price);

    // Calculate deal rating
    const marketData = getMarketData(askingPrice);
    const { rating } = calculateDealRating(askingPrice, marketData.marketLow, marketData.marketHigh);
    const savings = marketData.marketAverage - askingPrice;

    if (variant === 'list') {
        return <VehicleCardList vehicle={vehicle} rating={rating} savings={savings} marketData={marketData} onSave={onSave} onCompare={onCompare} isSaved={isSaved} isComparing={isComparing} />;
    }

    return (
        <Card className="bg-card border-border overflow-hidden hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 group">
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                    src={primaryImage}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Image Count Badge */}
                {vehicle.images && vehicle.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {vehicle.images.length}
                    </div>
                )}

                {/* Deal Badge */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <DealBadge rating={rating} size="sm" />
                    {vehicle.status === 'pending_sale' && (
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5">
                            Sale Pending
                        </Badge>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
                    {/* Compare Button */}
                    {onCompare && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onCompare(vehicle.id);
                            }}
                            className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm',
                                isComparing
                                    ? 'bg-primary text-white'
                                    : 'bg-white/90 hover:bg-white text-gray-600 hover:text-primary'
                            )}
                            title="Compare"
                        >
                            <GitCompare className="w-4 h-4" />
                        </button>
                    )}

                    {/* Save Button */}
                    {onSave && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onSave(vehicle.id);
                            }}
                            className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm',
                                isSaved
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white/90 hover:bg-white text-gray-600 hover:text-red-500'
                            )}
                            title={isSaved ? 'Saved' : 'Save'}
                        >
                            <Heart className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                    )}
                </div>

                {/* Status Badge */}
                {vehicle.status === 'pending_sale' && (
                    <div className="absolute bottom-3 right-3">
                        <Badge className="bg-orange-500 text-white">Pending Sale</Badge>
                    </div>
                )}
            </div>

            <CardContent className="p-4">
                {/* Title */}
                <Link href={`/vehicles/${vehicle.id}`} className="block group/link">
                    <h3 className="font-semibold text-foreground group-hover/link:text-primary transition-colors line-clamp-1">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                </Link>
                {vehicle.trim && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{vehicle.trim}</p>
                )}

                {/* Price Section */}
                <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-foreground price">
                            {formatPrice(vehicle.asking_price)}
                        </span>
                        {msrp > askingPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(vehicle.msrp)}
                            </span>
                        )}
                    </div>

                    {/* Savings */}
                    {savings > 0 && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                            ${savings.toLocaleString()} below average
                        </p>
                    )}
                </div>

                {/* Price Comparison Bar */}
                <div className="mt-3">
                    <PriceComparisonBar
                        askingPrice={askingPrice}
                        marketLow={marketData.marketLow}
                        marketHigh={marketData.marketHigh}
                        size="sm"
                        showLabels={false}
                    />
                </div>

                {/* Dealer Info */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {vehicle.dealer.is_verified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className="line-clamp-1">{vehicle.dealer.business_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {vehicle.dealer.city}, {vehicle.dealer.state}
                    </span>
                </div>

                {/* CTA */}
                <Link href={`/vehicles/${vehicle.id}`}>
                    <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                        Get Price
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
});

// List variant for horizontal display
function VehicleCardList({
    vehicle,
    rating,
    savings,
    marketData,
    onSave,
    onCompare,
    isSaved,
    isComparing,
}: {
    vehicle: Vehicle;
    rating: DealRating;
    savings: number;
    marketData: { marketLow: number; marketHigh: number; marketAverage: number };
    onSave?: (id: string) => void;
    onCompare?: (id: string) => void;
    isSaved?: boolean;
    isComparing?: boolean;
}) {
    const primaryImage = getVehicleImageUrl(vehicle, 'medium');
    const askingPrice = parseFloat(vehicle.asking_price);
    const msrp = parseFloat(vehicle.msrp);

    return (
        <Card className="bg-card border-border overflow-hidden hover:shadow-card-hover hover:border-primary/30 transition-all duration-300">
            <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="relative w-full md:w-72 aspect-[4/3] md:aspect-auto overflow-hidden bg-muted flex-shrink-0">
                    <img
                        src={primaryImage}
                        alt={getVehicleImageAlt(vehicle)}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <DealBadge rating={rating} size="sm" />
                        {vehicle.status === 'pending_sale' && (
                            <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5">
                                Sale Pending
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Content */}
                <CardContent className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between">
                            <div>
                                <Link href={`/vehicles/${vehicle.id}`}>
                                    <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                    </h3>
                                </Link>
                                <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {onCompare && (
                                    <button
                                        onClick={() => onCompare(vehicle.id)}
                                        className={cn(
                                            'w-9 h-9 rounded-full flex items-center justify-center border transition-all',
                                            isComparing
                                                ? 'bg-primary text-white border-primary'
                                                : 'border-border text-muted-foreground hover:text-primary hover:border-primary'
                                        )}
                                    >
                                        <GitCompare className="w-4 h-4" />
                                    </button>
                                )}
                                {onSave && (
                                    <button
                                        onClick={() => onSave(vehicle.id)}
                                        className={cn(
                                            'w-9 h-9 rounded-full flex items-center justify-center border transition-all',
                                            isSaved
                                                ? 'bg-red-500 text-white border-red-500'
                                                : 'border-border text-muted-foreground hover:text-red-500 hover:border-red-500'
                                        )}
                                    >
                                        <Heart className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Specs */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary">{vehicle.body_type}</Badge>
                            <Badge variant="secondary">{vehicle.exterior_color}</Badge>
                            {vehicle.specifications?.mileage && (
                                <Badge variant="secondary">{vehicle.specifications.mileage.toLocaleString()} mi</Badge>
                            )}
                        </div>

                        {/* Price Bar */}
                        <div className="mt-4 max-w-xs">
                            <PriceComparisonBar
                                askingPrice={askingPrice}
                                marketLow={marketData.marketLow}
                                marketHigh={marketData.marketHigh}
                                size="md"
                            />
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-end justify-between mt-4">
                        {/* Dealer */}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {vehicle.dealer.is_verified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            <span>{vehicle.dealer.business_name}</span>
                            <span>•</span>
                            <span>{vehicle.dealer.city}, {vehicle.dealer.state}</span>
                        </div>

                        {/* Price & CTA */}
                        <div className="text-right">
                            <div className="flex items-baseline gap-2 justify-end">
                                <span className="text-2xl font-bold text-foreground price">
                                    {formatPrice(vehicle.asking_price)}
                                </span>
                                {msrp > askingPrice && (
                                    <span className="text-sm text-muted-foreground line-through">
                                        {formatPrice(vehicle.msrp)}
                                    </span>
                                )}
                            </div>
                            {savings > 0 && (
                                <p className="text-sm text-green-600 font-medium">
                                    ${savings.toLocaleString()} below avg
                                </p>
                            )}
                            <Link href={`/vehicles/${vehicle.id}`}>
                                <Button className="mt-2">Get Price</Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}

export default VehicleCard;
