'use client';

import { cn } from '@/lib/utils';
import { TrendingDown, Car, Users, Star } from 'lucide-react';

interface TrustIndicatorsProps {
    className?: string;
}

const stats = [
    {
        icon: TrendingDown,
        value: '$2.1B+',
        label: 'Saved by Buyers',
        color: 'text-green-500',
    },
    {
        icon: Car,
        value: '50K+',
        label: 'Vehicles Listed',
        color: 'text-primary',
    },
    {
        icon: Star,
        value: '4.8/5',
        label: 'Average Rating',
        color: 'text-yellow-500',
    },
    {
        icon: Users,
        value: '2,500+',
        label: 'Verified Dealers',
        color: 'text-teal-600',
    },
];

/**
 * TrustIndicators - Stats bar showing platform credibility
 */
export function TrustIndicators({ className }: TrustIndicatorsProps) {
    return (
        <section className={cn('py-8 bg-muted/50', className)}>
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
                    {/* Badge */}
                    <div className="flex items-center gap-2 md:pr-8 md:border-r border-border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            Trusted by <span className="text-foreground font-semibold">500,000+</span> Car Buyers
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 md:pl-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-3">
                                <div className={cn('w-10 h-10 rounded-lg bg-muted flex items-center justify-center', stat.color)}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default TrustIndicators;
