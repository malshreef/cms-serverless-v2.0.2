import { useTranslations } from 'next-intl';

export default function ContactInfo() {
    const t = useTranslations('contactPage.info');

    const cards = [
        {
            icon: 'fa-solid fa-envelope',
            title: t('email.title'),
            description: t('email.description'),
            action: t('email.action'),
            href: 'mailto:info@s7abt.com'
        },
        {
            icon: 'fa-solid fa-location-dot',
            title: t('office.title'),
            description: t('office.description'),
            action: t('office.action'),
            href: 'https://maps.google.com'
        }
    ];

    return (
        <div className="flex flex-col gap-6 h-full">
            {cards.map((card, index) => (
                <div key={index} className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-md transition-shadow duration-300 flex-1 flex flex-col justify-center items-center">
                    <div className="w-12 h-12 bg-sky-cta/10 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-cta text-xl">
                        <i className={card.icon}></i>
                    </div>
                    <h3 className="text-xl font-bold text-charcoal mb-2">{card.title}</h3>
                    <p className="text-muted-blue mb-4">{card.description}</p>
                    <a href={card.href} className="text-sky-cta font-semibold hover:text-sky-cta-hover transition-colors mt-auto">
                        {card.action}
                    </a>
                </div>
            ))}
        </div>
    );
}
