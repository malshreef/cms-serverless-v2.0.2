import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import ArticleContent from '@/components/article/ArticleContent';
import RelatedArticles from '@/components/article/RelatedArticles';
import ReadingProgress from '@/components/ui/ReadingProgress';
import ShareButtons from '@/components/article/ShareButtons';
import Breadcrumbs, { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { articlesApi, usersApi, searchApi, Article, ShareStats } from '@/lib/api/client';
import { calculateReadingTime, formatReadingTime } from '@/lib/readingTime';
import { Metadata, ResolvingMetadata } from 'next';
import { getAuthorImageAlt } from '@/lib/utils/altText';

interface ArticlePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata(
  { params }: ArticlePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale, id } = await params;

  try {
    const articleId = parseInt(id, 10);
    const { article } = await articlesApi.getById(articleId);

    if (!article) {
      return {
        title: 'Article Not Found',
      };
    }

    return {
      title: article.s7b_article_title,
      description: article.s7b_article_brief,
      openGraph: {
        title: article.s7b_article_title,
        description: article.s7b_article_brief,
        images: article.s7b_article_image ? [article.s7b_article_image] : [],
        type: 'article',
        publishedTime: article.s7b_article_add_date,
        authors: [article.s7b_user_name || 'S7abt Author'],
        tags: article.tags?.map(t => t.s7b_tags_name) || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.s7b_article_title,
        description: article.s7b_article_brief,
        images: article.s7b_article_image ? [article.s7b_article_image] : [],
      },
    };
  } catch (error) {
    return {
      title: 'S7abt Article',
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
    const shareStats: ShareStats = articleData.shareStats || {
      twitter: 0,
      linkedin: 0,
      whatsapp: 0,
      copy: 0,
      total: 0,
    };

    if (!article) {
      notFound();
    }

    // Author information is now included in the article object
    const author = {
      s7b_user_name: article.s7b_user_name,
      s7b_user_brief: article.s7b_user_brief,
      s7b_user_image: article.s7b_user_image,
      s7b_user_twitter: article.s7b_user_twitter,
      s7b_user_facebook: article.s7b_user_facebook,
      s7b_user_linkedin: article.s7b_user_linkedin,
    };

    // Fetch related articles based on tags
    let relatedArticles: Article[] = [];
    if (article.tags && article.tags.length > 0) {
      try {
        const tagNames = article.tags.map(t => t.s7b_tags_name);
        const searchResult = await searchApi.byTags(tagNames, 3);
        // Filter out current article
        relatedArticles = searchResult.articles.filter((a: Article) => a.s7b_article_id !== article.s7b_article_id).slice(0, 3);
      } catch (error) {
        console.warn('Failed to fetch related articles:', error);
      }
    }

    const isRTL = locale === 'ar';

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

    // Fallback author info
    // Fallback author info
    const authorName = author?.s7b_user_name || (locale === 'ar' ? 'كاتب سحابة' : 'S7abt Author');
    const authorBrief = author?.s7b_user_brief || '';
    const authorInitials = getAuthorInitials(authorName);

    // Build breadcrumb items
    const breadcrumbItems: BreadcrumbItem[] = [
      {
        label: locale === 'ar' ? 'الرئيسية' : 'Home',
        href: `/${locale}`,
      },
      {
        label: locale === 'ar' ? 'المقالات' : 'Articles',
        href: `/${locale}/articles`,
      },
    ];

    // Add section if available
    if (article.sections && article.sections.length > 0) {
      breadcrumbItems.push({
        label: article.sections[0].s7b_section_name,
        href: `/${locale}/sections/${article.sections[0].s7b_section_id}`,
      });
    }

    // Add current article (not clickable)
    breadcrumbItems.push({
      label: article.s7b_article_title,
    });

    return (
      <main className="min-h-screen bg-white">
        <ReadingProgress />
        <Header />

        {/* Article Hero Section with Gradient Background */}
        <section className="pt-32 pb-20 min-h-[600px] flex items-center relative overflow-hidden" style={{
          background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%)'
        }}>
          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-sky-cta/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">

              {/* Breadcrumbs with SEO markup */}
              <div className="flex justify-center mb-8">
                <Breadcrumbs items={breadcrumbItems} />
              </div>

              {/* Category Badges */}
              <div className={`flex justify-center ${isRTL ? 'flex-row-reverse' : ''} gap-4 mb-6 flex-wrap`}>
                {article.sections?.map((section: any) => (
                  <span
                    key={section.s7b_section_id}
                    className="px-4 py-2 bg-sky-cta text-white rounded-full text-sm font-medium shadow-sm"
                  >
                    {section.s7b_section_name}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-6xl font-poppins font-bold text-charcoal mb-6 leading-tight">
                {article.s7b_article_title}
              </h1>

              {/* Brief/Subtitle */}
              {article.s7b_article_brief && (
                <p className="text-xl text-muted-blue mb-8 leading-relaxed max-w-3xl mx-auto">
                  {article.s7b_article_brief}
                </p>
              )}

              {/* Meta Information */}
              <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''} gap-8 text-muted-blue flex-wrap border-t border-border-blue/50 pt-8 mt-8 max-w-2xl mx-auto`}>
                {/* Author Info */}
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-3`}>
                  <div className="w-12 h-12 bg-sky-cta rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden relative">
                    {author.s7b_user_image ? (
                      <Image
                        src={author.s7b_user_image}
                        alt={getAuthorImageAlt(authorName, locale)}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    ) : (
                      authorInitials
                    )}
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
                <div className="text-center px-6 border-x border-border-blue/50">
                  <div className="text-sm font-medium mb-1">
                    {locale === 'ar' ? 'تاريخ النشر' : 'Published'}
                  </div>
                  <div className="text-sm">{formatDate(article.s7b_article_add_date)}</div>
                </div>

                {/* Reading Time */}
                <div className="text-center">
                  <div className="text-sm font-medium mb-1">
                    {locale === 'ar' ? 'وقت القراءة' : 'Reading Time'}
                  </div>
                  <div className="text-sm">
                    {formatReadingTime(calculateReadingTime(article.s7b_article_body, locale), locale)}
                  </div>
                </div>
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
                <div className="sticky top-32">
                  {/* Table of Contents */}
                  <div className="bg-sky-bg/30 rounded-xl p-6 mb-[30px]">
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
                  <div className="bg-white border border-border-blue rounded-xl p-6 mb-[30px] shadow-sm">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-sky-cta rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-md overflow-hidden relative">
                        {author.s7b_user_image ? (
                          <Image
                            src={author.s7b_user_image}
                            alt={getAuthorImageAlt(authorName, locale)}
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized
                          />
                        ) : (
                          authorInitials
                        )}
                      </div>
                      <h4 className="text-lg font-poppins font-semibold text-charcoal mb-2">
                        {authorName}
                      </h4>
                      <p className="text-sm text-muted-blue mb-4">
                        {authorBrief}
                      </p>
                      <div className={`flex justify-center ${isRTL ? 'flex-row-reverse' : ''} gap-3 mb-4`}>
                        {author.s7b_user_twitter && (
                          <a href={author.s7b_user_twitter} target="_blank" rel="noopener noreferrer" className="text-link-blue hover:text-sky-cta transition-colors">
                            <i className="fa-brands fa-twitter"></i>
                          </a>
                        )}
                        {author.s7b_user_linkedin && (
                          <a href={author.s7b_user_linkedin} target="_blank" rel="noopener noreferrer" className="text-link-blue hover:text-sky-cta transition-colors">
                            <i className="fa-brands fa-linkedin"></i>
                          </a>
                        )}
                        {author.s7b_user_facebook && (
                          <a href={author.s7b_user_facebook} target="_blank" rel="noopener noreferrer" className="text-link-blue hover:text-sky-cta transition-colors">
                            <i className="fa-brands fa-facebook"></i>
                          </a>
                        )}
                      </div>
                      {/* Follow Author Button - Disabled for now */}
                      {/* <button className="w-full px-4 py-2 bg-sky-cta text-white rounded-full hover:bg-sky-cta-hover transition-colors text-sm font-medium shadow-sm">
                        {locale === 'ar' ? 'متابعة الكاتب' : 'Follow Author'}
                      </button> */}
                    </div>
                  </div>

                  {/* Share Section */}
                  <ShareButtons
                    title={article.s7b_article_title}
                    locale={locale}
                    isRTL={isRTL}
                    articleId={article.s7b_article_id}
                    initialStats={shareStats}
                  />
                </div>
              </aside>

              {/* Article Content */}
              <article className={`lg:col-span-3 ${isRTL ? 'lg:col-start-1' : ''}`}>
                <ArticleContent article={article} locale={locale} isRTL={isRTL} />

                {/* Related Articles */}
                <RelatedArticles articles={relatedArticles} locale={locale} isRTL={isRTL} />
              </article>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    );
  } catch (error) {
    console.error('Error fetching article:', error);
    notFound();
  }
}

