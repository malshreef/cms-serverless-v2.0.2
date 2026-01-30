'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  locale: string;
  isRTL: boolean;
}

export default function Breadcrumb({ items, locale, isRTL }: BreadcrumbProps) {
  return (
    <nav
      className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 text-sm text-muted-blue mb-6`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}
        >
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-sky-cta transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-charcoal font-medium">{item.label}</span>
          )}
          
          {index < items.length - 1 && (
            <i className={`fa-solid fa-chevron-${isRTL ? 'left' : 'right'} text-xs`}></i>
          )}
        </div>
      ))}
    </nav>
  );
}
