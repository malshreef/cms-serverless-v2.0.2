'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function HeroSection() {
  const t = useTranslations('hero');
  const locale = useLocale();

  return (
    <section className="relative pt-32 pb-16 min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/Hero-bg2.png')`,          
          filter: 'brightness(0.4) blur(2px)',
        }}
      ></div>

      <div className="absolute inset-0 bg-black/50"></div>

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"></div>

      {/* Content */}
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            {t('title')}
          </h1>
          <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link href={`/${locale}/articles`} className="w-full sm:w-auto">
              <button className="w-full px-8 py-4 bg-sky-cta text-white rounded-full hover:bg-sky-500 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105">
                {t('startExploring')}
              </button>
            </Link>
            <Link href={`/${locale}/contact`} className="w-full sm:w-auto">
              <button className="w-full px-8 py-4 border-2 border-white text-white rounded-full hover:bg-white hover:text-gray-900 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl">
                {t('learnMore')}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Animated Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/70 text-sm font-medium">{locale === 'ar' ? 'اسحب للأسفل' : 'Scroll down'}</span>
          <div className="animate-bounce">
            <i className="fa-solid fa-chevron-down text-white/70 text-xl"></i>
          </div>
        </div>
      </div>
    </section>
  );
}

