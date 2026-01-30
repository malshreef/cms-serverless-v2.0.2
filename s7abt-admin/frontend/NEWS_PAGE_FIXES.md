# News Page Fixes - October 21, 2025

## Issues Fixed

### 1. ❌ Not All News from Database Returned
**Problem:** The News page was using mock/hardcoded data instead of fetching from the actual database.

**Solution:** 
- Imported `newsAPI` from the API library
- Updated `fetchNews()` function to call the real API endpoint
- Added proper parameter handling for filters (status, search, pagination)
- Added response data parsing to handle different API response formats

**Code Changes:**
```javascript
// Added import
import { newsAPI } from '../lib/api';

// Updated fetchNews function
const response = await newsAPI.list(params);
const newsData = response.data?.news || response.data?.data || response.data || [];
setNews(Array.isArray(newsData) ? newsData : []);
```

---

### 2. ❌ Edit Link Redirects to Dashboard
**Problem:** The edit link was using the wrong route format (`/news/edit/:id` instead of `/news/:id/edit`), causing a routing mismatch that redirected to the dashboard.

**Solution:** 
- Fixed the Link component to use the correct route pattern that matches App.jsx routing configuration

**Code Changes:**
```javascript
// Before
<Link to={`/news/edit/${item.id}`}>

// After
<Link to={`/news/${item.id}/edit`}>
```

---

### 3. ❌ Delete Not Working
**Problem:** The delete function was only removing items from the local state without calling the API to delete from the database.

**Solution:** 
- Updated `handleDelete()` to call `newsAPI.delete(newsId)` before updating local state
- Added success message after deletion

**Code Changes:**
```javascript
// Before
const handleDelete = async (newsId) => {
  if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
  try {
    // TODO: API call
    setNews(news.filter(n => n.id !== newsId));
  } catch (error) {
    console.error('Error deleting news:', error);
  }
};

// After
const handleDelete = async (newsId) => {
  if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
  try {
    await newsAPI.delete(newsId);
    setNews(news.filter(n => n.id !== newsId));
    alert('تم حذف الخبر بنجاح');
  } catch (error) {
    console.error('Error deleting news:', error);
  }
};
```

---

## Bonus Fix: Toggle Status

While fixing the issues, I also updated the `handleToggleStatus()` function to properly call the API when toggling news active/inactive status.

**Code Changes:**
```javascript
const handleToggleStatus = async (newsId, currentStatus) => {
  try {
    const newStatus = currentStatus === 1 ? 0 : 1;
    await newsAPI.update(newsId, { active: newStatus });
    setNews(news.map(n =>
      n.id === newsId ? { ...n, active: newStatus } : n
    ));
    alert('تم تحديث حالة الخبر بنجاح');
  } catch (error) {
    console.error('Error updating news status:', error);
  }
};
```

---

## Installation Instructions

1. **Backup your current file** (optional but recommended):
   ```bash
   cp src/pages/News.jsx src/pages/News.jsx.backup
   ```

2. **Replace the News.jsx file**:
   ```bash
   cp News.jsx src/pages/News.jsx
   ```

3. **Restart your development server** (if running):
   ```bash
   npm run dev
   ```

---

## Testing Checklist

After applying the fix, test the following:

- [ ] **Load News Page** - Verify all news items from the database are displayed
- [ ] **Filter by Status** - Test "All", "Active", and "Inactive" filters
- [ ] **Search** - Search for news by title or brief
- [ ] **Edit News** - Click edit button and verify it navigates to the correct edit page
- [ ] **Delete News** - Delete a news item and verify it's removed from the database
- [ ] **Toggle Status** - Toggle active/inactive status and verify it updates in the database
- [ ] **Pagination** - If you have more than 20 news items, test pagination

---

## API Endpoints Used

The fixed News page now properly uses these API endpoints:

- `GET /admin/news` - List news with filters and pagination
- `GET /admin/news/:id` - Get single news item
- `POST /admin/news` - Create new news
- `PUT /admin/news/:id` - Update news
- `DELETE /admin/news/:id` - Delete news

---

## Notes

- The API client (`src/lib/api.js`) already has all the necessary `newsAPI` methods defined
- The backend Lambda functions for these endpoints are already deployed and working
- Error handling is in place for all API calls
- Success messages are shown after delete and status toggle operations

---

## Support

If you encounter any issues after applying this fix, please check:

1. Browser console for any error messages
2. Network tab to verify API calls are being made
3. Backend Lambda logs in CloudWatch for server-side errors

---

**Fixed by:** Manus AI  
**Date:** October 21, 2025  
**Version:** 1.0

