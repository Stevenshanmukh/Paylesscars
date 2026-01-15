'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, VehicleCardSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { VehicleSidebar } from '@/components/vehicles/VehicleSidebar';
import { useVehicleStore } from '@/store/vehicleStore';
import {
    Car,
    LayoutGrid,
    List,
    SlidersHorizontal,
    X
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest' | 'best-deal';

const sortOptions = [
    { value: 'best-deal', label: 'Best Deal' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
];

// Quick filter pills
const quickFilters = [
    { label: 'Great Deals', value: 'great-deals' },
    { label: 'Under $30K', value: 'under-30k' },
    { label: 'SUVs', value: 'suv' },
    { label: 'Trucks', value: 'truck' },
    { label: 'Electric', value: 'electric' },
    { label: 'Certified', value: 'certified' },
];

function VehiclesPageContent() {
    const {
        vehicles,
        filters,
        isLoading,
        error,
        setFilters,
        clearFilters,
        savedVehicles,
        saveVehicle,
        unsaveVehicle,
        fetchVehicles,
        fetchSavedVehicles,
    } = useVehicleStore();

    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('best-deal');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [compareList, setCompareList] = useState<string[]>([]);
    const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
    const searchParams = useSearchParams();

    // Initialize compare list from URL params (when coming from Compare page)
    useEffect(() => {
        const existingIds = searchParams.get('compareIds');
        if (existingIds) {
            setCompareList(existingIds.split(',').filter(Boolean));
        }
    }, [searchParams]);

    // Fetch vehicles on mount
    useEffect(() => {
        fetchVehicles(1);
    }, [fetchVehicles]);

    // Fetch saved vehicles only if user has a token (simple check to avoid 401 redirect)
    useEffect(() => {
        // We can check if a token exists in localStorage or use auth store
        // simpler here to just let the header handle auth state, but we need to know if we should fetch
        const token = localStorage.getItem('paylesscars_access_token');
        if (token) {
            fetchSavedVehicles();
        }
    }, [fetchSavedVehicles]);

    // Sort vehicles based on selected option
    const sortedVehicles = [...vehicles].sort((a, b) => {
        const priceA = parseFloat(String(a.asking_price)) || 0;
        const priceB = parseFloat(String(b.asking_price)) || 0;
        const msrpA = parseFloat(String(a.msrp)) || priceA;
        const msrpB = parseFloat(String(b.msrp)) || priceB;
        const discountA = msrpA > 0 ? (msrpA - priceA) / msrpA : 0;
        const discountB = msrpB > 0 ? (msrpB - priceB) / msrpB : 0;
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        switch (sortBy) {
            case 'price-asc':
                return priceA - priceB;
            case 'price-desc':
                return priceB - priceA;
            case 'newest':
                return dateB - dateA;
            case 'oldest':
                return dateA - dateB;
            case 'best-deal':
            default:
                return discountB - discountA; // Higher discount first
        }
    });

    const handleSave = (id: string) => {
        if (savedVehicles.includes(id)) {
            unsaveVehicle(id);
        } else {
            saveVehicle(id);
        }
    };

    const handleCompare = (id: string) => {
        setCompareList(prev => {
            if (prev.includes(id)) {
                return prev.filter(v => v !== id);
            }
            if (prev.length >= 4) {
                return prev; // Max 4 vehicles to compare
            }
            return [...prev, id];
        });
    };

    const toggleQuickFilter = (value: string) => {
        const isActive = activeQuickFilters.includes(value);

        // Update local state
        setActiveQuickFilters(prev => {
            if (prev.includes(value)) {
                return prev.filter(f => f !== value);
            }
            return [...prev, value];
        });

        // Apply actual filter based on quick filter value
        if (!isActive) {
            // Adding filter
            switch (value) {
                case 'under-30k':
                    setFilters({ ...filters, priceMax: 30000 });
                    break;
                case 'suv':
                    setFilters({ ...filters, bodyType: 'suv' });
                    break;
                case 'truck':
                    setFilters({ ...filters, bodyType: 'truck' });
                    break;
                case 'electric':
                    // Electric filter could use fuel_type but not supported in VehicleFilters type yet
                    // For now, just set a search term
                    setFilters({ ...filters, search: 'electric' });
                    break;
                case 'great-deals':
                case 'certified':
                    // These would need backend support - just placeholder for now
                    break;
            }
        } else {
            // Removing filter - clear the relevant filter value
            switch (value) {
                case 'under-30k':
                    setFilters({ ...filters, priceMax: undefined });
                    break;
                case 'suv':
                case 'truck':
                    setFilters({ ...filters, bodyType: undefined });
                    break;
                case 'electric':
                    setFilters({ ...filters, search: undefined });
                    break;
            }
        }
    };

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1">
                {/* Page Header */}
                <div className="bg-muted/30 border-b border-border">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                                    Browse Vehicles
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {vehicles.length > 0
                                        ? `${vehicles.length} vehicles available`
                                        : 'Find your perfect car'
                                    }
                                </p>
                            </div>

                            {/* Compare Bar */}
                            {compareList.length > 0 && (
                                <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-lg">
                                    <span className="text-sm font-medium text-primary">
                                        {compareList.length} selected
                                    </span>
                                    <Link href={`/compare?ids=${compareList.join(',')}`}>
                                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                                            Compare Now
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setCompareList([])}
                                        className="text-muted-foreground"
                                    >
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Quick Filters */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {quickFilters.map((filter) => (
                                <Badge
                                    key={filter.value}
                                    variant={activeQuickFilters.includes(filter.value) ? 'default' : 'secondary'}
                                    className={cn(
                                        'cursor-pointer px-3 py-1.5 text-sm transition-colors',
                                        activeQuickFilters.includes(filter.value)
                                            ? 'bg-primary text-white hover:bg-primary/90'
                                            : 'hover:bg-accent'
                                    )}
                                    onClick={() => toggleQuickFilter(filter.value)}
                                >
                                    {filter.label}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-6">
                    <div className="flex gap-6">
                        {/* Sidebar Filters - Desktop */}
                        <aside className="hidden lg:block w-72 flex-shrink-0">
                            <VehicleSidebar
                                filters={filters}
                                onFilterChange={setFilters}
                                onClear={clearFilters}
                            />
                        </aside>

                        {/* Results */}
                        <div className="flex-1 min-w-0">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-6 gap-4">
                                {/* Mobile Filter Button */}
                                <Button
                                    variant="outline"
                                    className="lg:hidden"
                                    onClick={() => setShowMobileFilters(true)}
                                >
                                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                                    Filters
                                    {activeFiltersCount > 0 && (
                                        <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-xs">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>

                                {/* Results count - Desktop */}
                                <div className="hidden lg:block text-sm text-muted-foreground">
                                    Showing <span className="font-medium text-foreground">{vehicles.length}</span> results
                                </div>

                                {/* Right side controls */}
                                <div className="flex items-center gap-3 ml-auto">
                                    {/* Sort */}
                                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sortOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* View Toggle */}
                                    <div className="hidden sm:flex items-center border border-border rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                'p-2 rounded transition-colors',
                                                viewMode === 'grid'
                                                    ? 'bg-primary text-white'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                            title="Grid view"
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                'p-2 rounded transition-colors',
                                                viewMode === 'list'
                                                    ? 'bg-primary text-white'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                            title="List view"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Grid/List */}
                            {isLoading ? (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6'
                                        : 'space-y-4'
                                )}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <VehicleCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : error ? (
                                <ErrorState
                                    title="Failed to Load Vehicles"
                                    message={error}
                                    onRetry={() => fetchVehicles(1)}
                                />
                            ) : sortedVehicles.length > 0 ? (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6'
                                        : 'space-y-4'
                                )}>
                                    {sortedVehicles.map((vehicle) => (
                                        <VehicleCard
                                            key={vehicle.id}
                                            vehicle={vehicle}
                                            variant={viewMode}
                                            onSave={handleSave}
                                            onCompare={handleCompare}
                                            isSaved={savedVehicles.includes(vehicle.id)}
                                            isComparing={compareList.includes(vehicle.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Car}
                                    title="No vehicles found"
                                    description="Try adjusting your filters or search criteria to find what you're looking for."
                                    action={{
                                        label: "Clear Filters",
                                        onClick: clearFilters
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Filter Modal */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowMobileFilters(false)}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Filters</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowMobileFilters(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-4">
                            <VehicleSidebar
                                filters={filters}
                                onFilterChange={setFilters}
                                onClear={clearFilters}
                            />
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default function VehiclesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-6">
                    <div className="animate-pulse space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <VehicleCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        }>
            <VehiclesPageContent />
        </Suspense>
    );
}
