'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { useRedirectIfAuthenticated } from '@/lib/hooks/useAuth';
import { Logo } from '@/components/ui/logo';

const registerSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    password_confirm: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
    message: "Passwords don't match",
    path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { register: registerUser, isLoading, error } = useAuthStore();
    const [userType, setUserType] = useState<'buyer' | 'dealer'>('buyer');
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already authenticated
    useRedirectIfAuthenticated('/dashboard');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerUser({
                email: data.email,
                password: data.password,
                password_confirm: data.password_confirm,
                user_type: userType,
            });
            toast.success('Account created successfully!');

            if (userType === 'dealer') {
                router.push('/dealer/onboarding');
            } else {
                router.push('/dashboard');
            }
        } catch {
            toast.error(error || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-border">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Logo variant="full" size="lg" theme="auto" href="/" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground font-display">Create Account</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Join Payless Cars and start saving on your next car
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {/* User Type Tabs */}
                        <Tabs value={userType} onValueChange={(v) => setUserType(v as 'buyer' | 'dealer')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="buyer">
                                    I&apos;m a Buyer
                                </TabsTrigger>
                                <TabsTrigger value="dealer">
                                    I&apos;m a Dealer
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="buyer" className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                    Find your next car and negotiate the best price directly with dealers.
                                </p>
                            </TabsContent>
                            <TabsContent value="dealer" className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                    List your inventory and connect with serious buyers ready to negotiate.
                                </p>
                            </TabsContent>
                        </Tabs>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    placeholder="John"
                                    {...register('first_name')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    placeholder="Doe"
                                    {...register('last_name')}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••••"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Min 12 characters with uppercase, lowercase, and number
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password_confirm">Confirm Password</Label>
                            <Input
                                id="password_confirm"
                                type="password"
                                placeholder="••••••••••••"
                                {...register('password_confirm')}
                            />
                            {errors.password_confirm && (
                                <p className="text-sm text-destructive">{errors.password_confirm.message}</p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>

                        <p className="text-sm text-muted-foreground text-center">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                                Sign in
                            </Link>
                        </p>

                        <p className="text-xs text-muted-foreground text-center">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
