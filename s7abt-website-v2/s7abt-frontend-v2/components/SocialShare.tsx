'use client';

import { useState } from 'react';

interface SocialShareProps {
  title: string;
  url: string;
  locale: string;
  isRTL: boolean;
}

export default function SocialShare({ title, url, locale, isRTL }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <div className="bg-sky-bg/30 rounded-xl p-6">
      <h4 className={`text-lg font-poppins font-semibold text-charcoal mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        {locale === 'ar' ? 'شارك المقال' : 'Share Article'}
      </h4>
      <div className={`flex ${isRTL ? 'flex-row-reverse justify-end' : ''} gap-3 flex-wrap`}>
        <button
          onClick={() => handleShare('facebook')}
          className="w-10 h-10 bg-sky-cta text-white rounded-full flex items-center justify-center hover:bg-sky-cta-hover transition-colors"
          aria-label="Share on Facebook"
        >
          <i className="fa-brands fa-facebook-f text-sm"></i>
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className="w-10 h-10 bg-sky-cta text-white rounded-full flex items-center justify-center hover:bg-sky-cta-hover transition-colors"
          aria-label="Share on Twitter"
        >
          <i className="fa-brands fa-twitter text-sm"></i>
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className="w-10 h-10 bg-sky-cta text-white rounded-full flex items-center justify-center hover:bg-sky-cta-hover transition-colors"
          aria-label="Share on LinkedIn"
        >
          <i className="fa-brands fa-linkedin text-sm"></i>
        </button>
        <button
          onClick={() => handleShare('whatsapp')}
          className="w-10 h-10 bg-sky-cta text-white rounded-full flex items-center justify-center hover:bg-sky-cta-hover transition-colors"
          aria-label="Share on WhatsApp"
        >
          <i className="fa-brands fa-whatsapp text-sm"></i>
        </button>
        <button
          onClick={handleCopyLink}
          className="w-10 h-10 bg-sky-cta text-white rounded-full flex items-center justify-center hover:bg-sky-cta-hover transition-colors relative"
          aria-label="Copy link"
        >
          <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'} text-sm`}></i>
          {copied && (
            <span className={`absolute -top-8 ${isRTL ? 'right-0' : 'left-0'} bg-charcoal text-white text-xs px-2 py-1 rounded whitespace-nowrap`}>
              {locale === 'ar' ? 'تم النسخ!' : 'Copied!'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
