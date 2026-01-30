import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import ArticleContent from '@/components/article/ArticleContent';
import ReadingProgress from '@/components/article/ReadingProgress';
import SocialShare from '@/components/article/SocialShare';
import RelatedArticles from '@/components/article/RelatedArticles';
import Breadcrumb from '@/components/common/Breadcrumb';
import { articlesApi, usersApi } from '@/lib/api/client';
import { generateArticleStructuredData, generateBreadcrumbStructuredData, generateArticleMetadata } from '@/lib/seo';
import { calculateReadingTimeFromSections, formatReadingTime } from '@/lib/readingTime';

interface ArticlePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps) {
  const { locale, id } = await params;
  
  try {
    const articleId = parseInt(id, 10);
    const articleData = await articlesApi.getById(articleId);
    const article = articleData.article;

    if (!article) {
      return {
        title: 'Article Not Found',
      };
    }

    return generateArticleMetadata(article, locale);
  } catch (error) {
    return {
      title: 'Article Not Found',
    };
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  
  try {
    const articleId = parseInt(id, 10);
    const articleData = await articlesApi.getById(articleId);
    const article = articleData.article;

    if (!article) {
      notFound();
    }

    // Fetch author information dynamically
    let author = null;
    if (article.userId || article.s7b_user_id) {
      try {
        const authorData = await usersApi.getById(article.userId || article.s7b_user_id);
        author = authorData.user;
      } catch (error) {
        console.warn('Failed to fetch author data:', error);
      }
    }

    const isRTL = locale === 'ar';

    // Format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Get author initials
    const getAuthorInitials = (name: string) => {
      return name
        .split(' ')
        .map(n => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    // Calculate reading time
    const readingTime = article.sections
      ? calculateReadingTimeFromSections(article.sections, locale)
      : 12; // Default fallback

    // Author info
    const authorName = author?.name || author?.s7b_user_name || (locale === 'ar' ? 'أحمد محمد' : 'Ahmed Mohamed');
    const authorBrief = author?.brief || author?.s7b_user_brief || (locale === 'ar' 
      ? 'خبير تقني متخصص في الحوسبة السحابية مع أكثر من 10 سنوات من الخبرة'
      : 'Cloud Computing Expert with 10+ years of experience helping professionals'
    );
    const authorInitials = getAuthorInitials(authorName);

    // Breadcrumb items
    const breadcrumbItems = [
      { label: locale === 'ar' ? 'الرئيسية' : 'Home', href: `/${locale}` },
      { 
        label: article.section?.name || article.section?.s7b_section_name || (locale === 'ar' ? 'مقالات' : 'Articles'),
        href: article.section?.id ? `/${locale}/sections/${article.section.id}` : `/${locale}/articles`
      },
      { label: article.title || article.s7b_article_title },
    ];

    // Article URL for sharing
    const articleUrl = `https://s7abt.com/${locale}/articles/${article.id}`;

    // Structured data
    const articleStructuredData = generateArticleStructuredData(article, locale);
    const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbItems);

    return (
      <>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />

        <main className="min-h-screen bg-white">
          {/* Reading Progress Bar */}
          <ReadingProgress />

          <Header />

          {/* Article Hero Section with Gradient Background */}
          <section className="pt-28 pb-16 min-h-[700px] flex items-center" style={{
            background: 'linear-gradient(180deg, #E3F2FD 0%, #FFFFFF 100%)'
          }}>
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center">
                {/* Breadcrumb */}
                <div className="flex justify-center mb-6">
                  <Breadcrumb items={breadcrumbItems} locale={locale} isRTL={isRTL} />
                </div>

                {/* Category Badges */}
                {(article.section || article.sections) && (
                  <div className={`flex justify-center ${isRTL ? 'flex-row-reverse' : ''} gap-4 mb-6 flex-wrap`}>
                    {article.sections ? (
                      article.sections.map((section: any, index: number) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-sky-cta text-white rounded-full text-sm font-medium"
                        >
                          {section.name || section.s7b_section_name}
                        </span>
                      ))
                    ) : article.section && (
                      <span className="px-4 py-2 bg-sky-cta text-white rounded-full text-sm font-medium">
                        {article.section.name || article.section.s7b_section_name}
                      </span>
                    )}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-5xl lg:text-6xl font-poppins font-bold text-charcoal mb-6 leading-tight">
                  {article.title || article.s7b_article_title}
                </h1>

                {/* Brief/Subtitle */}
                {(article.excerpt || article.description || article.s7b_article_description) && (
                  <p className="text-xl text-muted-blue mb-8 leading-relaxed max-w-3xl mx-auto">
                    {article.excerpt || article.description || article.s7b_article_description}
                  </p>
                )}

                {/* Meta Information */}
                <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''} gap-8 text-muted-blue flex-wrap`}>
                  {/* Author Info */}
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-3`}>
                    <div className="w-12 h-12 bg-sky-cta rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {authorInitials}
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <div className="font-semibold text-charcoal">
                        {authorName}
                      </div>
                      <div className="text-sm">
                        {locale === 'ar' ? 'خبير تقني' : 'Tech Expert'}
                      </div>
                    </div>
                  </div>

                  {/* Published Date */}
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {locale === 'ar' ? 'تاريخ النشر' : 'Published'}
                    </div>
                    <div className="text-sm">{formatDate(article.createdAt || article.s7b_article_add_date)}</div>
                  </div>

                  {/* Reading Time */}
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {locale === 'ar' ? 'وقت القراءة' : 'Reading Time'}
                    </div>
                    <div className="text-sm">
                      {formatReadingTime(readingTime, locale)}
                    </div>
                  </div>

                  {/* Views */}
                  {article.views && (
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {locale === 'ar' ? 'المشاهدات' : 'Views'}
                      </div>
                      <div className="text-sm">
                        {article.views.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Main Content Area with Sidebar */}
          <div className="container mx-auto px-6 py-16 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className={`grid grid-cols-1 lg:grid-cols-4 gap-12 ${isRTL ? 'lg:grid-flow-dense' : ''}`}>
                
                {/* Sidebar */}
                <aside className={`lg:col-span-1 ${isRTL ? 'lg:col-start-4' : ''}`}>
                  <div className="sticky top-32 space-y-6">
                    {/* Table of Contents */}
                    <div className="bg-sky-bg/30 rounded-xl p-6">
                      <h3 className={`text-lg font-poppins font-semibold text-charcoal mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {locale === 'ar' ? 'محتويات المقال' : 'Table of Contents'}
                      </h3>
                      <nav id="table-of-contents">
                        <ul className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {/* TOC will be populated by client component */}
                        </ul>
                      </nav>
                    </div>

                    {/* Author Card */}
                    <div className="bg-white border border-border-blue rounded-xl p-6">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-sky-cta rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
                          {authorInitials}
                        </div>
                        <h4 className="text-lg font-poppins font-semibold text-charcoal mb-2">
                          {authorName}
                        </h4>
                        <p className="text-sm text-muted-blue mb-4">
                          {authorBrief}
                        </p>
                        {author && (
                          <div className={`flex justify-center ${isRTL ? 'flex-row-reverse' : ''} gap-3 mb-4`}>
                            {(author.twitter || author.s7b_user_twitter) && (
                              <a
                                href={author.twitter || author.s7b_user_twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-link-blue hover:text-sky-cta transition-colors"
                              >
                                <i className="fa-brands fa-twitter"></i>
                              </a>
                            )}
                            {(author.linkedin || author.s7b_user_linkedin) && (
                              <a
                                href={author.linkedin || author.s7b_user_linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-link-blue hover:text-sky-cta transition-colors"
                              >
                                <i className="fa-brands fa-linkedin"></i>
                              </a>
                            )}
                            {(author.facebook || author.s7b_user_facebook) && (
                              <a
                                href={author.facebook || author.s7b_user_facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-link-blue hover:text-sky-cta transition-colors"
                              >
                                <i className="fa-brands fa-facebook"></i>
                              </a>
                            )}
                          </div>
                        )}
                        <button className="w-full px-4 py-2 bg-sky-cta text-white rounded-full hover:bg-sky-cta-hover transition-colors text-sm font-medium">
                          {locale === 'ar' ? 'متابعة الكاتب' : 'Follow Author'}
                        </button>
                      </div>
                    </div>

                    {/* Share Section */}
                    <SocialShare
                      title={article.title || article.s7b_article_title}
                      url={articleUrl}
                      locale={locale}
                      isRTL={isRTL}
                    />
                  </div>
                </aside>

                {/* Article Content */}
                <article className={`lg:col-span-3 ${isRTL ? 'lg:col-start-1' : ''}`}>
                  <ArticleContent article={article} locale={locale} isRTL={isRTL} />
                </article>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <RelatedArticles
              articles={article.relatedArticles}
              locale={locale}
              isRTL={isRTL}
            />
          )}

          <Footer />
        </main>
      </>
    );
  } catch (error) {
    console.error('Error fetching article:', error);
    notFound();
  }
}
