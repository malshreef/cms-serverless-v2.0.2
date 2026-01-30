'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface Section {
  title: string;
  content: string;
}

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
      const id = `heading-${index}`;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.substring(1));
      
      // Add ID to heading
      heading.id = id;
      
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
        button.className = `text-muted-blue hover:text-sky-cta transition-all duration-200 block py-1 text-${isRTL ? 'right' : 'left'} w-full text-sm ${
          activeId === item.id ? 'text-sky-cta font-semibold' : ''
        } ${item.level > 2 ? (isRTL ? 'pr-4' : 'pl-4') : ''} hover:${isRTL ? 'pr-2' : 'pl-2'}`;
        
        button.addEventListener('click', () => scrollToHeading(item.id));
        
        li.appendChild(button);
        tocNav.appendChild(li);
      });
    }
  }, [tocItems, activeId, isRTL]);

  // Render article sections properly
  const renderArticleContent = () => {
    if (!article.sections || article.sections.length === 0) {
      // Fallback to old structure if sections don't exist
      return article.s7b_article_body || article.content || '';
    }

    // Build HTML from sections array
    return article.sections
      .map((section: Section) => {
        let html = '';
        if (section.title) {
          html += `<h2>${section.title}</h2>`;
        }
        if (section.content) {
          html += section.content;
        }
        return html;
      })
      .join('');
  };

  return (
    <div>
      {/* Featured Image */}
      {(article.mainImage || article.s7b_article_image) && (
        <div className="relative w-full h-[400px] mb-12 rounded-xl overflow-hidden">
          <Image
            src={article.mainImage || article.s7b_article_image}
            alt={article.title || article.s7b_article_title}
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
        dangerouslySetInnerHTML={{ __html: renderArticleContent() }}
      />

      {/* Custom Styles for Article Content */}
      <style jsx global>{`
        .article-content {
          font-size: 18px;
          line-height: 1.8;
          color: #1a1a1a;
        }

        .article-content h1,
        .article-content h2,
        .article-content h3 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          color: #1a1a1a;
          scroll-margin-top: 120px;
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
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
          font-size: 18px;
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }

        .article-content img {
          border-radius: 0.75rem;
          margin: 2rem 0;
          width: 100%;
          height: auto;
        }

        .article-content ul,
        .article-content ol {
          margin: 1.5rem 0;
          padding-${isRTL ? 'right' : 'left'}: 2rem;
          color: #4a6572;
        }

        .article-content li {
          color: #4a6572;
          margin-bottom: 0.5rem;
          line-height: 1.8;
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
          margin: 2rem 0;
          font-style: italic;
          color: #4a6572;
          font-size: 1.125rem;
        }

        .article-content code {
          background: #f5f5f5;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          color: #1a1a1a;
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
              <a
                key={tag.id || tag.s7b_tags_id}
                href={`/${locale}/tags/${tag.id || tag.s7b_tags_id}`}
                className="px-4 py-2 bg-sky-bg text-sky-cta rounded-full text-sm font-medium hover:bg-sky-cta hover:text-white transition-colors cursor-pointer"
              >
                #{tag.name || tag.s7b_tags_name}
              </a>
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
              <div key={comment.s7b_comment_id || comment.id} className="bg-sky-bg/30 rounded-xl p-6">
                <div className={`flex ${isRTL ? 'flex-row-reverse justify-end' : ''} gap-3 mb-3`}>
                  <div className="w-10 h-10 bg-sky-cta rounded-full flex items-center justify-center text-white font-bold">
                    {(comment.s7b_comment_user_name || comment.userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-semibold text-charcoal">{comment.s7b_comment_user_name || comment.userName}</p>
                    <p className="text-sm text-muted-blue">{formatDate(comment.s7b_comment_add_date || comment.createdAt)}</p>
                  </div>
                </div>
                <p className="text-muted-blue">{comment.s7b_comment_body || comment.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
