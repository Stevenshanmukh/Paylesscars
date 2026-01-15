'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, TrendingUp, DollarSign, Users } from 'lucide-react';

interface DealerHeroProps {
    className?: string;
}

const stats = [
    { value: '2,500+', label: 'Active Dealers' },
    { value: '40%', label: 'Higher Conversion' },
    { value: '$50K+', label: 'Avg Monthly Revenue' },
];

export function DealerHero({ className }: DealerHeroProps) {
    return (
        <section className={cn('relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden', className)}>
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950" />

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm mb-8">
                        <TrendingUp className="w-4 h-4 text-teal-400" />
                        <span>Join 2,500+ dealerships growing with Payless Cars</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                        Grow Your Dealership with{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-500">
                            Payless Cars
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                        Connect with motivated buyers, streamline negotiations, and close more deals.
                        Our platform brings qualified leads directly to your inventory.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Link href="/register?type=dealer">
                            <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-8">
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                            <Play className="w-5 h-5 mr-2" />
                            Watch Demo
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
                                <p className="text-white/60 text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </section>
    );
}

export default DealerHero;
