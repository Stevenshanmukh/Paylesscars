'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNotificationStore, type Notification } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Bell,
    DollarSign,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Trophy,
    TrendingDown,
    AlertCircle,
    Car,
} from 'lucide-react';

interface NotificationDropdownProps {
    className?: string;
    variant?: 'default' | 'transparent';
}

// Map notification types to icons and colors
const notificationConfig: Record<string, { icon: typeof Bell; color: string; bgColor: string }> = {
    offer_received: { icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
    offer_accepted: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    offer_rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    counter_offer: { icon: RefreshCw, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    negotiation_expired: { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    deal_completed: { icon: Trophy, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    price_drop: { icon: TrendingDown, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    vehicle_sold: { icon: Car, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    dealer_verified: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
};

function NotificationItem({
    notification,
    onRead,
}: {
    notification: Notification;
    onRead: () => void;
}) {
    const router = useRouter();
    const config = notificationConfig[notification.notification_type] || {
        icon: AlertCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
    };
    const Icon = config.icon;

    // Calculate time ago
    const getTimeAgo = () => {
        const now = new Date();
        const created = new Date(notification.created_at);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleClick = () => {
        onRead();
        // Navigate based on notification data
        const data = notification.data || {};
        if (data.negotiation_id) {
            router.push(`/negotiations/${data.negotiation_id}`);
        } else if (data.vehicle_id) {
            router.push(`/vehicles/${data.vehicle_id}`);
        }
    };

    return (
        <DropdownMenuItem
            className={cn(
                'flex items-start gap-3 p-3 cursor-pointer',
                !notification.is_read && 'bg-primary/5'
            )}
            onClick={handleClick}
        >
            {/* Icon */}
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.bgColor)}>
                <Icon className={cn('w-4 h-4', config.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium line-clamp-1', !notification.is_read && 'text-foreground')}>
                    {notification.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{getTimeAgo()}</p>
            </div>

            {/* Unread indicator */}
            {!notification.is_read && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
            )}
        </DropdownMenuItem>
    );
}

export function NotificationDropdown({ className, variant = 'default' }: NotificationDropdownProps) {
    const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } =
        useNotificationStore();

    const isTransparent = variant === 'transparent';

    // Fetch notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Get recent notifications (max 5)
    const recentNotifications = notifications.slice(0, 5);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'relative',
                        isTransparent ? 'text-white hover:bg-white/10' : '',
                        className
                    )}
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white border-2 border-background"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary h-auto py-1 px-2"
                            onClick={(e) => {
                                e.preventDefault();
                                markAllAsRead();
                            }}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Loading...
                        </div>
                    ) : recentNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        recentNotifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={() => markAsRead(notification.id)}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 5 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-2 text-center">
                            <Button variant="ghost" size="sm" className="text-xs text-primary w-full">
                                View all notifications
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default NotificationDropdown;
