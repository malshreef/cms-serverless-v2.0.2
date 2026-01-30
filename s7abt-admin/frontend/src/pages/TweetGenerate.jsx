import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesAPI, tweetsAPI } from '../lib/api';
import {
  MessageSquare,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';

const TweetGenerate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Select Article, 2: Generating, 3: Review & Confirm
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [generatedTweets, setGeneratedTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      // Fetch only latest 6 published articles, sorted by newest first
      const response = await articlesAPI.list({
        status: 'published',
        limit: 6,
        sort: 'createdAt',
        order: 'DESC'
      });
      const articlesData = response.data?.data || response.data || {};
      const articlesList = articlesData.articles || [];

      // Map to the format expected by the UI
      const formattedArticles = articlesList.map(article => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt || 'لا يوجد ملخص',
        created_at: article.createdAt,
        status: article.status,
      }));

      setArticles(formattedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('فشل في تحميل المقالات');
    }
  };

  const handleGenerateTweets = async () => {
    if (!selectedArticle) return;

    setLoading(true);
    setError(null);
    setStep(2);

    try {
      // Call the tweet generator Lambda
      const response = await tweetsAPI.generate(selectedArticle.id, {
        article_title: selectedArticle.title,
        article_url: `https://s7abt.com/articles/${selectedArticle.id}`
      });

      const responseData = response.data?.data || response.data || {};
      const tweets = responseData.tweets || [];

      if (tweets.length === 0) {
        throw new Error('لم يتم إنشاء أي تغريدات');
      }

      // Format tweets for display
      const formattedTweets = tweets.map(tweet => ({
        text: tweet.tweet_text || tweet.text,
        tone: tweet.tone || 'professional',
        hashtags: tweet.hashtags || [],
      }));

      setGeneratedTweets(formattedTweets);
      setStep(3);
      setLoading(false);
    } catch (error) {
      console.error('Error generating tweets:', error);
      const errorMessage = error.response?.data?.message || error.message || 'فشل في إنشاء التغريدات';
      setError(`${errorMessage}. يرجى المحاولة مرة أخرى.`);
      setLoading(false);
      setStep(1);
    }
  };

  const handleSaveTweets = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: API call to save tweets to DynamoDB
      // Already done by the generator Lambda, so this might just be a confirmation
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/tweets');
      }, 2000);
    } catch (error) {
      console.error('Error saving tweets:', error);
      setError('فشل في حفظ التغريدات');
      setLoading(false);
    }
  };

  const getToneBadge = (tone) => {
    return tone === 'professional' ? (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">احترافي</span>
    ) : (
      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">ودي</span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal font-readex">إنشاء تغريدات من مقال</h1>
        <p className="text-muted-blue mt-1">
          اختر مقالاً وسنقوم بإنشاء 3-5 تغريدة متنوعة تلقائياً باستخدام الذكاء الاصطناعي
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-sky-cta text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                1
              </div>
              <div className="mr-3 text-right">
                <p className={`font-semibold ${step >= 1 ? 'text-charcoal' : 'text-gray-500'}`}>
                  اختيار المقال
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center">
            <div className={`flex-1 h-1 ${step >= 2 ? 'bg-sky-cta' : 'bg-gray-200'}`}></div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-sky-cta text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>
            <div className="mr-3 text-right">
              <p className={`font-semibold ${step >= 2 ? 'text-charcoal' : 'text-gray-500'}`}>
                إنشاء التغريدات
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-center">
            <div className={`flex-1 h-1 ${step >= 3 ? 'bg-sky-cta' : 'bg-gray-200'}`}></div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-sky-cta text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              3
            </div>
            <div className="mr-3 text-right">
              <p className={`font-semibold ${step >= 3 ? 'text-charcoal' : 'text-gray-500'}`}>
                المراجعة والحفظ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 ml-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-right">
            <p className="text-red-800 font-semibold">خطأ</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 ml-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-right">
            <p className="text-green-800 font-semibold">تم بنجاح!</p>
            <p className="text-green-700 text-sm mt-1">
              تم حفظ التغريدات في قائمة الانتظار. جاري التحويل إلى صفحة إدارة التغريدات...
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Select Article */}
      {step === 1 && (
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
          <div className="p-6 border-b border-border-blue">
            <h2 className="text-xl font-bold text-charcoal text-right">اختر مقالاً</h2>
            <p className="text-sm text-muted-blue mt-1 text-right">
              اختر المقال الذي تريد إنشاء تغريدات منه من آخر 6 مقالات منشورة
            </p>
          </div>

          <div className="p-6">
            {articles.length === 0 ? (
              <div className="text-center py-12 text-muted-blue">
                <p>لا توجد مقالات منشورة حالياً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedArticle?.id === article.id
                      ? 'border-sky-cta bg-sky-bg'
                      : 'border-border-blue hover:border-sky-cta hover:bg-sky-bg'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 text-right">
                      <h3 className="font-semibold text-charcoal mb-2">
                        {article.title}
                        {/* Show "New" badge for articles published in last 7 days */}
                        {new Date() - new Date(article.created_at) < 7 * 24 * 60 * 60 * 1000 && (
                          <span className="mr-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            جديد
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-blue mb-2">{article.excerpt}</p>
                      <p className="text-xs text-muted-blue">
                        تاريخ النشر: {new Date(article.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="mr-4">
                      <FileText className="w-6 h-6 text-sky-cta" />
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGenerateTweets}
                disabled={!selectedArticle || articles.length === 0}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold transition ${
                  selectedArticle && articles.length > 0
                    ? 'bg-sky-cta text-white hover:bg-sky-cta-hover'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-5 h-5 ml-2" />
                إنشاء التغريدات
                <ArrowRight className="w-5 h-5 mr-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Generating */}
      {step === 2 && (loading || success) && (
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm p-12">
          <div className="text-center">
            {success ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-charcoal mb-2">تم بدء إنشاء التغريدات!</h3>
                <p className="text-muted-blue">
                  جاري إنشاء التغريدات في الخلفية باستخدام الذكاء الاصطناعي
                </p>
                <p className="text-sm text-green-600 mt-4">سيتم تحويلك إلى قائمة التغريدات...</p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-bg rounded-full mb-4">
                  <Loader className="w-8 h-8 text-sky-cta animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-charcoal mb-2">جاري بدء عملية الإنشاء...</h3>
                <p className="text-muted-blue">
                  نقوم بتحضير المقال لإنشاء التغريدات
                </p>
                <p className="text-sm text-muted-blue mt-4">لحظات قليلة...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && !loading && (
        <div className="bg-cloud-white rounded-lg border border-border-blue shadow-sm">
          <div className="p-6 border-b border-border-blue">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <h2 className="text-xl font-bold text-charcoal">مراجعة التغريدات المُنشأة</h2>
                <p className="text-sm text-muted-blue mt-1">
                  تم إنشاء {generatedTweets.length} تغريدة بنجاح
                </p>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6 bg-sky-bg p-4 rounded-lg text-right">
              <p className="text-sm text-charcoal">
                <strong>المقال:</strong> {selectedArticle?.title}
              </p>
              <p className="text-xs text-muted-blue mt-2">
                سيتم نشر هذه التغريدات تلقائياً يومياً في الساعة 3:00 مساءً (توقيت الرياض)
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generatedTweets.map((tweet, index) => (
                <div key={index} className="border border-border-blue rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getToneBadge(tweet.tone)}
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        #{index + 1}
                      </span>
                    </div>
                  </div>

                  <p className="text-charcoal text-right mb-3 whitespace-pre-wrap">{tweet.text}</p>

                  <div className="flex items-center justify-end space-x-2 space-x-reverse">
                    {tweet.hashtags.map((tag, idx) => (
                      <span key={idx} className="text-xs text-sky-cta">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedArticle(null);
                  setGeneratedTweets([]);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                إلغاء
              </button>

              <button
                onClick={handleSaveTweets}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-sky-cta text-white rounded-lg hover:bg-sky-cta-hover transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 ml-2" />
                    حفظ وإضافة إلى قائمة الانتظار
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TweetGenerate;

