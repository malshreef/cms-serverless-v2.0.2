import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { newsApi } from '@/lib/api/client';
import { formatImageUrl } from '@/lib/utils/image';
import Pagination from '@/components/ui/Pagination';
import { setRequestLocale } from 'next-intl/server';
import { getNewsImageAlt, getPlaceholderImageAlt } from '@/lib/utils/altText';

interface NewsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewsPage({ params, searchParams }: NewsPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);
  const isRTL = locale === 'ar';

  // Pagination Logic
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const limit = 15; // Show 15 news items per page
  const offset = (page - 1) * limit;

  let news = [];
  let totalPages = 0;
  let error = null;

  try {
    const newsData = await newsApi.getAll(limit, offset);
    news = newsData.news || [];
    const totalNews = newsData.pagination?.total || 0;
    totalPages = Math.ceil(totalNews / limit);
  } catch (err) {
    console.error('Error fetching news:', err);
    error = 'Failed to load news';
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main className="min-h-screen">
      <Header />

      {/* Page Header */}
      <section className="gradient-hero pt-32 pb-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-charcoal mb-4">
            {locale === 'ar' ? 'الأخبار' : 'News'}
          </h1>
          <p className="text-xl text-muted-blue max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'ابق على اطلاع بأحدث الأخبار والتطورات'
              : 'Stay updated with the latest news and developments'}
          </p>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          {error ? (
            <div className="text-center py-12">
              <p className="text-xl text-red-500">{error}</p>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-blue">
                {locale === 'ar' ? 'لا توجد أخبار' : 'No news found'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-12"> {/* Increased spacing */}
                {news.map((newsItem: any) => (
                  <Link
                    key={newsItem.s7b_news_id}
                    href={`/${locale}/news/${newsItem.s7b_news_id}`}
                    className="group block"
                  >
                    <div className="card-hover bg-white rounded-2xl overflow-hidden border border-border-blue hover:shadow-2xl transition-all duration-300">
                      <div
                        className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-8`}
                      >
                        {/* Image */}
                        <div className="w-full md:w-80 h-64 md:h-auto flex-shrink-0 relative">
                          <Image
                            src={
                              formatImageUrl(newsItem.s7b_news_image) ||
                              '/placeholders/placeholder2.png'
                            }
                            alt={formatImageUrl(newsItem.s7b_news_image) ? getNewsImageAlt(newsItem.s7b_news_title, locale) : getPlaceholderImageAlt()}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 320px"
                          />
                        </div>

                        {/* Content */}
                        <div
                          className={`flex-1 p-8 flex flex-col justify-center ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          {/* Badge */}
                          <span className="inline-block px-3 py-1 bg-sky-cta text-white rounded-full text-sm font-medium mb-4 w-fit">
                            {locale === 'ar' ? 'خبر' : 'News'}
                          </span>

                          {/* Title */}
                          <h3 className="text-3xl font-bold text-charcoal mb-4 group-hover:text-sky-cta transition-colors line-clamp-2">
                            {newsItem.s7b_news_title}
                          </h3>

                          {/* Brief */}
                          <p className="text-lg text-muted-blue mb-6 line-clamp-3">
                            {newsItem.s7b_news_brief}
                          </p>

                          {/* Meta */}
                          <div
                            className={`flex items-center ${isRTL ? 'flex-row-reverse justify-end' : ''} gap-6 text-muted-blue`}
                          >
                            <div
                              className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-2`}
                            >
                              <i className="fa-regular fa-calendar"></i>
                              <span>{formatDate(newsItem.s7b_news_add_date)}</span>
                            </div>
                            <span className="text-sky-cta font-medium group-hover:underline">
                              {locale === 'ar' ? 'اقرأ المزيد' : 'Read More'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              <Pagination totalPages={totalPages} currentPage={page} />
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
