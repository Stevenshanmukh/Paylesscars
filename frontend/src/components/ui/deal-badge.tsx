'use client';

import { cn } from '@/lib/utils';
import { type DealRating, dealRatingConfig } from '@/lib/design-tokens';

interface DealBadgeProps {
    rating: DealRating;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * DealBadge - Visual indicator for deal quality
 * 
 * Shows how good a deal is based on market analysis:
 * - Great Deal: Priced well below market average
 * - Good Deal: Priced below market average  
 * - Fair Deal: Priced at market average
 * - Above Market: Priced above market average
 * - High Price: Priced well above market average
 */
export function DealBadge({
    rating,
    showIcon = true,
    size = 'md',
    className
}: DealBadgeProps) {
    const config = dealRatingConfig[rating];

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    const iconClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap',
                config.bgColor,
                config.textColor,
                sizeClasses[size],
                className
            )}
        >
            {showIcon && <DealIcon rating={rating} className={iconClasses[size]} />}
            {config.label}
        </span>
    );
}

/**
 * DealIcon - Icon for each deal rating level
 */
function DealIcon({ rating, className }: { rating: DealRating; className?: string }) {
    const icons: Record<DealRating, React.ReactNode> = {
        great: (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        ),
        good: (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
        ),
        fair: (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
        ),
        above: (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        ),
        high: (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    };

    return <>{icons[rating]}</>;
}

/**
 * DealBadgeCompact - Smaller version for tight spaces
 */
export function DealBadgeCompact({ rating, className }: { rating: DealRating; className?: string }) {
    return <DealBadge rating={rating} showIcon={false} size="sm" className={className} />;
}

export default DealBadge;
