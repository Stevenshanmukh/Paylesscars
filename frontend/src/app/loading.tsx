import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/PageContainer';

export default function Loading() {
    return (
        <PageContainer>
            {/* Page title skeleton */}
            <div className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Grid of card skeletons */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="rounded-xl border border-border overflow-hidden">
                        <Skeleton className="aspect-[4/3]" />
                        <div className="p-4 space-y-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex justify-between items-center pt-2">
                                <Skeleton className="h-7 w-24" />
                                <Skeleton className="h-9 w-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
