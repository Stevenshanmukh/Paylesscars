'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// Using native img instead of Next.js Image to bypass optimization issues
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DealBadge } from '@/components/ui/deal-badge';
import { MarketPriceAnalysis } from '@/components/ui/price-comparison-bar';

import { MakeOfferModal } from '@/components/negotiations/MakeOfferModal';
import { calculateDealRating } from '@/lib/design-tokens';
import { formatPrice, calculateDiscount } from '@/lib/utils/formatters';
import { vehicleApi } from '@/lib/api/vehicles';
import type { Vehicle } from '@/lib/types/vehicle';
import { ErrorState } from '@/components/ui/ErrorState';
import {
    ArrowLeft,
    Heart,
    MapPin,
    Phone,
    CheckCircle,
    Share2,
    ChevronLeft,
    ChevronRight,
    Fuel,
    Gauge,
    Calendar,
    Settings2,
    Shield,
    Clock,
    Star,
} from 'lucide-react';



// Helper to generate market data
function getMarketData(askingPrice: number) {
    const variance = askingPrice * 0.15;
    return {
        marketLow: Math.round(askingPrice - variance),
        marketHigh: Math.round(askingPrice + variance * 0.5),
        marketAverage: Math.round(askingPrice - variance * 0.2),
    };
}

export default function VehicleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [similarVehicles, setSimilarVehicles] = useState<Vehicle[]>([]);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await vehicleApi.get(params.id as string);
                setVehicle(data);

                // Fetch similar vehicles
                try {
                    const similar = await vehicleApi.getSimilar(params.id as string);
                    setSimilarVehicles(similar);
                } catch (err) {
                    console.error('Failed to fetch similar vehicles', err);
                }
            } catch (err: unknown) {
                const error = err as { response?: { status?: number } };
                if (error.response?.status === 404) {
                    setError('Vehicle not found');
                } else {
                    setError('Failed to load vehicle details');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchVehicle();
        }
    }, [params.id]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="aspect-[16/10] rounded-xl" />
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Skeleton key={i} className="w-24 h-16 rounded-lg" />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-48 rounded-xl" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Error state
    if (error || !vehicle) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <ErrorState
                        title={error || 'Vehicle not found'}
                        message="The vehicle you're looking for might have been sold or removed."
                        onRetry={() => router.push('/vehicles')}
                    />
                </main>
                <Footer />
            </div>
        );
    }

    const askingPrice = parseFloat(vehicle.asking_price);
    const msrp = parseFloat(vehicle.msrp);
    const discount = calculateDiscount(vehicle.msrp, vehicle.asking_price);
    const marketData = getMarketData(askingPrice);
    const { rating } = calculateDealRating(askingPrice, marketData.marketLow, marketData.marketHigh);
    const images = vehicle.images && vehicle.images.length > 0
        ? vehicle.images
        : [{ image: vehicle.primary_image || '/placeholder-car.jpg', image_url: vehicle.primary_image }];

    const nextImage = () => {
        setActiveImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1">
                {/* Breadcrumb */}
                <div className="bg-muted/30 border-b border-border">
                    <div className="container mx-auto px-4 py-3">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
                            <span className="text-muted-foreground">/</span>
                            <Link href="/vehicles" className="text-muted-foreground hover:text-foreground">Vehicles</Link>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                        </nav>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Images & Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Image Gallery */}
                            <div className="relative aspect-[16/10] bg-muted rounded-xl overflow-hidden group">
                                <img
                                    src={images[activeImageIndex]?.image_url || images[activeImageIndex]?.image || '/placeholder-car.jpg'}
                                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />

                                {/* Gallery Navigation */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}

                                {/* Deal Badge */}
                                <div className="absolute top-4 left-4">
                                    <DealBadge rating={rating} size="md" />
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => setIsSaved(!isSaved)}
                                        className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors',
                                            isSaved ? 'bg-red-500 text-white' : 'bg-white/90 hover:bg-white text-gray-600'
                                        )}
                                    >
                                        <Heart className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg text-gray-600">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Image Counter */}
                                <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                                    {activeImageIndex + 1} / {images.length}
                                </div>
                            </div>

                            {/* Thumbnail Gallery */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImageIndex(i)}
                                            className={cn(
                                                'w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                                                i === activeImageIndex ? 'border-primary' : 'border-transparent hover:border-border'
                                            )}
                                        >
                                            <img
                                                src={img.image_url || img.image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Tabs - Details */}
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 gap-0">
                                    <TabsTrigger
                                        value="overview"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                                    >
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="features"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                                    >
                                        Features
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="specs"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                                    >
                                        Specifications
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="price-analysis"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                                    >
                                        Price Analysis
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="mt-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Year</p>
                                                        <p className="font-semibold">{vehicle.year}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Gauge className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Mileage</p>
                                                        <p className="font-semibold">{vehicle.specifications?.mileage?.toLocaleString() || 'N/A'} mi</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Fuel className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Fuel Type</p>
                                                        <p className="font-semibold">{vehicle.specifications?.fuel_type || 'Gasoline'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Settings2 className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Transmission</p>
                                                        <p className="font-semibold">{vehicle.specifications?.transmission || 'Automatic'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="my-6" />

                                            {/* Vehicle Details */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="flex justify-between py-2 border-b border-border">
                                                    <span className="text-muted-foreground">Exterior Color</span>
                                                    <span className="font-medium">{vehicle.exterior_color}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border">
                                                    <span className="text-muted-foreground">Interior Color</span>
                                                    <span className="font-medium">{vehicle.interior_color}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border">
                                                    <span className="text-muted-foreground">Body Type</span>
                                                    <span className="font-medium capitalize">{vehicle.body_type}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border">
                                                    <span className="text-muted-foreground">Trim</span>
                                                    <span className="font-medium">{vehicle.trim || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border">
                                                    <span className="text-muted-foreground">VIN</span>
                                                    <span className="font-mono text-sm">{vehicle.vin}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border">
                                                    <span className="text-muted-foreground">Stock #</span>
                                                    <span className="font-medium">{vehicle.stock_number}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="features" className="mt-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            {vehicle.features && vehicle.features.length > 0 ? (
                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {vehicle.features.map((feature) => (
                                                        <div key={feature} className="flex items-center gap-2 text-sm">
                                                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                            <span>{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground">No feature information available.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="specs" className="mt-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            {vehicle.specifications && Object.keys(vehicle.specifications).length > 0 ? (
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {Object.entries(vehicle.specifications).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between py-2 border-b border-border">
                                                            <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                                            <span className="font-medium">{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground">No specification information available.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="price-analysis" className="mt-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <MarketPriceAnalysis
                                                askingPrice={askingPrice}
                                                marketLow={marketData.marketLow}
                                                marketHigh={marketData.marketHigh}
                                                marketAverage={marketData.marketAverage}
                                                msrp={msrp}
                                            />

                                            <Separator className="my-6" />

                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="text-center p-4 bg-muted rounded-lg">
                                                    <p className="text-sm text-muted-foreground">This Vehicle</p>
                                                    <p className="text-xl font-bold price">{formatPrice(vehicle.asking_price)}</p>
                                                </div>
                                                <div className="text-center p-4 bg-muted rounded-lg">
                                                    <p className="text-sm text-muted-foreground">Market Average</p>
                                                    <p className="text-xl font-bold price">${marketData.marketAverage.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                                                    <p className="text-sm text-green-600">Your Potential Savings</p>
                                                    <p className="text-xl font-bold text-green-600">${(marketData.marketAverage - askingPrice).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Right Column - Pricing & Actions */}
                        <div className="space-y-6">
                            {/* Vehicle Title */}
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                </h1>
                                {vehicle.trim && (
                                    <p className="text-lg text-muted-foreground mt-1">{vehicle.trim}</p>
                                )}
                            </div>

                            {/* Pricing Card */}
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Asking Price</p>
                                        <p className="text-3xl font-bold text-foreground price">
                                            {formatPrice(vehicle.asking_price)}
                                        </p>
                                    </div>

                                    {msrp > askingPrice && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-muted-foreground line-through">
                                                MSRP {formatPrice(vehicle.msrp)}
                                            </span>
                                            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                                Save {formatPrice((msrp - askingPrice).toString())}
                                            </Badge>
                                        </div>
                                    )}

                                    <Separator />

                                    <Button
                                        size="lg"
                                        variant="primary"
                                        className="w-full text-lg py-6"
                                        onClick={() => setIsOfferModalOpen(true)}
                                    >
                                        Make an Offer
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        Start negotiating directly with the dealer
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Dealer Card */}
                            {vehicle.dealer && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            {vehicle.dealer.is_verified && (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            )}
                                            {vehicle.dealer.business_name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Trust Badges */}
                                        {vehicle.dealer.is_verified && (
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="gap-1">
                                                    <Shield className="w-3 h-3" />
                                                    Verified Dealer
                                                </Badge>
                                                <Badge variant="secondary" className="gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Fast Response
                                                </Badge>
                                                <Badge variant="secondary" className="gap-1">
                                                    <Star className="w-3 h-3" />
                                                    Top Rated
                                                </Badge>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            {vehicle.dealer.city}, {vehicle.dealer.state}
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            {vehicle.dealer.phone}
                                        </div>
                                        <Button variant="outline" className="w-full mt-2">
                                            View Dealer Profile
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Similar Vehicles */}
                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Similar Vehicles</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {similarVehicles.length > 0 ? (
                                similarVehicles.map((similar) => (
                                    <Link key={similar.id} href={`/vehicles/${similar.id}`}>
                                        <Card className="overflow-hidden hover:shadow-card-hover hover:border-primary/30 transition-all h-full">
                                            <div className="relative aspect-[4/3] bg-muted">
                                                {similar.primary_image ? (
                                                    <img
                                                        src={similar.primary_image}
                                                        alt={`${similar.year} ${similar.make} ${similar.model}`}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <CardContent className="p-3">
                                                <h3 className="font-medium text-sm line-clamp-1">
                                                    {similar.year} {similar.make} {similar.model}
                                                </h3>
                                                <p className="text-lg font-bold text-foreground price">
                                                    {formatPrice(similar.asking_price)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No similar vehicles found.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Make Offer Modal - PRESERVED */}
            <MakeOfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                vehicle={vehicle}
            />

            <Footer />
        </div>
    );
}
