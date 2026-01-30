import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ContactInfo from '@/components/contact/ContactInfo';
import ContactForm from '@/components/contact/ContactForm';
import FAQ from '@/components/contact/FAQ';

interface ContactPageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function ContactPage({ params }: ContactPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('contactPage.hero');

    return (
        <main className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-gradient-to-b from-sky-50 to-white">
                <div className="container mx-auto px-6 text-center">
                    <span className="inline-block px-4 py-2 bg-sky-cta/10 text-sky-cta rounded-full text-sm font-semibold mb-6">
                        {t('badge')}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">
                        {t('title')}
                    </h1>
                    <p className="text-xl text-muted-blue max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-20">
                    {/* Left Column: Contact Info */}
                    <div className="lg:col-span-4">
                        <ContactInfo />
                    </div>

                    {/* Right Column: Contact Form */}
                    <div className="lg:col-span-8">
                        <ContactForm />
                    </div>
                </div>

                <FAQ />
            </div>

            <Footer />
        </main>
    );
}
