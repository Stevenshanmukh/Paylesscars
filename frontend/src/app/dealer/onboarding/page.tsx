'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { dealerApi } from '@/lib/api/dealers';

// Validation schemas for each step
const step1Schema = z.object({
    business_name: z.string().min(2, 'Business name is required'),
    dealer_license_number: z.string().min(3, 'License number is required'),
    business_phone: z.string().min(10, 'Valid phone number required'),
});

const step2Schema = z.object({
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zip_code: z.string().min(5, 'ZIP code is required'),
});

const step3Schema = z.object({
    website: z.string().url().optional().or(z.literal('')),
    description: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema> & z.infer<typeof step3Schema>;

const STEPS = [
    { number: 1, title: 'Business Info', description: 'Basic dealership information' },
    { number: 2, title: 'Location', description: 'Business address' },
    { number: 3, title: 'Profile', description: 'Additional details' },
    { number: 4, title: 'Documents', description: 'Verification documents' },
];

function OnboardingContent() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<FormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const step1Form = useForm({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            business_name: formData.business_name ?? '',
            dealer_license_number: formData.dealer_license_number ?? '',
            business_phone: formData.business_phone ?? '',
        }
    });
    const step2Form = useForm({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            address: formData.address ?? '',
            city: formData.city ?? '',
            state: formData.state ?? '',
            zip_code: formData.zip_code ?? '',
        }
    });
    const step3Form = useForm({
        resolver: zodResolver(step3Schema),
        defaultValues: {
            website: formData.website ?? '',
            description: formData.description ?? '',
        }
    });

    const handleStep1 = step1Form.handleSubmit((data) => {
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep(2);
    });

    const handleStep2 = step2Form.handleSubmit((data) => {
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep(3);
    });

    const handleStep3 = step3Form.handleSubmit((data) => {
        setFormData(prev => ({ ...prev, ...data }));
        setCurrentStep(4);
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Call the real dealer registration API
            // Field names must match backend Dealer model
            await dealerApi.register({
                business_name: formData.business_name || '',
                license_number: formData.dealer_license_number || '',
                phone: formData.business_phone || '',
                street_address: formData.address || '',
                city: formData.city || '',
                state: formData.state || '',
                zip_code: formData.zip_code || '',
                website: formData.website || '',
                description: formData.description || '',
            });

            toast.success('Application submitted! We\'ll review it within 24-48 hours.');
            router.push('/dealer');
        } catch (error: any) {
            console.error('Registration error:', error);
            let errorMessage = 'Failed to submit application';

            if (error?.response?.data) {
                const data = error.response.data;
                if (typeof data === 'object') {
                    // Collect all error messages from the object
                    const messages = Object.entries(data).map(([key, value]) => {
                        const message = Array.isArray(value) ? value.join(', ') : String(value);
                        return `${key.replace(/_/g, ' ')}: ${message}`;
                    });
                    if (messages.length > 0) {
                        errorMessage = messages.join('\n');
                    }
                } else if (data.error) {
                    errorMessage = data.error;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            {/* Sub-header */}
            <header className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-foreground">
                        Payless<span className="text-primary">Cars</span>
                    </Link>
                    <span className="text-muted-foreground">Dealer Registration</span>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between">
                        {STEPS.map((step) => (
                            <div
                                key={step.number}
                                className={`flex-1 text-center ${step.number < currentStep ? 'text-green-500' :
                                    step.number === currentStep ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                            >
                                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${step.number < currentStep ? 'bg-green-600' :
                                    step.number === currentStep ? 'bg-primary' : 'bg-muted'
                                    }`}>
                                    {step.number < currentStep ? (
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span className="text-white font-medium">{step.number}</span>
                                    )}
                                </div>
                                <p className="text-sm font-medium hidden md:block">{step.title}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 h-2 bg-muted rounded-full">
                        <div
                            className="h-2 bg-primary rounded-full transition-all"
                            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step 1: Business Info */}
                {currentStep === 1 && (
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Business Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleStep1} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Business Name *</Label>
                                    <Input
                                        {...step1Form.register('business_name')}
                                        placeholder="Premier Auto Sales"
                                    />
                                    {step1Form.formState.errors.business_name && (
                                        <p className="text-destructive text-sm">{step1Form.formState.errors.business_name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Dealer License Number *</Label>
                                    <Input
                                        {...step1Form.register('dealer_license_number')}
                                        placeholder="DLR-12345"
                                    />
                                    {step1Form.formState.errors.dealer_license_number && (
                                        <p className="text-destructive text-sm">{step1Form.formState.errors.dealer_license_number.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Business Phone *</Label>
                                    <Input
                                        {...step1Form.register('business_phone')}
                                        placeholder="(555) 123-4567"
                                    />
                                    {step1Form.formState.errors.business_phone && (
                                        <p className="text-destructive text-sm">{step1Form.formState.errors.business_phone.message}</p>
                                    )}
                                </div>
                                <Button type="submit" variant="primary" className="w-full">
                                    Continue
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Location */}
                {currentStep === 2 && (
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Business Location</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleStep2} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Street Address *</Label>
                                    <Input
                                        {...step2Form.register('address')}
                                        placeholder="123 Auto Drive"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City *</Label>
                                        <Input
                                            {...step2Form.register('city')}
                                            placeholder="Los Angeles"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State *</Label>
                                        <Input
                                            {...step2Form.register('state')}
                                            placeholder="CA"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>ZIP Code *</Label>
                                    <Input
                                        {...step2Form.register('zip_code')}
                                        placeholder="90210"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                                        Back
                                    </Button>
                                    <Button type="submit" variant="primary" className="flex-1">
                                        Continue
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Profile */}
                {currentStep === 3 && (
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Dealership Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleStep3} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Website (optional)</Label>
                                    <Input
                                        {...step3Form.register('website')}
                                        placeholder="https://www.yourdealer.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (optional)</Label>
                                    <textarea
                                        {...step3Form.register('description')}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Tell buyers about your dealership..."
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                                        Back
                                    </Button>
                                    <Button type="submit" variant="primary" className="flex-1">
                                        Continue
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Documents */}
                {currentStep === 4 && (
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Verification Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-muted-foreground">
                                Upload the following documents to verify your dealership. This helps build trust with buyers.
                            </p>

                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                    <svg className="w-10 h-10 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-foreground font-medium">Dealer License</p>
                                    <p className="text-sm text-muted-foreground mb-2">PDF, JPG or PNG up to 10MB</p>
                                    <Button variant="outline">
                                        Choose File
                                    </Button>
                                </div>

                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                    <svg className="w-10 h-10 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <p className="text-foreground font-medium">Business License</p>
                                    <p className="text-sm text-muted-foreground mb-2">PDF, JPG or PNG up to 10MB</p>
                                    <Button variant="outline">
                                        Choose File
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                                    Back
                                </Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700">
                                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                By submitting, you agree to our Terms of Service and Privacy Policy.
                                Verification typically takes 24-48 hours.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}

export default function DealerOnboardingPage() {
    return (
        <ProtectedRoute>
            <OnboardingContent />
        </ProtectedRoute>
    );
}
