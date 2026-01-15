'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
    variant?: 'full' | 'icon' | 'wordmark';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    theme?: 'light' | 'dark' | 'auto';
    href?: string;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
}

/**
 * Payless Cars Logo Component
 * 
 * Hybrid Approach:
 * - Icon: High-quality PNG Image (for complex split-car design)
 * - Text: Native HTML/CSS (for perfect blending and theme adaptability)
 */
export function Logo({
    variant = 'full',
    size = 'md',
    theme = 'auto',
    href = '/',
    className,
    iconClassName,
    textClassName,
}: LogoProps) {
    const sizeConfig = {
        sm: { icon: 32, text: 'text-lg', gap: 'gap-2' },
        md: { icon: 48, text: 'text-xl', gap: 'gap-3' },
        lg: { icon: 64, text: 'text-2xl', gap: 'gap-4' },
        xl: { icon: 80, text: 'text-3xl', gap: 'gap-5' },
    };

    const { icon: iconSize, text: textSize, gap } = sizeConfig[size];

    // Theme logic for text color
    const textColor = theme === 'dark' ? 'text-white' :
        theme === 'light' ? 'text-[#1A237E]' :
            'text-[#1A237E] dark:text-white'; // Auto

    const content = (
        <div className={cn('flex items-center', gap, className)}>
            {/* Icon - Using Image for fidelity */}
            {(variant === 'full' || variant === 'icon') && (
                <div className={cn('relative flex-shrink-0', iconClassName)} style={{ width: iconSize, height: iconSize }}>
                    {/* Using next/image or standard img tag. Standard img often easier for simple component without needing width/height props predefined */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/payless-icon.png"
                        alt="Payless Cars Icon"
                        className="w-full h-full object-contain drop-shadow-sm"
                    />
                </div>
            )}

            {/* Wordmark - Using Text for blending */}
            {(variant === 'full' || variant === 'wordmark') && (
                <span className={cn('font-bold tracking-tight flex items-baseline leading-none select-none', textSize, textClassName)}>
                    <span className={cn(textColor)}>PAYLESS</span>
                    <span className="text-[#00BFA5] ml-1.5">CARS</span>
                </span>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="hover:opacity-90 transition-opacity inline-flex items-center">
                {content}
            </Link>
        );
    }

    return content;
}

/**
 * Logo for Dark Backgrounds
 */
export function LogoDark(props: Omit<LogoProps, 'theme'>) {
    return (
        <Logo
            {...props}
            theme="dark"
        />
    );
}

export default Logo;
