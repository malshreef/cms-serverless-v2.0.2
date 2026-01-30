'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <footer className="bg-sky-bg/30 border-t border-border-blue py-16">
      <div className="container mx-auto px-6">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          {/* Brand */}
          <div>
            <div className="text-2xl font-bold text-charcoal mb-4">
              <span className="text-sky-cta">{locale === 'ar' ? 'سحابة الكلاود' : 'S7abt'}</span>
              {locale === 'ar' ? '' : '.com'}
            </div>
            <p className="text-muted-blue mb-6">{t('tagline')}</p>
            <div className={`flex ${isRTL ? 'flex-row-reverse justify-end' : ''} space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              <a href="https://x.com/s7abt_cloud" target='_blank' className="text-muted-blue hover:text-sky-cta transition-colors">
                <i className="fa-brands fa-twitter text-xl"></i>
              </a>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-semibold text-charcoal mb-4">{t('content')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/articles`} className="text-muted-blue hover:text-sky-cta transition-colors">
                  {t('allArticles')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/sections`} className="text-muted-blue hover:text-sky-cta transition-colors">
                  {t('sections')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/news`} className="text-muted-blue hover:text-sky-cta transition-colors">
                  {t('news')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/tags`} className="text-muted-blue hover:text-sky-cta transition-colors">
                  {t('tags')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold text-charcoal mb-4">{t('community')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/vision2030`} className="text-muted-blue hover:text-sky-cta transition-colors">
                  {t('vision2030')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-charcoal mb-4">{t('support')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/contact`} className="text-muted-blue hover:text-sky-cta transition-colors">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-muted-blue hover:text-sky-cta transition-colors">
                  {t('privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className={`pt-8 border-t border-border-blue ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-muted-blue text-sm">
            © 2025 {locale === 'ar' ? 'سحابة' : 'S7abt.com'}. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}

