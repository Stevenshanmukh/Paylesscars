'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

interface DealerPricingProps {
    className?: string;
}

const plans = [
    {
        name: 'Starter',
        description: 'Perfect for small dealerships just getting started',
        price: 199,
        period: '/month',
        features: [
            'Up to 25 active listings',
            'Basic analytics dashboard',
            'Email support',
            'Standard listing placement',
            'Offer management',
        ],
        cta: 'Start Free Trial',
        highlighted: false,
    },
    {
        name: 'Professional',
        description: 'Most popular for growing dealerships',
        price: 499,
        period: '/month',
        features: [
            'Up to 100 active listings',
            'Advanced analytics & reporting',
            'Priority email & phone support',
            'Featured listing placement',
            'Bulk upload & DMS sync',
            'Custom branding',
            'Lead prioritization',
        ],
        cta: 'Start Free Trial',
        highlighted: true,
        badge: 'Most Popular',
    },
    {
        name: 'Enterprise',
        description: 'For large dealerships and dealer groups',
        price: 'Custom',
        period: '',
        features: [
            'Unlimited listings',
            'Custom analytics & API access',
            'Dedicated account manager',
            'Premium listing placement',
            'White-label options',
            'Multi-location management',
            'Custom integrations',
            'SLA guarantees',
        ],
        cta: 'Contact Sales',
        highlighted: false,
    },
];

export function DealerPricing({ className }: DealerPricingProps) {
    return (
        <section className={cn('py-20 bg-muted/30', className)}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Choose the plan that fits your dealership. All plans include a 14-day free trial.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                'relative rounded-2xl p-8 transition-all',
                                plan.highlighted
                                    ? 'bg-card border-2 border-primary shadow-lg scale-105'
                                    : 'bg-card border border-border hover:shadow-card-hover'
                            )}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4">
                                    <Star className="w-3 h-3 mr-1" />
                                    {plan.badge}
                                </Badge>
                            )}

                            {/* Plan Name */}
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                {plan.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                {plan.description}
                            </p>

                            {/* Price */}
                            <div className="mb-6">
                                {typeof plan.price === 'number' ? (
                                    <>
                                        <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                                        <span className="text-muted-foreground">{plan.period}</span>
                                    </>
                                ) : (
                                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-sm">
                                        <Check className={cn(
                                            'w-5 h-5 flex-shrink-0 mt-0.5',
                                            plan.highlighted ? 'text-primary' : 'text-green-500'
                                        )} />
                                        <span className="text-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Link href={plan.name === 'Enterprise' ? '/contact' : '/register?type=dealer'}>
                                <Button
                                    className={cn(
                                        'w-full',
                                        plan.highlighted
                                            ? 'bg-primary hover:bg-primary/90'
                                            : 'bg-foreground text-background hover:bg-foreground/90'
                                    )}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Trust note */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    No credit card required for trial • Cancel anytime
                </p>
            </div>
        </section>
    );
}

export default DealerPricing;
