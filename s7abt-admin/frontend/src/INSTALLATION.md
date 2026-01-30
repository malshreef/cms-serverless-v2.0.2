# Frontend S3 Image Upload - Installation Guide

## Files Included

```
frontend-s3-updated/
├── components/
│   └── ImageUpload.jsx       # Drag & drop image upload component
├── lib/
│   └── imageUtils.js         # Image utility functions
├── pages/
│   ├── News.jsx              # Updated news list page
│   └── NewsForm.jsx          # Updated news form with image upload
└── INSTALLATION.md           # This file
```

---

## Installation Steps

### 1. Copy Files to Your Project

```bash
# Navigate to your frontend project root
cd /path/to/your/frontend

# Copy components
cp components/ImageUpload.jsx src/components/

# Copy utilities
cp lib/imageUtils.js src/lib/

# Copy pages
cp pages/NewsForm.jsx src/pages/
cp pages/News.jsx src/pages/
```

### 2. Update Environment Variables

Add these to your `.env` file:

```env
VITE_API_BASE_URL=https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev
VITE_S3_BASE_URL=https://<your-s3-bucket>.s3.me-central-1.amazonaws.com
```

### 3. Restart Development Server

```bash
npm run dev
```

---

## What Changed

### NewsForm.jsx
- ❌ Removed: Text input for image URL
- ✅ Added: ImageUpload component with drag & drop
- ✅ Added: Direct S3 upload with progress tracking
- ✅ Added: Image preview before saving

### News.jsx
- ✅ Added: `buildImageUrl()` to display S3 images
- ✅ Added: Error handling for missing images
- ✅ Updated: Image display in list and modal

### ImageUpload.jsx (New)
- ✅ Drag & drop interface
- ✅ Upload progress indicator
- ✅ File validation (type, size)
- ✅ Image preview
- ✅ Error messages in Arabic

### imageUtils.js (New)
- ✅ `buildImageUrl()` - Build full S3 URL from key
- ✅ `extractS3Key()` - Extract key from URL
- ✅ `validateImageFile()` - File validation
- ✅ `formatFileSize()` - Format bytes to human-readable

---

## Testing

### 1. Create News with Image

1. Go to **News** → **خبر جديد** (Create News)
2. You should see a new upload area instead of text input
3. Click or drag an image to upload
4. Watch the upload progress (0% → 100%)
5. Verify image preview appears
6. Fill in news details and click **حفظ** (Save)
7. Check that news appears in list with image

### 2. Edit News with Image

1. Go to **News** list
2. Click edit on any news item
3. Existing image should display
4. You can upload a new image to replace it
5. Save and verify changes

### 3. View News

1. Click the eye icon on any news
2. Modal should open with image
3. Image should display correctly

---

## Troubleshooting

### Images Not Uploading

**Check browser console (F12) for errors:**

1. **"Unauthorized"** - Check that you're logged in
2. **"CORS error"** - Verify S3 bucket CORS is configured
3. **"Network error"** - Check API Gateway endpoint is correct

**Verify environment variables:**
```javascript
// In browser console
console.log(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env.VITE_S3_BASE_URL);
```

### Images Not Displaying

**Check image URLs:**
```javascript
// In browser console, on News page
console.log('First news image:', news[0]?.image);
```

Should show either:
- S3 key: `news/1729567890-abc123.jpg`
- Full URL: `https://<your-s3-bucket>.s3.me-central-1.amazonaws.com/news/...`

**Verify S3 bucket is public:**
```bash
aws s3api get-bucket-policy \
  --bucket <your-s3-bucket> \
  --region me-central-1
```

### Upload Progress Stuck

- Check Lambda function logs in CloudWatch
- Verify presigned URL is being generated
- Check S3 bucket permissions

---

## API Endpoint

The image upload uses this endpoint:

```
POST /admin/media/presigned-url
```

**Request:**
```json
{
  "fileName": "image.jpg",
  "fileType": "image/jpeg",
  "folder": "news"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://<your-s3-bucket>.s3.amazonaws.com/...",
    "fileKey": "news/1729567890-abc123.jpg",
    "publicUrl": "https://<your-s3-bucket>.s3.me-central-1.amazonaws.com/news/1729567890-abc123.jpg",
    "expiresIn": 300
  }
}
```

---

## Features

✅ **Secure Upload** - Uses presigned URLs (no credentials in browser)  
✅ **Direct to S3** - No server intermediary  
✅ **Progress Tracking** - Real-time upload progress  
✅ **Drag & Drop** - Modern UX  
✅ **Validation** - File type, size checks  
✅ **Preview** - Instant image preview  
✅ **Error Handling** - Arabic error messages  
✅ **Backward Compatible** - Works with existing image URLs  

---

## Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev` | API Gateway base URL |
| `VITE_S3_BASE_URL` | `https://<your-s3-bucket>.s3.me-central-1.amazonaws.com` | S3 bucket base URL |

---

## Support

For issues:
1. Check browser console for errors
2. Check CloudWatch Logs for Lambda errors
3. Verify environment variables are set
4. Test API endpoint with curl

---

**Version:** 1.0  
**Date:** October 22, 2025  
**Status:** Production Ready 🚀

