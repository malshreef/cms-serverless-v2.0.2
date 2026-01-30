'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchFilterSection() {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const searchUrl = `/${locale}/search?q=${encodeURIComponent(searchTerm)}`;
      router.push(searchUrl);
    }
  };

  return (
    <section className="py-12 bg-white border-b border-border-blue">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="relative flex gap-3 items-center">
            <input
              type="text"
              placeholder={t('placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-4 border border-border-blue rounded-full focus:outline-none focus:border-sky-cta bg-sky-bg/30`}
            />
            <span className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-muted-blue`}>
              <i className="fa-solid fa-search"></i>
            </span>
            <button
              type="submit"
              className="px-8 py-4 bg-sky-cta text-white rounded-full font-medium hover:bg-sky-cta/90 transition-colors whitespace-nowrap"
            >
              بحث
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

