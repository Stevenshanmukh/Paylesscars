'use client';

import { cn } from '@/lib/utils';
import { type DealRating, dealRatingConfig, calculateDealRating } from '@/lib/design-tokens';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface PriceComparisonBarProps {
    askingPrice: number;
    marketLow: number;
    marketHigh: number;
    msrp?: number;
    showLabels?: boolean;
    showMarker?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * PriceComparisonBar - Visual representation of price vs market range
 * 
 * Shows where the asking price falls within the market range,
 * with color gradient from green (great deal) to red (overpriced).
 */
export function PriceComparisonBar({
    askingPrice,
    marketLow,
    marketHigh,
    msrp,
    showLabels = true,
    showMarker = true,
    size = 'md',
    className,
}: PriceComparisonBarProps) {
    const { rating, percentage } = calculateDealRating(askingPrice, marketLow, marketHigh);

    // Clamp percentage between 0 and 100
    const markerPosition = Math.max(0, Math.min(100, percentage));

    const heightClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
    };

    return (
        <div className={cn('w-full', className)}>
            {/* Bar Container */}
            <div className="relative pt-6 pb-2">
                {/* Background Track */}
                <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heightClasses[size])}>
                    {/* Gradient Bar - Segmented look for professional feel */}
                    <div
                        className="w-full h-full"
                        style={{
                            background: `linear-gradient(90deg, 
                                #22c55e 0%, 
                                #22c55e 30%, 
                                #eab308 50%, 
                                #f97316 70%, 
                                #ef4444 100%)`
                        }}
                    />
                </div>

                {/* Price Marker */}
                {showMarker && (
                    <div
                        className="absolute top-1/2 -translate-y-[20%] transform -translate-x-1/2 flex flex-col items-center group cursor-help"
                        style={{ left: `${markerPosition}%` }}
                    >
                        {/* The Marker Pin */}
                        <div className="relative">
                            <div className="w-1 h-8 bg-slate-900 rounded-full shadow-sm" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px] w-4 h-4 rounded-full border-4 border-white bg-slate-900 shadow-md" />
                        </div>

                        {/* Tooltip-like label appearing on hover */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                            ${formatCompactPrice(askingPrice)}
                        </div>
                    </div>
                )}

                {/* Range Labels */}
                {showLabels && (
                    <div className="absolute top-full left-0 right-0 flex justify-between mt-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                        <span>Great Deal</span>
                        <span className="pl-8">Good</span>
                        <span className="pl-4">Fair</span>
                        <span>High</span>
                    </div>
                )}
            </div>

            {/* Price Points */}
            {showLabels && (
                <div className="flex justify-between mt-6 text-xs text-muted-foreground border-t border-border pt-3">
                    <div className="text-left">
                        <div className="mb-0.5">Market Low</div>
                        <div className="font-semibold text-slate-700">${formatCompactPrice(marketLow)}</div>
                    </div>
                    <div className="text-right">
                        <div className="mb-0.5">Market High</div>
                        <div className="font-semibold text-slate-700">${formatCompactPrice(marketHigh)}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * MarketPriceAnalysis - Full price analysis component with context
 */
export function MarketPriceAnalysis({
    askingPrice,
    marketLow,
    marketHigh,
    marketAverage,
    msrp,
    className,
}: {
    askingPrice: number;
    marketLow: number;
    marketHigh: number;
    marketAverage: number;
    msrp?: number;
    className?: string;
}) {
    const { rating } = calculateDealRating(askingPrice, marketLow, marketHigh);
    const config = dealRatingConfig[rating];
    const savings = marketAverage - askingPrice;

    // Determine status badge
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let badgeClass = "";

    if (rating === 'great' || rating === 'good') {
        badgeVariant = "default";
        badgeClass = "bg-green-100 text-green-700 hover:bg-green-100 border-green-200";
    } else if (rating === 'fair') {
        badgeVariant = "secondary";
        badgeClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
    } else {
        badgeVariant = "destructive";
        badgeClass = "bg-red-50 text-red-700 hover:bg-red-50 border-red-100";
    }

    return (
        <Card className={cn('p-6 border-border shadow-sm bg-white', className)}>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-slate-900">Price Analysis</h4>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs text-xs">Based on similar vehicles in your area (same make, model, year, trim, and approximate mileage).</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-sm text-slate-500">{config.description}</p>
                    </div>

                    <Badge variant={badgeVariant} className={cn("px-3 py-1 text-xs font-semibold border", badgeClass)}>
                        {config.label} Price
                    </Badge>
                </div>

                {/* The Gauge */}
                <div className="px-1">
                    <PriceComparisonBar
                        askingPrice={askingPrice}
                        marketLow={marketLow}
                        marketHigh={marketHigh}
                        msrp={msrp}
                        size="md"
                    />
                </div>

                {/* Data Cards Grid */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                    {/* Card 1: This Vehicle */}
                    <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">This Vehicle</div>
                        <div className="text-lg font-bold text-slate-900">
                            ${formatCompactPrice(askingPrice, 0)}
                        </div>
                    </div>

                    {/* Card 2: Market Avg */}
                    <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Market Avg</div>
                        <div className="text-lg font-bold text-slate-700">
                            ${formatCompactPrice(marketAverage, 0)}
                        </div>
                    </div>

                    {/* Card 3: Difference/Savings */}
                    <div className={cn(
                        "rounded-lg p-3 text-center border",
                        savings > 0
                            ? "bg-green-50 border-green-100"
                            : "bg-red-50 border-red-100"
                    )}>
                        <div className={cn(
                            "text-[10px] uppercase tracking-wider font-semibold mb-1",
                            savings > 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {savings > 0 ? "Potential Savings" : "Over Market"}
                        </div>
                        <div className={cn(
                            "text-lg font-bold",
                            savings > 0 ? "text-green-700" : "text-red-700"
                        )}>
                            {savings > 0 ? '-' : '+'}${formatCompactPrice(Math.abs(savings), 0)}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

/**
 * Format price in compact form (e.g., 34500 -> "34.5K") or standard with commas
 */
function formatCompactPrice(price: number, decimals = 1): string {
    if (price >= 1000000) {
        return `${(price / 1000000).toFixed(decimals)}M`;
    }
    if (price >= 10000) {
        // For prices like 55000, "55K" is cleaner than "55.0K"
        return `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : decimals)}K`;
    }
    return price.toLocaleString();
}

/**
 * PriceComparisonBarSimple - Simplified version for lists
 */
export function PriceComparisonBarSimple({
    percentage,
    rating,
    size = 'md',
    className,
}: {
    percentage: number;
    rating: DealRating;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    // ... logic remains same or can be simplified ...
    const config = dealRatingConfig[rating];
    const clampedPercentage = Math.max(5, Math.min(100, percentage));

    // Choose color based on rating directly
    let bgColor = "bg-slate-200";
    if (rating === 'great') bgColor = "bg-green-500";
    else if (rating === 'good') bgColor = "bg-green-400";
    else if (rating === 'fair') bgColor = "bg-yellow-400";
    else bgColor = "bg-red-500";

    const heightClasses = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-2.5',
    };

    return (
        <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heightClasses[size], className)}>
            <div
                className={cn('h-full rounded-full transition-all duration-500', bgColor)}
                style={{ width: `${clampedPercentage}%` }}
            />
        </div>
    );
}

export default PriceComparisonBar;
