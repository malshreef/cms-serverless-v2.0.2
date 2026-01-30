# Advanced Search - Quick Installation Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Backup
```bash
cd /path/to/cms_frontend
cp -r app/\[locale\]/search app/\[locale\]/search.backup
```

### Step 2: Copy Files
```bash
# Extract package
unzip advanced_search_package.zip
cd advanced_search_package

# Copy to your project
cp -r app components /path/to/cms_frontend/
```

### Step 3: Test
```bash
cd /path/to/cms_frontend
npm run dev
# Visit http://localhost:3000/search?q=test
```

---

## ✅ Verification

After installation, check:

### 1. Files Exist
```bash
ls app/\[locale\]/search/page.tsx
ls components/search/SearchResultCard.tsx
ls components/search/Pagination.tsx
ls components/search/SearchFiltersSidebar.tsx
```

### 2. Search Works
1. Visit `/search`
2. Enter search term
3. Click "بحث"
4. Results should appear

### 3. Filters Work
1. Click "بحث متقدم"
2. Select date range
3. Results should filter

### 4. Pagination Works
1. Search for common term
2. If many results, pagination appears
3. Click page 2
4. Next page loads

---

## 🔧 Configuration

### API Endpoint (Already Configured)
The search API is already set up in `lib/api/client.ts`:

```typescript
const SEARCH_API_URL = 'https://<your-api-id>.execute-api.me-central-1.amazonaws.com';
```

No additional configuration needed!

---

## 📊 What You Get

### 4 New Components:
1. **Search Page** - Main search interface
2. **Result Card** - Individual result display
3. **Pagination** - Page navigation
4. **Filters Sidebar** - Category and author filters

### Features:
- ✅ Advanced search with filters
- ✅ Beautiful result cards
- ✅ Smart pagination
- ✅ Sidebar filters
- ✅ Sort options
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ RTL support
- ✅ Responsive design

---

## 🎨 Design

Matches your screenshot exactly:
- Purple gradient theme
- Cairo font
- Hover effects
- Smooth animations
- Professional layout

---

## 🧪 Testing Checklist

- [ ] Search returns results
- [ ] Advanced filters work
- [ ] Sidebar filters work
- [ ] Pagination works
- [ ] Sort options work
- [ ] Empty state shows when no results
- [ ] Loading spinner shows during search
- [ ] Mobile responsive
- [ ] RTL layout correct

---

## 🆘 Troubleshooting

### No Results?
- Check API endpoint is correct
- Check network tab for API errors
- Verify search term exists in database

### Styling Issues?
- Ensure Tailwind CSS is installed
- Check `tailwind.config.js` includes search components
- Run `npm run dev` to rebuild

### Filters Not Working?
- Ensure articles have sections data
- Ensure articles have author data
- Check browser console for errors

---

## 📞 Need Help?

All components are well-documented with comments. Check:
- `README.md` - Full documentation
- Component files - Inline comments
- Console logs - Debug information

---

**Installation Time**: ~5 minutes  
**Complexity**: Easy  
**Status**: Production Ready ✅

