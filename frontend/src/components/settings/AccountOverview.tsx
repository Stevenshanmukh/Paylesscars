'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, ShieldCheck, Calendar, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import type { User as UserType } from '@/lib/types/auth';

interface AccountOverviewProps {
    user: UserType;
}

const roleConfig = {
    buyer: {
        label: 'Buyer',
        icon: User,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
        borderColor: 'border-blue-500/20',
    },
    dealer: {
        label: 'Dealer',
        icon: Building2,
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-500',
        borderColor: 'border-emerald-500/20',
    },
    admin: {
        label: 'Administrator',
        icon: ShieldCheck,
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-500',
        borderColor: 'border-purple-500/20',
    },
};

export function AccountOverview({ user }: AccountOverviewProps) {
    const config = roleConfig[user.user_type] || roleConfig.buyer;
    const RoleIcon = config.icon;

    // Get initials for avatar
    const initials = user.profile
        ? `${user.profile.first_name?.[0] || ''}${user.profile.last_name?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
        : user.email[0].toUpperCase();

    // Format member since date
    const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-16 h-16 rounded-full ${config.bgColor} ${config.textColor} flex items-center justify-center text-xl font-bold border-2 ${config.borderColor}`}>
                        {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h2 className="text-xl font-semibold text-foreground">
                                {user.profile?.first_name && user.profile?.last_name
                                    ? `${user.profile.first_name} ${user.profile.last_name}`
                                    : 'Account Settings'}
                            </h2>
                            <Badge className={`${config.bgColor} ${config.textColor} border ${config.borderColor} gap-1`}>
                                <RoleIcon className="w-3.5 h-3.5" />
                                {config.label}
                            </Badge>
                            {user.is_verified ? (
                                <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Verified
                                </Badge>
                            ) : (
                                <Badge className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Unverified
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" />
                                {user.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Member since {memberSince}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default AccountOverview;
