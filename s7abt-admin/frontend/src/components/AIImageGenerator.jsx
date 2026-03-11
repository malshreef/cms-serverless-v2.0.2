import { useState } from 'react';
import { Sparkles, Loader, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { aiImagesAPI } from '../lib/api';

const AIImageGenerator = ({ title, content, type = 'article', onSelect }) => {
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [error, setError] = useState(null);

  const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || '';

  const buildImageUrl = (key) => {
    if (!key) return null;
    if (key.startsWith('http')) return key;
    return `${S3_BASE_URL}/${key}`;
  };

  const handleGenerate = async () => {
    if (!title?.trim()) {
      setError('يرجى كتابة العنوان أولاً قبل توليد الصور');
      return;
    }

    setError(null);
    setGenerating(true);
    setImages([]);
    setSelectedIndex(null);

    try {
      const response = await aiImagesAPI.generate({ title, content, type });
      const generated = response.data?.data?.images || response.data?.images || [];

      if (generated.length === 0) {
        setError('لم يتم توليد أي صور. يرجى المحاولة مرة أخرى.');
      } else {
        setImages(generated);
      }
    } catch (err) {
      console.error('AI image generation error:', err);
      const msg = err.response?.data?.error?.message || err.message;
      setError(`فشل توليد الصور: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (index) => {
    setSelectedIndex(index);
    const image = images[index];
    if (image && onSelect) {
      onSelect(image.key);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>جاري التوليد...</span>
            </>
          ) : (
            <>
              {images.length > 0 ? (
                <RefreshCw className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span>{images.length > 0 ? 'إعادة التوليد' : 'توليد صور بالذكاء الاصطناعي'}</span>
            </>
          )}
        </button>
        <p className="text-xs text-muted-blue">
          سيتم توليد 3 صور باستخدام DALL-E
        </p>
      </div>

      {/* Loading State */}
      {generating && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-8 text-center">
          <Loader className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-indigo-700 font-medium">جاري توليد 3 صور بالذكاء الاصطناعي...</p>
          <p className="text-indigo-500 text-sm mt-2">قد تستغرق هذه العملية حتى 30 ثانية</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generated Images Grid */}
      {images.length > 0 && !generating && (
        <div>
          <p className="text-sm font-medium text-charcoal mb-3 text-right">
            اختر الصورة المناسبة:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                onClick={() => handleSelect(index)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  selectedIndex === index
                    ? 'border-green-500 ring-2 ring-green-200 shadow-lg'
                    : 'border-border-blue hover:border-sky-cta hover:shadow-md'
                }`}
              >
                <img
                  src={image.url || buildImageUrl(image.key)}
                  alt={`AI Generated ${index + 1}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = '';
                    e.target.alt = 'فشل تحميل الصورة';
                  }}
                />

                {/* Selection overlay */}
                {selectedIndex === index && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="bg-green-500 text-white rounded-full p-2">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>
                )}

                {/* Image number badge */}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {selectedIndex !== null && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg mt-3">
              <Check className="w-4 h-4" />
              <span>تم اختيار الصورة {selectedIndex + 1} كصورة رئيسية</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIImageGenerator;
