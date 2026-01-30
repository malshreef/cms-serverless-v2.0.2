'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import ArticleCard from '@/components/ui/ArticleCard';
import { getAuthorImageAlt } from '@/lib/utils/altText';

// ✅ API ENDPOINTS - Configure in environment variables
const NEW_TAGS_API_URL = process.env.NEXT_PUBLIC_TAGS_API_URL || 'https://<your-api-id>.execute-api.<region>.amazonaws.com/dev/GetArticlesByTagid';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://<your-s3-bucket>.s3.<region>.amazonaws.com';

// ✅ ARTICLES PER PAGE
const ARTICLES_PER_PAGE = 15;

interface Writer {
  s7b_user_id: number;
  s7b_user_username: string;
  s7b_user_display_name: string;  // ✅ Display name field
  s7b_user_name: string;
  s7b_user_email: string;
  s7b_user_image: string;
  s7b_user_brief: string;
  s7b_user_twitter: string;
  s7b_user_facebook: string;
  s7b_user_linkedin: string;
  articlesCount: number;
}

interface Article {
  s7b_article_id: number;
  s7b_article_title: string;
  s7b_article_brief: string;
  s7b_article_image: string;
  s7b_article_add_date: string;
  s7b_section_title: string;
  s7b_section_id: number;
  s7b_user_name: string;  // This will be the display name from API
  s7b_user_display_name?: string;  // Backup field
  reading_time?: number;
}

interface WriterPageProps {
  params: {
    id: string;
  };
}

export default function WriterPage({ params }: WriterPageProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  const [writer, setWriter] = useState<Writer | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch writer details
  useEffect(() => {
    const fetchWriter = async () => {
      try {
        const response = await fetch(`${WRITERS_BASE_URL}/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch writer details');
        }

        const data = await response.json();
        setWriter(data.writer);
      } catch (err) {
        console.error('Error fetching writer:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchWriter();
  }, [params.id]);

  // Fetch articles by writer
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${WRITERS_BASE_URL}/${params.id}/articles?page=${currentPage}&pageSize=${ARTICLES_PER_PAGE}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }

        const data = await response.json();
        
        // Append new articles when loading more
        if (currentPage === 1) {
          setArticles(data.articles || []);
        } else {
          setArticles(prev => [...prev, ...(data.articles || [])]);
        }
        
        setTotalPages(data.pagination?.totalPages || 1);
        setHasMore(data.pagination?.hasMore || false);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [params.id, currentPage]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {locale === 'ar' ? 'حدث خطأ' : 'Error'}
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Writer Header Section */}
        {writer && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-8`}>
              {/* Writer Image */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-blue-100">
                {writer.s7b_user_image ? (
                  <Image
                    src={`${IMAGE_BASE_URL}${writer.s7b_user_image}`}
                    alt={getAuthorImageAlt(writer.s7b_user_display_name || writer.s7b_user_name, locale)}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center" role="img" aria-label={getAuthorImageAlt(writer.s7b_user_display_name || writer.s7b_user_name, locale)}>
                    <span className="text-white text-4xl font-bold">
                      {(writer.s7b_user_display_name || writer.s7b_user_name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Writer Info */}
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {/* ✅ DISPLAY NAME - This is the key change */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {writer.s7b_user_display_name || writer.s7b_user_name}
                </h1>
                
                {/* Username (optional, smaller text) */}
                {writer.s7b_user_username && (
                  <p className="text-sm text-gray-500 mb-3">
                    @{writer.s7b_user_username}
                  </p>
                )}

                {/* Writer Brief */}
                {writer.s7b_user_brief && (
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {writer.s7b_user_brief}
                  </p>
                )}

                {/* Article Count */}
                <div className="flex items-center gap-2 text-blue-600 font-medium mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>
                    {locale === 'ar' 
                      ? `${writer.articlesCount} ${writer.articlesCount === 1 ? 'مقال' : 'مقالات'}`
                      : `${writer.articlesCount} ${writer.articlesCount === 1 ? 'Article' : 'Articles'}`
                    }
                  </span>
                </div>

                {/* Social Links */}
                {(writer.s7b_user_twitter || writer.s7b_user_facebook || writer.s7b_user_linkedin) && (
                  <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
                    {writer.s7b_user_twitter && (
                      <a
                        href={writer.s7b_user_twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-500 transition-colors"
                        aria-label="Twitter"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {writer.s7b_user_facebook && (
                      <a
                        href={writer.s7b_user_facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        aria-label="Facebook"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                    )}
                    {writer.s7b_user_linkedin && (
                      <a
                        href={writer.s7b_user_linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-700 transition-colors"
                        aria-label="LinkedIn"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Articles Section */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold text-gray-900 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {locale === 'ar' ? 'المقالات' : 'Articles'}
          </h2>

          {loading && currentPage === 1 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xl text-gray-500">
                {locale === 'ar' ? 'لا توجد مقالات' : 'No articles found'}
              </p>
            </div>
          ) : (
            <>
              {/* ✅ USE ARTICLECARD COMPONENT */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.s7b_article_id}
                    article={article}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{locale === 'ar' ? 'تحميل المزيد' : 'Load More'}</span>
                        <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back to Writers Button */}
        <div className="text-center mt-12">
          <Link
            href={`/${locale}/writers`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors font-medium"
          >
            <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{locale === 'ar' ? 'العودة إلى الكتّاب' : 'Back to Writers'}</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
