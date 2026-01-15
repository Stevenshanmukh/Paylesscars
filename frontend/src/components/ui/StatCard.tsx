import Link from 'next/link';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string; // e.g., 'orange', 'indigo', 'teal', 'green'
    href?: string;
    description?: string;
}

export function StatCard({
    title,
    value,
    icon,
    color,
    href,
    description
}: StatCardProps) {
    // Map abstract color names to Tailwind classes
    const colorMap: Record<string, string> = {
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    };

    const colorClass = color ? colorMap[color] || colorMap['blue'] : colorMap['blue'];

    const content = (
        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-border">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-foreground">{value}</div>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
                <div className={cn("p-3 rounded-full flex items-center justify-center", colorClass)}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}
