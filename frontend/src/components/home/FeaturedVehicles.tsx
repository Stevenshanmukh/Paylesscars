'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, resolveImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DealBadge } from '@/components/ui/deal-badge';
import { type DealRating } from '@/lib/design-tokens';
import { vehicleApi } from '@/lib/api/vehicles';
import { ChevronLeft, ChevronRight, Heart, ArrowRight } from 'lucide-react';

interface FeaturedVehiclesProps {
    className?: string;
}

interface FeaturedVehicle {
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
        business_name?: string;
        city?: string;
        state?: string;
    };
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

/**
 * FeaturedVehicles - Carousel of featured car listings
 * Now fetches real data from the API
 */
export function FeaturedVehicles({ className }: FeaturedVehiclesProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [vehicles, setVehicles] = useState<FeaturedVehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                setIsLoading(true);
                const data = await vehicleApi.getFeatured();
                setVehicles(data as FeaturedVehicle[]);
            } catch (error) {
                console.error('Failed to fetch featured vehicles:', error);
                // Keep empty array - will show "no vehicles" state
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 320;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
            setTimeout(checkScroll, 300);
        }
    };

    return (
        <section className={cn('py-20 bg-muted/30', className)}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                            Featured Vehicles
                        </h2>
                        <p className="text-muted-foreground">
                            Hand-picked deals from verified dealers
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className="rounded-full"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className="rounded-full"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex gap-6 overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex-shrink-0 w-[300px]">
                                <Skeleton className="aspect-[4/3] rounded-t-xl" />
                                <div className="p-4 bg-card rounded-b-xl border border-border">
                                    <Skeleton className="h-5 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2 mb-3" />
                                    <Skeleton className="h-6 w-1/3 mb-2" />
                                    <Skeleton className="h-9 w-full mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && vehicles.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No featured vehicles available right now.</p>
                        <Link href="/vehicles">
                            <Button>Browse All Vehicles</Button>
                        </Link>
                    </div>
                )}

                {/* Carousel */}
                {!isLoading && vehicles.length > 0 && (
                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory px-4 md:px-0"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {vehicles.map((vehicle) => {
                            const askingPrice = Number(vehicle.asking_price);
                            const msrpPrice = Number(vehicle.msrp);
                            const dealRating = calculateDealRating(askingPrice, msrpPrice);
                            const title = vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

                            return (
                                <Link
                                    key={vehicle.id}
                                    href={`/vehicles/${vehicle.id}`}
                                    className="flex-shrink-0 w-[300px] snap-start"
                                >
                                    <div className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border h-full flex flex-col">
                                        {/* Image */}
                                        <div className="relative aspect-[4/3] overflow-hidden bg-muted flex-shrink-0">
                                            {vehicle.primary_image ? (
                                                <Image
                                                    src={resolveImageUrl(vehicle.primary_image) || ''}
                                                    alt={title}
                                                    fill
                                                    unoptimized
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    No Image
                                                </div>
                                            )}
                                            {/* Deal Badge */}
                                            <div className="absolute top-3 left-3">
                                                <DealBadge rating={dealRating} size="sm" />
                                            </div>
                                            {/* Save Button */}
                                            <button
                                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // Handle save
                                                }}
                                            >
                                                <Heart className="w-5 h-5 text-gray-600" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 flex flex-col flex-grow">
                                            <div className="flex-grow">
                                                {/* Title */}
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{vehicle.trim}</p>

                                                {/* Price */}
                                                <div className="mt-3 flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-foreground price">
                                                        ${askingPrice.toLocaleString()}
                                                    </span>
                                                    {msrpPrice > askingPrice && (
                                                        <span className="text-sm text-muted-foreground line-through">
                                                            ${msrpPrice.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Dealer */}
                                                {vehicle.dealer && (
                                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                                        {vehicle.dealer.business_name} • {vehicle.dealer.city}, {vehicle.dealer.state}
                                                    </p>
                                                )}
                                            </div>

                                            {/* CTA */}
                                            <Button className="w-full mt-4" size="sm">
                                                Get Price
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* View All Link */}
                <div className="text-center mt-10">
                    <Link href="/vehicles">
                        <Button variant="outline" size="lg">
                            View All Vehicles
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default FeaturedVehicles;
