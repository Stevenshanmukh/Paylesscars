'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Mic } from 'lucide-react';
import { vehicleApi } from '@/lib/api/vehicles';

// Popular searches for quick access
const popularSearches = [
    { label: 'Honda Accord', href: '/vehicles?make=Honda&model=Accord' },
    { label: 'Toyota RAV4', href: '/vehicles?make=Toyota&model=RAV4' },
    { label: 'Tesla Model 3', href: '/vehicles?make=Tesla&model=Model%203' },
    { label: 'Ford F-150', href: '/vehicles?make=Ford&model=F-150' },
];

// Mock data for dropdowns
const budgets = [
    { value: 'any', label: 'Any Budget' },
    { value: '0-20000', label: 'Under $20,000' },
    { value: '20000-30000', label: '$20,000 - $30,000' },
    { value: '30000-40000', label: '$30,000 - $40,000' },
    { value: '40000-50000', label: '$40,000 - $50,000' },
    { value: '50000-75000', label: '$50,000 - $75,000' },
    { value: '75000+', label: '$75,000+' },
];

interface HeroProps {
    className?: string;
}

/**
 * Hero Section - Main landing area with search
 */
export function Hero({ className }: HeroProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMake, setSelectedMake] = useState('');
    const [selectedBudget, setSelectedBudget] = useState('');
    const [makes, setMakes] = useState<string[]>(['Any Make']);

    useEffect(() => {
        const fetchMakes = async () => {
            try {
                const data = await vehicleApi.getMakes();
                setMakes(['Any Make', ...data]);
            } catch (error) {
                console.error('Failed to fetch makes:', error);
                // Fallback to basic list if API fails
                setMakes(['Any Make', 'Honda', 'Toyota', 'Ford', 'Chevrolet', 'Nissan']);
            }
        };

        fetchMakes();
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedMake && selectedMake !== 'Any Make') params.set('make', selectedMake);
        if (selectedBudget && selectedBudget !== 'any') params.set('budget', selectedBudget);

        router.push(`/vehicles${params.toString() ? '?' + params.toString() : ''}`);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <section
            className={cn(
                'relative min-h-[600px] lg:min-h-[700px] flex items-center',
                'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
                className
            )}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-secondary/10 to-transparent" />
            </div>

            <div className="container mx-auto px-4 py-20 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-white/80">Trusted by 500,000+ car buyers</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight tracking-tight">
                        The Smarter Way to
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-500">
                            Buy a Car
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg lg:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                        Get upfront pricing and negotiate directly with dealers.
                        No haggling. No surprises. Just great deals.
                    </p>

                    {/* Search Box */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-white/10 max-w-3xl mx-auto">
                        {/* Search Input */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search by make, model, or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-12 pr-12 py-6 text-lg bg-white border-0 rounded-xl shadow-lg placeholder:text-slate-400"
                            />
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                                aria-label="Voice search"
                            >
                                <Mic className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Filter Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Select value={selectedMake} onValueChange={setSelectedMake}>
                                <SelectTrigger className="bg-white border-0 h-12">
                                    <SelectValue placeholder="Make" />
                                </SelectTrigger>
                                <SelectContent>
                                    {makes.map((make) => (
                                        <SelectItem key={make} value={make}>
                                            {make}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                                <SelectTrigger className="bg-white border-0 h-12">
                                    <SelectValue placeholder="Budget" />
                                </SelectTrigger>
                                <SelectContent>
                                    {budgets.map((budget) => (
                                        <SelectItem key={budget.value} value={budget.value}>
                                            {budget.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                size="lg"
                                onClick={handleSearch}
                                className="h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
                            >
                                <Search className="w-5 h-5 mr-2" />
                                Search Cars
                            </Button>
                        </div>
                    </div>

                    {/* Popular Searches */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                        <span className="text-sm text-slate-400">Popular:</span>
                        {popularSearches.map((search) => (
                            <Link
                                key={search.label}
                                href={search.href}
                                className="text-sm text-white/70 hover:text-white hover:underline transition-colors"
                            >
                                {search.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg
                    viewBox="0 0 1440 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0 100V60C240 20 480 0 720 20C960 40 1200 80 1440 60V100H0Z"
                        className="fill-background"
                    />
                </svg>
            </div>
        </section>
    );
}

export default Hero;
