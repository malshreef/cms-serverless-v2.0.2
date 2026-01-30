'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

interface StatItem {
  value: string;
  label: string;
  icon: string;
  source: string;
}

export default function VisionSection() {
  const t = useTranslations('vision');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const stats: StatItem[] = [
    {
      value: '23%',
      label: locale === 'ar' 
        ? 'من المنظمات تثق في وضع بياناتها على الخدمات السحابية العامة'
        : 'of organizations trust public cloud services',
      icon: 'fa-shield-check',
      source: 'Forbes',
    },
    {
      value: '22%',
      label: locale === 'ar'
        ? 'معدل النمو المتوقع للخدمات السحابية'
        : 'Expected growth rate of cloud services',
      icon: 'fa-chart-line',
      source: 'Forrester',
    },
    {
      value: '80%',
      label: locale === 'ar'
        ? 'من الأرباح ستستحوذ عليها الشركات الكبرى'
        : 'of profits captured by major cloud providers',
      icon: 'fa-crown',
      source: 'Forrester',
    },
    {
      value: '$547B',
      label: locale === 'ar'
        ? 'حجم الإنفاق المتوقع على الكلاود عالمياً'
        : 'Expected global cloud spending',
      icon: 'fa-dollar-sign',
      source: 'Deloitte',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-6">
        {/* Header with Vision 2030 branding */}
        <div className={`flex flex-col ${isRTL ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 mb-16`}>
          {/* Text Content */}
          <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              {locale === 'ar' ? 'الخدمات السحابية وفق رؤية 2030' : 'Cloud Services & Vision 2030'}
            </h2>
            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
              {locale === 'ar'
                ? 'أهمية الخدمات السحابية في رؤية المملكة العربية السعودية 2030 وخطة هيئة الاتصالات وتقنية المعلومات'
                : 'The importance of cloud services in Saudi Arabia\'s Vision 2030 and the plan of the Communications and Information Technology Commission'
              }
            </p>
            <Link href={`/${locale}/vision2030`}>
              <div className="inline-block px-6 py-3 bg-sky-cta rounded-lg font-semibold hover:bg-sky-500 transition-colors cursor-pointer">
                {locale === 'ar' ? 'المزيد من التفاصيل' : 'Learn More'}
              </div>
            </Link>
          </div>

          {/* Vision 2030 Logo/Badge */}
          <div className="flex-1 flex justify-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-center">
              <div className="text-6xl font-bold text-sky-cta mb-2">2030</div>
              <div className="text-xl font-semibold mb-4">
                {locale === 'ar' ? 'رؤية المملكة' : 'Vision'}
              </div>
              <p className="text-sm text-gray-300">
                {locale === 'ar' ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 hover:border-sky-cta/50"
            >
              {/* Icon */}
              <div className="text-5xl text-sky-cta mb-4">
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>

              {/* Value */}
              <div className="text-4xl lg:text-5xl font-bold text-sky-cta mb-3">
                {stat.value}
              </div>

              {/* Label */}
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {stat.label}
              </p>

              {/* Source */}
              <div className="text-xs text-gray-400 font-semibold">
                {locale === 'ar' ? 'المصدر' : 'Source'}: <span className="text-sky-cta">{stat.source}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <p className="text-gray-300 text-lg mb-6">
            {locale === 'ar'
              ? 'استكشف كيف تساهم الخدمات السحابية في تحقيق رؤية 2030'
              : 'Discover how cloud services contribute to achieving Vision 2030'
            }
          </p>
          <Link href={`/${locale}/vision2030`}>
            <div className="px-8 py-4 bg-sky-cta text-white rounded-lg font-semibold hover:bg-sky-500 transition-colors inline-block cursor-pointer">
              {locale === 'ar' ? 'اقرأ المزيد' : 'Read More'}
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

