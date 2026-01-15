'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
    className?: string;
}

const footerLinks = {
    shop: {
        title: 'Shop',
        links: [
            { label: 'Browse Cars', href: '/vehicles' },
            { label: 'Dealer Directory', href: '/dealers' },
            { label: 'Sell Your Car', href: '/sell' },
        ],
    },
    research: {
        title: 'Research',
        links: [
            { label: 'Car Reviews', href: '/reviews' },
            { label: 'Compare Cars', href: '/compare' },
            { label: 'Buying Guides', href: '/guides' },
            { label: 'Price Trends', href: '/trends' },
            { label: 'Best Deals', href: '/deals' },
        ],
    },
    company: {
        title: 'Company',
        links: [
            { label: 'About Us', href: '/about' },
            { label: 'How It Works', href: '/how-it-works' },
            { label: 'Careers', href: '/careers' },
            { label: 'Press', href: '/press' },
            { label: 'Blog', href: '/blog' },
            { label: 'Contact', href: '/contact' },
        ],
    },
    dealers: {
        title: 'For Dealers',
        links: [
            { label: 'Dealer Sign Up', href: '/register?type=dealer' },
            { label: 'Dealer Login', href: '/login' },
            { label: 'Dealer Resources', href: '/dealer-resources' },
            { label: 'Pricing', href: '/dealer-pricing' },
        ],
    },
};

const socialLinks = [
    { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { label: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
];

const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Accessibility', href: '/accessibility' },
    { label: 'Sitemap', href: '/sitemap' },
];

/**
 * Footer Component - Global footer with navigation and newsletter
 */
export function Footer({ className }: FooterProps) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={cn('bg-muted text-muted-foreground border-t border-border', className)}>
            {/* Newsletter Section */}
            <div className="border-b border-border">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                            Ready to find your next car?
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Get the latest deals and car buying tips delivered to your inbox.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground flex-1"
                            />
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
                                Subscribe
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
                    {/* Logo & Info Column */}
                    <div className="col-span-2">
                        <Logo
                            variant="full"
                            size="lg"
                            href="/"
                        />
                        <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                            The smarter way to buy a car. Get upfront pricing and negotiate directly with verified dealers.
                        </p>

                        {/* Contact Info */}
                        <div className="mt-6 space-y-2">
                            <a href="tel:1-800-CAR-DEAL" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Phone className="w-4 h-4" />
                                1-800-CAR-DEAL
                            </a>
                            <a href="mailto:support@paylesscars.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Mail className="w-4 h-4" />
                                support@paylesscars.com
                            </a>
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3 mt-6">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([key, section]) => (
                        <div key={key}>
                            <h4 className="text-sm font-semibold text-foreground mb-4">{section.title}</h4>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} Payless Cars. All rights reserved.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                            {legalLinks.map((link, index) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
