'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatImageUrl } from '@/lib/utils/image';
import { getArticleImageAlt } from '@/lib/utils/altText';

interface ArticleContentProps {
  article: any;
  locale: string;
  isRTL: boolean;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function ArticleContent({ article, locale, isRTL }: ArticleContentProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const articleBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!articleBodyRef.current) return;

    // Extract headings from article body
    const headings = articleBodyRef.current.querySelectorAll('h1, h2, h3');

    const items: TocItem[] = [];
    headings.forEach((heading, index) => {
      // Use existing ID or generate one
      const id = heading.id || `heading-${index}`;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.substring(1));

      // Ensure ID is set on heading
      if (!heading.id) {
        heading.id = id;
      }

      items.push({ id, text, level });
    });

    setTocItems(items);

    // Intersection Observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach((heading) => {
      observer.observe(heading);
    });

    return () => {
      headings.forEach((heading) => {
        observer.unobserve(heading);
      });
    };
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Update TOC in sidebar
  useEffect(() => {
    const tocNav = document.querySelector('#table-of-contents ul');
    if (tocNav && tocItems.length > 0) {
      // Clear existing content
      tocNav.innerHTML = '';

      // Create TOC items
      tocItems.forEach((item) => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = item.text;
        button.className = `text-muted-blue hover:text-sky-cta transition-all duration-200 block py-1 text-${isRTL ? 'right' : 'left'} w-full text-sm ${activeId === item.id ? 'text-sky-cta font-semibold' : ''
          } ${item.level > 2 ? (isRTL ? 'pr-4' : 'pl-4') : ''} hover:${isRTL ? 'pr-2' : 'pl-2'}`;

        button.addEventListener('click', () => scrollToHeading(item.id));

        li.appendChild(button);
        tocNav.appendChild(li);
      });
    }
  }, [tocItems, activeId, isRTL]);

  return (
    <div>
      {/* Featured Image */}
      {article.s7b_article_image && (
        <div className="relative w-full h-[400px] mb-12 rounded-xl overflow-hidden">
          <Image
            src={formatImageUrl(article.s7b_article_image) || ''}
            alt={getArticleImageAlt(article.s7b_article_title, locale)}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Article Body with Enhanced Styling */}
      <div
        ref={articleBodyRef}
        id="article-body"
        className={`article-content prose prose-lg max-w-none mb-12 ${isRTL ? 'text-right' : 'text-left'}`}
        dangerouslySetInnerHTML={{ __html: article.s7b_article_body }}
      />

      {/* Custom Styles for Article Content */}
      <style jsx global>{`
        .article-content {
          font-size: 18px;
          line-height: 2.2;
          color: #374151; /* Dark grey instead of pure black for reduced eye strain */
        }

        /* English fonts */
        html[lang="en"] .article-content h1,
        html[lang="en"] .article-content h2,
        html[lang="en"] .article-content h3 {
          font-family: var(--font-poppins), 'Poppins', sans-serif;
          font-weight: 700;
          color: #1f2937;
          scroll-margin-top: 120px;
        }

        html[lang="en"] .article-content p,
        html[lang="en"] .article-content li,
        html[lang="en"] .article-content blockquote {
          font-family: var(--font-inter), 'Inter', sans-serif;
        }

        /* Arabic fonts */
        html[lang="ar"] .article-content h1,
        html[lang="ar"] .article-content h2,
        html[lang="ar"] .article-content h3 {
          font-family: var(--font-readex), 'Readex Pro', sans-serif;
          font-weight: 700;
          color: #1f2937;
          scroll-margin-top: 120px;
        }

        html[lang="ar"] .article-content p,
        html[lang="ar"] .article-content li,
        html[lang="ar"] .article-content blockquote {
          font-family: var(--font-readex), 'Readex Pro', sans-serif;
        }

        .article-content h1 {
          font-size: 2.5rem;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
        }

        .article-content h2 {
          font-size: 28px;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
        }

        .article-content h3 {
          font-size: 24px;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .article-content p {
          color: #374151; /* Dark grey for better readability */
          font-size: 18px;
          line-height: 2.2;
          margin-bottom: 2rem; /* Increased spacing for better breathing room */
        }

        .article-content img {
          border-radius: 0.75rem;
          margin: 2rem 0;
          width: 100%;
          height: auto;
        }

        .article-content ul,
        .article-content ol {
          margin: 2rem 0; /* Increased spacing for better breathing room */
          padding-${isRTL ? 'right' : 'left'}: 2rem;
          color: #4b5563; /* Updated to match body text color scheme */
        }

        .article-content li {
          color: #4b5563; /* Updated to match body text color scheme */
          margin-bottom: 0.75rem; /* Increased spacing between list items */
          line-height: 2.2;
        }

        .article-content a {
          color: #42a5f5;
          text-decoration: none;
          transition: color 0.2s;
        }

        .article-content a:hover {
          color: #1e88e5;
        }

        .article-content blockquote {
          border-${isRTL ? 'right' : 'left'}: 4px solid #42a5f5;
          padding-${isRTL ? 'right' : 'left'}: 1.5rem;
          margin: 2.5rem 0; /* Increased spacing for emphasis */
          font-style: italic;
          color: #4b5563; /* Updated to match body text color scheme */
          font-size: 1.125rem;
          line-height: 2.3;
        }

        .article-content code {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          color: #374151; /* Updated for consistency */
        }

        .article-content pre {
          background: #1a1a1a;
          color: #4ade80;
          padding: 1.5rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 2rem 0;
        }

        .article-content pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }

        .article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
        }

        .article-content th,
        .article-content td {
          border: 1px solid #d0e7ff;
          padding: 0.75rem;
          text-align: ${isRTL ? 'right' : 'left'};
        }

        .article-content th {
          background: #eaf6ff;
          font-weight: 600;
          color: #1a1a1a;
        }

        /* Info boxes and callouts */
        .article-content .info-box,
        .article-content .callout {
          background: rgba(234, 246, 255, 0.3);
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin: 2rem 0;
        }

        .article-content .info-box h4,
        .article-content .callout h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
        }

        .article-content .info-box p,
        .article-content .callout p {
          color: #4a6572;
          margin-bottom: 0;
        }
      `}</style>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className={`border-t border-border-blue pt-8 mt-12 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h3 className="text-xl font-poppins font-bold text-charcoal mb-4">
            {locale === 'ar' ? 'الوسوم' : 'Tags'}
          </h3>
          <div className={`flex ${isRTL ? 'flex-row-reverse justify-end' : ''} gap-3 flex-wrap`}>
            {article.tags.map((tag: any) => (
              <Link
                key={tag.s7b_tags_id}
                href={`/${locale}/tags/${tag.s7b_tags_id}`}
                className="px-4 py-2 bg-sky-bg text-sky-cta rounded-full text-sm font-medium hover:bg-sky-cta hover:text-white transition-colors cursor-pointer"
              >
                #{tag.s7b_tags_name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {article.comments && article.comments.length > 0 && (
        <div className={`border-t border-border-blue pt-8 mt-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h3 className="text-2xl font-poppins font-bold text-charcoal mb-6">
            {locale === 'ar' ? 'التعليقات' : 'Comments'} ({article.comments.length})
          </h3>
          <div className="space-y-6">
            {article.comments.map((comment: any) => (
              <div key={comment.s7b_comment_id} className="bg-sky-bg/30 rounded-xl p-6">
                <div className={`flex ${isRTL ? 'flex-row-reverse justify-end' : ''} gap-3 mb-3`}>
                  <div className="w-10 h-10 bg-sky-cta rounded-full flex items-center justify-center text-white font-bold">
                    {comment.s7b_comment_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-semibold text-charcoal">{comment.s7b_comment_user_name}</p>
                    <p className="text-sm text-muted-blue">{formatDate(comment.s7b_comment_add_date)}</p>
                  </div>
                </div>
                <p className="text-muted-blue">{comment.s7b_comment_body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

