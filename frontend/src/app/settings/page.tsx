'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AccountOverview } from '@/components/settings/AccountOverview';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, User, Trash2, Bell, Shield, KeyRound } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

function BuyerSettingsContent() {
    const { user, updateProfile, isLoading } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });

    useEffect(() => {
        if (user?.profile) {
            setFormData({
                firstName: user.profile.first_name || '',
                lastName: user.profile.last_name || '',
                phone: user.profile.phone || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        try {
            // Profile data needs to be passed as nested structure
            await updateProfile({
                profile: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
            toast.success('Settings saved!');
            setIsEditing(false);
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error.message || 'Failed to save settings');
        }
    };

    if (!user) {
        return (
            <PageContainer>
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <Skeleton className="h-64 w-96" />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                </Link>
                <h1 className="text-3xl font-bold font-display text-foreground">Settings</h1>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Account Overview */}
                <AccountOverview user={user} />

                {/* Profile */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Profile Information
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
                                <Label>First Name</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="First Name"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{formData.firstName || 'Not set'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Last Name"
                                    />
                                ) : (
                                    <p className="text-foreground font-medium">{formData.lastName || 'Not set'}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            {isEditing ? (
                                <Input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Phone Number"
                                />
                            ) : (
                                <p className="text-foreground font-medium">{formData.phone || 'Not set'}</p>
                            )}
                        </div>

                        {isEditing && (
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleSave} variant="primary" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
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

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Email Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'Counter offers', description: 'When dealers respond to your offers', enabled: true },
                            { label: 'Offer accepted', description: 'When your offer is accepted', enabled: true },
                            { label: 'Expiring negotiations', description: 'Reminder before negotiations expire', enabled: true },
                            { label: 'Price drops', description: 'When saved vehicles drop in price', enabled: false },
                        ].map((pref, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <div>
                                    <p className="font-medium text-foreground">{pref.label}</p>
                                    <p className="text-sm text-muted-foreground">{pref.description}</p>
                                </div>
                                <button
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pref.enabled ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform ${pref.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
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
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground">Delete Account</p>
                                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                            </div>
                            <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>

    );
}

export default function BuyerSettingsPage() {
    return (
        <ProtectedRoute>
            <BuyerSettingsContent />
        </ProtectedRoute>
    );
}
