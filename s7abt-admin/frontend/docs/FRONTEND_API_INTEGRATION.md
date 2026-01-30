# Frontend API Integration Guide

## Overview

The admin frontend is configured to connect to your backend API with authentication.

**API Endpoint**: `https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev`

---

## Step 1: Update API Service

Replace `src/lib/api.js` with the complete version.

### Option 1: Replace File

1. Download `api-complete.js`
2. Rename it to `api.js`
3. Replace `src/lib/api.js` with it

### Option 2: Copy Content

Copy the content from `api-complete.js` and paste it into `src/lib/api.js`

---

## Step 2: Test API Connection (Without Auth)

Let's first test if the API is reachable without authentication.

### Create Test Page

Create `src/pages/ApiTest.jsx`:

```jsx
import { useState } from 'react';
import { sectionsAPI, tagsAPI } from '../lib/api';

function ApiTest() {
  const [sections, setSections] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testSections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sectionsAPI.list();
      setSections(response.data.data || []);
      alert('✓ Sections loaded successfully!');
    } catch (err) {
      setError(err.message);
      alert('✗ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tagsAPI.list();
      setTags(response.data.data || []);
      alert('✓ Tags loaded successfully!');
    } catch (err) {
      setError(err.message);
      alert('✗ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testSections}
            disabled={loading}
            className="bg-sky-cta text-white px-6 py-2 rounded-lg hover:bg-sky-cta-hover disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Sections API'}
          </button>
          {sections.length > 0 && (
            <div className="mt-2 p-4 bg-green-100 rounded">
              <p className="font-bold">Sections ({sections.length}):</p>
              <ul>
                {sections.map(s => (
                  <li key={s.id}>{s.name} ({s.nameEn})</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={testTags}
            disabled={loading}
            className="bg-sky-cta text-white px-6 py-2 rounded-lg hover:bg-sky-cta-hover disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Tags API'}
          </button>
          {tags.length > 0 && (
            <div className="mt-2 p-4 bg-green-100 rounded">
              <p className="font-bold">Tags ({tags.length}):</p>
              <ul>
                {tags.map(t => (
                  <li key={t.id}>{t.name} ({t.nameEn})</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiTest;
```

### Add Route

In `src/App.jsx`, add this route:

```jsx
import ApiTest from './pages/ApiTest';

// Add this route in the Routes section
<Route path="/api-test" element={<ApiTest />} />
```

### Test It

1. Go to `http://localhost:5173/api-test`
2. Click "Test Sections API"
3. Click "Test Tags API"
4. Should see success messages and data

---

## Step 3: Verify Cognito Configuration

Check if Cognito User Pool exists:

```bash
aws cognito-idp describe-user-pool --user-pool-id <your-cognito-user-pool-id> --region me-central-1
```

If it doesn't exist, we need to create it.

---

## API Methods Available

### Articles

```javascript
import { articlesAPI } from './lib/api';

// List articles
const articles = await articlesAPI.list({ page: 1, limit: 20, status: 'published' });

// Get single article
const article = await articlesAPI.get(123);

// Create article
const newArticle = await articlesAPI.create({
  title: 'عنوان المقال',
  slug: 'article-slug',
  excerpt: 'وصف مختصر',
  userId: 1,
  sectionId: 1,
  sections: [
    { title: 'القسم الأول', content: '<p>المحتوى</p>' }
  ],
  tagIds: [1, 2],
  status: 'draft'
});

// Update article
const updated = await articlesAPI.update(123, { title: 'عنوان جديد' });

// Delete article
await articlesAPI.delete(123);

// Upload image
const file = event.target.files[0];
const { key, url } = await articlesAPI.uploadImage(file);
```

### Sections

```javascript
import { sectionsAPI } from './lib/api';

// List sections
const sections = await sectionsAPI.list();

// Create section
const newSection = await sectionsAPI.create({
  name: 'الحوسبة السحابية',
  nameEn: 'Cloud Computing'
});

// Update section
await sectionsAPI.update(1, { name: 'اسم جديد' });

// Delete section
await sectionsAPI.delete(1);
```

### Tags

```javascript
import { tagsAPI } from './lib/api';

// List tags
const tags = await tagsAPI.list();

// Create tag
const newTag = await tagsAPI.create({
  name: 'AWS',
  nameEn: 'AWS'
});

// Update tag
await tagsAPI.update(1, { name: 'اسم جديد' });

// Delete tag
await tagsAPI.delete(1);
```

---

## Error Handling

All API calls return promises. Use try-catch:

```javascript
try {
  const response = await articlesAPI.list();
  const articles = response.data.data;
  // Success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Status:', error.response.status);
    console.error('Message:', error.response.data.message);
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
  } else {
    // Error setting up request
    console.error('Error:', error.message);
  }
}
```

---

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed message"
}
```

### List Response (with pagination)
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## Authentication Flow

### 1. Login
```javascript
import { signIn } from 'aws-amplify/auth';

const handleLogin = async (email, password) => {
  try {
    const user = await signIn({ username: email, password });
    // Redirect to dashboard
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### 2. Get Current User
```javascript
import { getCurrentUser } from 'aws-amplify/auth';

const user = await getCurrentUser();
```

### 3. Logout
```javascript
import { signOut } from 'aws-amplify/auth';

await signOut();
```

### 4. Auto Token Refresh

The API interceptor automatically:
- Gets the current auth session
- Extracts the ID token
- Adds it to the Authorization header
- Refreshes tokens when needed

---

## Testing Checklist

- [ ] API endpoint configured in `.env`
- [ ] Cognito credentials configured
- [ ] `api.js` updated with all methods
- [ ] Test page created and accessible
- [ ] Sections API test passes
- [ ] Tags API test passes
- [ ] Articles API test passes (after auth)
- [ ] Image upload test passes
- [ ] Error handling works
- [ ] Auth token interceptor works

---

## Next Steps

1. **Test API without auth** (Sections, Tags)
2. **Setup Cognito User Pool** (if not exists)
3. **Create test user**
4. **Test login flow**
5. **Test authenticated endpoints** (Articles)
6. **Build article management UI**

---

## Troubleshooting

### Issue: CORS Error

**Symptom**: `Access-Control-Allow-Origin` error in console

**Solution**: API Gateway CORS is already configured, but check:
```bash
aws apigateway get-rest-api --rest-api-id <your-api-id> --region me-central-1
```

### Issue: 401 Unauthorized

**Symptom**: All requests return 401

**Solution**: 
1. Check if Cognito is configured
2. Verify user is logged in
3. Check token in request headers (DevTools → Network)

### Issue: Network Error

**Symptom**: `Network Error` or `ERR_CONNECTION_REFUSED`

**Solution**:
1. Verify API endpoint in `.env`
2. Check if API Gateway is deployed
3. Test with curl:
   ```bash
   curl https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/sections
   ```

---

**Status**: Ready for testing  
**Next**: Create test page and verify API connection

