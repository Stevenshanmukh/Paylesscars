'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { Home, Search, Heart, MessageSquare, User } from 'lucide-react';

interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
    authRequired?: boolean;
}

const navItems: NavItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/vehicles', icon: Search, label: 'Search' },
    { href: '/saved', icon: Heart, label: 'Saved', authRequired: true },
    { href: '/negotiations', icon: MessageSquare, label: 'Offers', authRequired: true },
    { href: '/dashboard', icon: User, label: 'Account', authRequired: true },
];

export function MobileNav() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();

    // Filter items based on auth state for unauth users
    const visibleItems = navItems.map(item => ({
        ...item,
        // If auth required and not authenticated, link to login
        href: item.authRequired && !isAuthenticated ? '/login' : item.href,
    }));

    // Don't show on dealer pages (they have their own nav)
    if (pathname?.startsWith('/dealer')) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {visibleItems.map((item) => {
                    const isActive =
                        item.href === '/'
                            ? pathname === '/'
                            : pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] rounded-lg transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <item.icon className={cn(
                                'w-6 h-6 transition-transform',
                                isActive && 'scale-110'
                            )} />
                            <span className={cn(
                                'text-xs font-medium',
                                isActive && 'font-semibold'
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Safe area padding for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}

export default MobileNav;
