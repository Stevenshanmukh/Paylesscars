'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';


import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { vehicleApi } from '@/lib/api/vehicles';
import {
    ArrowLeft,
    X,
    Car,
    DollarSign,
    Palette,
    Settings,
    ImageIcon,
    CheckCircle,
    AlertCircle,
    Upload,
    Info,
    Star,
    GripVertical,
    Trash2
} from 'lucide-react';

// Interface for existing images with full metadata
interface ExistingImage {
    id: string;
    url: string;
    isPrimary: boolean;
    displayOrder: number;
}

// Schema that allows VIN to be optional for edits (not editable)
const vehicleSchema = z.object({
    vin: z.string().length(17, 'VIN must be exactly 17 characters').optional().or(z.literal('')),
    stock_number: z.string().min(1, 'Stock number is required'),
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.string().min(1, 'Year is required'),
    trim: z.string().optional(),
    body_type: z.string().min(1, 'Body type is required'),
    exterior_color: z.string().min(1, 'Exterior color is required'),
    interior_color: z.string().min(1, 'Interior color is required'),
    mileage: z.string().optional(),
    transmission: z.string().optional(),
    fuel_type: z.string().optional(),
    drivetrain: z.string().optional(),
    engine: z.string().optional(),
    description: z.string().optional(),
    msrp: z.string().min(1, 'MSRP is required'),
    floor_price: z.string().min(1, 'Floor price is required'),
    asking_price: z.string().min(1, 'Asking price is required'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

// Extended options to match sample data
const MAKES = [
    'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge',
    'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
    'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Nissan',
    'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

const BODY_TYPES = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'truck', label: 'Truck' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'van', label: 'Van' },
    { value: 'wagon', label: 'Wagon' }
];

const EXTERIOR_COLORS = [
    'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Beige',
    'Midnight Black', 'Platinum White', 'Alpine White', 'Carbonized Gray', 'Stealth Grey',
    'Pearl White', 'Metallic Silver', 'Deep Blue', 'Racing Red', 'Forest Green'
];

const INTERIOR_COLORS = [
    'Black', 'Gray', 'Tan', 'Brown', 'Beige', 'White', 'Red', 'Cognac', 'Saddle Brown'
];

const TRANSMISSIONS = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
    { value: 'cvt', label: 'CVT' },
    { value: 'dct', label: 'Dual-Clutch (DCT)' }
];

const FUEL_TYPES = [
    { value: 'gasoline', label: 'Gasoline' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'plug_in_hybrid', label: 'Plug-in Hybrid' }
];

const DRIVETRAINS = [
    { value: 'fwd', label: 'Front-Wheel Drive (FWD)' },
    { value: 'rwd', label: 'Rear-Wheel Drive (RWD)' },
    { value: 'awd', label: 'All-Wheel Drive (AWD)' },
    { value: '4wd', label: 'Four-Wheel Drive (4WD)' }
];

const YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + 1 - i).toString());

function AddVehicleContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newPrimaryIndex, setNewPrimaryIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Load existing vehicle data if in edit mode
    useEffect(() => {
        if (editId) {
            const fetchVehicle = async () => {
                try {
                    setIsLoading(true);
                    const vehicle = await vehicleApi.get(editId);

                    // Populate form with existing data
                    reset({
                        vin: vehicle.vin || '',
                        stock_number: vehicle.stock_number || '',
                        make: vehicle.make || '',
                        model: vehicle.model || '',
                        year: vehicle.year?.toString() || '',
                        trim: vehicle.trim || '',
                        body_type: vehicle.body_type || '',
                        exterior_color: vehicle.exterior_color || '',
                        interior_color: vehicle.interior_color || '',
                        mileage: String(vehicle.specifications?.mileage || ''),
                        transmission: String(vehicle.specifications?.transmission || ''),
                        fuel_type: String(vehicle.specifications?.fuel_type || ''),
                        drivetrain: String(vehicle.specifications?.drivetrain || ''),
                        engine: String(vehicle.specifications?.engine || ''),
                        description: String(vehicle.specifications?.description || ''),
                        msrp: vehicle.msrp?.toString() || '',
                        floor_price: vehicle.floor_price?.toString() || '',
                        asking_price: vehicle.asking_price?.toString() || '',
                    });

                    // Load existing images - use image_url which is the absolute URL from the serializer
                    if (vehicle.images && vehicle.images.length > 0) {
                        const images: ExistingImage[] = vehicle.images.map((img: any, idx: number) => ({
                            id: img.id?.toString() || `img-${idx}`,
                            url: img.image_url || img.large_url || img.medium_url || img.thumbnail_url || img.image || '',
                            isPrimary: img.is_primary || false,
                            displayOrder: img.display_order || idx
                        })).filter((img: ExistingImage) => img.url);
                        setExistingImages(images);
                    }
                } catch (err) {
                    toast.error('Failed to load vehicle data');
                    router.push('/dealer/inventory');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVehicle();
        }
    }, [editId, reset, router]);

    const msrp = watch('msrp');
    const floorPrice = watch('floor_price');
    const askingPrice = watch('asking_price');

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + selectedImages.length > 10) {
            toast.error('Maximum 10 images allowed');
            return;
        }

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setSelectedImages(prev => [...prev, ...files]);
        setImagePreviews(prev => [...prev, ...newPreviews]);

        // If no existing images and no new primary set, default to first new image
        if (existingImages.length === 0 && newPrimaryIndex === null) {
            setNewPrimaryIndex(0);
        }
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));

        if (newPrimaryIndex === index) {
            setNewPrimaryIndex(imagePreviews.length > 1 ? 0 : null);
        } else if (newPrimaryIndex !== null && newPrimaryIndex > index) {
            setNewPrimaryIndex(newPrimaryIndex - 1);
        }
    };

    // Delete an existing image from the server
    const deleteExistingImage = async (imageId: string) => {
        if (!editId) return;
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            await vehicleApi.deleteImage(editId, imageId);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            toast.success('Image deleted');
        } catch (err) {
            toast.error('Failed to delete image');
        }
    };



    // Set an image as the primary image
    const setPrimaryImage = async (imageId: string) => {
        if (!editId) return;

        try {
            await vehicleApi.setPrimaryImage(editId, imageId);
            setExistingImages(prev => prev.map(img => ({
                ...img,
                isPrimary: img.id === imageId
            })));
            setNewPrimaryIndex(null); // Clear new primary selection
            toast.success('Primary image updated');
        } catch (err) {
            toast.error('Failed to set primary image');
        }
    };

    const setNewPrimaryImage = (index: number) => {
        setNewPrimaryIndex(index);
        // Visually unmark existing primary images
        setExistingImages(prev => prev.map(img => ({
            ...img,
            isPrimary: false
        })));
    };

    // Drag and drop handlers for reordering
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        // Reorder locally
        const newImages = [...existingImages];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedImage);

        // Update display order
        newImages.forEach((img, idx) => {
            img.displayOrder = idx;
        });

        setExistingImages(newImages);
        setDraggedIndex(index);
    };

    const handleDragEnd = async () => {
        if (!editId || draggedIndex === null) {
            setDraggedIndex(null);
            return;
        }

        try {
            const imageIds = existingImages.map(img => img.id);
            await vehicleApi.reorderImages(editId, imageIds);
            toast.success('Image order saved');
        } catch (err) {
            toast.error('Failed to save image order');
        }
        setDraggedIndex(null);
    };


    const submitVehicle = async (data: VehicleFormData, status: 'active' | 'draft') => {
        const msrpNum = parseFloat(data.msrp);
        const floorNum = parseFloat(data.floor_price);
        const askingNum = parseFloat(data.asking_price);

        if (floorNum > msrpNum) {
            toast.error('Floor price cannot exceed MSRP');
            return;
        }
        if (askingNum < floorNum) {
            toast.error('Asking price cannot be below floor price');
            return;
        }

        setIsSubmitting(true);

        try {
            const vehicleData = {
                ...(isEditMode ? {} : { vin: data.vin }), // Only include VIN for new vehicles
                stock_number: data.stock_number,
                make: data.make,
                model: data.model,
                year: parseInt(data.year),
                trim: data.trim || '',
                body_type: data.body_type as 'sedan' | 'suv' | 'truck' | 'coupe' | 'hatchback' | 'convertible' | 'van' | 'wagon',
                exterior_color: data.exterior_color,
                interior_color: data.interior_color,
                msrp: data.msrp,
                floor_price: data.floor_price,
                asking_price: data.asking_price,
                status: status,
                specifications: {
                    mileage: data.mileage ? parseInt(data.mileage) : 0,
                    transmission: data.transmission || 'Automatic',
                    fuel_type: data.fuel_type || 'Gasoline',
                    drivetrain: data.drivetrain || 'FWD',
                    engine: data.engine || '',
                    description: data.description || ''
                }
            };

            let vehicleIdForImages = editId;

            if (isEditMode && editId) {
                // Update existing vehicle (no VIN change allowed)
                await vehicleApi.update(editId, vehicleData);
            } else {
                // Create new vehicle (VIN required)
                if (!data.vin) {
                    toast.error('VIN is required for new vehicles');
                    return;
                }
                const newVehicle = await vehicleApi.create({ ...vehicleData, vin: data.vin });
                vehicleIdForImages = newVehicle.id;
            }

            // Upload new images if any were selected
            if (selectedImages.length > 0 && vehicleIdForImages) {
                try {
                    // Start upload
                    // If we have a new primary selected, we pass that index.
                    // However, backend ignores it if existing images exist.
                    // So we must handle the response and force set primary if needed.
                    const uploadResponse = await vehicleApi.uploadImages(vehicleIdForImages, selectedImages, newPrimaryIndex ?? 0);

                    // If a new image was selected as primary, and we have uploaded images, ensure it's set
                    if (newPrimaryIndex !== null && uploadResponse?.images) {
                        const newImages = uploadResponse.images;
                        // The response order matches upload order
                        if (newImages[newPrimaryIndex]) {
                            try {
                                const newPrimaryId = newImages[newPrimaryIndex].id;
                                await vehicleApi.setPrimaryImage(vehicleIdForImages, newPrimaryId);
                                console.log('Set new uploaded image as primary:', newPrimaryId);
                            } catch (e) {
                                console.error('Failed to set new image as primary after upload', e);
                            }
                        }
                    }

                    toast.success(isEditMode ? 'Vehicle and images updated!' : status === 'draft' ? 'Draft saved with images!' : 'Vehicle published with images!');
                } catch (imgErr) {
                    console.error('Image upload error:', imgErr);
                    toast.error('Vehicle saved but image upload failed');
                }
            } else {
                toast.success(isEditMode ? 'Vehicle updated successfully!' : status === 'draft' ? 'Draft saved successfully!' : 'Vehicle published successfully!');
            }

            router.push('/dealer/inventory');
        } catch (error: unknown) {
            console.log('Vehicle submission error:', error);

            let errorMessage = 'Failed to create vehicle';
            if (error && typeof error === 'object') {
                const err = error as {
                    response?: {
                        status?: number;
                        data?: {
                            message?: string;
                            error?: string | { message?: string };
                            detail?: string;
                        }
                    };
                    message?: string
                };

                if (err.response?.data?.detail) {
                    errorMessage = err.response.data.detail;
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.status === 403) {
                    errorMessage = 'Permission denied - only dealers can create vehicles';
                } else if (err.response?.status === 401) {
                    errorMessage = 'Not authenticated - please log in again';
                }
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePublish = (data: VehicleFormData) => submitVehicle(data, 'active');
    const handleSaveDraft = (data: VehicleFormData) => submitVehicle(data, 'draft');

    // Pricing validation
    const isPricingValid = () => {
        if (!msrp || !floorPrice || !askingPrice) return null;
        const m = parseFloat(msrp);
        const f = parseFloat(floorPrice);
        const a = parseFloat(askingPrice);
        return f <= m && a >= f;
    };

    return (
        <>
            <PageContainer>
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/dealer/inventory" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Inventory
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground font-display">Add New Vehicle</h1>
                        <p className="text-muted-foreground mt-1">
                            Fill in the details below to list a new vehicle for sale
                        </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <Button
                            variant="outline"
                            onClick={handleSubmit(handleSaveDraft)}
                            disabled={isSubmitting}
                        >
                            Save as Draft
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit(handlePublish)}
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit(handlePublish)} className="space-y-6">
                    {/* Vehicle Identification */}
                    <Card className="border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Car className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle>Vehicle Identification</CardTitle>
                                    <CardDescription>VIN and stock number details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>VIN <span className="text-destructive">*</span></Label>
                                <Input
                                    {...register('vin')}
                                    placeholder="17-character VIN"
                                    className="font-mono uppercase"
                                    maxLength={17}
                                />
                                {errors.vin && <p className="text-destructive text-sm">{errors.vin.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Stock Number <span className="text-destructive">*</span></Label>
                                <Input
                                    {...register('stock_number')}
                                    placeholder="e.g., STK-001"
                                />
                                {errors.stock_number && <p className="text-destructive text-sm">{errors.stock_number.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Basic Information */}
                    <Card className="border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                    <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>Make, model, year and trim details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Make <span className="text-destructive">*</span></Label>
                                <Select onValueChange={(v) => setValue('make', v)}>
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
                                <Label>Model <span className="text-destructive">*</span></Label>
                                <Input
                                    {...register('model')}
                                    placeholder="e.g., Camry, Model 3, F-150"
                                />
                                {errors.model && <p className="text-destructive text-sm">{errors.model.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Year <span className="text-destructive">*</span></Label>
                                <Select onValueChange={(v) => setValue('year', v)}>
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
                                <Label>Trim <Badge variant="outline" className="ml-2 text-xs">Optional</Badge></Label>
                                <Input
                                    {...register('trim')}
                                    placeholder="e.g., XSE, Sport, Long Range"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Body Type <span className="text-destructive">*</span></Label>
                                <Select onValueChange={(v) => setValue('body_type', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select body type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BODY_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.body_type && <p className="text-destructive text-sm">{errors.body_type.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Mileage <Badge variant="outline" className="ml-2 text-xs">Optional</Badge></Label>
                                <Input
                                    type="number"
                                    {...register('mileage')}
                                    placeholder="e.g., 15000"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Specifications */}
                    <Card className="border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <CardTitle>Specifications</CardTitle>
                                    <CardDescription>Engine, transmission, and drivetrain</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Transmission <Badge variant="outline" className="ml-2 text-xs">Optional</Badge></Label>
                                <Select onValueChange={(v) => setValue('transmission', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select transmission" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TRANSMISSIONS.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fuel Type <Badge variant="outline" className="ml-2 text-xs">Optional</Badge></Label>
                                <Select onValueChange={(v) => setValue('fuel_type', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select fuel type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FUEL_TYPES.map(f => (
                                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Drivetrain <Badge variant="outline" className="ml-2 text-xs">Optional</Badge></Label>
                                <Select onValueChange={(v) => setValue('drivetrain', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select drivetrain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DRIVETRAINS.map(d => (
                                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Engine <Badge variant="outline" className="ml-2 text-xs">Optional</Badge></Label>
                                <Input
                                    {...register('engine')}
                                    placeholder="e.g., 2.5L 4-Cylinder"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appearance */}
                    <Card className="border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle>Appearance</CardTitle>
                                    <CardDescription>Exterior and interior colors</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Exterior Color <span className="text-destructive">*</span></Label>
                                <Select onValueChange={(v) => setValue('exterior_color', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select exterior color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXTERIOR_COLORS.map(color => (
                                            <SelectItem key={color} value={color}>{color}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.exterior_color && <p className="text-destructive text-sm">{errors.exterior_color.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Interior Color <span className="text-destructive">*</span></Label>
                                <Select onValueChange={(v) => setValue('interior_color', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select interior color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INTERIOR_COLORS.map(color => (
                                            <SelectItem key={color} value={color}>{color}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.interior_color && <p className="text-destructive text-sm">{errors.interior_color.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                            <CardDescription>Optional detailed description for the listing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                {...register('description')}
                                placeholder="Describe the vehicle's features, condition, history, and any special notes for buyers..."
                                className="min-h-[120px]"
                            />
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle>Pricing</CardTitle>
                                    <CardDescription>Set MSRP, floor price, and asking price</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>MSRP <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            type="number"
                                            {...register('msrp')}
                                            placeholder="38500"
                                            className="pl-7"
                                        />
                                    </div>
                                    {errors.msrp && <p className="text-destructive text-sm">{errors.msrp.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Floor Price <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            type="number"
                                            {...register('floor_price')}
                                            placeholder="32000"
                                            className="pl-7"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Minimum acceptable price (hidden)</p>
                                    {errors.floor_price && <p className="text-destructive text-sm">{errors.floor_price.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Asking Price <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            type="number"
                                            {...register('asking_price')}
                                            placeholder="36250"
                                            className="pl-7"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Listed price for negotiations</p>
                                    {errors.asking_price && <p className="text-destructive text-sm">{errors.asking_price.message}</p>}
                                </div>
                            </div>

                            {/* Pricing validation feedback */}
                            {isPricingValid() !== null && (
                                <div className={`p-4 rounded-lg flex items-center gap-3 ${isPricingValid()
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-destructive/10 border border-destructive/30'
                                    }`}>
                                    {isPricingValid() ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-green-700 dark:text-green-300">Pricing is valid</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-5 h-5 text-destructive" />
                                            <span className="text-destructive">
                                                {parseFloat(floorPrice || '0') > parseFloat(msrp || '0')
                                                    ? 'Floor price cannot exceed MSRP'
                                                    : 'Asking price cannot be below floor price'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Image Upload */}
                    <Card className="border-border">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle>Vehicle Images</CardTitle>
                                    <CardDescription>Upload up to 10 photos of the vehicle</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />

                            {/* Show existing images in edit mode with full management */}
                            {existingImages.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Existing Images ({existingImages.length}) - Drag to reorder
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {existingImages.map((image, index) => (
                                            <div
                                                key={image.id}
                                                draggable
                                                onDragStart={() => handleDragStart(index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`relative aspect-video bg-muted rounded-lg overflow-hidden group cursor-move border-2 transition-all ${draggedIndex === index ? 'border-primary opacity-50' : 'border-transparent hover:border-primary/50'
                                                    }`}
                                            >
                                                {/* Drag handle */}
                                                <div className="absolute top-2 left-2 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <GripVertical className="w-4 h-4 text-white" />
                                                </div>

                                                {/* Image */}
                                                <img
                                                    src={image.url}
                                                    alt={`Image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Action buttons */}
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Set Primary Button */}
                                                    {!image.isPrimary && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPrimaryImage(image.id)}
                                                            className="p-1.5 bg-yellow-500 rounded-full hover:bg-yellow-400 transition-colors"
                                                            title="Set as primary"
                                                        >
                                                            <Star className="w-3 h-3 text-white" />
                                                        </button>
                                                    )}
                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteExistingImage(image.id)}
                                                        className="p-1.5 bg-destructive rounded-full hover:bg-destructive/80 transition-colors"
                                                        title="Delete image"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-white" />
                                                    </button>
                                                </div>

                                                {/* Primary Badge */}
                                                {image.isPrimary && (
                                                    <Badge className="absolute bottom-2 left-2 bg-primary gap-1">
                                                        <Star className="w-3 h-3" />
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Show newly selected images */}
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                                            <Image
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1 bg-destructive rounded-full hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>

                                            {/* Star Button for New Images */}
                                            {newPrimaryIndex !== index && (
                                                <button
                                                    type="button"
                                                    onClick={() => setNewPrimaryImage(index)}
                                                    className="absolute top-2 right-10 p-1.5 bg-yellow-500 rounded-full hover:bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Set as primary"
                                                >
                                                    <Star className="w-3 h-3 text-white" />
                                                </button>
                                            )}

                                            {newPrimaryIndex === index && (
                                                <Badge className="absolute bottom-2 left-2 bg-primary">Primary</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div
                                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-foreground mb-2">Click to select images or drag and drop</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedImages.length > 0
                                        ? `${selectedImages.length} image(s) selected. Click to add more.`
                                        : 'Supports JPEG, PNG. Maximum 10 images.'}
                                </p>
                                <Button type="button" variant="outline" className="mt-4">
                                    Choose Files
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bottom Actions */}
                    <div className="flex justify-end gap-3 pt-4 pb-8">
                        <Link href="/dealer/inventory">
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleSubmit(handleSaveDraft)}
                            disabled={isSubmitting}
                        >
                            Save as Draft
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </>
    );
}

export default function AddVehiclePage() {
    return (
        <ProtectedRoute requiredRole="dealer">
            <AddVehicleContent />
        </ProtectedRoute>
    );
}
