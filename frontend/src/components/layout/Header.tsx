'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, X, ChevronDown, User, Settings, LogOut, Car, MessageSquare, LayoutDashboard, Heart } from 'lucide-react';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';

interface HeaderProps {
    variant?: 'default' | 'transparent';
    className?: string;
}

const mainNavItems = [
    { label: 'Browse Cars', href: '/vehicles' },
    { label: 'Dealers', href: '/for-dealers', showOnlyOnHome: true },
    { label: 'How It Works', href: '/how-it-works', hideWhenLoggedIn: true },
];

const dealerNavItems = [
    { label: 'Dashboard', href: '/dealer', icon: LayoutDashboard },
    { label: 'Inventory', href: '/dealer/inventory', icon: Car },
    { label: 'Offers', href: '/dealer/offers', icon: MessageSquare },
];

const buyerNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Negotiations', href: '/negotiations', icon: MessageSquare },
    { label: 'Saved', href: '/saved', icon: Heart },
];

/**
 * Header Component - Global navigation
 */
export function Header({ variant = 'default', className }: HeaderProps) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, isDealer, isBuyer, isLoading } = useAuth();
    const { logout } = useAuthStore();

    const isTransparent = variant === 'transparent';

    const handleLogout = async () => {
        await logout();
    };

    const userNavItems = isDealer ? dealerNavItems : buyerNavItems;
    const userInitials = user?.profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full transition-all duration-300',
                isTransparent
                    ? 'bg-transparent'
                    : 'bg-background/95 backdrop-blur-md border-b border-border',
                className
            )}
        >
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Logo
                        variant="full"
                        size="md"
                        theme={isTransparent ? 'dark' : 'auto'}
                    />

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {/* Main nav items - filter showOnlyOnHome items unless on homepage */}
                        {mainNavItems
                            .filter(item => (!item.showOnlyOnHome || pathname === '/') && (!item.hideWhenLoggedIn || !user))
                            .map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                                        pathname === item.href || pathname.startsWith(item.href.split('?')[0])
                                            ? 'text-primary bg-primary/10'
                                            : isTransparent
                                                ? 'text-white/80 hover:text-white hover:bg-white/10'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}

                        {/* User-specific nav items when logged in */}
                        {user && (
                            <>
                                <span className={cn(
                                    "mx-2 h-5 w-px",
                                    isTransparent ? "bg-white/30" : "bg-border"
                                )} />
                                {userNavItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
                                            pathname === item.href || pathname.startsWith(item.href)
                                                ? 'text-primary bg-primary/10'
                                                : isTransparent
                                                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                        )}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>

                    {/* Right Side - Notifications, Auth Buttons or User Menu */}
                    <div className="flex items-center gap-2">
                        {isLoading ? (
                            <div className="w-24 h-9 bg-muted animate-pulse rounded-lg" />
                        ) : user ? (
                            <>
                                {/* Notification Bell */}
                                <NotificationDropdown variant={isTransparent ? 'transparent' : 'default'} />

                                {/* User Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                'flex items-center gap-2',
                                                isTransparent ? 'text-white hover:bg-white/10' : ''
                                            )}
                                        >
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                                    {userInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="hidden sm:inline text-sm font-medium">
                                                {user.profile?.first_name || 'Account'}
                                            </span>
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <div className="px-2 py-1.5">
                                            <p className="text-sm font-medium">{user.profile?.first_name || 'User'}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        {userNavItems.map((item) => (
                                            <DropdownMenuItem key={item.href} asChild>
                                                <Link href={item.href} className="flex items-center gap-2">
                                                    <item.icon className="w-4 h-4" />
                                                    {item.label}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings" className="flex items-center gap-2">
                                                <Settings className="w-4 h-4" />
                                                Settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            isTransparent ? 'text-white hover:bg-white/10' : ''
                                        )}
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-primary hover:bg-primary/90">
                                        Sign Up
                                    </Button>
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn('md:hidden', isTransparent ? 'text-white' : '')}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-background">
                    <nav className="container mx-auto px-4 py-4 space-y-1">
                        {mainNavItems
                            .filter(item => (!item.showOnlyOnHome || pathname === '/') && (!item.hideWhenLoggedIn || !user))
                            .map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'block px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                                        pathname === item.href
                                            ? 'text-primary bg-primary/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    )}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        {user && (
                            <>
                                <div className="border-t border-border my-2" />
                                {userNavItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}

export default Header;
