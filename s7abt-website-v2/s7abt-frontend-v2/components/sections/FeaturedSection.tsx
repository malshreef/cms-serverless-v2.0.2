'use client';

import { useTranslations, useLocale } from 'next-intl';
import ArticleCard from '../ui/ArticleCard';
import { Article } from '@/lib/api/client';

interface FeaturedSectionProps {
  articles: Article[];
}

export default function FeaturedSection({ articles }: FeaturedSectionProps) {
  const t = useTranslations('featured');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'} max-w-3xl mx-auto`}>
          <h2 className="text-4xl font-bold text-charcoal mb-4">{t('title')}</h2>
          <p className="text-xl text-muted-blue">{t('subtitle')}</p>
        </div>

        {/* Featured Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard
              key={article.s7b_article_id}
              id={article.s7b_article_id}
              title={article.s7b_article_title}
              brief={article.s7b_article_brief}
              image={article.s7b_article_image}
              date={article.s7b_article_add_date}
              category={article.sections?.[0]?.s7b_section_name}
              featured={true}
              isPremium={article.isPremium || false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

