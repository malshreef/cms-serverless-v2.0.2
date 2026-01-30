'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/api/client';
import { formatImageUrl } from '@/lib/utils/image';
import { getRelatedArticleImageAlt } from '@/lib/utils/altText';

interface RelatedArticlesProps {
    articles: Article[];
    locale: string;
    isRTL: boolean;
}

export default function RelatedArticles({ articles, locale, isRTL }: RelatedArticlesProps) {
    if (!articles || articles.length === 0) return null;

    return (
        <div className={`mt-16 border-t border-border-blue pt-12 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h3 className="text-2xl font-poppins font-bold text-charcoal mb-8">
                {locale === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {articles.map((article) => (
                    <Link
                        key={article.s7b_article_id}
                        href={`/${locale}/articles/${article.s7b_article_id}`}
                        className="group block"
                    >
                        <div className="bg-white border border-border-blue rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                            {/* Image */}
                            <div className="relative h-48 w-full overflow-hidden">
                                {article.s7b_article_image ? (
                                    <Image
                                        src={formatImageUrl(article.s7b_article_image) || ''}
                                        alt={getRelatedArticleImageAlt(article.s7b_article_title, locale)}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-sky-bg flex items-center justify-center" role="img" aria-label={locale === 'ar' ? 'لا توجد صورة' : 'No image available'}>
                                        <i className="fa-regular fa-image text-4xl text-muted-blue/30"></i>
                                    </div>
                                )}

                                {/* Category Badge */}
                                {article.sections && article.sections.length > 0 && (
                                    <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'}`}>
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-sky-cta text-xs font-bold rounded-full shadow-sm">
                                            {article.sections[0].s7b_section_name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5 flex flex-col flex-grow">
                                <h4 className="text-lg font-bold text-charcoal mb-3 line-clamp-2 group-hover:text-sky-cta transition-colors">
                                    {article.s7b_article_title}
                                </h4>

                                <p className="text-sm text-muted-blue line-clamp-3 mb-4 flex-grow">
                                    {article.s7b_article_brief}
                                </p>

                                <div className={`flex items-center text-xs text-muted-blue/70 mt-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span>
                                        {new Date(article.s7b_article_add_date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
