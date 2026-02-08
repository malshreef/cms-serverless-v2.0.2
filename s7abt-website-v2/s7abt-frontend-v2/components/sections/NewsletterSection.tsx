'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';

export default function NewsletterSection() {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const contactApiUrl = process.env.NEXT_PUBLIC_CONTACT_API_URL || '/api/contact';
      const response = await fetch(contactApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: 'Newsletter Subscriber', // Default name for newsletter
          subject: 'Newsletter Subscription',
          message: 'User subscribed via newsletter form'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail('');
        alert(isRTL ? 'تم الاشتراك بنجاح!' : 'Subscribed successfully!');
      } else {
        console.error('Subscription error:', data);
        setStatus('error');
        alert(isRTL ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setStatus('error');
      alert(isRTL ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section id="newsletter-section" className="py-20 gradient-newsletter">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-charcoal mb-4">{t('title')}</h2>
          <p className="text-xl text-muted-blue mb-8">{t('subtitle')}</p>

          {/* Subscription Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className={`flex-1 px-6 py-4 border border-border-blue rounded-full focus:outline-none focus:border-sky-cta ${isRTL ? 'text-right' : ''}`}
              required
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className={`px-8 py-4 bg-sky-cta text-white rounded-full hover:bg-sky-cta-hover transition-colors duration-200 font-semibold whitespace-nowrap ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  {isRTL ? 'جاري الاشتراك...' : 'Subscribing...'}
                </span>
              ) : (
                t('subscribe')
              )}
            </button>
          </form>

          <p className="text-sm text-muted-blue">{t('privacy')}</p>
        </div>
      </div>
    </section>
  );
}

