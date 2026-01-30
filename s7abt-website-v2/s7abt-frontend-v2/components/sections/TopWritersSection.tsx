'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { writersApi, Writer } from '@/lib/api/client';
import { getAuthorImageAlt } from '@/lib/utils/altText';

export default function TopWritersSection() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const isRTL = locale === 'ar';

  useEffect(() => {
    fetchTopWriters();
  }, []);

  const fetchTopWriters = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await writersApi.getTopWriters();
      setWriters(data.writers);
    } catch (err) {
      console.error('Error fetching top writers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load writers');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Get default avatar if none provided
  const getAvatarUrl = (writer: Writer): string => {
    if (writer.avatarUrl) {
      return writer.avatarUrl;
    }
    // Return a default avatar based on user ID
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(writer.displayName)}&size=200&background=0EA5E9&color=fff`;
  };

  // Helper function to build social media URLs correctly
  const getSocialMediaUrl = (platform: 'twitter' | 'linkedin' | 'facebook', value: string | null): string | null => {
    if (!value) return null;

    // If it's already a full URL, return as is
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    // Remove @ symbol if present (common in Twitter handles)
    const cleanValue = value.startsWith('@') ? value.substring(1) : value;

    // Build the full URL based on platform
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/${cleanValue}`;
      case 'linkedin':
        return `https://linkedin.com/in/${cleanValue}`;
      case 'facebook':
        return `https://facebook.com/${cleanValue}`;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-sky-bg/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-charcoal mb-4">
              {locale === 'ar' ? 'تعرف على كتابنا' : 'Meet Our Writers'}
            </h2>
            <p className="text-lg text-muted-blue">
              {locale === 'ar' ? 'الأصوات وراء محتوانا الملهم' : 'The voices behind our inspiring content'}
            </p>
          </div>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-blue"></div>
            <p className="mt-4 text-muted-blue">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-sky-bg/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-charcoal mb-4">
              {locale === 'ar' ? 'تعرف على كتابنا' : 'Meet Our Writers'}
            </h2>
            <p className="text-lg text-muted-blue">
              {locale === 'ar' ? 'الأصوات وراء محتوانا الملهم' : 'The voices behind our inspiring content'}
            </p>
          </div>
          <div className="text-center text-red-500">
            <p>{locale === 'ar' ? 'عذراً، حدث خطأ في تحميل البيانات' : 'Sorry, an error occurred while loading data'}</p>
            <button 
              onClick={fetchTopWriters}
              className="mt-4 px-6 py-2 bg-sky-blue text-white rounded-lg hover:bg-sky-blue/90 transition-colors"
            >
              {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (writers.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-sky-bg/20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-charcoal mb-4">
            {locale === 'ar' ? 'تعرف على كتابنا' : 'Meet Our Writers'}
          </h2>
          <p className="text-lg text-muted-blue">
            {locale === 'ar' ? 'الأصوات وراء محتوانا الملهم' : 'The voices behind our inspiring content'}
          </p>
        </div>

        {/* Writers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {writers.map((writer) => (
            <div
              key={writer.id}
              className="card-hover bg-white rounded-xl p-6 text-center shadow-lg border border-border-blue/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Avatar */}
              <div className="relative w-20 h-20 mx-auto mb-4">
                <Image
                  src={getAvatarUrl(writer)}
                  alt={getAuthorImageAlt(writer.displayName, locale)}
                  fill
                  className="rounded-full object-cover"
                  sizes="80px"
                  unoptimized
                />
              </div>

              {/* Name and Bio */}
              <h3 className="text-xl font-semibold text-charcoal mb-2">
                {writer.displayName}
              </h3>
              {writer.bio && (
                <p className="text-sm text-muted-blue mb-4 line-clamp-2">
                  {writer.bio}
                </p>
              )}

              {/* Stats */}
              <div className={`flex justify-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 mb-4`}>
                <span className="text-xs text-muted-blue bg-sky-bg/50 px-3 py-1 rounded-full">
                  {writer.articlesCount} {locale === 'ar' ? 'مقال' : 'articles'}
                </span>
              </div>

              {/* Social Links */}
              <div className={`flex justify-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                {getSocialMediaUrl('twitter', writer.socialMedia.twitter) && (
                  <a
                    href={getSocialMediaUrl('twitter', writer.socialMedia.twitter)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-bg hover:bg-sky-blue hover:text-white transition-all duration-200"
                    aria-label="Twitter"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {getSocialMediaUrl('linkedin', writer.socialMedia.linkedin) && (
                  <a
                    href={getSocialMediaUrl('linkedin', writer.socialMedia.linkedin)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-bg hover:bg-sky-blue hover:text-white transition-all duration-200"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {getSocialMediaUrl('facebook', writer.socialMedia.facebook) && (
                  <a
                    href={getSocialMediaUrl('facebook', writer.socialMedia.facebook)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-bg hover:bg-sky-blue hover:text-white transition-all duration-200"
                    aria-label="Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
