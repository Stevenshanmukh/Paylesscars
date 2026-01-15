'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ValueProposition } from '@/components/home/ValueProposition';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HowItWorksPage() {
    return (
        <PageContainer
            title="How Payless Cars Works"
            description="The easiest way to get a great deal on your next car, without the dealership hassle."
        >
            <HowItWorks className="bg-transparent pt-0" />

            <div className="py-12 border-t border-border">
                <ValueProposition className="bg-transparent pt-0" />
            </div>

            <div className="flex flex-col items-center justify-center py-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to start saving?</h2>
                <div className="flex gap-4">
                    <Link href="/vehicles">
                        <Button size="lg" className="bg-primary hover:bg-primary/90">
                            Browse Cars
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button size="lg" variant="outline">
                            Sign Up Free
                        </Button>
                    </Link>
                </div>
            </div>
        </PageContainer>
    );
}
