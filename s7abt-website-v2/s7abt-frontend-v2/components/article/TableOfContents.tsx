'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  locale: string;
  isRTL: boolean;
}

export default function TableOfContents({ locale, isRTL }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Wait for article body to render
    const timer = setTimeout(() => {
      const articleBody = document.getElementById('article-body');
      if (!articleBody) return;

      const headings = articleBody.querySelectorAll('h1, h2, h3');
      const items: TocItem[] = [];

      headings.forEach((heading, index) => {
        const id = heading.id || `heading-${index}`;
        const text = heading.textContent || '';
        const level = parseInt(heading.tagName.substring(1));

        if (!heading.id) {
          heading.id = id;
        }

        items.push({ id, text, level });
      });

      setTocItems(items);

      // Intersection Observer for active heading tracking
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: '-100px 0px -80% 0px' }
      );

      headings.forEach((heading) => observer.observe(heading));

      return () => {
        headings.forEach((heading) => observer.unobserve(heading));
      };
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-sky-bg/30 rounded-xl p-6 mb-[30px]">
      <h3 className={`text-lg font-poppins font-semibold text-charcoal mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        {locale === 'ar' ? 'محتويات المقال' : 'Table of Contents'}
      </h3>
      <nav>
        <ul className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
          {tocItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollToHeading(item.id)}
                className={`text-sm transition-all duration-200 block py-1 w-full
                  ${isRTL ? 'text-right' : 'text-left'}
                  ${activeId === item.id ? 'text-sky-cta font-semibold' : 'text-muted-blue hover:text-sky-cta'}
                  ${item.level > 2 ? (isRTL ? 'pr-4' : 'pl-4') : ''}
                  ${item.level > 2 ? 'text-xs' : ''}
                `}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
