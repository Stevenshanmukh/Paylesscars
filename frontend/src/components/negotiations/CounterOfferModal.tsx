'use client';

import { useState, useMemo } from 'react';
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
    onSuccess?: () => void;
    negotiationId: string;
    vehicleTitle: string;
    askingPrice: string;
    currentOffer: string;
    myRole: 'buyer' | 'dealer';
}

interface Suggestion {
    label: string;
    amount: number;
    description?: string;
}

export function CounterOfferModal({
    isOpen,
    onClose,
    onSuccess,
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

    // Calculate savings from asking price
    const savingsAmount = askingPriceNum - amountNum;
    const savingsPercent = amountNum > 0 ? (savingsAmount / askingPriceNum) * 100 : 0;

    // Deal quality rating
    const getDealRating = (percent: number) => {
        if (percent <= 0) return { label: 'Above Asking', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', barColor: 'bg-red-500' };
        if (percent < 5) return { label: 'Near Asking', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', barColor: 'bg-orange-500' };
        if (percent < 10) return { label: 'Fair Price', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', barColor: 'bg-yellow-500' };
        if (percent < 15) return { label: 'Good Deal', color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', barColor: 'bg-green-500' };
        return { label: 'Great Deal', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', barColor: 'bg-emerald-500' };
    };

    const dealRating = getDealRating(savingsPercent);

    // Generate suggestions with labels - deduplicate
    const suggestions: Suggestion[] = useMemo(() => {
        const rawSuggestions: Suggestion[] = myRole === 'dealer'
            ? [
                { label: 'Match Offer', amount: Math.round(currentOfferNum), description: "Accept buyer's current offer" },
                { label: 'Midpoint', amount: Math.round((currentOfferNum + askingPriceNum) / 2), description: 'Split the difference' },
                { label: '5% Off', amount: Math.round(askingPriceNum * 0.95), description: '5% off asking price' },
            ]
            : [
                { label: '5% Less', amount: Math.round(currentOfferNum * 0.95), description: "5% below dealer's counter" },
                { label: '3% Less', amount: Math.round(currentOfferNum * 0.97), description: "3% below dealer's counter" },
                { label: 'Accept', amount: Math.round(currentOfferNum), description: "Match dealer's offer" },
            ];

        // Deduplicate by amount - keep first occurrence
        const seen = new Set<number>();
        return rawSuggestions.filter(s => {
            if (seen.has(s.amount)) return false;
            seen.add(s.amount);
            return true;
        });
    }, [myRole, currentOfferNum, askingPriceNum]);

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
            onSuccess?.(); // Trigger parent to refetch negotiation data
            onClose();
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err as any;
            console.error('Failed to submit counter offer:', error);
            toast.error(error.message || 'Failed to submit counter offer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setMessage('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-card border-border text-card-foreground max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Submit Counter Offer</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {vehicleTitle}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 py-4">
                        {/* Current Offer Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div>
                                <p className="text-xs text-muted-foreground">Asking Price</p>
                                <p className="text-lg font-semibold text-foreground price">
                                    {formatPrice(askingPrice)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Current Offer</p>
                                <p className="text-lg font-semibold text-primary price">
                                    {formatPrice(currentOffer)}
                                </p>
                            </div>
                        </div>

                        {/* Quick Suggestions with Labels */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-sm">Quick Select</Label>
                            <div className="flex gap-2">
                                {suggestions.map((suggestion, i) => (
                                    <Button
                                        key={i}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className={`flex-1 flex-col h-auto py-2 transition-all ${amount === suggestion.amount.toString()
                                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                                            : 'border-input hover:border-primary/50 hover:bg-muted/50'
                                            }`}
                                        onClick={() => setAmount(suggestion.amount.toString())}
                                        title={suggestion.description}
                                    >
                                        <span className="text-xs opacity-70 font-normal">{suggestion.label}</span>
                                        <span className="font-semibold">{formatPrice(suggestion.amount)}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-foreground">
                                Your Counter Offer
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                                    $
                                </span>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-8 text-lg bg-muted/50 border-input text-foreground h-12"
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Minimum: {formatPrice(minOffer)}
                            </p>
                        </div>

                        {/* Deal Quality Indicator (Savings from Asking Price) */}
                        {amountNum > 0 && amountNum <= askingPriceNum && (
                            <div className={`p-4 rounded-lg border ${dealRating.bgColor} ${dealRating.borderColor} transition-all`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Savings from Asking
                                    </span>
                                    <span className={`font-semibold ${dealRating.color}`}>
                                        {formatPrice(savingsAmount)} ({savingsPercent.toFixed(1)}%)
                                    </span>
                                </div>
                                {/* Progress bar */}
                                <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full ${dealRating.barColor} transition-all duration-300`}
                                        style={{ width: `${Math.min(savingsPercent * 4, 100)}%` }}
                                    />
                                </div>
                                {/* Deal rating badge */}
                                <div className="flex items-center gap-1.5">
                                    <svg className={`w-4 h-4 ${dealRating.color}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className={`text-sm font-medium ${dealRating.color}`}>
                                        {dealRating.label}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Difference from Current Offer indicator */}
                        {amountNum > 0 && (
                            <div className={`p-3 rounded-lg ${amountNum < currentOfferNum
                                ? 'bg-destructive/10 border border-destructive/30'
                                : amountNum > currentOfferNum
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-muted/30 border border-border'
                                }`}>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">vs Current Offer</span>
                                    <span className={
                                        amountNum < currentOfferNum
                                            ? 'text-destructive font-medium'
                                            : amountNum > currentOfferNum
                                                ? 'text-green-500 font-medium'
                                                : 'text-muted-foreground'
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

                        {/* Warning if offer is too low */}
                        {amountNum > 0 && amountNum < minOffer && (
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
                                Message <span className="text-muted-foreground">(optional)</span>
                            </Label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-muted/50 border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                            className="border-input text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            disabled={isSubmitting || !amount || amountNum < minOffer}
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
