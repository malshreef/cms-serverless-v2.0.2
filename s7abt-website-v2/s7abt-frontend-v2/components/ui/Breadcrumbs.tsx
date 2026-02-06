'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';

export interface BreadcrumbItem {
  label: string;
  href?: string; // undefined means current page (not clickable)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: 'light' | 'dark'; // light for colored backgrounds, dark for white backgrounds
}

export default function Breadcrumbs({ items, variant = 'dark' }: BreadcrumbsProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Generate JSON-LD structured data for SEO
  const generateStructuredData = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://s7abt-dubai.com';

    const itemListElement = items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${baseUrl}${item.href}` }),
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    };
  };

  if (items.length === 0) return null;

  // Color schemes based on variant
  const linkColors = variant === 'light'
    ? 'text-white/90 hover:text-white'
    : 'text-sky-cta hover:text-deep-blue';

  const currentPageColor = variant === 'light'
    ? 'text-white font-semibold'
    : 'text-deep-blue font-medium';

  const normalTextColor = variant === 'light'
    ? 'text-white/80'
    : 'text-muted-blue';

  const separatorColor = variant === 'light'
    ? 'text-white/60'
    : 'text-muted-blue/50';

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData()),
        }}
      />

      {/* Visual Breadcrumbs */}
      <nav
        aria-label={locale === 'ar' ? 'مسار التنقل' : 'Breadcrumb'}
        className="mb-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <ol className="flex items-center flex-wrap gap-2 text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isClickable = !isLast && item.href;

            return (
              <li
                key={index}
                className="flex items-center gap-2"
              >
                {isClickable ? (
                  <Link
                    href={item.href!}
                    className={`${linkColors} transition-colors duration-200 hover:underline`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? currentPageColor : normalTextColor}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}

                {/* Separator */}
                {!isLast && (
                  <span
                    className={separatorColor}
                    aria-hidden="true"
                  >
                    {isRTL ? '←' : '→'}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
