import { Search } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EmptyStateProps {
    title?: string;
    message?: string;
    actionLabel?: string;
    actionLink?: string;
    onAction?: () => void;
    icon?: React.ElementType;
    className?: string;
}

export function EmptyState({
    title = "No items found",
    message = "Try adjusting your filters or search criteria.",
    actionLabel,
    actionLink,
    onAction,
    icon: Icon = Search,
    className
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800", className)}>
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">{message}</p>

            {actionLabel && (
                actionLink ? (
                    <Link href={actionLink}>
                        <Button variant="outline">
                            {actionLabel}
                        </Button>
                    </Link>
                ) : onAction ? (
                    <Button onClick={onAction} variant="outline">
                        {actionLabel}
                    </Button>
                ) : null
            )}
        </div>
    );
}
