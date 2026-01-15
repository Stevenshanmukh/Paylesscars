'use client';

import { cn } from '@/lib/utils';
import {
    TrendingUp,
    Clock,
    MessageSquare,
    BarChart3,
    Shield,
    Zap,
    Users,
    DollarSign,
} from 'lucide-react';

interface DealerBenefitsProps {
    className?: string;
}

const benefits = [
    {
        icon: TrendingUp,
        title: 'Higher Conversion Rates',
        description: 'Buyers on Payless Cars are 40% more likely to complete a purchase than traditional leads.',
        stat: '40%',
        statLabel: 'higher close rate',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
    {
        icon: Clock,
        title: 'Faster Sales Cycle',
        description: 'Close deals in days, not weeks. Our negotiation platform streamlines the entire process.',
        stat: '3 days',
        statLabel: 'avg. time to close',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        icon: MessageSquare,
        title: 'Direct Communication',
        description: 'No middlemen. Negotiate directly with serious buyers through our secure messaging system.',
        stat: '100%',
        statLabel: 'transparent pricing',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    {
        icon: BarChart3,
        title: 'Real-Time Analytics',
        description: 'Track views, offers, and performance with detailed analytics and insights.',
        stat: '24/7',
        statLabel: 'performance tracking',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
    {
        icon: Shield,
        title: 'Verified Buyers',
        description: 'All buyers are verified before they can make offers. No tire-kickers.',
        stat: '95%',
        statLabel: 'buyer qualification',
        color: 'text-teal-500',
        bgColor: 'bg-teal-500/10',
    },
    {
        icon: Zap,
        title: 'Easy Inventory Management',
        description: 'Bulk upload, sync with your DMS, and manage all listings from one dashboard.',
        stat: '5 min',
        statLabel: 'to list 50 vehicles',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
    },
];

export function DealerBenefits({ className }: DealerBenefitsProps) {
    return (
        <section className={cn('py-20 bg-background', className)}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Why Dealers Love Payless Cars
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Join thousands of dealerships who are selling more cars with less hassle.
                    </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit) => (
                        <div
                            key={benefit.title}
                            className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover transition-all duration-300"
                        >
                            {/* Icon */}
                            <div
                                className={cn(
                                    'w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110',
                                    benefit.bgColor
                                )}
                            >
                                <benefit.icon className={cn('w-7 h-7', benefit.color)} />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                {benefit.title}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {benefit.description}
                            </p>

                            {/* Stat */}
                            <div className="pt-4 border-t border-border">
                                <span className={cn('text-2xl font-bold', benefit.color)}>
                                    {benefit.stat}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                    {benefit.statLabel}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default DealerBenefits;
