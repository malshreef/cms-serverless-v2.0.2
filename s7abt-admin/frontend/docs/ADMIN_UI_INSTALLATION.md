# Admin UI Installation Guide

## Overview

Complete admin UI pages for managing Articles, Sections, and Tags with full CRUD functionality.

---

## Files Included

### Pages
1. **Articles.jsx** - List all articles with filters and pagination
2. **ArticleForm.jsx** - Create/Edit articles with rich form
3. **Sections.jsx** - Manage article sections
4. **Tags.jsx** - Manage article tags

### Configuration
5. **App-updated.jsx** - Updated routes
6. **api-complete.js** - Complete API service

---

## Installation Steps

### Step 1: Copy Pages

Copy the page files to your frontend:

```bash
cd C:\xampp5_6\htdocs\s7abt_serverless\s7abt-dubai\s7abt-admin\frontend

# Copy pages
copy Articles.jsx src\pages\
copy ArticleForm.jsx src\pages\
copy Sections.jsx src\pages\
copy Tags.jsx src\pages\
```

### Step 2: Update API Service

Replace the API file:

```bash
copy api-complete.js src\lib\api.js
```

### Step 3: Update App.jsx

**Option A**: Replace entire file
```bash
copy App-updated.jsx src\App.jsx
```

**Option B**: Manual update (if you have custom changes)

Add these imports at the top:
```javascript
import Articles from './pages/Articles';
import ArticleForm from './pages/ArticleForm';
import Sections from './pages/Sections';
import Tags from './pages/Tags';
```

