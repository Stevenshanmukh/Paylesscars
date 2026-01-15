'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { formatPrice } from '@/lib/utils/formatters';

interface CounterOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    negotiationId: string;
    vehicleTitle: string;
    askingPrice: string;
    currentOffer: string;
    myRole: 'buyer' | 'dealer';
}

export function CounterOfferModal({
    isOpen,
    onClose,
    negotiationId,
    vehicleTitle,
    askingPrice,
    currentOffer,
    myRole,
}: CounterOfferModalProps) {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const askingPriceNum = parseFloat(askingPrice);
    const currentOfferNum = parseFloat(currentOffer);
    const amountNum = parseFloat(amount) || 0;
    const minOffer = askingPriceNum * 0.5;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (amountNum < minOffer) {
            toast.error(`Offer must be at least ${formatPrice(minOffer)} (50% of asking price)`);
            return;
        }

        setIsSubmitting(true);

        try {
            const { negotiationApi } = await import('@/lib/api/negotiations');
            await negotiationApi.submitOffer(negotiationId, {
                amount: amountNum.toString(),
                message: message
            });

            toast.success('Counter offer submitted!');
            setAmount('');
            setMessage('');
            onClose();
            router.refresh();
        } catch (err: any) {
            console.error('Failed to submit counter offer:', err);
            toast.error(err.message || 'Failed to submit counter offer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setMessage('');
        onClose();
    };

    const suggestedAmounts = myRole === 'dealer'
        ? [
            currentOfferNum, // Match buyer's offer
            Math.round((currentOfferNum + askingPriceNum) / 2), // Midpoint
            askingPriceNum * 0.95, // 5% off asking
        ]
        : [
            currentOfferNum * 0.95, // 5% below dealer's counter
            currentOfferNum * 0.97, // 3% below
            currentOfferNum, // Match dealer's offer
        ];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Submit Counter Offer</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {vehicleTitle}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6 py-4">
                        {/* Current Offer Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                            <div>
                                <p className="text-xs text-slate-400">Asking Price</p>
                                <p className="text-lg font-semibold text-white">
                                    {formatPrice(askingPrice)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Current Offer</p>
                                <p className="text-lg font-semibold text-white">
                                    {formatPrice(currentOffer)}
                                </p>
                            </div>
                        </div>

                        {/* Quick Suggestions */}
                        <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">Quick Select</Label>
                            <div className="flex gap-2">
                                {suggestedAmounts.map((suggested, i) => (
                                    <Button
                                        key={i}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className={`flex-1 ${amount === Math.round(suggested).toString()
                                            ? 'border-blue-500 bg-blue-900/30'
                                            : 'border-slate-600'
                                            }`}
                                        onClick={() => setAmount(Math.round(suggested).toString())}
                                    >
                                        {formatPrice(suggested)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-slate-200">
                                Your Counter Offer
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                                    $
                                </span>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-8 text-lg bg-slate-700/50 border-slate-600 text-white h-12"
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Minimum: {formatPrice(minOffer)}
                            </p>
                        </div>

                        {/* Difference indicator */}
                        {amountNum > 0 && (
                            <div className={`p-3 rounded-lg ${amountNum < currentOfferNum
                                ? 'bg-red-900/20 border border-red-800'
                                : amountNum > currentOfferNum
                                    ? 'bg-green-900/20 border border-green-800'
                                    : 'bg-slate-700/30'
                                }`}>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">vs Current Offer</span>
                                    <span className={
                                        amountNum < currentOfferNum
                                            ? 'text-red-400'
                                            : amountNum > currentOfferNum
                                                ? 'text-green-400'
                                                : 'text-slate-400'
                                    }>
                                        {amountNum === currentOfferNum
                                            ? 'Same'
                                            : amountNum > currentOfferNum
                                                ? `+${formatPrice(amountNum - currentOfferNum)}`
                                                : `-${formatPrice(currentOfferNum - amountNum)}`
                                        }
                                    </span>
                                </div>
                            </div>
                        )}

                        <Separator className="bg-slate-700" />

                        {/* Message */}
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-slate-200">
                                Message <span className="text-slate-500">(optional)</span>
                            </Label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add context to your offer..."
                                maxLength={500}
                            />
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
                            disabled={isSubmitting || !amount}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Offer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default CounterOfferModal;
