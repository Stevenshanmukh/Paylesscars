'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { vehicleApi } from '@/lib/api/vehicles';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { Vehicle } from '@/lib/types/vehicle';

const vehicleSchema = z.object({
    stock_number: z.string().min(1, 'Stock number is required'),
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.string().min(1, 'Year is required'),
    trim: z.string().optional(),
    body_type: z.string().min(1, 'Body type is required'),
    exterior_color: z.string().min(1, 'Exterior color is required'),
    interior_color: z.string().min(1, 'Interior color is required'),
    msrp: z.string().min(1, 'MSRP is required'),
    floor_price: z.string().min(1, 'Floor price is required'),
    asking_price: z.string().min(1, 'Asking price is required'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Nissan', 'Hyundai'];
const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Convertible', 'Van', 'Wagon'];
const COLORS = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Beige'];
const YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + 1 - i).toString());

function EditVehicleContent() {
    const params = useParams();
    const router = useRouter();
    const vehicleId = params.id as string;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
    const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
    const [imageOrder, setImageOrder] = useState<string[]>([]);
    const [newPrimaryImageId, setNewPrimaryImageId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<VehicleFormData>({
        resolver: zodResolver(vehicleSchema),
    });

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                setIsLoading(true);
                const data = await vehicleApi.get(vehicleId);
                setVehicle(data);

                // Populate form with existing data
                reset({
                    stock_number: data.stock_number || '',
                    make: data.make || '',
                    model: data.model || '',
                    year: String(data.year) || '',
                    trim: data.trim || '',
                    body_type: data.body_type || '',
                    exterior_color: data.exterior_color || '',
                    interior_color: data.interior_color || '',
                    msrp: String(data.msrp) || '',
                    floor_price: String(data.floor_price) || '',
                    asking_price: String(data.asking_price) || '',
                });
            } catch (err) {
                setError('Failed to load vehicle');
            } finally {
                setIsLoading(false);
            }
        };

        if (vehicleId) {
            fetchVehicle();
        }
    }, [vehicleId, reset]);

    const onSubmit = async (data: VehicleFormData) => {
        setIsSaving(true);

        try {
            // Update vehicle data
            await vehicleApi.update(vehicleId, {
                stock_number: data.stock_number,
                make: data.make,
                model: data.model,
                year: parseInt(data.year),
                trim: data.trim || '',
                body_type: data.body_type.toLowerCase() as any,
                exterior_color: data.exterior_color,
                interior_color: data.interior_color,
                msrp: data.msrp,
                floor_price: data.floor_price,
                asking_price: data.asking_price,
            });

            // Delete removed images
            if (deletedImageIds.length > 0) {
                try {
                    await Promise.all(
                        deletedImageIds.map(id => vehicleApi.deleteImage(vehicleId, id))
                    );
                } catch (delErr) {
                    console.error('Image delete error:', delErr);
                    // Continue with other operations even if some deletes fail
                }
            }

            // Reorder existing images if order changed
            if (imageOrder.length > 0) {
                try {
                    await vehicleApi.reorderImages(vehicleId, imageOrder);
                } catch (reorderErr) {
                    console.error('Image reorder error:', reorderErr);
                }
            }

            // Upload new images if any were added
            if (imageFiles.length > 0) {
                try {
                    await vehicleApi.uploadImages(vehicleId, imageFiles, primaryImageIndex);
                } catch (imgErr) {
                    console.error('Image upload error:', imgErr);
                    toast.error('Vehicle saved, but image upload failed');
                }
            }

            // Set new primary image for existing images
            if (newPrimaryImageId && !newPrimaryImageId.startsWith('new-')) {
                try {
                    await vehicleApi.setPrimaryImage(vehicleId, newPrimaryImageId);
                } catch (primaryErr) {
                    console.error('Set primary image error:', primaryErr);
                }
            }

            toast.success('Vehicle updated successfully!');

            router.push('/dealer/inventory');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } }; message?: string };
            toast.error(error.response?.data?.detail || error.message || 'Failed to update vehicle');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImagesChange = (files: File[], primaryIndex: number, deletedIds: string[], order: string[]) => {
        setImageFiles(files);
        setPrimaryImageIndex(primaryIndex);
        setDeletedImageIds(deletedIds);
        setImageOrder(order);

        // Track if primary changed to an existing image
        if (order.length > 0 && primaryIndex >= 0 && primaryIndex < order.length) {
            const primaryId = order[primaryIndex];
            // Only track if it's an existing image (not a newly uploaded one)
            if (!primaryId.startsWith('new-')) {
                // Check if it's different from the original primary
                const originalPrimary = vehicle?.images?.find(img => img.is_primary);
                if (originalPrimary && originalPrimary.id !== primaryId) {
                    setNewPrimaryImageId(primaryId);
                } else if (!originalPrimary) {
                    setNewPrimaryImageId(primaryId);
                }
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (error || !vehicle) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-16">
                    <Card className="border-border p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <p className="text-foreground mb-4">{error || 'Vehicle not found'}</p>
                        <Link href="/dealer/inventory">
                            <Button>Back to Inventory</Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            {/* Sub-header */}
            <header className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dealer/inventory" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Inventory
                        </Link>
                        <span className="text-foreground font-semibold">Edit Vehicle</span>
                    </div>
                    <Button onClick={handleSubmit(onSubmit)} variant="primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Vehicle Info (Read-only) */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Vehicle Identification</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>VIN</Label>
                                <Input
                                    value={vehicle.vin}
                                    disabled
                                    className="font-mono opacity-60"
                                />
                                <p className="text-xs text-muted-foreground">VIN cannot be changed</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Stock Number *</Label>
                                <Input
                                    {...register('stock_number')}
                                />
                                {errors.stock_number && <p className="text-destructive text-sm">{errors.stock_number.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Photos */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Photos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ImageUploader
                                existingImages={vehicle.images?.map(img => ({
                                    id: img.id,
                                    url: img.image_url || img.medium_url || img.thumbnail_url || img.image || '',
                                    isPrimary: img.is_primary
                                })) || []}
                                onImagesChange={handleImagesChange}
                                maxImages={10}
                            />
                        </CardContent>
                    </Card>

                    {/* Basic Info */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Make *</Label>
                                <Select value={watch('make')} onValueChange={(v) => setValue('make', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select make" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MAKES.map(make => (
                                            <SelectItem key={make} value={make}>{make}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.make && <p className="text-destructive text-sm">{errors.make.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Model *</Label>
                                <Input
                                    {...register('model')}
                                />
                                {errors.model && <p className="text-destructive text-sm">{errors.model.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Year *</Label>
                                <Select value={watch('year')} onValueChange={(v) => setValue('year', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map(year => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.year && <p className="text-destructive text-sm">{errors.year.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Trim</Label>
                                <Input
                                    {...register('trim')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Body Type *</Label>
                                <Select value={watch('body_type')} onValueChange={(v) => setValue('body_type', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select body type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BODY_TYPES.map(type => (
                                            <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.body_type && <p className="text-destructive text-sm">{errors.body_type.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Colors */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Appearance</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Exterior Color *</Label>
                                <Select value={watch('exterior_color')} onValueChange={(v) => setValue('exterior_color', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COLORS.map(color => (
                                            <SelectItem key={color} value={color}>{color}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.exterior_color && <p className="text-destructive text-sm">{errors.exterior_color.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Interior Color *</Label>
                                <Select value={watch('interior_color')} onValueChange={(v) => setValue('interior_color', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COLORS.map(color => (
                                            <SelectItem key={color} value={color}>{color}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.interior_color && <p className="text-destructive text-sm">{errors.interior_color.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>MSRP *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        {...register('msrp')}
                                        className="pl-7"
                                    />
                                </div>
                                {errors.msrp && <p className="text-destructive text-sm">{errors.msrp.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Floor Price *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        {...register('floor_price')}
                                        className="pl-7"
                                    />
                                </div>
                                {errors.floor_price && <p className="text-destructive text-sm">{errors.floor_price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Asking Price *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        {...register('asking_price')}
                                        className="pl-7"
                                    />
                                </div>
                                {errors.asking_price && <p className="text-destructive text-sm">{errors.asking_price.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </main>
        </div>
    );
}

export default function EditVehiclePage() {
    return (
        <ProtectedRoute requiredRole="dealer">
            <EditVehicleContent />
        </ProtectedRoute>
    );
}
