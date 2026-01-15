'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: 'buyer' | 'dealer' | 'admin';
    requireVerified?: boolean;
}

export function ProtectedRoute({
    children,
    requiredRole,
    requireVerified = false
}: ProtectedRouteProps) {
    const router = useRouter();
    const { isAuthenticated, isLoading, user, isVerified } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
                return;
            }

            if (requiredRole && user?.user_type !== requiredRole) {
                router.push('/dashboard');
                return;
            }

            if (requireVerified && !isVerified) {
                router.push('/verification-required');
                return;
            }
        }
    }, [isAuthenticated, isLoading, user, isVerified, requiredRole, requireVerified, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (requiredRole && user?.user_type !== requiredRole) {
        return null;
    }

    if (requireVerified && !isVerified) {
        return null;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
