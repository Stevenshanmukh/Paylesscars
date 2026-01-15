'use client';

import { cn } from '@/lib/utils';
import { DollarSign, Users, Shield, Clock, HandshakeIcon, Zap } from 'lucide-react';

interface ValuePropositionProps {
    className?: string;
}

const benefits = [
    {
        icon: DollarSign,
        title: 'Save Money',
        description: 'Average savings of $3,500 off MSRP on new car purchases. Our users consistently beat dealer pricing.',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
    {
        icon: HandshakeIcon,
        title: 'Direct Deals',
        description: 'Negotiate directly with dealers - no middleman, no markups. You control the conversation.',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
    },
    {
        icon: Shield,
        title: 'Verified Dealers',
        description: 'Every dealer is licensed and verified. Buy with confidence from trusted sellers.',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        icon: Users,
        title: 'Price Transparency',
        description: 'See what others paid for the same car. Make informed decisions with real market data.',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    {
        icon: Clock,
        title: 'No Pressure',
        description: 'Take your time browsing and negotiating. No salespeople following you around.',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
    {
        icon: Zap,
        title: 'Fast & Easy',
        description: 'Complete your deal online in minutes. Pick up your car when you\'re ready.',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
    },
];

/**
 * ValueProposition - Why choose Payless Cars section
 */
export function ValueProposition({ className }: ValuePropositionProps) {
    return (
        <section className={cn('py-20 bg-background', className)}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Why Payless Cars?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        We&apos;ve reimagined the car buying experience to put you in control.
                    </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                            <p className="text-muted-foreground leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ValueProposition;
