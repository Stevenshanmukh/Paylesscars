'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, Calendar, CheckCircle } from 'lucide-react';

interface DealerCTAProps {
    className?: string;
}

const benefits = [
    '14-day free trial',
    'No credit card required',
    'Cancel anytime',
    'Full feature access',
];

export function DealerCTA({ className }: DealerCTAProps) {
    return (
        <section className={cn('py-20', className)}>
            <div className="container mx-auto px-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-900 p-8 md:p-16">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
                    </div>

                    <div className="relative z-10 max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                            Ready to Sell More Cars?
                        </h2>
                        <p className="text-lg md:text-xl text-white/80 mb-8">
                            Join 2,500+ dealerships that are growing their sales with Payless Cars.
                            Start your free trial today.
                        </p>

                        {/* Benefits */}
                        <div className="flex flex-wrap justify-center gap-4 mb-10">
                            {benefits.map((benefit) => (
                                <div
                                    key={benefit}
                                    className="flex items-center gap-2 text-white/90 text-sm"
                                >
                                    <CheckCircle className="w-5 h-5 text-teal-400" />
                                    {benefit}
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/register?type=dealer">
                                <Button
                                    size="lg"
                                    className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-8"
                                >
                                    Start Free Trial
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/10 px-8"
                                >
                                    <Phone className="w-5 h-5 mr-2" />
                                    Talk to Sales
                                </Button>
                            </Link>
                        </div>

                        {/* Schedule Demo */}
                        <div className="mt-8 flex items-center justify-center gap-2 text-white/60 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>Or <a href="/demo" className="underline hover:text-white">schedule a demo</a> with our team</span>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
                </div>
            </div>
        </section>
    );
}

export default DealerCTA;
