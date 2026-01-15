'use client';

import { cn } from "@/lib/utils";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface PageContainerProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
}

export function PageContainer({
    children,
    title,
    description,
    className
}: PageContainerProps) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <main className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full", className)}>
                {(title || description) && (
                    <div className="mb-8">
                        {title && (
                            <h1 className="text-3xl font-display font-bold text-foreground">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="mt-2 text-muted-foreground">{description}</p>
                        )}
                    </div>
                )}
                {children}
            </main>
            <Footer />
        </div>
    );
}
