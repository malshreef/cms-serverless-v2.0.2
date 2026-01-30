import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { articlesAPI } from '../lib/api';
import { ArrowLeft, Edit, Calendar, User, Tag, Eye } from 'lucide-react';

const ArticleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://<your-s3-bucket>.s3.me-central-1.amazonaws.com';

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.get(id);
      const articleData = response.data.data;
      setArticle(articleData);
    } catch (err) {
      setError('خطأ في تحميل المقال: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildImageUrl = (imageKey) => {
    if (!imageKey) return null;
    // Filter out default placeholder
    if (imageKey === 'no-image.png') return null;
    // If already a full URL, return as is
    if (imageKey.startsWith('http')) return imageKey;
    // Otherwise, build S3 URL from key
    return `${S3_BASE_URL}/${imageKey}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-amber-100 text-amber-700',
      scheduled: 'bg-blue-100 text-blue-700',
    };
    
    const labels = {
      published: 'منشور',
      draft: 'مسودة',
      scheduled: 'مجدول',
    };

    return (
      <span className={`px-3 py-1 text-sm rounded-full ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-cta"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-right">{error}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-blue text-lg">المقال غير موجود</p>
      </div>
    );
  }

  const imageUrl = buildImageUrl(article.mainImage);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/articles')}
          className="flex items-center space-x-2 space-x-reverse text-muted-blue hover:text-charcoal transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>العودة للمقالات</span>
        </button>
        <button
          onClick={() => navigate(`/articles/${id}/edit`)}
          className="bg-sky-cta hover:bg-sky-cta-hover text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 space-x-reverse transition"
        >
          <Edit className="w-5 h-5" />
          <span>تعديل المقال</span>
        </button>
      </div>

      {/* Article Content */}
      <article className="bg-cloud-white rounded-lg border border-border-blue shadow-sm overflow-hidden">
        {/* Main Image - Only show if not default placeholder */}
        {imageUrl && (
          <div className="w-full h-96 overflow-hidden">
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8">
          {/* Meta Info */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-border-blue">
            <div className="flex items-center space-x-4 space-x-reverse">
              {getStatusBadge(article.status)}
              {article.section && (
                <span className="text-sm text-muted-blue">
                  {article.section.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 space-x-reverse text-sm text-muted-blue">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Calendar className="w-4 h-4" />
                <span>{new Date(article.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
              {article.author && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <User className="w-4 h-4" />
                  <span>{article.author.name || 'مؤلف'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold font-readex text-charcoal mb-4 text-right">
            {article.title}
          </h1>

          {/* Slug */}
          {article.slug && (
            <div className="mb-6 text-sm text-muted-blue text-left">
              <span className="font-mono bg-sky-bg px-3 py-1 rounded">
                {article.slug}
              </span>
            </div>
          )}

          {/* Excerpt */}
          {article.excerpt && (
            <div className="mb-8 p-4 bg-sky-bg rounded-lg border-r-4 border-sky-cta">
              <p className="text-lg text-charcoal text-right leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          )}

          {/* Article Sections */}
          {article.sections && article.sections.length > 0 && (
            <div className="space-y-8">
              {article.sections.map((section, index) => (
                <div key={index} className="border-b border-border-blue pb-8 last:border-b-0">
                  {section.title && (
                    <h2 className="text-2xl font-bold font-readex text-charcoal mb-4 text-right">
                      {section.title}
                    </h2>
                  )}
                  {section.content && (
                    <div
                      className="prose prose-lg max-w-none text-right text-charcoal leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border-blue">
              <div className="flex items-center space-x-3 space-x-reverse">
                <Tag className="w-5 h-5 text-muted-blue" />
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-sky-bg text-charcoal text-sm rounded-lg border border-border-blue"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* View Count (if available) */}
          {article.views !== undefined && article.views > 0 && (
            <div className="mt-6 flex items-center justify-center space-x-2 space-x-reverse text-muted-blue">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{article.views} مشاهدة</span>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export default ArticleView;

