import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DealerHero } from '@/components/dealers/DealerHero';
import { DealerBenefits } from '@/components/dealers/DealerBenefits';
import { DealerPricing } from '@/components/dealers/DealerPricing';
import { DealerTestimonials } from '@/components/dealers/DealerTestimonials';
import { DealerCTA } from '@/components/dealers/DealerCTA';

export default function ForDealersPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <DealerHero />

                {/* Benefits Section */}
                <DealerBenefits />

                {/* Pricing Tiers */}
                <DealerPricing />

                {/* Dealer Testimonials */}
                <DealerTestimonials />

                {/* Final CTA */}
                <DealerCTA />
            </main>

            <Footer />
        </div>
    );
}
