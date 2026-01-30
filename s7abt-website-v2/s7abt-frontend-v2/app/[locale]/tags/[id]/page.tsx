'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/search/Pagination';
import Breadcrumbs, { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';

// ✅ NEW API ENDPOINT - Configure in environment variables
const NEW_TAGS_API_URL = process.env.NEXT_PUBLIC_TAGS_API_URL || 'https://<your-api-id>.execute-api.<region>.amazonaws.com/dev/GetArticlesByTagid';

// ✅ IMAGE BASE URL - S3 Bucket - Configure in environment variables
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://<your-s3-bucket>.s3.<region>.amazonaws.com';

interface Tag {
  id: number;
  name: string;
  totalItems: number;
  totalArticles: number;
  articlesCount: number;
}

interface Article {
  id: number;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  sectionName: string;
  sectionId: number;
  authorName: string;
  authorDisplayName?: string;  // ✅ ADDED: For display name
  authorId: number;
  active: number;
}

interface PaginationData {
  page: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  offset: number;
  totalItems: number;
  hasMore: boolean;
  itemsOnPage: number;
  nextPage: number | null;
  previousPage: number | null;
}

interface TagDetailPageProps {
  params: {
    id: string;
  };
}

export default function TagDetailPage({ params }: TagDetailPageProps) {
  const locale = useLocale();
  const { id } = params;
  const [tag, setTag] = useState<Tag | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTagData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data with pagination
        const url = `${NEW_TAGS_API_URL}?tagId=${id}&page=${currentPage}&pageSize=15`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tag data');
        }

        const result = await response.json();
        
        if (result.success && result.data && result.data.tag) {
          const tagData = result.data.tag;
          
          setTag({
            id: tagData.id,
            name: tagData.name,
            totalItems: tagData.totalItems || 0,
            totalArticles: tagData.totalArticles || 0,
            articlesCount: tagData.articlesCount || 0,
          });

          setArticles(tagData.articles || []);
          
          // Set pagination data
          if (result.data.pagination) {
            setPagination(result.data.pagination);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching tag data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchTagData();
  }, [id, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of articles section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getImageUrl = (imageName: string): string => {
    // If already a full URL, return as is
    if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
      return imageName;
    }
    
    // If no-image placeholder, return empty string
    if (imageName === 'no-image.png' || !imageName) {
      return '';
    }
    
    // Construct full URL
    return `${IMAGE_BASE_URL}/${imageName}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh] pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-xl text-gray-600">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      ) : error || !tag ? (
        <div className="flex items-center justify-center min-h-[60vh] pt-32">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {locale === 'ar' ? 'حدث خطأ' : 'An Error Occurred'}
            </h2>
            <p className="text-gray-600 mb-6">{error || 'Tag not found'}</p>
            <Link
              href={`/${locale}/tags`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {locale === 'ar' ? 'العودة للمواضيع' : 'Back to Topics'}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-r from-sky-400 to-blue-500">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>

            <div className="container mx-auto px-6 relative">
              <div className="max-w-4xl text-center mx-auto">
                {/* Breadcrumbs with SEO markup */}
                <div className="flex justify-center mb-8">
                  <Breadcrumbs
                    items={[
                      {
                        label: locale === 'ar' ? 'الرئيسية' : 'Home',
                        href: `/${locale}`,
                      },
                      {
                        label: locale === 'ar' ? 'المواضيع' : 'Tags',
                        href: `/${locale}/tags`,
                      },
                      {
                        label: tag.name,
                      },
                    ]}
                    variant="light"
                  />
                </div>

                {/* Tag Badge */}
                <div className="inline-block mb-6">
                  <span className="inline-flex items-center px-6 py-3 rounded-full text-white font-bold text-2xl shadow-lg"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    #{tag.name}
                  </span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                  {locale === 'ar' 
                    ? `مقالات ${tag.name}` 
                    : `${tag.name} Articles`}
                </h1>
                <p className="text-xl text-white opacity-90 mb-8 leading-relaxed">
                  {locale === 'ar'
                    ? `اكتشف جميع المقالات المتعلقة بموضوع ${tag.name}`
                    : `Discover all articles related to ${tag.name}`}
                </p>
                <div className="flex items-center justify-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                    </svg>
                    <span>{tag.totalItems} {locale === 'ar' ? 'مقال' : 'Articles'}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Articles Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-6">
              {articles.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-400 text-6xl mb-4">📄</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">
                    {locale === 'ar' ? 'لا توجد مقالات' : 'No articles found'}
                  </h3>
                  <p className="text-gray-500 mb-8">
                    {locale === 'ar' 
                      ? 'لا توجد مقالات لهذا الموضوع حالياً' 
                      : 'No articles available for this topic yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Articles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((article) => {
                      const imageUrl = getImageUrl(article.image);
                      
                      return (
                        <article
                          key={article.id}
                          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <Link href={`/${locale}/articles/${article.id}`}>
                            {/* Article Image */}
                            <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={article.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Article Content */}
                            <div className="p-5">
                              {/* Section Badge */}
                              {article.sectionName && (
                                <div className="mb-3">
                                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                                    {article.sectionName}
                                  </span>
                                </div>
                              )}

                              {/* Title */}
                              <h2 className="text-xl font-bold mb-2 line-clamp-2 text-gray-800 hover:text-blue-600 transition-colors">
                                {article.title}
                              </h2>

                              {/* Description */}
                              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                {article.description}
                              </p>

                              {/* Meta Info */}
                              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                                <span className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {/* ✅ CHANGED: Use display name if available, fallback to authorName */}
                                  <span className="truncate">{article.authorDisplayName || article.authorName}</span>
                                </span>
                                <span className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs">{formatDate(article.createdAt)}</span>
                                </span>
                              </div>
                            </div>
                          </Link>
                        </article>
                      );
                    })}
                  </div>

                  {/* Pagination Component */}
                  {pagination && pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}

      <Footer />
    </main>
  );
}
