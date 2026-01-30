'use client';

import { useLocale } from 'next-intl';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const content = {
        ar: {
            title: 'سياسة الخصوصية',
            subtitle: 'نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية',
            lastUpdated: 'آخر تحديث: يناير 2025',
            sections: [
                {
                    title: 'مقدمة',
                    content: `مرحباً بك في سحابة الكلاود. نحن نقدر ثقتك بنا ونلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك عند استخدام موقعنا الإلكتروني وخدماتنا.`
                },
                {
                    title: 'المعلومات التي نجمعها',
                    content: `نقوم بجمع أنواع مختلفة من المعلومات لتقديم خدماتنا وتحسينها:`,
                    list: [
                        'معلومات الحساب: الاسم، البريد الإلكتروني، وكلمة المرور عند إنشاء حساب',
                        'معلومات الاستخدام: كيفية تفاعلك مع موقعنا، الصفحات التي تزورها، والمقالات التي تقرأها',
                        'معلومات الجهاز: نوع المتصفح، نظام التشغيل، وعنوان IP',
                        'ملفات تعريف الارتباط (Cookies): لتحسين تجربتك وتذكر تفضيلاتك'
                    ]
                },
                {
                    title: 'كيف نستخدم معلوماتك',
                    content: `نستخدم المعلومات التي نجمعها للأغراض التالية:`,
                    list: [
                        'تقديم وتحسين خدماتنا ومحتوانا',
                        'تخصيص تجربتك وعرض المحتوى المناسب لاهتماماتك',
                        'التواصل معك بشأن التحديثات والمقالات الجديدة',
                        'تحليل استخدام الموقع لتحسين الأداء',
                        'حماية أمن الموقع ومنع الاحتيال'
                    ]
                },
                {
                    title: 'أمان البيانات وعدم المشاركة',
                    content: `نحن لا نشارك أو نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث على الإطلاق. بياناتك تبقى محفوظة لدينا فقط ونتخذ إجراءات أمنية صارمة لحمايتها من الوصول غير المصرح به أو التغيير أو الإتلاف.`
                },
                {
                    title: 'حقوقك',
                    content: `لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية:`,
                    list: [
                        'الوصول إلى بياناتك الشخصية وطلب نسخة منها',
                        'تصحيح أي معلومات غير دقيقة',
                        'طلب حذف بياناتك (في ظروف معينة)',
                        'الاعتراض على معالجة بياناتك',
                        'سحب موافقتك في أي وقت'
                    ]
                },
                {
                    title: 'ملفات تعريف الارتباط (Cookies)',
                    content: `نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتحسين تجربتك. يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك، لكن تعطيلها قد يؤثر على بعض وظائف الموقع.`
                },
                {
                    title: 'روابط لمواقع أخرى',
                    content: `قد يحتوي موقعنا على روابط لمواقع خارجية. نحن غير مسؤولين عن ممارسات الخصوصية لهذه المواقع، وننصحك بمراجعة سياسات الخصوصية الخاصة بها.`
                },
                {
                    title: 'تحديثات السياسة',
                    content: `قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية عن طريق نشر السياسة الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث".`
                },
                {
                    title: 'اتصل بنا',
                    content: `إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه أو ممارسات البيانات لدينا، يرجى التواصل معنا عبر صفحة "اتصل بنا" أو عبر البريد الإلكتروني.`
                }
            ]
        },
        en: {
            title: 'Privacy Policy',
            subtitle: 'We respect your privacy and are committed to protecting your personal data',
            lastUpdated: 'Last Updated: January 2025',
            sections: [
                {
                    title: 'Introduction',
                    content: `Welcome to Sahabet Alcloud (سحابة الكلاود). We value your trust and are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.`
                },
                {
                    title: 'Information We Collect',
                    content: `We collect different types of information to provide and improve our services:`,
                    list: [
                        'Account Information: Name, email, and password when you create an account',
                        'Usage Information: How you interact with our site, pages you visit, and articles you read',
                        'Device Information: Browser type, operating system, and IP address',
                        'Cookies: To improve your experience and remember your preferences'
                    ]
                },
                {
                    title: 'How We Use Your Information',
                    content: `We use the information we collect for the following purposes:`,
                    list: [
                        'Provide and improve our services and content',
                        'Personalize your experience and show relevant content',
                        'Communicate with you about updates and new articles',
                        'Analyze site usage to improve performance',
                        'Protect site security and prevent fraud'
                    ]
                },
                {
                    title: 'Data Security & No Sharing Policy',
                    content: `We do not share, sell, or rent your personal data to any third party whatsoever. Your data remains stored with us only, and we take strict security measures to protect it from unauthorized access, alteration, or destruction.`
                },
                {
                    title: 'Your Rights',
                    content: `You have the following rights regarding your personal data:`,
                    list: [
                        'Access your personal data and request a copy',
                        'Correct any inaccurate information',
                        'Request deletion of your data (under certain circumstances)',
                        'Object to the processing of your data',
                        'Withdraw your consent at any time'
                    ]
                },
                {
                    title: 'Cookies',
                    content: `We use cookies and similar technologies to improve your experience. You can control cookies through your browser settings, but disabling them may affect some site functionality.`
                },
                {
                    title: 'Links to Other Sites',
                    content: `Our site may contain links to external websites. We are not responsible for the privacy practices of these sites, and we encourage you to review their privacy policies.`
                },
                {
                    title: 'Policy Updates',
                    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.`
                },
                {
                    title: 'Contact Us',
                    content: `If you have any questions about this Privacy Policy or our data practices, please contact us via our "Contact Us" page or by email.`
                }
            ]
        }
    };

    const t = content[locale as keyof typeof content] || content.ar;

    return (
        <main className="min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-16 bg-gradient-to-b from-sky-50 to-white">
                <div className="container mx-auto px-6 text-center">
                    <span className="inline-block px-4 py-2 bg-sky-cta/10 text-sky-cta rounded-full text-sm font-semibold mb-6">
                        {isRTL ? 'الخصوصية والأمان' : 'Privacy & Security'}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">
                        {t.title}
                    </h1>
                    <p className="text-xl text-muted-blue max-w-2xl mx-auto mb-4">
                        {t.subtitle}
                    </p>
                    <p className="text-sm text-gray-500">
                        {t.lastUpdated}
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        {t.sections.map((section, index) => (
                            <div key={index} className="mb-10 group cursor-pointer">
                                <h2 className="text-2xl font-bold text-charcoal mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-sky-cta text-white rounded-full text-sm font-bold transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-sky-cta/40">
                                        {index + 1}
                                    </span>
                                    {section.title}
                                </h2>
                                <div className={`${isRTL ? 'pr-11' : 'pl-11'}`}>
                                    <p className="text-muted-blue leading-relaxed mb-4">
                                        {section.content}
                                    </p>
                                    {section.list && (
                                        <ul className={`space-y-2 ${isRTL ? 'pr-4' : 'pl-4'}`}>
                                            {section.list.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start gap-2 text-muted-blue">
                                                    <svg
                                                        className="w-5 h-5 text-sky-cta flex-shrink-0 mt-0.5"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Contact CTA */}
                        <div className="mt-12 p-8 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl text-center">
                            <h3 className="text-xl font-bold text-charcoal mb-3">
                                {isRTL ? 'هل لديك أسئلة؟' : 'Have Questions?'}
                            </h3>
                            <p className="text-muted-blue mb-6">
                                {isRTL
                                    ? 'نحن هنا للمساعدة. لا تتردد في التواصل معنا بخصوص أي استفسارات تتعلق بالخصوصية.'
                                    : 'We are here to help. Feel free to contact us with any privacy-related inquiries.'
                                }
                            </p>
                            <a
                                href={`/${locale}/contact`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-cta text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors"
                            >
                                {isRTL ? 'تواصل معنا' : 'Contact Us'}
                                <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
