'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { AccountOverview } from '@/components/settings/AccountOverview';
import { useAuthStore } from '@/store/authStore';
import { dealerApi } from '@/lib/api/dealers';
import { ArrowLeft, CheckCircle, Trash2, AlertCircle, User, Building2, Bell, KeyRound, Shield } from 'lucide-react';
import type { Dealer } from '@/lib/types/dealer';

function SettingsContent() {
    const { user, updateProfile, isLoading: authLoading } = useAuthStore();
    const [dealer, setDealer] = useState<Dealer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        businessPhone: '',
        website: '',
    });

    useEffect(() => {
        const fetchDealerProfile = async () => {
            try {
                setIsLoading(true);
                const dealerData = await dealerApi.getProfile();
                setDealer(dealerData);
            } catch {
                // Error handled silently - dealer may not have completed onboarding
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            setFormData({
                firstName: user.profile?.first_name || '',
                lastName: user.profile?.last_name || '',
                phone: user.profile?.phone || '',
                businessPhone: '',
                website: '',
            });
            fetchDealerProfile();
        }
    }, [user]);

    useEffect(() => {
        if (dealer) {
            setFormData(prev => ({
                ...prev,
                businessPhone: dealer.phone || '',
                website: dealer.website || '',
            }));
        }
    }, [dealer]);

    const handleSave = async () => {
        try {
            // Profile data needs to be passed as-is, the API handles nested structure
            await updateProfile({
                profile: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            if (dealer) {
                await dealerApi.updateProfile({
                    phone: formData.businessPhone,
                    website: formData.website,
                });
            }

            toast.success('Settings saved successfully!');
            setIsEditing(false);
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error.message || 'Failed to save settings');
        }
    };

    if (!user || isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <header className="border-b border-border bg-background/95 backdrop-blur sticky top-16 z-40">
                    <div className="container mx-auto px-4 py-4">
                        <Skeleton className="h-6 w-48" />
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8 max-w-3xl">
                    <Skeleton className="h-32 w-full mb-6" />
                    <Skeleton className="h-64 w-full mb-6" />
                    <Skeleton className="h-48 w-full" />
                </main>
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
                        <Link href="/dealer" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Dashboard
                        </Link>
                        <span className="text-foreground font-semibold">Settings</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
                {/* Account Overview */}
                <AccountOverview user={user} />

                {/* Profile Settings */}
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Personal Profile
                        </CardTitle>
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                Edit
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">First Name</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-foreground">{formData.firstName || 'Not set'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Last Name</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-foreground">{formData.lastName || 'Not set'}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Phone</Label>
                            {isEditing ? (
                                <Input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            ) : (
                                <p className="text-foreground">{formData.phone || 'Not set'}</p>
                            )}
                        </div>

                        {isEditing && (
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={authLoading}>
                                    {authLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dealership Settings */}
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Dealership Information
                        </CardTitle>
                        {dealer?.is_verified ? (
                            <Badge className="bg-green-600/20 text-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verified
                            </Badge>
                        ) : (
                            <Badge className="bg-yellow-600/20 text-yellow-500">
                                <AlertCircle className="w-3 h-3 mr-1" /> Pending Verification
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Business Name</Label>
                            <p className="text-foreground">{dealer?.business_name || 'Not set'}</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">License Number</Label>
                                <p className="text-foreground font-mono">{dealer?.license_number || 'N/A'}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Business Phone</Label>
                                <p className="text-foreground">{dealer?.phone || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Address</Label>
                            <p className="text-foreground">{dealer?.street_address || 'Not set'}</p>
                            <p className="text-foreground">{dealer?.city}, {dealer?.state} {dealer?.zip_code}</p>
                        </div>
                        {dealer?.website && (
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Website</Label>
                                <a href={dealer.website} target="_blank" rel="noopener" className="text-primary hover:underline">
                                    {dealer.website}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <KeyRound className="w-5 h-5" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground">Password</p>
                                <p className="text-sm text-muted-foreground">Last changed: Unknown</p>
                            </div>
                            <Button variant="outline" disabled>
                                Change Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Email Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'New offers', description: 'When buyers submit offers on your vehicles', enabled: true },
                            { label: 'Counter offers', description: 'When buyers respond to your counter offers', enabled: true },
                            { label: 'Expiring negotiations', description: 'Warning before negotiations expire', enabled: true },
                            { label: 'Daily summary', description: 'Daily email with activity summary', enabled: false },
                        ].map((pref, i) => (
                            <div key={i} className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-foreground font-medium">{pref.label}</p>
                                    <p className="text-sm text-muted-foreground">{pref.description}</p>
                                </div>
                                <button
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pref.enabled ? 'bg-primary' : 'bg-muted'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pref.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-foreground font-medium">Deactivate Account</p>
                                <p className="text-sm text-muted-foreground">Temporarily hide your listings and pause offers</p>
                            </div>
                            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                                Deactivate
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-foreground font-medium">Delete Account</p>
                                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                            </div>
                            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default function DealerSettingsPage() {
    return (
        <ProtectedRoute requiredRole="dealer">
            <SettingsContent />
        </ProtectedRoute>
    );
}
