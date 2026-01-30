# Authentication Fix for Image Upload

## What Was Fixed

The ImageUpload component was getting **401 Unauthorized** because it wasn't sending the Cognito auth token with the API request.

### Changes Made:

1. **Added Amplify auth import** to ImageUpload.jsx
2. **Fetches auth token** before making API request
3. **Includes Authorization header** in the presigned URL request

---

## Installation

### Quick Update (Just ImageUpload.jsx)

```bash
cp components/ImageUpload.jsx src/components/
```

Then refresh your browser and try uploading again!

---

## What Changed in ImageUpload.jsx

### Before:
```javascript
const presignedResponse = await axios.post(
  `${API_BASE_URL}/admin/media/presigned-url`,
  {
    fileName: file.name,
    fileType: file.type,
    folder: folder
  }
);
```

### After:
```javascript
// Get auth token
const session = await fetchAuthSession();
const token = session.tokens?.idToken?.toString();

if (!token) {
  setError('يجب تسجيل الدخول أولاً');
  setUploading(false);
  return;
}

// Include token in request
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
```

---

## Testing

After copying the file:

1. Refresh your browser (Ctrl+F5)
2. Go to News → Create News
3. Try uploading an image
4. Should work now! ✅

---

## Expected Behavior

1. Click/drag image to upload
2. Component fetches auth token from Amplify
3. Sends POST request with Authorization header
4. Gets presigned URL from Lambda
5. Uploads file directly to S3
6. Shows progress and preview
7. Saves S3 key to form

---

**Version:** 1.1  
**Fix:** Added authentication to image upload  
**Status:** Ready to use 🚀

