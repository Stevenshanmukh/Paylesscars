'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Image from 'next/image';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatPrice } from '@/lib/utils/formatters';
import { resolveImageUrl } from '@/lib/utils';
import type { Vehicle } from '@/lib/types/vehicle';

const offerSchema = z.object({
    amount: z.string().min(1, 'Please enter an offer amount'),
    message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface MakeOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: Vehicle;
}

export function MakeOfferModal({ isOpen, onClose, vehicle }: MakeOfferModalProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const askingPrice = parseFloat(vehicle.asking_price);
    const minOffer = askingPrice * 0.5; // 50% minimum per business rules

    // Quick offer percentages
    const quickOffers = [
        { label: '5% Off', percent: 0.95 },
        { label: '10% Off', percent: 0.90 },
        { label: '15% Off', percent: 0.85 },
    ];

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<OfferFormData>({
        resolver: zodResolver(offerSchema),
        defaultValues: {
            amount: Math.round(askingPrice * 0.9).toString(), // Default to 10% off
        },
    });

    const currentOffer = watch('amount');
    const offerAmount = parseFloat(currentOffer) || 0;
    const savings = askingPrice - offerAmount;
    const savingsPercent = ((savings / askingPrice) * 100);
    const savingsPercentDisplay = savingsPercent.toFixed(1);

    // Reset form when modal opens with new vehicle
    useEffect(() => {
        if (isOpen) {
            reset({
                amount: Math.round(askingPrice * 0.9).toString(),
            });
        }
    }, [isOpen, askingPrice, reset]);

    // Get deal rating based on offer percentage
    const getDealRating = () => {
        if (savingsPercent >= 15) return { label: 'Great Deal', color: 'text-green-400', bg: 'bg-green-500/20' };
        if (savingsPercent >= 10) return { label: 'Good Deal', color: 'text-lime-400', bg: 'bg-lime-500/20' };
        if (savingsPercent >= 5) return { label: 'Fair Deal', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
        return { label: 'Near Asking', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    };

    const dealRating = getDealRating();

    const onSubmit = async (data: OfferFormData) => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const amount = parseFloat(data.amount);
        if (amount < minOffer) {
            toast.error(`Offer must be at least ${formatPrice(minOffer)} (50% of asking price)`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Import and use negotiation API
            const { negotiationApi } = await import('@/lib/api/negotiations');
            await negotiationApi.create({
                vehicle_id: vehicle.id,
                initial_amount: amount,
                message: data.message,
            });

            toast.success('Offer submitted successfully! The dealer will respond shortly.');
            reset();
            onClose();

            // Redirect to negotiations page
            router.push('/negotiations');
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err as any;

            // Default generic fallback
            let errorMessage = error.message || 'Failed to submit offer';

            if (error.response?.data) {
                const data = error.response.data;

                // 1. Check for 'detail' (DRF generic error)
                if (data.detail && typeof data.detail === 'string') {
                    errorMessage = data.detail;
                }
                // 2. Check for nested error message structure
                else if (data.error?.message) {
                    errorMessage = data.error.message;
                }
                // 3. Check if data itself is an array of errors
                else if (Array.isArray(data) && data.length > 0) {
                    errorMessage = typeof data[0] === 'string' ? data[0] : JSON.stringify(data[0]);
                }
                // 4. Check for field validation errors (standard DRF: { field: ["Error"] })
                else if (typeof data === 'object') {
                    const keys = Object.keys(data);
                    if (keys.length > 0) {
                        const firstKey = keys[0];
                        const firstError = data[firstKey];

                        if (Array.isArray(firstError) && firstError.length > 0) {
                            errorMessage = firstError[0];
                        } else if (typeof firstError === 'string') {
                            errorMessage = firstError;
                        } else {
                            // Fallback: stringify the field error content
                            errorMessage = JSON.stringify(firstError);
                        }
                    }
                }
                // 5. Fallback for string response
                else if (typeof data === 'string') {
                    errorMessage = data;
                }
            }

            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleQuickOffer = (percent: number) => {
        const amount = Math.round(askingPrice * percent);
        setValue('amount', amount.toString());
    };

    // Get primary image URL
    const vehicleImage = vehicle.primary_image || vehicle.images?.[0]?.image || null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-card border-border text-card-foreground max-w-md">
                <DialogHeader>
                    {/* Vehicle Image + Title */}
                    <div className="flex items-start gap-4">
                        {vehicleImage && (
                            <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                                <Image
                                    src={resolveImageUrl(vehicleImage)}
                                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl">Make an Offer</DialogTitle>
                            <DialogDescription className="text-muted-foreground truncate">
                                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-5 py-4">
                        {/* Current Price */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Asking Price</span>
                                <span className="text-xl font-bold text-foreground price">
                                    {formatPrice(vehicle.asking_price)}
                                </span>
                            </div>
                        </div>

                        {/* Quick Offer Buttons */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">Quick Select</Label>
                            <div className="flex gap-2">
                                {quickOffers.map((offer, i) => {
                                    const offerValue = Math.round(askingPrice * offer.percent);
                                    const isSelected = currentOffer === offerValue.toString();
                                    return (
                                        <Button
                                            key={i}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className={`flex-1 flex-col h-auto py-2 ${isSelected
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-input hover:border-primary/50'
                                                }`}
                                            onClick={() => handleQuickOffer(offer.percent)}
                                        >
                                            <span className="text-xs font-medium">{offer.label}</span>
                                            <span className="text-sm font-bold">{formatPrice(offerValue)}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Offer Input */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-foreground">Your Offer</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    className="pl-8 text-lg bg-muted/50 border-input text-foreground h-12"
                                    {...register('amount')}
                                />
                            </div>
                            {errors.amount && (
                                <p className="text-sm text-destructive">{errors.amount.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Minimum offer: {formatPrice(minOffer)}
                            </p>
                        </div>

                        {/* Savings Calculator with Progress Bar */}
                        {offerAmount > 0 && offerAmount < askingPrice && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-green-400 font-medium">Potential Savings</span>
                                    </div>
                                    <span className="font-bold text-green-400">
                                        {formatPrice(savings)} ({savingsPercentDisplay}%)
                                    </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full bg-green-900/30 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-green-400 h-full rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${Math.min(savingsPercent * 2, 100)}%` }}
                                    />
                                </div>
                                {/* Deal Rating Badge */}
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${dealRating.bg} ${dealRating.color}`}>
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {dealRating.label}
                                </div>
                            </div>
                        )}

                        {/* Warning if offer is too low */}
                        {offerAmount > 0 && offerAmount < minOffer && (
                            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
                                <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-sm text-destructive">
                                    Offer must be at least {formatPrice(minOffer)} (50% of asking price)
                                </p>
                            </div>
                        )}

                        <Separator className="bg-border" />

                        {/* Message */}
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-foreground">
                                Message to Dealer <span className="text-muted-foreground">(optional)</span>
                            </Label>
                            <textarea
                                id="message"
                                rows={3}
                                className="w-full px-3 py-2 bg-muted/50 border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="e.g., I'm a serious buyer ready to purchase this week..."
                                {...register('message')}
                            />
                            {errors.message && (
                                <p className="text-sm text-destructive">{errors.message.message}</p>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>
                                The dealer has 72 hours to respond to your offer.
                                You can counter or accept their response.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="border-input text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            disabled={isSubmitting || offerAmount < minOffer}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Offer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default MakeOfferModal;
