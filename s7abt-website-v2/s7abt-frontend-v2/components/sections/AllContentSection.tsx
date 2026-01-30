'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import ArticleCard from '../ui/ArticleCard';
import { Article, articlesApi } from '@/lib/api/client';

interface AllContentSectionProps {
  articles: Article[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function AllContentSection({ articles: initialArticles, onLoadMore, hasMore = true }: AllContentSectionProps) {
  const t = useTranslations('allContent');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  // Track displayed articles and load state
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>(initialArticles.slice(0, 9));
  const [loadMoreCount, setLoadMoreCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleLoadMore = async () => {
    if (loadMoreCount === 0) {
      // First click: Load 9 more articles from API (total 18)
      setLoading(true);
      try {
        const response = await articlesApi.getAll(18, 0); // Load 18 total
        const newArticles = response.articles || [];
        setDisplayedArticles(newArticles.slice(0, 18)); // Show up to 18
        setLoadMoreCount(1);
      } catch (error) {
        console.error('Error loading more articles:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Second click: Redirect to articles page
      router.push(`/${locale}/articles`);
    }
  };

  // Determine if we should show the button
  const shouldShowButton = initialArticles.length >= 9 && hasMore;

  return (
    <section className="py-16 bg-sky-bg/20">
      <div className="container mx-auto px-6">
        {/* Header - Centered */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-charcoal mb-4">{t('title')}</h2>
          <p className="text-xl text-muted-blue">{t('subtitle')}</p>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayedArticles.map((article) => (
            <ArticleCard
              key={article.s7b_article_id}
              article={article}
            />
          ))}
        </div>

        {/* Load More Button / View All Link */}
        {shouldShowButton && (
          <div className="text-center">
            {loadMoreCount === 0 ? (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8 py-4 border-2 border-sky-cta text-sky-cta rounded-full hover:bg-sky-cta hover:text-white transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </span>
                ) : (
                  t('loadMore')
                )}
              </button>
            ) : (
              <button
                onClick={handleLoadMore}
                className="px-8 py-4 bg-sky-cta text-white rounded-full hover:bg-sky-cta-hover transition-all duration-200 font-semibold inline-flex items-center gap-2"
              >
                <span>{locale === 'ar' ? 'عرض جميع المقالات' : 'View All Articles'}</span>
                <i className={`fa-solid fa-arrow-${isRTL ? 'left' : 'right'}`}></i>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

