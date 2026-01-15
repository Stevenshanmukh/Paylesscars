import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';

export default function VehiclesLoading() {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Search bar skeleton */}
                <div className="mb-6">
                    <Skeleton className="h-12 w-full max-w-md" />
                </div>

                <div className="flex gap-8">
                    {/* Sidebar skeleton - desktop only */}
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    </aside>

                    {/* Main content */}
                    <div className="flex-1">
                        {/* Header row */}
                        <div className="flex justify-between items-center mb-6">
                            <Skeleton className="h-6 w-32" />
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-10 w-10" />
                            </div>
                        </div>

                        {/* Vehicle cards grid */}
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="rounded-xl border border-border overflow-hidden">
                                    <Skeleton className="aspect-[4/3]" />
                                    <div className="p-4 space-y-3">
                                        <div className="flex gap-2">
                                            <Skeleton className="h-6 w-16" />
                                            <Skeleton className="h-6 w-12" />
                                        </div>
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                        <div className="flex justify-between items-center pt-2">
                                            <Skeleton className="h-7 w-24" />
                                            <Skeleton className="h-9 w-24" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
