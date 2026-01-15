'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface CallToActionProps {
    className?: string;
}

const benefits = [
    'No credit card required',
    'No obligation to buy',
    'Free price comparisons',
    '100% no-pressure experience',
];

/**
 * CallToAction - Final CTA section before footer
 */
export function CallToAction({ className }: CallToActionProps) {
    return (
        <section className={cn('py-20', className)}>
            <div className="container mx-auto px-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-900 p-8 md:p-16">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Ready to Get a Great Deal on Your Next Car?
                        </h2>
                        <p className="text-lg md:text-xl text-white/80 mb-8">
                            Join 500,000+ smart car buyers who saved money by negotiating directly with dealers.
                        </p>

                        {/* Benefits */}
                        <div className="flex flex-wrap justify-center gap-4 mb-10">
                            {benefits.map((benefit) => (
                                <div
                                    key={benefit}
                                    className="flex items-center gap-2 text-white/90 text-sm"
                                >
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    {benefit}
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/vehicles">
                                <Button
                                    size="lg"
                                    className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
                                >
                                    Start Browsing Cars
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/register?type=dealer">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/10 font-semibold px-8"
                                >
                                    I&apos;m a Dealer
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Text */}
                        <p className="text-white/60 text-sm mt-8">
                            ⭐ Rated 4.8/5 by 10,000+ customers
                        </p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
                </div>
            </div>
        </section>
    );
}

export default CallToAction;
