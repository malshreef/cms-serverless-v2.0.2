'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

interface Topic {
  id: number;
  name: string;
  count: number;
  color: string;
}

interface TopicsSectionProps {
  tags?: any[];
}

export default function TopicsSection({ tags = [] }: TopicsSectionProps) {
  const t = useTranslations('topics');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Default topics if no tags provided
  const defaultTopics: Topic[] = [
    { id: 1, name: locale === 'ar' ? 'الخدمات السحابية' : 'Cloud Services', count: 48, color: 'bg-blue-100 text-blue-700' },
    { id: 2, name: locale === 'ar' ? 'AWS' : 'AWS', count: 7, color: 'bg-orange-100 text-orange-700' },
    { id: 3, name: locale === 'ar' ? 'Azure' : 'Azure', count: 3, color: 'bg-purple-100 text-purple-700' },
    { id: 4, name: locale === 'ar' ? 'Google Cloud' : 'Google Cloud', count: 1, color: 'bg-green-100 text-green-700' },
    { id: 5, name: locale === 'ar' ? 'البنية التحتية' : 'Infrastructure', count: 5, color: 'bg-pink-100 text-pink-700' },
    { id: 6, name: locale === 'ar' ? 'الأمان السيبراني' : 'Security', count: 4, color: 'bg-red-100 text-red-700' },
    { id: 7, name: locale === 'ar' ? 'DevOps' : 'DevOps', count: 3, color: 'bg-indigo-100 text-indigo-700' },
    { id: 8, name: locale === 'ar' ? 'الذكاء الاصطناعي' : 'AI & ML', count: 2, color: 'bg-cyan-100 text-cyan-700' },
  ];

  // Convert tags to topic format if provided
  const topics = tags && tags.length > 0
    ? tags.slice(0, 8).map((tag, index) => ({
        id: tag.s7b_tag_id || index,
        name: tag.s7b_tag_name || '',
        count: tag.article_count || 0,
        color: defaultTopics[index % defaultTopics.length].color,
      }))
    : defaultTopics;

  // Calculate max count for sizing
  const maxCount = Math.max(...topics.map(t => t.count), 1);

  // Function to get font size based on count (tag cloud effect)
  const getFontSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-2xl font-bold';
    if (ratio > 0.6) return 'text-xl font-bold';
    if (ratio > 0.4) return 'text-lg font-semibold';
    return 'text-base font-medium';
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-charcoal mb-4">
            {locale === 'ar' ? 'المواضيع الرئيسية' : 'Popular Topics'}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-sky-cta to-sky-400 mx-auto mb-6"></div>
          <p className="text-xl text-muted-blue max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'استكشف أشهر المواضيع والتصنيفات على موقعنا'
              : 'Explore the most popular topics and categories on our site'
            }
          </p>
        </div>

        {/* Topics Cloud */}
        <div className="flex flex-wrap gap-4 justify-center items-center max-w-4xl mx-auto">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/${locale}/tags/${topic.id}`}
              className="group"
            >
              <div className={`${topic.color} px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-110 cursor-pointer border-2 border-transparent hover:border-sky-cta ${getFontSize(topic.count)}`}>
                <span className="flex items-center gap-2">
                  {topic.name}
                  <span className="text-xs font-bold opacity-75">({topic.count})</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Link href={`/${locale}/tags`}>
            <button className="px-8 py-4 bg-sky-cta text-white rounded-lg font-semibold hover:bg-sky-500 transition-colors inline-block">
              {locale === 'ar' ? 'عرض جميع المواضيع' : 'View All Topics'}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

