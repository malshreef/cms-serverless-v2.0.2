'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { getLogoAlt } from '@/lib/utils/altText';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();

  const navItems = [
    { href: '/', label: t('home') },
    { href: '/articles', label: t('articles') },
    { href: '/sections', label: t('sections') },
    { href: '/news', label: t('news') },
    { href: '/vision2030', label: t('vision2030') },
    { href: '/tags', label: t('tags') },
    { href: '/contact', label: t('contact') },
  ];

  const handleSubscribeClick = () => {
    // Scroll to the newsletter section at the bottom of the page
    const newsletterSection = document.getElementById('newsletter-section');
    if (newsletterSection) {
      newsletterSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border-blue transition-all duration-300">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo with Image and Text */}
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt={getLogoAlt(locale)}
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <div className="text-2xl font-bold text-charcoal">
              <span className="text-sky-cta">سحابة</span>
              <span className="text-charcoal"> الكلاود</span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className="text-charcoal hover:text-sky-cta transition-colors duration-200 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Subscribe Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSubscribeClick}
              className="hidden lg:block px-6 py-2 bg-sky-cta text-white rounded-full hover:bg-sky-cta-hover transition-colors duration-200 font-medium"
            >
              {t('subscribe')}
            </button>
            <button className="lg:hidden text-charcoal">
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

