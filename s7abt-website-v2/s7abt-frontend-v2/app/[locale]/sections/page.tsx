'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { sectionsApi, Section } from '@/lib/api/client';

interface SectionsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function SectionsPage() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const data = await sectionsApi.getAll();
        setSections(data.sections || []);
      } catch (err) {
        console.error('Error fetching sections:', err);
        setError('Failed to load sections');
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  // Map section keywords to relevant icons (matches partial names)
  const sectionIconRules: { keywords: string[]; icon: string; prefix: string }[] = [
    { keywords: ['أمازون', 'amazon', 'aws'], icon: 'fa-aws', prefix: 'fa-brands' },
    { keywords: ['أزور', 'azure', 'microsoft'], icon: 'fa-microsoft', prefix: 'fa-brands' },
    { keywords: ['قوقل', 'جوجل', 'google', 'gcp'], icon: 'fa-google', prefix: 'fa-brands' },
    { keywords: ['علي بابا', 'alibaba', 'alicloud'], icon: 'fa-cloud-arrow-up', prefix: 'fa-solid' },
    { keywords: ['سحابية', 'cloud'], icon: 'fa-cloud', prefix: 'fa-solid' },
    { keywords: ['مقالات', 'articles', 'عامة', 'general'], icon: 'fa-newspaper', prefix: 'fa-solid' },
    { keywords: ['أمن', 'security', 'حماية'], icon: 'fa-shield-halved', prefix: 'fa-solid' },
    { keywords: ['شبكات', 'network', 'networking'], icon: 'fa-network-wired', prefix: 'fa-solid' },
    { keywords: ['قواعد بيانات', 'database', 'بيانات'], icon: 'fa-database', prefix: 'fa-solid' },
    { keywords: ['برمجة', 'programming', 'تطوير', 'development', 'code'], icon: 'fa-code', prefix: 'fa-solid' },
    { keywords: ['ذكاء اصطناعي', 'ai', 'artificial'], icon: 'fa-robot', prefix: 'fa-solid' },
    { keywords: ['لينكس', 'linux'], icon: 'fa-linux', prefix: 'fa-brands' },
    { keywords: ['devops', 'ديف أوبس'], icon: 'fa-gears', prefix: 'fa-solid' },
    { keywords: ['docker', 'حاويات', 'containers'], icon: 'fa-docker', prefix: 'fa-brands' },
    { keywords: ['kubernetes', 'k8s'], icon: 'fa-dharmachakra', prefix: 'fa-solid' },
    { keywords: ['serverless', 'سيرفرلس', 'lambda'], icon: 'fa-bolt', prefix: 'fa-solid' },
  ];

  const fallbackIcons = [
    { icon: 'fa-server', prefix: 'fa-solid' },
    { icon: 'fa-database', prefix: 'fa-solid' },
    { icon: 'fa-code', prefix: 'fa-solid' },
    { icon: 'fa-shield-halved', prefix: 'fa-solid' },
  ];

  const getIconForSection = (name: string, index: number) => {
    const lowerName = name.toLowerCase();
    const matched = sectionIconRules.find(rule =>
      rule.keywords.some(kw => lowerName.includes(kw.toLowerCase()) || name.includes(kw))
    );
    return matched
      ? { icon: matched.icon, prefix: matched.prefix }
      : fallbackIcons[index % fallbackIcons.length];
  };

  return (
    <main className="min-h-screen">
      <Header />

      {/* Page Header */}
      <section className="gradient-hero pt-32 pb-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-charcoal mb-4">
            {locale === 'ar' ? 'جميع الفئات' : 'All Categories'}
          </h1>
          <p className="text-xl text-muted-blue max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'استكشف مجموعة شاملة من الفئات والموضوعات'
              : 'Explore our comprehensive collection of categories and topics'}          </p>
        </div>
      </section>

      {/* Sections Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-blue">
                {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-xl text-red-500">{error}</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-blue">
                {locale === 'ar' ? 'لا توجد فئات' : 'No categories found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {sections.map((section, index) => (
                <Link
                  key={section.s7b_section_id}
                  href={`/${locale}/sections/${section.s7b_section_id}`}
                  className="group"
                >
                  <div className="card-hover bg-gradient-to-br from-sky-bg to-white p-8 rounded-2xl border border-border-blue text-center h-full">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-6 bg-sky-cta/10 rounded-full flex items-center justify-center group-hover:bg-sky-cta transition-colors duration-200">
                      <i
                        className={`${getIconForSection(section.s7b_section_name, index).prefix} ${getIconForSection(section.s7b_section_name, index).icon} text-3xl text-sky-cta group-hover:text-white transition-colors duration-200`}
                      ></i>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-charcoal mb-3 group-hover:text-sky-cta transition-colors">
                      {section.s7b_section_name}
                    </h3>

                    {/* Description */}
                    {section.s7b_section_brief && (
                      <p className="text-muted-blue mb-4 text-sm line-clamp-2">
                        {section.s7b_section_brief}
                      </p>
                    )}

                    {/* Count */}
                    <p className="text-muted-blue mb-4">
                      {section.article_count || 0}{' '}
                      {locale === 'ar' ? 'مقالات' : 'Articles'}
                    </p>

                    {/* Link */}
                    <span className="text-sky-cta font-medium group-hover:underline">
                      {locale === 'ar' ? 'استكشف ←' : 'Explore →'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

