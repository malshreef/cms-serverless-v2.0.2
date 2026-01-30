'use client';

import Image from 'next/image';
import Link from 'next/link';

interface RelatedArticle {
  id: number;
  title: string;
  excerpt?: string;
  description?: string;
  mainImage?: string;
  image?: string;
  s7b_article_image?: string;
  createdAt?: string;
  s7b_article_add_date?: string;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
  locale: string;
  isRTL: boolean;
}

export default function RelatedArticles({ articles, locale, isRTL }: RelatedArticlesProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section className="bg-sky-bg/20 py-16">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-3xl font-poppins font-bold text-charcoal mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            {locale === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.slice(0, 3).map((article) => {
              const image = article.mainImage || article.image || article.s7b_article_image;
              const date = article.createdAt || article.s7b_article_add_date;
              const description = article.excerpt || article.description;

              return (
                <Link
                  key={article.id}
                  href={`/${locale}/articles/${article.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  {image && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <Image
                        src={image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Date */}
                    {date && (
                      <p className={`text-sm text-muted-blue mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {formatDate(date)}
                      </p>
                    )}

                    {/* Title */}
                    <h3 className={`text-xl font-poppins font-semibold text-charcoal mb-3 line-clamp-2 group-hover:text-sky-cta transition-colors ${isRTL ? 'text-right' : 'text-left'}`}>
                      {article.title}
                    </h3>

                    {/* Description */}
                    {description && (
                      <p className={`text-muted-blue text-sm line-clamp-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {description}
                      </p>
                    )}

                    {/* Read More */}
                    <div className={`mt-4 flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 text-sky-cta font-medium text-sm group-hover:gap-3 transition-all`}>
                      <span>{locale === 'ar' ? 'اقرأ المزيد' : 'Read More'}</span>
                      <i className={`fa-solid fa-arrow-${isRTL ? 'left' : 'right'} text-xs`}></i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
