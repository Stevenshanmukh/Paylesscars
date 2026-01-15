'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    const router = useRouter();

    return (

        <PageContainer>
            <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="text-center max-w-md">
                    {/* 404 Number */}
                    <div className="relative mb-8">
                        <span className="text-[180px] font-bold text-muted/20 leading-none select-none">
                            404
                        </span>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                                <Search className="w-12 h-12 text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <h1 className="text-3xl font-bold text-foreground mb-4">
                        Page Not Found
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Oops! It seems the page you're looking for has driven off.
                        Let's get you back on track.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/">
                            <Button size="lg" variant="primary">
                                <Home className="w-5 h-5 mr-2" />
                                Go Home
                            </Button>
                        </Link>
                        <Link href="/vehicles">
                            <Button size="lg" variant="outline">
                                <Search className="w-5 h-5 mr-2" />
                                Browse Vehicles
                            </Button>
                        </Link>
                    </div>

                    {/* Back Link */}
                    <div className="mt-8">
                        <button
                            onClick={() => router.back()}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go back to previous page
                        </button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
