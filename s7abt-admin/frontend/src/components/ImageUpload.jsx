import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const ImageUpload = ({ 
  value, 
  onChange, 
  folder = 'news',
  label = 'صورة الخبر',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev';
  const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || 'https://<your-s3-bucket>.s3.me-central-1.amazonaws.com';

  // Sync preview with value prop changes (for loading existing images)
  useEffect(() => {
    console.log('ImageUpload - value changed:', value);
    if (value) {
      setPreview(value);
      console.log('ImageUpload - preview set to:', value);
    } else {
      setPreview(null);
      console.log('ImageUpload - preview cleared');
    }
  }, [value]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(`حجم الملف يجب أن يكون أقل من ${maxSize / (1024 * 1024)} ميجابايت`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('يجب اختيار ملف صورة فقط');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Get auth token
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if (!token) {
        setError('يجب تسجيل الدخول أولاً');
        setUploading(false);
        return;
      }

      // Step 1: Get presigned URL from backend
      const presignedResponse = await axios.post(
        `${API_BASE_URL}/admin/media/presigned-url`,
        {
          fileName: file.name,
          fileType: file.type,
          folder: folder
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { uploadUrl, fileKey, publicUrl } = presignedResponse.data.data;

      // Step 2: Upload file to S3 using presigned URL
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      // Step 3: Update preview and notify parent
      setPreview(fileKey); // Store the key, not the full URL
      onChange(fileKey); // Store only the S3 key in the database
      
      setUploading(false);
      setUploadProgress(100);

      console.log('ImageUpload - Upload successful:', fileKey);

    } catch (err) {
      console.error('Upload error:', err);
      setError('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const buildImageUrl = (imageKey) => {
    if (!imageKey) {
      console.log('ImageUpload - buildImageUrl: no imageKey');
      return null;
    }
    // If already a full URL, return as is
    if (imageKey.startsWith('http')) {
      console.log('ImageUpload - buildImageUrl: full URL:', imageKey);
      return imageKey;
    }
    // Otherwise, build S3 URL from key
    const fullUrl = `${S3_BASE_URL}/${imageKey}`;
    console.log('ImageUpload - buildImageUrl: built URL:', fullUrl, 'from key:', imageKey);
    return fullUrl;
  };

  const imageUrl = buildImageUrl(preview);
  console.log('ImageUpload - Rendering with preview:', preview, 'imageUrl:', imageUrl);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-charcoal text-right">
        {label}
      </label>

      {preview ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg border border-border-blue"
            onError={(e) => {
              console.error('ImageUpload - Image failed to load:', imageUrl);
              console.error('ImageUpload - Error event:', e);
            }}
            onLoad={() => {
              console.log('ImageUpload - Image loaded successfully:', imageUrl);
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
            title="حذف الصورة"
          >
            <X className="w-4 h-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">جاري الرفع... {uploadProgress}%</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border-blue rounded-lg p-8 text-center cursor-pointer hover:border-sky-cta hover:bg-sky-bg transition"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <div className="text-center">
              <Loader className="w-12 h-12 text-sky-cta animate-spin mx-auto mb-4" />
              <p className="text-muted-blue">جاري الرفع... {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-sky-cta h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="w-12 h-12 text-muted-blue mx-auto mb-4" />
              <p className="text-muted-blue mb-2">اضغط لاختيار صورة</p>
              <p className="text-sm text-gray-400">
                PNG, JPG, GIF, WebP (حد أقصى {maxSize / (1024 * 1024)} ميجابايت)
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {uploadProgress === 100 && !uploading && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span>تم رفع الصورة بنجاح</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

