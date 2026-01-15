'use client';

import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
    return (
        <PageContainer>
            <div className="flex-1 flex items-center justify-center px-4 min-h-[calc(100vh-200px)]">
                <div className="text-center max-w-md">
                    {/* Error Icon */}
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-destructive" />
                    </div>

                    {/* Message */}
                    <h1 className="text-3xl font-bold text-foreground mb-4">
                        Something Went Wrong
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        We encountered an unexpected error. Don't worry, our team has been notified.
                    </p>

                    {/* Error Details (dev only) */}
                    {process.env.NODE_ENV === 'development' && error.message && (
                        <div className="mb-8 p-4 bg-muted/50 rounded-lg text-left">
                            <p className="text-xs text-muted-foreground font-mono break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" onClick={reset}>
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Try Again
                        </Button>
                        <Link href="/">
                            <Button size="lg" variant="outline">
                                <Home className="w-5 h-5 mr-2" />
                                Go Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
