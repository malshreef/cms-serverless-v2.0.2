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

            <div className="space-y-6">
                {faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="p-8">
                            <h3 className="font-bold text-charcoal text-xl mb-5 border-b border-gray-100 pb-3">{faq.question}</h3>
                            <div className="text-muted-blue leading-loose text-base space-y-4">
                                {faq.answer.split('\n\n').map((paragraph: string, pIndex: number) => (
                                    <p key={pIndex} className="leading-[2]">
                                        {paragraph.split('\n').map((line: string, lIndex: number, arr: string[]) => (
                                            <span key={lIndex}>
                                                {line}
                                                {lIndex < arr.length - 1 && <br />}
                                            </span>
                                        ))}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
