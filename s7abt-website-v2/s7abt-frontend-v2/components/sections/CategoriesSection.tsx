'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Section } from '@/lib/api/client';
import { useMemo } from 'react';

interface CategoriesSectionProps {
  sections: Section[];
}

export default function CategoriesSection({ sections }: CategoriesSectionProps) {
  const t = useTranslations('categories');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Sort sections by order field
  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => {
      const orderA = a.s7b_section_order ?? 999;
      const orderB = b.s7b_section_order ?? 999;
      return orderA - orderB;
    });
  }, [sections]);

  // Map sections to specific colors and icons for visual distinction
  const sectionStyles = [
    { bg: 'from-blue-50 to-blue-100', border: 'border-blue-300', badge: 'bg-blue-500', icon: 'fa-cloud', hover: 'hover:from-blue-100 hover:to-blue-200' },
    { bg: 'from-orange-50 to-orange-100', border: 'border-orange-300', badge: 'bg-orange-500', icon: 'fa-server', hover: 'hover:from-orange-100 hover:to-orange-200' },
    { bg: 'from-purple-50 to-purple-100', border: 'border-purple-300', badge: 'bg-purple-500', icon: 'fa-database', hover: 'hover:from-purple-100 hover:to-purple-200' },
    { bg: 'from-green-50 to-green-100', border: 'border-green-300', badge: 'bg-green-500', icon: 'fa-shield-halved', hover: 'hover:from-green-100 hover:to-green-200' },
    { bg: 'from-pink-50 to-pink-100', border: 'border-pink-300', badge: 'bg-pink-500', icon: 'fa-lock', hover: 'hover:from-pink-100 hover:to-pink-200' },
    { bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-300', badge: 'bg-indigo-500', icon: 'fa-microchip', hover: 'hover:from-indigo-100 hover:to-indigo-200' },
  ];

  // Truncate description to fit design (max 120 characters)
  const truncateDescription = (text: string | undefined, maxLength: number = 120): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-charcoal mb-4">{t('title')}</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sky-cta to-sky-400 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-muted-blue max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedSections.slice(0, 6).map((section, index) => {
            const style = sectionStyles[index % sectionStyles.length];
            const description = section.s7b_section_description || section.s7b_section_brief || '';
            const truncatedDescription = truncateDescription(description, 110);
            
            return (
              <Link
                key={section.s7b_section_id}
                href={`/${locale}/sections/${section.s7b_section_id}`}
                className="group h-full"
              >
                <div className={`card-hover bg-gradient-to-br ${style.bg} ${style.hover} ${style.border} border-2 p-8 rounded-2xl h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
                  {/* Icon Container */}
                  <div className={`w-20 h-20 ${style.badge} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <i className={`fa-solid ${style.icon} text-3xl text-white`}></i>
                  </div>

                  {/* Title */}
                  <h3 className={`text-2xl font-bold text-charcoal mb-4 group-hover:text-sky-cta transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                    {section.s7b_section_name}
                  </h3>

                  {/* Description from Database */}
                  <p className={`text-muted-blue mb-6 flex-grow text-sm leading-relaxed line-clamp-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {truncatedDescription || (locale === 'ar' 
                      ? 'استكشف مجموعة شاملة من المقالات المتخصصة في هذا المجال'
                      : 'Explore a comprehensive collection of specialized articles in this field'
                    )}
                  </p>

                  {/* Footer with Article Count and Arrow */}
                  <div className={`flex items-center justify-between pt-4 border-t ${style.border}`}>
                    <div className="flex items-center gap-2">
                      <span className={`${style.badge} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md`}>
                        {section.article_count || 0}
                      </span>
                      <span className="text-sm font-medium text-muted-blue">
                        {t('articles')}
                      </span>
                    </div>
                    <div className={`w-10 h-10 rounded-full ${style.badge} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                      <i className={`fa-solid fa-arrow-${isRTL ? 'left' : 'right'} text-white text-sm`}></i>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

