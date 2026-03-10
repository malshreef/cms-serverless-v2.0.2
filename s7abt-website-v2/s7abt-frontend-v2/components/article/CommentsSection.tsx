'use client';

import { useState } from 'react';
import { Comment, commentsApi } from '@/lib/api/client';

interface CommentsSectionProps {
  articleId: number;
  comments: Comment[];
  locale: string;
  isRTL: boolean;
}

export default function CommentsSection({ articleId, comments, locale, isRTL }: CommentsSectionProps) {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const t = {
    title: locale === 'ar' ? 'التعليقات' : 'Comments',
    noComments: locale === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يعلق!' : 'No comments yet. Be the first to comment!',
    addComment: locale === 'ar' ? 'أضف تعليقاً' : 'Add a comment',
    name: locale === 'ar' ? 'الاسم' : 'Name',
    email: locale === 'ar' ? 'البريد الإلكتروني' : 'Email',
    body: locale === 'ar' ? 'التعليق' : 'Comment',
    submit: locale === 'ar' ? 'إرسال التعليق' : 'Submit Comment',
    submitting: locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...',
    success: locale === 'ar' ? 'تم إرسال تعليقك بنجاح وسيظهر بعد المراجعة' : 'Your comment was submitted successfully and will appear after review',
    error: locale === 'ar' ? 'حدث خطأ في إرسال التعليق' : 'Failed to submit comment',
    namePlaceholder: locale === 'ar' ? 'أدخل اسمك' : 'Enter your name',
    emailPlaceholder: locale === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email',
    bodyPlaceholder: locale === 'ar' ? 'اكتب تعليقك هنا...' : 'Write your comment here...',
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const normalized = dateString.replace(' ', 'T');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      await commentsApi.create(articleId, {
        userName: userName.trim(),
        email: email.trim(),
        commentBody: commentBody.trim(),
      });
      setSubmitSuccess(true);
      setUserName('');
      setEmail('');
      setCommentBody('');
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || t.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 pt-12 border-t border-border-blue/30">
      {/* Section Title */}
      <h2 className={`text-2xl font-poppins font-bold text-charcoal mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
        {t.title} ({comments.length})
      </h2>

      {/* Existing Comments */}
      {comments.length > 0 ? (
        <div className="space-y-6 mb-12">
          {comments.map((comment) => (
            <div
              key={comment.s7b_comment_id}
              className="bg-sky-bg/30 rounded-xl p-6"
            >
              <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 bg-sky-cta rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {getInitials(comment.s7b_comment_user_name)}
                </div>

                <div className="flex-1">
                  <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold text-charcoal">
                      {comment.s7b_comment_user_name}
                    </span>
                    <span className="text-xs text-muted-blue">
                      {formatDate(comment.s7b_comment_add_date)}
                    </span>
                  </div>
                  <p className={`text-charcoal/80 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                    {comment.s7b_comment_body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-8">
          <p className="text-muted-blue">{t.noComments}</p>
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className={`text-green-700 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.success}
          </p>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className={`text-red-700 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {submitError}
          </p>
        </div>
      )}

      {/* Comment Form */}
      <div className="bg-white border border-border-blue rounded-xl p-6 shadow-sm">
        <h3 className={`text-lg font-poppins font-semibold text-charcoal mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.addComment}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium text-charcoal mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.name} *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t.namePlaceholder}
                required
                maxLength={100}
                className={`w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-charcoal ${isRTL ? 'text-right' : 'text-left'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium text-charcoal mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.email} *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className={`w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-charcoal ${isRTL ? 'text-right' : 'text-left'}`}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium text-charcoal mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.body} *
            </label>
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder={t.bodyPlaceholder}
              required
              maxLength={5000}
              rows={4}
              className={`w-full px-4 py-2 border border-border-blue rounded-lg focus:ring-2 focus:ring-sky-cta focus:border-transparent text-charcoal resize-y ${isRTL ? 'text-right' : 'text-left'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <div className={isRTL ? 'text-left' : 'text-right'}>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-sky-cta text-white rounded-lg hover:bg-sky-cta/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
