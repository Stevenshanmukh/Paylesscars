'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { formatPrice } from '@/lib/utils/formatters';
import { dealerApi } from '@/lib/api/dealers';
import { vehicleApi } from '@/lib/api/vehicles';
import { Skeleton } from '@/components/ui/skeleton';

interface DealerStats {
    total_vehicles: number;
    active_vehicles: number;
    pending_sale: number;
    sold_vehicles: number;
    total_negotiations: number;
    active_negotiations: number;
    pending_offers: number;
    deals_closed_30d: number;
    total_revenue_30d: number;
    avg_response_time_hours: number;
    conversion_rate: number;
}

interface VehicleData {
    id: string;
    make: string;
    model: string;
    year: number;
    asking_price: number;
    status: string;
}

function StatCard({
    title,
    value,
    format = 'number',
    isLoading = false
}: {
    title: string;
    value: number | string;
    format?: 'number' | 'currency' | 'percent' | 'time';
    isLoading?: boolean;
}) {
    const formatValue = () => {
        if (typeof value === 'string') return value;
        switch (format) {
            case 'currency': return formatPrice(value);
            case 'percent': return `${value}%`;
            case 'time': return `${value}h`;
            default: return value.toLocaleString();
        }
    };

    if (isLoading) {
        return (
            <Card className="border-border">
                <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-32" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border">
            <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">{title}</p>
                <p className="text-3xl font-bold text-foreground">{formatValue()}</p>
            </CardContent>
        </Card>
    );
}

function MakeDistribution({ vehicles, isLoading }: { vehicles: VehicleData[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-8" />
                ))}
            </div>
        );
    }

    const makeCount: Record<string, number> = {};
    vehicles.forEach(v => {
        makeCount[v.make] = (makeCount[v.make] || 0) + 1;
    });

    const total = vehicles.length || 1;
    const data = Object.entries(makeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([make, count]) => ({
            make,
            count,
            percentage: Math.round((count / total) * 100)
        }));

    if (data.length === 0) {
        return <p className="text-muted-foreground text-sm">No vehicles in inventory</p>;
    }

    return (
        <div className="space-y-3">
            {data.map((item, i) => (
                <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-foreground">{item.make}</span>
                        <span className="text-muted-foreground">{item.count} vehicles ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                        <div
                            className="h-2 bg-primary rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function TopVehiclesTable({ vehicles, isLoading }: { vehicles: VehicleData[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-10" />
                ))}
            </div>
        );
    }

    const topVehicles = vehicles.slice(0, 5);

    if (topVehicles.length === 0) {
        return <p className="text-muted-foreground text-sm">No vehicles in inventory</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                        <th className="pb-3 font-medium">Vehicle</th>
                        <th className="pb-3 font-medium text-right">Price</th>
                        <th className="pb-3 font-medium text-right">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {topVehicles.map((vehicle, i) => (
                        <tr key={i} className="border-b border-border/50">
                            <td className="py-3 text-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</td>
                            <td className="py-3 text-right text-green-500">{formatPrice(vehicle.asking_price)}</td>
                            <td className="py-3 text-right capitalize text-muted-foreground">{vehicle.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function InventorySummary({ stats, isLoading }: { stats: DealerStats | null, isLoading: boolean }) {
    if (isLoading || !stats) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-6" />
                ))}
            </div>
        );
    }

    const items = [
        { label: 'Active Listings', value: stats.active_vehicles, color: 'text-green-500' },
        { label: 'Pending Sale', value: stats.pending_sale, color: 'text-yellow-500' },
        { label: 'Sold', value: stats.sold_vehicles, color: 'text-primary' },
        { label: 'Total', value: stats.total_vehicles, color: 'text-foreground' },
    ];

    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-semibold ${item.color}`}>{item.value}</span>
                </div>
            ))}
        </div>
    );
}

function AnalyticsContent() {
    const [period, setPeriod] = useState('30');
    const [stats, setStats] = useState<DealerStats | null>(null);
    const [vehicles, setVehicles] = useState<VehicleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [statsRes, vehiclesRes] = await Promise.allSettled([
                    dealerApi.getStats(),
                    vehicleApi.list({}, 1)
                ]);

                if (statsRes.status === 'fulfilled') {
                    setStats(statsRes.value);
                }
                if (vehiclesRes.status === 'fulfilled') {
                    setVehicles((vehiclesRes.value.results || []) as unknown as VehicleData[]);
                }
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [period]);

    return (
        <div className="min-h-screen bg-background">
            <Header />
            {/* Sub-header */}
            <header className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dealer" className="text-muted-foreground hover:text-foreground">
                            ← Dashboard
                        </Link>
                        <span className="text-foreground font-semibold">Analytics & Reports</span>
                    </div>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Overview Stats - REAL DATA */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Monthly Revenue"
                        value={stats?.total_revenue_30d || 0}
                        format="currency"
                        isLoading={isLoading}
                    />
                    <StatCard
                        title="Deals Closed"
                        value={stats?.deals_closed_30d || 0}
                        isLoading={isLoading}
                    />
                    <StatCard
                        title="Conversion Rate"
                        value={stats?.conversion_rate || 0}
                        format="percent"
                        isLoading={isLoading}
                    />
                    <StatCard
                        title="Avg Response Time"
                        value={stats?.avg_response_time_hours || 0}
                        format="time"
                        isLoading={isLoading}
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Inventory Summary */}
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">Inventory Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                                        <p className="text-2xl font-bold text-green-500">{stats?.active_vehicles || 0}</p>
                                        <p className="text-sm text-muted-foreground">Active</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                                        <p className="text-2xl font-bold text-yellow-500">{stats?.pending_sale || 0}</p>
                                        <p className="text-sm text-muted-foreground">Pending</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                                        <p className="text-2xl font-bold text-primary">{stats?.sold_vehicles || 0}</p>
                                        <p className="text-sm text-muted-foreground">Sold</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                                        <p className="text-2xl font-bold text-foreground">{stats?.total_vehicles || 0}</p>
                                        <p className="text-sm text-muted-foreground">Total</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Vehicles */}
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-foreground">Your Inventory</CardTitle>
                                <Link href="/dealer/inventory">
                                    <Button variant="ghost" size="sm" className="text-primary">View All</Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <TopVehiclesTable vehicles={vehicles} isLoading={isLoading} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Inventory by Make */}
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground text-lg">Inventory by Make</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MakeDistribution vehicles={vehicles} isLoading={isLoading} />
                            </CardContent>
                        </Card>

                        {/* Negotiations Summary */}
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground text-lg">Negotiations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Active</span>
                                    <span className="font-semibold text-green-500">{stats?.active_negotiations || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pending Offers</span>
                                    <span className="font-semibold text-yellow-500">{stats?.pending_offers || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-semibold text-foreground">{stats?.total_negotiations || 0}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href="/dealer/inventory/new">
                                    <Button variant="primary" className="w-full">
                                        Add New Vehicle
                                    </Button>
                                </Link>
                                <Link href="/dealer/offers">
                                    <Button variant="outline" className="w-full">
                                        View Offers
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function DealerAnalyticsPage() {
    return (
        <ProtectedRoute requiredRole="dealer">
            <AnalyticsContent />
        </ProtectedRoute>
    );
}
