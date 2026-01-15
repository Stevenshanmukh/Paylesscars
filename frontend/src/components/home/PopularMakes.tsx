'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PopularMakesProps {
    className?: string;
}

const popularMakes = [
    { name: 'Honda', logo: '/makes/honda.svg', href: '/vehicles?make=Honda' },
    { name: 'Toyota', logo: '/makes/toyota.svg', href: '/vehicles?make=Toyota' },
    { name: 'Ford', logo: '/makes/ford.svg', href: '/vehicles?make=Ford' },
    { name: 'Tesla', logo: '/makes/tesla.svg', href: '/vehicles?make=Tesla' },
    { name: 'BMW', logo: '/makes/bmw.svg', href: '/vehicles?make=BMW' },
    { name: 'Mercedes-Benz', logo: '/makes/mercedes.svg', href: '/vehicles?make=Mercedes-Benz' },
    { name: 'Chevrolet', logo: '/makes/chevrolet.svg', href: '/vehicles?make=Chevrolet' },
    { name: 'Hyundai', logo: '/makes/hyundai.svg', href: '/vehicles?make=Hyundai' },
    { name: 'Nissan', logo: '/makes/nissan.svg', href: '/vehicles?make=Nissan' },
    { name: 'Audi', logo: '/makes/audi.svg', href: '/vehicles?make=Audi' },
    { name: 'Lexus', logo: '/makes/lexus.svg', href: '/vehicles?make=Lexus' },
    { name: 'Mazda', logo: '/makes/mazda.svg', href: '/vehicles?make=Mazda' },
];

/**
 * PopularMakes - Grid of popular car brands with links
 */
export function PopularMakes({ className }: PopularMakesProps) {
    return (
        <section className={cn('py-20 bg-background', className)}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Shop by Make
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Browse vehicles from your favorite brands
                    </p>
                </div>

                {/* Makes Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
                    {popularMakes.map((make) => (
                        <Link
                            key={make.name}
                            href={make.href}
                            className="group flex flex-col items-center justify-center p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover transition-all duration-300"
                        >
                            {/* Logo Placeholder - Using text initials since we don't have actual logos */}
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                <span className="text-xl md:text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                    {make.name.charAt(0)}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
                                {make.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default PopularMakes;
