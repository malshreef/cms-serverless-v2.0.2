import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Breadcrumbs, { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { newsApi } from '@/lib/api/client';
import { calculateReadingTime, formatReadingTime } from '@/lib/readingTime';
import { formatImageUrl } from '@/lib/utils/image';
import { Metadata, ResolvingMetadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface NewsPageProps {
    params: Promise<{
        locale: string;
        id: string;
    }>;
}

export async function generateMetadata(
    { params }: NewsPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { locale, id } = await params;

    try {
        const newsId = parseInt(id, 10);
        const { news } = await newsApi.getById(newsId);

        if (!news) {
            return {
                title: 'News Not Found',
            };
        }

        const imageUrl = formatImageUrl(news.s7b_news_image);
        return {
            title: news.s7b_news_title,
            description: news.s7b_news_brief,
            openGraph: {
                title: news.s7b_news_title,
                description: news.s7b_news_brief,
                images: imageUrl ? [imageUrl] : [],
                type: 'article',
                publishedTime: news.s7b_news_add_date,
            },
        };
    } catch (error) {
        return {
            title: 'S7abt News',
        };
    }
}

export default async function NewsDetailPage({ params }: NewsPageProps) {
    const { locale, id } = await params;
    setRequestLocale(locale);
    const isRTL = locale === 'ar';

    try {
        const newsId = parseInt(id, 10);
        const { news } = await newsApi.getById(newsId);

        if (!news) {
            notFound();
        }

        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        };

        // Build breadcrumb items
        const breadcrumbItems: BreadcrumbItem[] = [
            {
                label: locale === 'ar' ? 'الرئيسية' : 'Home',
                href: `/${locale}`,
            },
            {
                label: locale === 'ar' ? 'الأخبار' : 'News',
                href: `/${locale}/news`,
            },
            {
                label: news.s7b_news_title,
            },
        ];

        return (
            <main className="min-h-screen bg-white">
                <Header />

                {/* Hero Section with Gradient Background */}
                <section className="pt-32 pb-20 min-h-[500px] flex items-center relative overflow-hidden" style={{
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

                            {/* Badge */}
                            <div className="flex justify-center mb-6">
                                <span className="px-4 py-2 bg-sky-cta text-white rounded-full text-sm font-medium shadow-sm">
                                    {locale === 'ar' ? 'خبر' : 'News'}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl lg:text-5xl font-poppins font-bold text-charcoal mb-6 leading-tight">
                                {news.s7b_news_title}
                            </h1>

                            {/* Brief */}
                            {news.s7b_news_brief && (
                                <p className="text-xl text-muted-blue mb-8 leading-relaxed max-w-3xl mx-auto">
                                    {news.s7b_news_brief}
                                </p>
                            )}

                            {/* Meta Information */}
                            <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''} gap-8 text-muted-blue flex-wrap border-t border-border-blue/50 pt-8 mt-8 max-w-2xl mx-auto`}>
                                {/* Published Date */}
                                <div className="text-center px-6">
                                    <div className="text-sm font-medium mb-1">
                                        {locale === 'ar' ? 'تاريخ النشر' : 'Published'}
                                    </div>
                                    <div className="text-sm">{formatDate(news.s7b_news_add_date)}</div>
                                </div>

                                {/* Reading Time */}
                                <div className="text-center px-6 border-x border-border-blue/50">
                                    <div className="text-sm font-medium mb-1">
                                        {locale === 'ar' ? 'وقت القراءة' : 'Reading Time'}
                                    </div>
                                    <div className="text-sm">
                                        {formatReadingTime(calculateReadingTime(news.s7b_news_body, locale), locale)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content Area */}
                <div className="container mx-auto px-6 py-16 bg-white">
                    <div className="max-w-5xl mx-auto">
                        {/* News Content */}
                        <article className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted-blue prose-a:text-sky-cta hover:prose-a:text-sky-cta-hover prose-img:rounded-xl">
                            {/* Main Image */}
                            {news.s7b_news_image && (
                                <div className="mb-10 relative h-[400px] w-full rounded-2xl overflow-hidden shadow-lg">
                                    <img
                                        src={formatImageUrl(news.s7b_news_image)}
                                        alt={news.s7b_news_title}
                                        className="object-cover w-full h-full m-0"
                                    />
                                </div>
                            )}

                            <div className={isRTL ? 'text-right' : 'text-left'} dir={isRTL ? 'rtl' : 'ltr'}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-charcoal" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 text-charcoal" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-6 mb-3 text-charcoal" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-6 leading-relaxed text-gray-700" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-6 space-y-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-6 space-y-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote className="border-l-4 border-sky-cta pl-4 italic my-6 text-gray-600 bg-gray-50 p-4 rounded-r-lg" {...props} />
                                        ),
                                        code: ({ node, className, children, ...props }: any) => {
                                            const match = /language-(\w+)/.exec(className || '')
                                            return !match ? (
                                                <code className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono text-pink-600" {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            )
                                        }
                                    }}
                                >
                                    {news.s7b_news_body}
                                </ReactMarkdown>
                            </div>
                        </article>
                    </div>
                </div>

                <Footer />
            </main>
        );
    } catch (error) {
        console.error('Error fetching news detail:', error);
        notFound();
    }
}
