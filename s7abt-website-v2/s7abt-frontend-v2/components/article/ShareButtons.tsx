'use client';

import { useState, useEffect } from 'react';
import { articlesApi, ShareStats, SharePlatform } from '@/lib/api/client';

interface ShareButtonsProps {
    title: string;
    locale: string;
    isRTL: boolean;
    articleId: number;
    initialStats?: ShareStats;
}

export default function ShareButtons({ title, locale, isRTL, articleId, initialStats }: ShareButtonsProps) {
    const [currentUrl, setCurrentUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState<ShareStats>(initialStats || {
        twitter: 0,
        linkedin: 0,
        whatsapp: 0,
        copy: 0,
        total: 0
    });

    useEffect(() => {
        setCurrentUrl(window.location.href);
    }, []);

    useEffect(() => {
        if (initialStats) {
            setStats(initialStats);
        }
    }, [initialStats]);

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + currentUrl)}`,
    };

    const trackAndShare = async (platform: SharePlatform, url?: string) => {
        // Track the share
        const result = await articlesApi.trackShare(articleId, platform);
        if (result.stats) {
            setStats(result.stats);
        }

        // Open share window if URL provided
        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            // Track the copy action
            await trackAndShare('copy');
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const handleShare = (platform: 'twitter' | 'linkedin' | 'whatsapp') => {
        trackAndShare(platform, shareLinks[platform]);
    };

    return (
        <div className="bg-sky-bg/30 rounded-xl p-6">
            <h4 className={`text-lg font-poppins font-semibold text-charcoal mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {locale === 'ar' ? 'شارك المقال' : 'Share Article'}
            </h4>

            {/* Share Stats Display */}
            {stats.total > 0 && (
                <div className={`mb-4 pb-4 border-b border-sky-cta/20 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-muted-blue mb-2">
                        {locale === 'ar'
                            ? `تمت مشاركة هذا المقال ${stats.total} ${stats.total === 1 ? 'مرة' : 'مرة'}`
                            : `Shared ${stats.total} ${stats.total === 1 ? 'time' : 'times'}`
                        }
                    </p>
                    <div className={`flex ${isRTL ? 'flex-row-reverse justify-end' : ''} gap-3 text-xs text-muted-blue`}>
                        {stats.twitter > 0 && (
                            <span className="flex items-center gap-1">
                                <i className="fa-brands fa-twitter text-sky-cta"></i>
                                {stats.twitter}
                            </span>
                        )}
                        {stats.linkedin > 0 && (
                            <span className="flex items-center gap-1">
                                <i className="fa-brands fa-linkedin text-sky-cta"></i>
                                {stats.linkedin}
                            </span>
                        )}
                        {stats.whatsapp > 0 && (
                            <span className="flex items-center gap-1">
                                <i className="fa-brands fa-whatsapp text-sky-cta"></i>
                                {stats.whatsapp}
                            </span>
                        )}
                        {stats.copy > 0 && (
                            <span className="flex items-center gap-1">
                                <i className="fa-solid fa-link text-sky-cta"></i>
                                {stats.copy}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className={`flex ${isRTL ? 'flex-row-reverse justify-end' : ''} gap-3`}>
                {/* Twitter/X */}
                <button
                    onClick={() => handleShare('twitter')}
                    className="w-10 h-10 bg-sky-cta text-white rounded-full flex items-center justify-center hover:bg-sky-cta-hover transition-colors shadow-sm"
                    title="Twitter"
                >
                    <i className="fa-brands fa-twitter text-sm"></i>
                </button>

                {/* LinkedIn */}
                <button
                    onClick={() => handleShare('linkedin')}
                    className="w-10 h-10 bg-sky-cta text-white rounded-full flex items-center justify-center hover:bg-sky-cta-hover transition-colors shadow-sm"
                    title="LinkedIn"
                >
                    <i className="fa-brands fa-linkedin text-sm"></i>
                </button>

                {/* WhatsApp */}
                <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-10 h-10 bg-sky-cta text-white rounded-full flex items-center justify-center hover:bg-sky-cta-hover transition-colors shadow-sm"
                    title="WhatsApp"
                >
                    <i className="fa-brands fa-whatsapp text-sm"></i>
                </button>

                {/* Copy Link */}
                <button
                    onClick={handleCopyLink}
                    className={`w-10 h-10 ${copied ? 'bg-green-500' : 'bg-sky-cta'} text-white rounded-full flex items-center justify-center hover:opacity-90 transition-colors shadow-sm relative`}
                    title={locale === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                >
                    <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'} text-sm`}></i>
                </button>
            </div>
        </div>
    );
}
