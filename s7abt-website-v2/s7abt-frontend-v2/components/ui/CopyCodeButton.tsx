'use client';

import { useState } from 'react';

interface CopyCodeButtonProps {
  code: string;
  locale?: string;
}

export default function CopyCodeButton({ code, locale = 'en' }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 ${locale === 'ar' ? 'left-2' : 'right-2'} px-3 py-1 text-xs rounded-md border cursor-pointer transition-all z-10 font-inherit ${
        copied
          ? 'bg-green-500/20 text-green-400 border-green-500/40'
          : 'bg-white/15 text-gray-300 border-white/20 hover:bg-white/25 hover:text-white'
      }`}
    >
      {copied
        ? (locale === 'ar' ? 'تم النسخ!' : 'Copied!')
        : (locale === 'ar' ? 'نسخ' : 'Copy')
      }
    </button>
  );
}
