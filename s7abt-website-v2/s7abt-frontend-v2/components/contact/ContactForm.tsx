'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ContactForm() {
    const t = useTranslations('contactPage.form');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
                alert(t('successMessage'));
            } else {
                console.error('Submission error:', data);
                setStatus('error');
                alert('Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            setStatus('error');
            alert('Something went wrong. Please try again.');
        } finally {
            setStatus('idle');
        }
    };

    return (
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-charcoal mb-4">{t('title')}</h2>
                <p className="text-muted-blue">{t('subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
                            {t('name')}
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-sky-cta focus:ring-2 focus:ring-sky-cta/20 outline-none transition-all"
                            placeholder={t('namePlaceholder')}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                            {t('email')}
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-sky-cta focus:ring-2 focus:ring-sky-cta/20 outline-none transition-all"
                            placeholder={t('emailPlaceholder')}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-charcoal mb-2">
                        {t('subject')}
                    </label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-sky-cta focus:ring-2 focus:ring-sky-cta/20 outline-none transition-all"
                        placeholder={t('subjectPlaceholder')}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-2">
                        {t('message')}
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-sky-cta focus:ring-2 focus:ring-sky-cta/20 outline-none transition-all resize-none"
                        placeholder={t('messagePlaceholder')}
                        required
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`w-full bg-sky-cta text-white font-bold py-4 rounded-lg hover:bg-sky-cta-hover transition-colors shadow-lg shadow-sky-cta/20 ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {status === 'loading' ? (
                        <span className="flex items-center justify-center gap-2">
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            {t('submit')}...
                        </span>
                    ) : (
                        t('submit')
                    )}
                </button>
            </form>
        </div>
    );
}
