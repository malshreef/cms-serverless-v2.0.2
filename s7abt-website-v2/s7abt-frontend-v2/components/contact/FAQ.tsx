import { useTranslations } from 'next-intl';

export default function FAQ() {
    const t = useTranslations('contactPage.faq');

    const faqs = [
        { question: t('q1'), answer: t('a1') },
        { question: t('q2'), answer: t('a2') },
        { question: t('q3'), answer: t('a3') },
    ];

    return (
        <div className="max-w-3xl mx-auto mt-20">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-charcoal mb-4">{t('title')}</h2>
                <p className="text-muted-blue">{t('subtitle')}</p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <div className="p-6">
                            <h3 className="font-semibold text-charcoal text-lg mb-3">{faq.question}</h3>
                            <p className="text-muted-blue leading-relaxed">{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
