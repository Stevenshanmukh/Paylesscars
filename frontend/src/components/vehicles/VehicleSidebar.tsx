'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import type { VehicleFilters, BodyType } from '@/lib/types/vehicle';
import { Search, RotateCcw, MapPin } from 'lucide-react';
import { useDebounce } from '@/lib/hooks';

interface VehicleSidebarProps {
    filters: VehicleFilters;
    onFilterChange: (filters: VehicleFilters) => void;
    onClear: () => void;
    className?: string;
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
    'Tesla', 'Mazda', 'Subaru', 'Jeep',
];

const COLORS = [
    'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue',
    'Brown', 'Green', 'Orange', 'Yellow', 'Gold',
];

const DEAL_RATINGS = [
    { value: 'great', label: 'Great Deal', color: 'bg-green-500' },
    { value: 'good', label: 'Good Deal', color: 'bg-lime-500' },
    { value: 'fair', label: 'Fair Deal', color: 'bg-yellow-500' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i + 1);

export function VehicleSidebar({
    filters,
    onFilterChange,
    onClear,
    className,
}: VehicleSidebarProps) {
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
    const [selectedMakes, setSelectedMakes] = useState<string[]>(filters.make ? [filters.make] : []);
    const [selectedBodyTypes, setSelectedBodyTypes] = useState<BodyType[]>(filters.bodyType ? [filters.bodyType] : []);

    // Local state for search to allow debouncing
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Sync local search when prop changes (e.g. clear all)
    useEffect(() => {
        if (filters.search !== debouncedSearch) {
            setSearchTerm(filters.search || '');
        }
    }, [filters.search, debouncedSearch]);

    // Effect to trigger filter change when debounced value changes
    useEffect(() => {
        // Only trigger if actual value differs from prop (to avoid loop on sync)
        if (debouncedSearch !== filters.search) {
            onFilterChange({ ...filters, search: debouncedSearch || undefined });
        }
    }, [debouncedSearch, filters, onFilterChange]);

    const handleMakeToggle = (make: string) => {
        const newMakes = selectedMakes.includes(make)
            ? selectedMakes.filter(m => m !== make)
            : [...selectedMakes, make];
        setSelectedMakes(newMakes);
        onFilterChange({ ...filters, make: newMakes[0] }); // For now, just use first
    };

    const handleBodyTypeToggle = (type: BodyType) => {
        const newTypes = selectedBodyTypes.includes(type)
            ? selectedBodyTypes.filter(t => t !== type)
            : [...selectedBodyTypes, type];
        setSelectedBodyTypes(newTypes);
        onFilterChange({ ...filters, bodyType: newTypes[0] });
    };

    const handlePriceChange = (min: number, max: number) => {
        setPriceRange([min, max]);
        onFilterChange({ ...filters, priceMin: min, priceMax: max });
    };

    const handleYearChange = (minOrMax: 'min' | 'max', value: string) => {
        if (value === 'any') {
            if (minOrMax === 'min') {
                onFilterChange({ ...filters, yearMin: undefined });
            } else {
                onFilterChange({ ...filters, yearMax: undefined });
            }
        } else {
            const year = parseInt(value);
            if (minOrMax === 'min') {
                onFilterChange({ ...filters, yearMin: year });
            } else {
                onFilterChange({ ...filters, yearMax: year });
            }
        }
    };

    const activeFiltersCount = [
        filters.make,
        filters.bodyType,
        filters.priceMin || filters.priceMax,
        filters.yearMin || filters.yearMax,
        filters.search,
    ].filter(Boolean).length;

    return (
        <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Filters</h3>
                {activeFiltersCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Clear all
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search vehicles..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Location */}
            <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Location</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ZIP code or city"
                        className="pl-9"
                        value={filters.city || ''}
                        onChange={(e) => onFilterChange({ ...filters, city: e.target.value })}
                    />
                </div>
            </div>

            <Accordion type="multiple" defaultValue={['price', 'make', 'body-type', 'year']} className="space-y-2">
                {/* Price Range */}
                <AccordionItem value="price" className="border-border">
                    <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Price Range
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.priceMin || ''}
                                        onChange={(e) => onFilterChange({
                                            ...filters,
                                            priceMin: e.target.value ? parseInt(e.target.value) : undefined
                                        })}
                                    />
                                </div>
                                <span className="text-muted-foreground self-center">-</span>
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.priceMax || ''}
                                        onChange={(e) => onFilterChange({
                                            ...filters,
                                            priceMax: e.target.value ? parseInt(e.target.value) : undefined
                                        })}
                                    />
                                </div>
                            </div>
                            {/* Quick price buttons */}
                            <div className="flex flex-wrap gap-2">
                                {[20000, 30000, 40000, 50000].map((price) => (
                                    <Badge
                                        key={price}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-accent"
                                        onClick={() => handlePriceChange(0, price)}
                                    >
                                        Under ${(price / 1000)}K
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Make */}
                <AccordionItem value="make" className="border-border">
                    <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Make
                        {selectedMakes.length > 0 && (
                            <Badge className="ml-2 h-5 min-w-[20px] px-1.5">{selectedMakes.length}</Badge>
                        )}
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {POPULAR_MAKES.map((make) => (
                                <label
                                    key={make}
                                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedMakes.includes(make)}
                                        onChange={() => handleMakeToggle(make)}
                                        className="rounded border-border"
                                    />
                                    <span className="text-sm">{make}</span>
                                </label>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Body Type */}
                <AccordionItem value="body-type" className="border-border">
                    <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Body Type
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                        <div className="flex flex-wrap gap-2">
                            {BODY_TYPES.map((type) => (
                                <Badge
                                    key={type.value}
                                    variant={selectedBodyTypes.includes(type.value) ? 'default' : 'secondary'}
                                    className={cn(
                                        'cursor-pointer transition-colors',
                                        selectedBodyTypes.includes(type.value) && 'bg-primary'
                                    )}
                                    onClick={() => handleBodyTypeToggle(type.value)}
                                >
                                    {type.label}
                                </Badge>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Year */}
                <AccordionItem value="year" className="border-border">
                    <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Year
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                        <div className="flex gap-2">
                            <Select
                                value={filters.yearMin?.toString() || 'any'}
                                onValueChange={(v) => handleYearChange('min', v)}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Min Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    {YEARS.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.yearMax?.toString() || 'any'}
                                onValueChange={(v) => handleYearChange('max', v)}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Max Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    {YEARS.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Deal Rating */}
                <AccordionItem value="deal-rating" className="border-border">
                    <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Deal Rating
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-1">
                            {DEAL_RATINGS.map((rating) => (
                                <label
                                    key={rating.value}
                                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        className="rounded border-border"
                                    />
                                    <span className={cn('w-3 h-3 rounded-full', rating.color)} />
                                    <span className="text-sm">{rating.label}</span>
                                </label>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Color */}
                <AccordionItem value="color" className="border-border">
                    <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        Exterior Color
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color) => (
                                <Badge
                                    key={color}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-accent"
                                >
                                    {color}
                                </Badge>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

export default VehicleSidebar;
