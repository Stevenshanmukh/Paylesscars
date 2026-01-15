'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DealerTestimonialsProps {
    className?: string;
}

const testimonials = [
    {
        id: 1,
        name: 'Mike Thompson',
        role: 'General Manager',
        dealership: 'Thompson Auto Group',
        location: 'Dallas, TX',
        avatar: 'MT',
        rating: 5,
        quote: "Payless Cars has transformed our sales process. We're closing 40% more deals and spending less time on back-and-forth negotiations. The platform pays for itself within the first week.",
        stat: '42%',
        statLabel: 'increase in monthly sales',
    },
    {
        id: 2,
        name: 'Sarah Chen',
        role: 'Sales Director',
        dealership: 'Premier Motors',
        location: 'Miami, FL',
        avatar: 'SC',
        rating: 5,
        quote: "The quality of leads we get through Payless Cars is exceptional. These are serious buyers who are ready to close. Our team loves the streamlined workflow.",
        stat: '3x',
        statLabel: 'better lead quality',
    },
    {
        id: 3,
        name: 'James Rodriguez',
        role: 'Owner',
        dealership: 'Rodriguez Family Motors',
        location: 'Phoenix, AZ',
        avatar: 'JR',
        rating: 5,
        quote: "As a smaller dealership, we needed a way to compete with the big guys. Payless Cars levels the playing field. Our inventory is getting seen by more qualified buyers than ever.",
        stat: '$125K',
        statLabel: 'additional monthly revenue',
    },
];

export function DealerTestimonials({ className }: DealerTestimonialsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    const testimonial = testimonials[currentIndex];

    return (
        <section className={cn('py-20 bg-background', className)}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Trusted by Top Dealerships
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        See what other dealers are saying about Payless Cars
                    </p>
                </div>

                {/* Testimonial Card */}
                <div className="max-w-4xl mx-auto">
                    <div className="relative bg-card rounded-2xl border border-border p-8 md:p-12">
                        {/* Navigation */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={goToPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full hidden md:flex"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full hidden md:flex"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>

                        <div className="text-center">
                            {/* Quote Icon */}
                            <Quote className="w-12 h-12 text-primary/20 mx-auto mb-6" />

                            {/* Quote Text */}
                            <blockquote className="text-xl md:text-2xl text-foreground leading-relaxed mb-8">
                                &ldquo;{testimonial.quote}&rdquo;
                            </blockquote>

                            {/* Stat */}
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8">
                                <span className="text-xl font-bold">{testimonial.stat}</span>
                                <span className="text-sm">{testimonial.statLabel}</span>
                            </div>

                            {/* Author */}
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-lg">
                                    {testimonial.avatar}
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {testimonial.role} at {testimonial.dealership}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                                </div>
                                <div className="flex gap-0.5 ml-4">
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

                        {/* Dots Navigation */}
                        <div className="flex justify-center gap-2 mt-8 md:hidden">
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
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bottom dots for desktop */}
                    <div className="hidden md:flex justify-center gap-2 mt-6">
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
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default DealerTestimonials;