Replace the placeholder routes with:
```javascript
{/* Articles Routes */}
<Route
  path="/articles"
  element={
    <ProtectedRoute>
      <AdminLayout>
        <Articles />
      </AdminLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/articles/new"
  element={
    <ProtectedRoute>
      <AdminLayout>
        <ArticleForm />
      </AdminLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/articles/:id/edit"
  element={
    <ProtectedRoute>
      <AdminLayout>
        <ArticleForm />
      </AdminLayout>
    </ProtectedRoute>
  }
/>

{/* Sections Route */}
<Route
  path="/sections"
  element={
    <ProtectedRoute>
      <AdminLayout>
        <Sections />
      </AdminLayout>
    </ProtectedRoute>
  }
/>

{/* Tags Route */}
<Route
  path="/tags"
  element={
    <ProtectedRoute>
      <AdminLayout>
        <Tags />
      </AdminLayout>
    </ProtectedRoute>
  }
/>
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

---

## Features

### Articles Management

**List View** (`/articles`):
- ✅ Paginated article list
- ✅ Search by title/content
- ✅ Filter by status (published/draft/scheduled)
- ✅ Filter by section
- ✅ View, Edit, Delete actions
- ✅ Responsive table layout

**Create/Edit Form** (`/articles/new`, `/articles/:id/edit`):
- ✅ Title and slug
- ✅ Excerpt (short description)
- ✅ Main image upload with preview
- ✅ Multiple content sections
- ✅ Rich text support (HTML)
- ✅ Section selection
- ✅ Tag selection (multiple)
- ✅ Status (draft/published/scheduled)
- ✅ Auto-slug generation from title
- ✅ Image upload to S3
- ✅ Form validation

### Sections Management

**Page** (`/sections`):
- ✅ Grid view of all sections
- ✅ Create new section (modal)
- ✅ Edit section (modal)
- ✅ Delete section with confirmation
- ✅ Arabic and English names
- ✅ Article count per section

### Tags Management

**Page** (`/tags`):
- ✅ Tag cloud view
- ✅ Create new tag (modal)
- ✅ Edit tag (modal)
- ✅ Delete tag with confirmation
- ✅ Arabic and English names
- ✅ Hover effects

---

## Usage Examples

### Create Article

1. Go to `/articles`
2. Click "مقال جديد" (New Article)
3. Fill in:
   - Title (Arabic)
   - Excerpt
   - Select Section
   - Upload image (optional)
   - Add content sections
   - Select tags
   - Choose status
4. Click "نشر" (Publish)

### Edit Article

1. Go to `/articles`
2. Click edit icon on any article
3. Update fields
4. Click "تحديث" (Update)

### Manage Sections

1. Go to `/sections`
2. Click "قسم جديد" (New Section)
3. Enter Arabic and English names
4. Click "إضافة" (Add)

### Manage Tags

1. Go to `/tags`
2. Click "وسم جديد" (New Tag)
3. Enter Arabic and English names
4. Click "إضافة" (Add)

---

## API Integration

All pages are fully integrated with your backend API:

**Articles API**:
- `GET /admin/articles` - List with pagination
- `GET /admin/articles/:id` - Get single article
- `POST /admin/articles` - Create article
- `PUT /admin/articles/:id` - Update article
- `DELETE /admin/articles/:id` - Delete article
- `POST /admin/articles/image-upload-url` - Get S3 upload URL

**Sections API**:
- `GET /admin/sections` - List all
- `POST /admin/sections` - Create
- `PUT /admin/sections/:id` - Update
- `DELETE /admin/sections/:id` - Delete

**Tags API**:
- `GET /admin/tags` - List all
- `POST /admin/tags` - Create
- `PUT /admin/tags/:id` - Update
- `DELETE /admin/tags/:id` - Delete

---

## UI Features

### Arabic RTL Support
- ✅ Right-to-left layout
- ✅ Arabic fonts (Rubik, Readex Pro)
- ✅ Proper text alignment
- ✅ Reversed spacing (space-x-reverse)

### Responsive Design
- ✅ Mobile-friendly
- ✅ Tablet optimized
- ✅ Desktop layout
- ✅ Breakpoints: sm, md, lg, xl

### Loading States
- ✅ Spinner during data fetch
- ✅ Button disabled states
- ✅ Upload progress indication

### Error Handling
- ✅ API error messages
- ✅ Form validation
- ✅ User-friendly alerts
- ✅ Confirmation dialogs

### Styling
- ✅ Tailwind CSS v4
- ✅ Custom cloud theme colors
- ✅ Hover effects
- ✅ Smooth transitions
- ✅ Consistent spacing

---

## Navigation

The sidebar already has links to these pages:

- **لوحة القيادة** (Dashboard) → `/`
- **المقالات** (Articles) → `/articles`
- **الأخبار** (News) → `/news` (placeholder)
- **الوسوم** (Tags) → `/tags`
- **الأقسام** (Sections) → `/sections`
- **التغريدات** (Tweets) → `/tweets` (placeholder)
- **المستخدمون** (Users) → `/users` (placeholder)
- **الإعدادات** (Settings) → `/settings` (placeholder)

---

## Testing Checklist

### Articles
- [ ] List articles loads
- [ ] Search works
- [ ] Filters work (status, section)
- [ ] Pagination works
- [ ] Create new article
- [ ] Upload image
- [ ] Add multiple sections
- [ ] Select tags
- [ ] Edit article
- [ ] Delete article

### Sections
- [ ] List sections loads
- [ ] Create section
- [ ] Edit section
- [ ] Delete section
- [ ] Arabic/English names save correctly

### Tags
- [ ] List tags loads
- [ ] Create tag
- [ ] Edit tag
- [ ] Delete tag
- [ ] Tags display in article form

---

## Troubleshooting

### Issue: Pages show blank

**Solution**: Check browser console for errors
```
F12 → Console tab
```

### Issue: API calls fail

**Solution**: Verify API endpoint in `.env`
```
VITE_API_ENDPOINT=https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev
```

### Issue: Images won't upload

**Solution**: Check S3 bucket permissions and CORS

### Issue: Routes not working

**Solution**: Ensure `App.jsx` is updated with new routes

### Issue: Styling broken

**Solution**: Clear cache and restart
```bash
rmdir /s /q node_modules\.vite
npm run dev
```

---

## Next Steps

1. **Test all CRUD operations**
2. **Setup Cognito authentication**
3. **Create test user**
4. **Test authenticated access**
5. **Build News management** (similar to Articles)
6. **Build Users management**
7. **Build Tweet scheduling**

---

## Notes

### Image Upload
- Images are uploaded to S3 bucket: `<your-s3-bucket>`
- Max size: 5MB
- Supported formats: JPG, PNG, GIF
- Presigned URLs used for secure upload

### Article Sections
- Each article can have multiple content sections
- Each section has title and HTML content
- Minimum 1 section required
- Add/remove sections dynamically

### Tags
- Multiple tags per article
- Tags are shared across all articles
- Create tags before using in articles

### Sections
- Each article belongs to one section
- Sections are like categories
- Create sections before creating articles

---

**Status**: Ready to use  
**Next**: Test the UI and setup authentication

