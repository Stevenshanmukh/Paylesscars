'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestimonialsProps {
    className?: string;
}

const testimonials = [
    {
        id: 1,
        name: 'Sarah Mitchell',
        location: 'Miami, FL',
        avatar: 'SM',
        rating: 5,
        savings: 4200,
        vehicle: '2025 Honda Accord',
        quote: "Saved $4,200 on my new Accord. The negotiation process was so easy - I made an offer, the dealer countered, and we agreed on a price within hours. No dealership games!",
    },
    {
        id: 2,
        name: 'John Davidson',
        location: 'Austin, TX',
        avatar: 'JD',
        rating: 5,
        savings: 3100,
        vehicle: '2025 Toyota RAV4',
        quote: "No pressure, no hassle. Best car buying experience I've ever had. I compared offers from 3 different dealers and got an amazing price on my RAV4.",
    },
    {
        id: 3,
        name: 'Emily Chen',
        location: 'San Francisco, CA',
        avatar: 'EC',
        rating: 5,
        savings: 5800,
        vehicle: '2025 Tesla Model 3',
        quote: "As a first-time car buyer, I was nervous about negotiating. Payless Cars made it simple - I just entered my offer and let the dealers come to me.",
    },
    {
        id: 4,
        name: 'Michael Rodriguez',
        location: 'Phoenix, AZ',
        avatar: 'MR',
        rating: 5,
        savings: 6500,
        vehicle: '2025 Ford F-150',
        quote: "Saved over $6,000 on my F-150 Lariat. The price transparency was incredible - I could see exactly how my offer compared to what others paid.",
    },
    {
        id: 5,
        name: 'Lisa Thompson',
        location: 'Seattle, WA',
        avatar: 'LT',
        rating: 5,
        savings: 2900,
        vehicle: '2025 Hyundai Ioniq 6',
        quote: "Love that I could do everything online. Submitted my offer from my couch, negotiated via the app, and only went to the dealership to pick up my car.",
    },
];

/**
 * Testimonials - Customer reviews carousel
 */
export function Testimonials({ className }: TestimonialsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    // Show 3 testimonials at a time on desktop, 1 on mobile
    const visibleTestimonials = [
        testimonials[currentIndex],
        testimonials[(currentIndex + 1) % testimonials.length],
        testimonials[(currentIndex + 2) % testimonials.length],
    ];

    return (
        <section className={cn('py-20 bg-muted/30', className)}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        What Our Customers Say
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Join thousands of happy car buyers who saved money with Payless Cars.
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="relative max-w-6xl mx-auto">
                    {/* Navigation Buttons */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToPrevious}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full hidden lg:flex"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full hidden lg:flex"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>

                    {/* Cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {visibleTestimonials.map((testimonial, index) => (
                            <div
                                key={testimonial.id}
                                className={cn(
                                    'bg-card rounded-2xl p-6 border border-border shadow-card transition-all duration-500',
                                    index === 0 ? 'block' : 'hidden md:block'
                                )}
                            >
                                {/* Quote Icon */}
                                <Quote className="w-10 h-10 text-primary/20 mb-4" />

                                {/* Quote */}
                                <p className="text-foreground leading-relaxed mb-6">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>

                                {/* Savings Badge */}
                                <div className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-sm font-medium mb-6">
                                    Saved ${testimonial.savings.toLocaleString()} on {testimonial.vehicle}
                                </div>

                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                                    </div>
                                    {/* Rating */}
                                    <div className="ml-auto flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    'w-4 h-4',
                                                    i < testimonial.rating
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-300'
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Dots Navigation */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    'w-2 h-2 rounded-full transition-all',
                                    index === currentIndex
                                        ? 'bg-primary w-6'
                                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                )}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Testimonials;
