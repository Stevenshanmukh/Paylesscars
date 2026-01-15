'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { VehicleFilters, BodyType } from '@/lib/types/vehicle';

interface VehicleFiltersProps {
    filters: VehicleFilters;
    onFilterChange: (filters: VehicleFilters) => void;
    onClear: () => void;
}

const BODY_TYPES: { value: BodyType; label: string }[] = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'truck', label: 'Truck' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'van', label: 'Van' },
    { value: 'wagon', label: 'Wagon' },
];

const POPULAR_MAKES = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz',
    'Audi', 'Lexus', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen',
];

const PRICE_RANGES = [
    { value: '0-25000', label: 'Under $25,000', min: 0, max: 25000 },
    { value: '25000-40000', label: '$25,000 - $40,000', min: 25000, max: 40000 },
    { value: '40000-60000', label: '$40,000 - $60,000', min: 40000, max: 60000 },
    { value: '60000-80000', label: '$60,000 - $80,000', min: 60000, max: 80000 },
    { value: '80000+', label: '$80,000+', min: 80000, max: undefined },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i + 1);

export function VehicleFiltersComponent({ filters, onFilterChange, onClear }: VehicleFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleMakeChange = (value: string) => {
        onFilterChange({ ...filters, make: value === 'all' ? undefined : value });
    };

    const handleBodyTypeChange = (value: string) => {
        onFilterChange({ ...filters, bodyType: value === 'all' ? undefined : value as BodyType });
    };

    const handlePriceChange = (value: string) => {
        const range = PRICE_RANGES.find(r => r.value === value);
        if (range) {
            onFilterChange({
                ...filters,
                priceMin: range.min,
                priceMax: range.max
            });
        } else {
            onFilterChange({ ...filters, priceMin: undefined, priceMax: undefined });
        }
    };

    const handleYearChange = (value: string) => {
        if (value === 'all') {
            onFilterChange({ ...filters, yearMin: undefined, yearMax: undefined });
        } else {
            const year = parseInt(value);
            onFilterChange({ ...filters, yearMin: year, yearMax: year });
        }
    };

    const activeFiltersCount = [
        filters.make,
        filters.bodyType,
        filters.priceMin || filters.priceMax,
        filters.yearMin,
    ].filter(Boolean).length;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            {/* Search Bar */}
            <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                        placeholder="Search vehicles..."
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        value={filters.search || ''}
                        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                    />
                </div>
                <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {activeFiltersCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </Button>
            </div>

            {/* Expandable Filters */}
            {isExpanded && (
                <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                    {/* Make */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Make</Label>
                        <Select value={filters.make || 'all'} onValueChange={handleMakeChange}>
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="All Makes" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">All Makes</SelectItem>
                                {POPULAR_MAKES.map(make => (
                                    <SelectItem key={make} value={make}>{make}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Body Type */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Body Type</Label>
                        <Select value={filters.bodyType || 'all'} onValueChange={handleBodyTypeChange}>
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">All Types</SelectItem>
                                {BODY_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Price Range</Label>
                        <Select
                            value={
                                filters.priceMin !== undefined
                                    ? PRICE_RANGES.find(r => r.min === filters.priceMin)?.value || 'all'
                                    : 'all'
                            }
                            onValueChange={handlePriceChange}
                        >
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="Any Price" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Any Price</SelectItem>
                                {PRICE_RANGES.map(range => (
                                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Year */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Year</Label>
                        <Select
                            value={filters.yearMin?.toString() || 'all'}
                            onValueChange={handleYearChange}
                        >
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="Any Year" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all">Any Year</SelectItem>
                                {YEARS.map(year => (
                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Active Filters & Clear */}
            {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                    <span className="text-sm text-slate-400">
                        {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="text-blue-400 hover:text-blue-300"
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
}

export default VehicleFiltersComponent;
