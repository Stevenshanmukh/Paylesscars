'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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

    const {
        register,
        handleSubmit,
        watch,
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
    const savingsPercent = ((savings / askingPrice) * 100).toFixed(1);

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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Make an Offer</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-6 py-4">
                        {/* Current Price */}
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Asking Price</span>
                                <span className="text-xl font-bold text-white">
                                    {formatPrice(vehicle.asking_price)}
                                </span>
                            </div>
                        </div>

                        {/* Offer Input */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-slate-200">Your Offer</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    className="pl-8 text-lg bg-slate-700/50 border-slate-600 text-white h-12"
                                    {...register('amount')}
                                />
                            </div>
                            {errors.amount && (
                                <p className="text-sm text-red-400">{errors.amount.message}</p>
                            )}
                            <p className="text-xs text-slate-500">
                                Minimum offer: {formatPrice(minOffer)}
                            </p>
                        </div>

                        {/* Savings Calculator */}
                        {offerAmount > 0 && offerAmount < askingPrice && (
                            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                                <div className="flex justify-between items-center text-green-400">
                                    <span>Potential Savings</span>
                                    <span className="font-bold">
                                        {formatPrice(savings)} ({savingsPercent}%)
                                    </span>
                                </div>
                            </div>
                        )}

                        <Separator className="bg-slate-700" />

                        {/* Message */}
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-slate-200">
                                Message to Dealer <span className="text-slate-500">(optional)</span>
                            </Label>
                            <textarea
                                id="message"
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., I'm a serious buyer ready to purchase this week..."
                                {...register('message')}
                            />
                            {errors.message && (
                                <p className="text-sm text-red-400">{errors.message.message}</p>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex items-start gap-2 text-sm text-slate-400">
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
                            className="border-slate-600 text-slate-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isSubmitting}
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
