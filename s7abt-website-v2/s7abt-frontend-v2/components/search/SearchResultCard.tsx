'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { formatImageUrl } from '@/lib/utils/image';
import { getArticleImageAlt, getPlaceholderImageAlt } from '@/lib/utils/altText';

interface SearchResultCardProps {
  article: any;
  searchQuery?: string;
}

const PLACEHOLDER_IMAGE = '/placeholders/placeholder2.png';

export default function SearchResultCard({ article, searchQuery }: SearchResultCardProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [imageError, setImageError] = useState(false);

  // Function to highlight search term in text
  const highlightSearchTerm = (text: string, query: string | undefined) => {
    if (!text || !query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={index} className="bg-sky-cta/20 text-sky-cta px-1 rounded font-medium">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // Image URL with proper fallback
  const hasValidImage = article.s7b_article_image && 
                        article.s7b_article_image !== 'no-image.png' && 
                        article.s7b_article_image.trim() !== '';
  
  const imageUrl: string = (hasValidImage && !imageError
    ? formatImageUrl(article.s7b_article_image) ?? PLACEHOLDER_IMAGE
    : PLACEHOLDER_IMAGE);

  const category = article.sections?.[0]?.s7b_section_name || 'عام';
  
  // Get author name
  const author = article.s7b_user_name || (locale === 'ar' ? 'كاتب مجهول' : 'Unknown Author');
  
  const views = article.views || 0;
  const likes = article.likes || 0;
  const comments = article.comments?.length || 0;

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (isRTL) {
      if (diffHours < 1) return 'منذ دقائق';
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
      return date.toLocaleDateString('ar-SA');
    } else {
      if (diffHours < 1) return 'minutes ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US');
    }
  };

  return (
    <Link href={`/${locale}/articles/${article.s7b_article_id}`} className="block w-full">
      <article className="bg-white rounded-2xl border border-border-blue p-6 hover:shadow-lg cursor-pointer transition-all duration-300 w-full">
        <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-6`}>
          {/* Article Image */}
          <div className="relative w-48 h-32 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={imageUrl === PLACEHOLDER_IMAGE ? getPlaceholderImageAlt() : getArticleImageAlt(article.s7b_article_title, locale)}
              fill
              className="rounded-xl object-cover"
              onError={() => setImageError(true)}
              unoptimized={imageUrl === PLACEHOLDER_IMAGE}
            />
          </div>

          {/* Article Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {/* Category and Date */}
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse justify-end' : 'flex-row'} gap-4 mb-3`}>
                <span className="px-3 py-1 bg-sky-bg text-sky-cta text-sm font-medium rounded-full border border-border-blue">
                  {category}
                </span>
                {article.s7b_article_add_date && (
                  <span className="text-muted-blue text-sm">
                    {formatDate(article.s7b_article_add_date)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className={`text-2xl font-bold text-charcoal mb-3 hover:text-sky-cta transition-colors line-clamp-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {searchQuery ? highlightSearchTerm(article.s7b_article_title, searchQuery) : article.s7b_article_title}
              </h3>

              {/* Snippet with highlighted search term - from article content */}
              {article.snippet ? (
                <p className={`text-muted-blue mb-4 leading-relaxed line-clamp-3 text-base ${isRTL ? 'text-right' : 'text-left'}`}>
                  {searchQuery ? highlightSearchTerm(article.snippet, searchQuery) : article.snippet}
                </p>
              ) : article.s7b_article_brief && (
                <p className={`text-muted-blue mb-4 leading-relaxed line-clamp-2 text-base ${isRTL ? 'text-right' : 'text-left'}`}>
                  {searchQuery ? highlightSearchTerm(article.s7b_article_brief, searchQuery) : article.s7b_article_brief}
                </p>
              )}
            </div>

            {/* Author and Stats */}
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between mt-auto`}>
              {/* Author */}
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                <div className="w-10 h-10 rounded-full bg-sky-cta flex items-center justify-center text-white font-bold text-sm">
                  {author.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-charcoal">{author}</span>
              </div>

              
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

