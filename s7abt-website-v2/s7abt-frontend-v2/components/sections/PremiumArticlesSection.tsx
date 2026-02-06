'use client';

import { Article } from '@/lib/api/client';
import Image from 'next/image';
import Link from 'next/link';
import { formatImageUrl } from '@/lib/utils/image';
import { formatReadingTime } from '@/lib/utils/readingTime';
import { getArticleImageAlt, getPlaceholderImageAlt } from '@/lib/utils/altText';

interface PremiumArticlesSectionProps {
  articles: Article[];
  locale: string;
}

export default function PremiumArticlesSection({ articles, locale }: PremiumArticlesSectionProps) {
  const isRTL = locale === 'ar';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Split articles: first one is featured, rest are small cards
  const featuredArticle = articles[0];
  const smallArticles = articles.slice(1, 4); // Get 3 small articles

  if (!featuredArticle) return null;

  return (
    <section className="py-16 bg-sky-bg/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className={`text-center mb-12 ${isRTL ? 'rtl' : 'ltr'}`}>
          <h2 className="text-4xl font-bold text-charcoal mb-4">
            {locale === 'ar' ? 'المحتوى المميز' : 'Premium Content'}
          </h2>
          <p className="text-lg text-muted-blue max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'اكتشف مقالاتنا الأكثر شعبية ورواجاً المختارة خصيصاً لك'
              : 'Discover our most popular and trending articles, specially selected for you'}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Featured Article (Large Card) */}
          <Link
            href={`/${locale}/articles/${featuredArticle.s7b_article_id}`}
            className="card-hover bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            {/* Featured Image */}
            <div className="relative h-64">
              <Image
                src={formatImageUrl(featuredArticle.s7b_article_image) || '/placeholders/placeholder2.png'}
                alt={formatImageUrl(featuredArticle.s7b_article_image) ? getArticleImageAlt(featuredArticle.s7b_article_title, locale) : getPlaceholderImageAlt()}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Premium Badge */}
              <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'}`}>
                <span className="px-3 py-1 bg-sky-cta text-white rounded-full text-sm font-medium">
                  {locale === 'ar' ? 'مميز' : 'Premium'}
                </span>
              </div>
            </div>

            {/* Featured Content */}
            <div className="p-6">
              {/* Meta Info */}
              <div className={`flex items-center mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {featuredArticle.sections && featuredArticle.sections.length > 0 && (
                  <span className="px-3 py-1 bg-light-azure/50 text-link-blue rounded-full text-xs font-medium">
                    {featuredArticle.sections[0].s7b_section_name}
                  </span>
                )}
                <span className={`text-muted-blue text-sm ${isRTL ? 'mr-3' : 'ml-3'}`}>
                  {formatReadingTime(featuredArticle.reading_time || 5, locale)}
                </span>
              </div>

              {/* Title */}
              <h3 className={`text-2xl font-bold text-charcoal mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                {featuredArticle.s7b_article_title}
              </h3>

              {/* Description */}
              <p className={`text-muted-blue leading-relaxed mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {featuredArticle.s7b_article_brief}
              </p>

              {/* Footer */}
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-sky-cta to-link-blue flex items-center justify-center text-white text-sm font-bold ${isRTL ? 'mr-3' : 'ml-3'}`}>
                    {featuredArticle.s7b_article_title.charAt(0)}
                  </div>
                  <span className="text-sm text-muted-blue">
                    {featuredArticle.s7b_user_name || (locale === 'ar' ? 'كاتب مجهول' : 'Unknown Author')}
                  </span>
                </div>
                <span className="text-link-blue hover:text-sky-cta font-medium cursor-pointer">
                  {locale === 'ar' ? 'اقرأ المزيد' : 'Read More'}
                </span>
              </div>
            </div>
          </Link>

          {/* Small Articles (3 Cards) */}
          <div className="space-y-6">
            {smallArticles.map((article) => (
              <Link
                key={article.s7b_article_id}
                href={`/${locale}/articles/${article.s7b_article_id}`}
                className="card-hover bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 block"
              >
                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Image */}
                  <div className="w-32 h-32 flex-shrink-0 relative">
                    <Image
                      src={formatImageUrl(article.s7b_article_image) || '/placeholders/placeholder2.png'}
                      alt={formatImageUrl(article.s7b_article_image) ? getArticleImageAlt(article.s7b_article_title, locale) : getPlaceholderImageAlt()}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>

                  {/* Content */}
                  <div className={`p-4 flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {/* Category Badge */}
                    {article.sections && article.sections.length > 0 && (
                      <span className="inline-block px-2 py-1 bg-soft-blue/50 text-link-blue rounded-full text-xs font-medium mb-2">
                        {article.sections[0].s7b_section_name}
                      </span>
                    )}

                    {/* Title */}
                    <h4 className="text-lg font-semibold text-charcoal mb-2 line-clamp-2">
                      {article.s7b_article_title}
                    </h4>

                    {/* Brief */}
                    <p className="text-sm text-muted-blue mb-2 line-clamp-2">
                      {article.s7b_article_brief}
                    </p>

                    {/* Reading Time */}
                    <span className="text-xs text-muted-blue">
                      {formatReadingTime(article.reading_time || 5, locale)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

