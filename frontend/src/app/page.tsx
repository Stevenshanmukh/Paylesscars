import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import dynamic from 'next/dynamic';
import {
  Hero,
  TrustIndicators,
  HowItWorks,
  ValueProposition,
  PopularMakes,
  CallToAction,
  FeaturedVehicles,
  Testimonials,
} from '@/components/home';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Transparent variant for hero */}
      <Header variant="transparent" className="absolute top-0 left-0 right-0" />

      <main className="flex-1">
        {/* Hero Section with Search */}
        <Hero />

        {/* Trust Indicators - Stats Bar */}
        <TrustIndicators />

        {/* Featured Vehicles Carousel */}
        <FeaturedVehicles />

        {/* How It Works - 4 Step Process */}
        <HowItWorks />

        {/* Value Proposition - Why Payless Cars */}
        <ValueProposition />

        {/* Customer Testimonials */}
        <Testimonials />

        {/* Popular Makes Grid */}
        <PopularMakes />

        {/* Final Call to Action */}
        <CallToAction />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
