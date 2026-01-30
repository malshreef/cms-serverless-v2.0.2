'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { formatImageUrl } from '@/lib/utils/image';
import { calculateReadingTime, formatReadingTime } from '@/lib/utils/readingTime';
import { getArticleImageAlt, getPlaceholderImageAlt } from '@/lib/utils/altText';

interface ArticleCardProps {
  id?: number;
  title?: string;
  brief?: string;
  image?: string;
  date?: string;
  category?: string;
  featured?: boolean;
  isPremium?: boolean;
  author?: string;
  body?: string;
  article?: any; // Support passing entire article object
}

const PLACEHOLDER_IMAGE = '/placeholders/placeholder2.png';

export default function ArticleCard(props: ArticleCardProps) {
  // Support both individual props and article object
  const {
    id: propId,
    title: propTitle,
    brief: propBrief,
    image: propImage,
    date: propDate,
    category: propCategory,
    featured = false,
    isPremium: propIsPremium = false,
    author: propAuthor,
    body: propBody,
    article,
  } = props;

  // Use article object if provided, otherwise use individual props
  const id = article?.s7b_article_id ?? propId!;
  const title = article?.s7b_article_title ?? propTitle!;
  const brief = article?.s7b_article_brief ?? propBrief!;
  const image = article?.s7b_article_image ?? propImage;
  const date = article?.s7b_article_add_date ?? propDate!;
  const category = article?.sections?.[0]?.s7b_section_name ?? propCategory;
  const isPremium = article?.isPremium ?? propIsPremium;
  const author = article?.s7b_user_name ?? propAuthor;
  const body = article?.s7b_article_body ?? propBody ?? '';

  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Calculate reading time
  // Priority: 1. API provided time (backend now calculates this), 2. Calculated from body, 3. Reasonable default
  let readingTimeMinutes = article?.reading_time || article?.readingTime || 0;

  if (!readingTimeMinutes) {
    if (body && body.length > 100) {
      // Calculate from body if available (detail pages)
      readingTimeMinutes = calculateReadingTime(body);
    } else {
      // Fallback to 5 minutes if no reading time provided
      // This should rarely happen now that backend calculates reading time
      readingTimeMinutes = 5;
    }
  }

  // Ensure minimum 1 minute
  readingTimeMinutes = Math.max(1, readingTimeMinutes);

  const readingTimeText = formatReadingTime(readingTimeMinutes, locale);

  // State to track if the main image failed to load
  const [imageError, setImageError] = useState(false);

  // Format the image URL from the API
  const formattedImage = formatImageUrl(image);

  // Determine which image to display - use placeholder if no image or error
  const displayImage = imageError || !formattedImage ? PLACEHOLDER_IMAGE : formattedImage;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Use ar-EG for Arabic to ensure Gregorian calendar (ar-SA uses Hijri by default)
    // This prevents hydration mismatch between server and client
    return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Generate a color for the category badge based on category name
  const getCategoryColor = (cat?: string) => {
    if (!cat) return 'bg-blue-100 text-blue-700 border border-blue-300';
    const colors = [
      'bg-blue-100 text-blue-700 border border-blue-300',
      'bg-orange-100 text-orange-700 border border-orange-300',
      'bg-purple-100 text-purple-700 border border-purple-300',
      'bg-green-100 text-green-700 border border-green-300',
      'bg-pink-100 text-pink-700 border border-pink-300',
    ];
    return colors[cat.charCodeAt(0) % colors.length];
  };

  return (
    <Link href={`/${locale}/articles/${id}`}>
      <div className="card-hover bg-white rounded-2xl overflow-hidden border-2 border-gray-200 h-full flex flex-col shadow-md hover:shadow-xl transition-all duration-300">
        {/* Image Container */}
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-sky-100 to-sky-50">
          {featured && (
            <span className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} z-10 px-4 py-2 bg-gradient-to-r from-sky-cta to-sky-500 text-white text-sm font-bold rounded-full shadow-lg`}>
              {locale === 'ar' ? '⭐ مميز' : '⭐ Featured'}
            </span>
          )}
          {isPremium && (
            <span className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-10 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold rounded-full shadow-lg`}>
              {locale === 'ar' ? '👑 مميز' : '👑 Premium'}
            </span>
          )}
          <Image
            src={displayImage}
            alt={imageError || !formattedImage ? getPlaceholderImageAlt() : getArticleImageAlt(title, locale)}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={handleImageError}
            priority={featured}
          />
        </div>

        {/* Content */}
        <div className={`p-6 flex flex-col flex-grow ${isRTL ? 'text-right' : 'text-left'}`}>
          {/* Category Badge */}
          {category && (
            <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-full mb-4 w-fit ${getCategoryColor(category)}`}>
              {category}
            </span>
          )}

          {/* Title */}
          <h3 className="text-lg lg:text-xl font-bold text-charcoal mb-3 line-clamp-2 hover:text-sky-cta transition-colors">
            {title}
          </h3>

          {/* Brief */}
          <p className="text-muted-blue text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">
            {brief}
          </p>

          {/* Meta Footer */}
          <div className={`flex flex-col gap-3 pt-4 border-t border-gray-200`}>
            {/* Author Name */}
            {author && (
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2 text-sm text-charcoal font-medium`}>
                <i className="fa-solid fa-user-pen text-sky-cta"></i>
                <span>{author}</span>
              </div>
            )}

            {/* Date and Reading Time */}
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-3 text-xs text-muted-blue`}>
              <span className="flex items-center gap-1">
                <i className="fa-regular fa-calendar text-sky-cta"></i>
                {formatDate(date)}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <i className="fa-regular fa-clock text-sky-cta"></i>
                {readingTimeText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

