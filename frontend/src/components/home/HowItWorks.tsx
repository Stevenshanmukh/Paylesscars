'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Search, DollarSign, MessageSquare, PartyPopper, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
    className?: string;
}

const steps = [
    {
        number: 1,
        icon: Search,
        title: 'Search',
        description: 'Browse thousands of vehicles from verified dealers in your area.',
        color: 'bg-blue-500',
    },
    {
        number: 2,
        icon: DollarSign,
        title: 'Make Offer',
        description: 'Send your offer directly to the dealer - no obligation, no pressure.',
        color: 'bg-green-500',
    },
    {
        number: 3,
        icon: MessageSquare,
        title: 'Negotiate',
        description: 'Dealers respond with accepts, counters, or new offers. You decide.',
        color: 'bg-purple-500',
    },
    {
        number: 4,
        icon: PartyPopper,
        title: 'Deal!',
        description: 'Accept the best offer and pick up your car at the dealership.',
        color: 'bg-primary',
    },
];

/**
 * HowItWorks - 4-step process explanation
 */
export function HowItWorks({ className }: HowItWorksProps) {
    return (
        <section className={cn('py-20 bg-background', className)}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        How Payless Cars Works
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Skip the dealership games. Our simple 4-step process puts you in control.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-4 gap-8 lg:gap-12 max-w-6xl mx-auto">
                    {steps.map((step, index) => (
                        <div key={step.number} className="relative">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-border via-border to-transparent -translate-x-1/2 z-0" />
                            )}

                            {/* Step Card */}
                            <div className="relative z-10 text-center group">
                                {/* Icon Circle */}
                                <div className="relative mx-auto mb-6">
                                    <div
                                        className={cn(
                                            'w-24 h-24 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110',
                                            step.color
                                        )}
                                    >
                                        <step.icon className="w-10 h-10 text-white" />
                                    </div>
                                    {/* Step Number */}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold flex items-center justify-center">
                                        {step.number}
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <Link href="/vehicles">
                        <Button size="lg" className="bg-primary hover:bg-primary/90">
                            Get Started - It&apos;s Free
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-3">
                        No credit card required. No hidden fees.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;
