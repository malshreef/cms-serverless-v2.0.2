# Article Show Page - Complete Implementation Guide

## Overview

This guide provides complete implementation of the enhanced article show page for your serverless CMS with all features and improvements.

---

## 📦 Components Implemented

### 1. **ArticleContent.tsx** - Enhanced Content Renderer
**Location:** `components/article/ArticleContent.tsx`

**Features:**
- ✅ Properly renders article sections from API response
- ✅ Supports both new structure (`sections` array) and old structure (fallback)
- ✅ Dynamic table of contents generation
- ✅ Active heading tracking with Intersection Observer
- ✅ Smooth scrolling to sections
- ✅ Tags display with links
- ✅ Comments section display
- ✅ Comprehensive article styling (typography, code blocks, tables, etc.)
- ✅ RTL/LTR support

**Key Changes from Original:**
- Added `renderArticleContent()` function to properly assemble content from sections
- Supports both `article.sections` (new API) and fallback to old structure
- Fixed image and tag field names to support both API formats

### 2. **ReadingProgress.tsx** - Progress Indicator
**Location:** `components/article/ReadingProgress.tsx`

**Features:**
- ✅ Fixed progress bar at top of page
- ✅ Calculates reading percentage based on scroll position
- ✅ Smooth animation
- ✅ Responsive and performant

**Usage:**
```tsx
import ReadingProgress from '@/components/article/ReadingProgress';

// In your page component
<ReadingProgress />
```

### 3. **SocialShare.tsx** - Functional Share Buttons
**Location:** `components/article/SocialShare.tsx`

**Features:**
- ✅ Share to Facebook, Twitter, LinkedIn, WhatsApp
- ✅ Copy link to clipboard with feedback
- ✅ Opens share dialogs in popup windows
- ✅ RTL support

**Usage:**
```tsx
import SocialShare from '@/components/article/SocialShare';

<SocialShare
  title={article.title}
  url={articleUrl}
  locale={locale}
  isRTL={isRTL}
/>
```

### 4. **RelatedArticles.tsx** - Related Content Section
**Location:** `components/article/RelatedArticles.tsx`

**Features:**
- ✅ Displays up to 3 related articles
- ✅ Responsive grid layout (1/2/3 columns)
- ✅ Hover effects and animations
- ✅ Image optimization with Next.js Image
- ✅ Date formatting
- ✅ RTL support

**Usage:**
```tsx
import RelatedArticles from '@/components/article/RelatedArticles';

<RelatedArticles
  articles={article.relatedArticles}
  locale={locale}
  isRTL={isRTL}
/>
```

### 5. **Breadcrumb.tsx** - Navigation Component
**Location:** `components/common/Breadcrumb.tsx`

**Features:**
- ✅ Hierarchical navigation (Home > Section > Article)
- ✅ Clickable links
- ✅ Current page indicator
- ✅ RTL support with proper chevron direction

**Usage:**
```tsx
import Breadcrumb from '@/components/common/Breadcrumb';

const breadcrumbItems = [
  { label: 'Home', href: `/${locale}` },
  { label: 'Articles', href: `/${locale}/articles` },
  { label: article.title }, // Current page (no href)
];

<Breadcrumb items={breadcrumbItems} locale={locale} isRTL={isRTL} />
```

---

## 🔧 Utility Functions

### 1. **readingTime.ts** - Calculate Reading Time
**Location:** `lib/readingTime.ts`

**Functions:**
- `calculateReadingTime(content, locale, wordsPerMinute)` - Calculate from HTML content
- `formatReadingTime(minutes, locale)` - Format for display
- `calculateReadingTimeFromSections(sections, locale)` - Calculate from sections array

**Usage:**
```tsx
import { calculateReadingTimeFromSections, formatReadingTime } from '@/lib/readingTime';

const readingTime = calculateReadingTimeFromSections(article.sections, locale);
const formattedTime = formatReadingTime(readingTime, locale); // "12 دقيقة" or "12 min read"
```

### 2. **seo.ts** - SEO and Structured Data
**Location:** `lib/seo.ts`

**Functions:**
- `generateArticleStructuredData(article, locale, baseUrl)` - JSON-LD for article
- `generateBreadcrumbStructuredData(items, baseUrl)` - JSON-LD for breadcrumb
- `generateArticleMetadata(article, locale, baseUrl)` - Next.js metadata
- `generateArticleMetaTags(article, locale, baseUrl)` - Meta tags array

**Usage:**
```tsx
import { generateArticleStructuredData, generateArticleMetadata } from '@/lib/seo';

// In generateMetadata function
export async function generateMetadata({ params }: ArticlePageProps) {
  const article = await fetchArticle(params.id);
  return generateArticleMetadata(article, params.locale);
}

// In page component
const structuredData = generateArticleStructuredData(article, locale);

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
/>
```

### 3. **useViewCounter.ts** - View Counter Hook
**Location:** `lib/useViewCounter.ts`

**Features:**
- ✅ Increments view counter once per page load
- ✅ 3-second delay to ensure real visit
- ✅ Error handling

**Usage:**
```tsx
'use client';
import { useViewCounter } from '@/lib/useViewCounter';

function ArticleClientComponent({ articleId }: { articleId: number }) {
  useViewCounter(articleId);
  // ... rest of component
}
```

---

## 📄 Complete Page Implementation

### **ArticlePage.tsx** - Full Page Component
**Location:** `app/[locale]/articles/[id]/page.tsx`

**Features Integrated:**
- ✅ Reading progress bar
- ✅ Breadcrumb navigation
- ✅ Enhanced hero section with metadata
- ✅ Sidebar with TOC, author card, and social share
- ✅ Article content with proper section rendering
- ✅ Related articles section
- ✅ SEO metadata and structured data
- ✅ Calculated reading time
- ✅ View counter display
- ✅ Author social links (Twitter, LinkedIn, Facebook)

**Key Improvements:**
1. **Metadata Generation** - Proper SEO with `generateMetadata()`
2. **Structured Data** - JSON-LD for Article and Breadcrumb
3. **Reading Time** - Calculated from article sections
4. **Breadcrumb** - Hierarchical navigation
5. **Social Share** - Functional share buttons
6. **Related Articles** - Display related content
7. **Author Info** - Enhanced author card with social links

---

## 🚀 Installation Steps

### Step 1: Copy Components

```bash
# Copy all components to your project
cp -r article-page-implementation/components/* your-project/components/

# Create article-specific component directory if needed
mkdir -p your-project/components/article
mkdir -p your-project/components/common
```

### Step 2: Copy Utility Functions

```bash
# Copy utility functions
cp article-page-implementation/lib/* your-project/lib/
```

### Step 3: Update Article Page

```bash
# Replace your current article page
cp article-page-implementation/pages/ArticlePage.tsx your-project/app/[locale]/articles/[id]/page.tsx
```

### Step 4: Install Dependencies (if needed)

```bash
# Ensure you have these dependencies
npm install next react react-dom
```

---

## 🔄 API Integration

### Expected API Response Structure

Your backend API should return articles in this format:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "مقدمة إلى AWS Lambda",
    "slug": "intro-to-aws-lambda",
    "excerpt": "تعرف على AWS Lambda",
    "sections": [
      {
        "title": "ما هي AWS Lambda؟",
        "content": "<p>AWS Lambda هي خدمة حوسبة بدون خادم...</p>"
      },
      {
        "title": "الفوائد الرئيسية",
        "content": "<p>توفر Lambda العديد من الفوائد...</p>"
      }
    ],
    "mainImage": "articles/lambda.png",
    "status": "published",
    "views": 150,
    "userId": 1,
    "sectionId": 2,
    "tags": [
      { "id": 1, "name": "AWS" },
      { "id": 5, "name": "Serverless" }
    ],
    "createdAt": "2025-10-19T10:00:00Z",
    "updatedAt": "2025-10-19T12:00:00Z",
    "user": {
      "id": 1,
      "name": "أحمد محمد",
      "email": "ahmed@s7abt.com",
      "brief": "خبير تقني",
      "twitter": "https://twitter.com/...",
      "linkedin": "https://linkedin.com/in/...",
      "facebook": "https://facebook.com/..."
    },
    "section": {
      "id": 2,
      "name": "AWS",
      "slug": "aws"
    },
    "relatedArticles": [
      {
        "id": 2,
        "title": "AWS Lambda Best Practices",
        "excerpt": "Learn best practices...",
        "mainImage": "articles/lambda-best-practices.png",
        "createdAt": "2025-10-20T10:00:00Z"
      }
    ],
    "comments": [
      {
        "id": 1,
        "userName": "محمد علي",
        "body": "مقال رائع!",
        "createdAt": "2025-10-19T15:00:00Z"
      }
    ]
  }
}
```

### API Client Updates

If your API client needs updates, modify `lib/api/client.ts`:

```typescript
export const articlesApi = {
  getById: async (id: string | number) => {
    const response = await apiClient.get(`/admin/articles/${id}`);
    return response.data; // Returns { success: true, data: { ... } }
  },
};
```

---

## 🎨 Styling

### Tailwind CSS Classes Used

The components use your existing Tailwind configuration with these custom colors:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'sky-cta': '#42a5f5',
        'sky-cta-hover': '#1e88e5',
        'sky-bg': '#eaf6ff',
        'charcoal': '#1a1a1a',
        'muted-blue': '#4a6572',
        'link-blue': '#42a5f5',
        'border-blue': '#d0e7ff',
      },
    },
  },
};
```

### Font Awesome Icons

Ensure Font Awesome is loaded in your layout:

```tsx
// app/[locale]/layout.tsx
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>
```

---

## ✅ Features Checklist

### Core Features
- [x] Article content rendering from sections
- [x] Table of contents generation
- [x] Active heading tracking
- [x] Smooth scrolling
- [x] Reading progress indicator
- [x] Breadcrumb navigation
- [x] Author information display
- [x] Tags display with links
- [x] Comments display
- [x] Related articles section

### Enhanced Features
- [x] Social share buttons (Facebook, Twitter, LinkedIn, WhatsApp)
- [x] Copy link to clipboard
- [x] Reading time calculation
- [x] View counter display
- [x] Author social links
- [x] Responsive design
- [x] RTL/LTR support

### SEO Features
- [x] Meta tags (title, description, keywords)
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Canonical URL
- [x] JSON-LD structured data (Article)
- [x] JSON-LD structured data (Breadcrumb)
- [x] Language alternates

---

## 🔧 Optional Enhancements

### 1. View Counter API Endpoint

If you want to implement view counter increment, create this endpoint:

**Backend (Lambda):**
```javascript
// POST /api/articles/{id}/view
exports.handler = async (event) => {
  const articleId = event.pathParameters.id;
  
  // Update view counter in database
  await db.query(
    'UPDATE s7b_article SET s7b_article_views = s7b_article_views + 1 WHERE s7b_article_id = ?',
    [articleId]
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
```

**Frontend Usage:**
```tsx
'use client';
import { useViewCounter } from '@/lib/useViewCounter';

export default function ArticleClientWrapper({ articleId }: { articleId: number }) {
  useViewCounter(articleId);
  return null;
}
```

### 2. Comments Form

Add a comment form component:

```tsx
// components/article/CommentForm.tsx
'use client';

export default function CommentForm({ articleId, locale, isRTL }) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit comment to API
    await fetch(`/api/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ name, comment }),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. Print Styles

Add print-friendly styles:

```css
/* globals.css */
@media print {
  .no-print {
    display: none !important;
  }
  
  .article-content {
    font-size: 12pt;
    line-height: 1.5;
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Images not loading

**Solution:** Ensure images are properly configured in `next.config.js`:

```javascript
module.exports = {
  images: {
    domains: ['s3.amazonaws.com', 'your-s3-bucket.s3.amazonaws.com'],
  },
};
```

### Issue: TOC not populating

**Solution:** Ensure the ArticleContent component is client-side:

```tsx
'use client';
import ArticleContent from '@/components/article/ArticleContent';
```

### Issue: Social share not working

**Solution:** Check that Font Awesome icons are loaded and buttons have proper event handlers.

### Issue: Reading progress not showing

**Solution:** Ensure ReadingProgress is rendered at the top level of your page.

---

## 📊 Performance Optimization

### 1. Image Optimization

Use Next.js Image component for automatic optimization:

```tsx
import Image from 'next/image';

<Image
  src={article.mainImage}
  alt={article.title}
  width={1200}
  height={630}
  priority // For above-the-fold images
/>
```

### 2. Code Splitting

Components are already set up for automatic code splitting with Next.js.

### 3. Lazy Loading

For related articles images:

```tsx
<Image
  src={image}
  alt={title}
  loading="lazy" // Lazy load below-the-fold images
/>
```

---

## 🎯 Next Steps

1. **Test the Implementation**
   - Test with different article IDs
   - Test RTL/LTR switching
   - Test on mobile devices
   - Test social share buttons

2. **Add Analytics**
   - Track article views
   - Track social shares
   - Track reading time

3. **Enhance Features**
   - Add comment form
   - Add print button
   - Add bookmark functionality
   - Add email subscription

4. **Monitor Performance**
   - Use Lighthouse for performance audits
   - Monitor Core Web Vitals
   - Optimize images and fonts

---

## 📞 Support

For questions or issues:
- Review this guide thoroughly
- Check the API documentation
- Test with sample data
- Verify all dependencies are installed

---

## 📝 Summary

This implementation provides a complete, production-ready article show page with:

- ✅ Proper content rendering from API
- ✅ Enhanced user experience
- ✅ SEO optimization
- ✅ Social sharing
- ✅ Related content
- ✅ Responsive design
- ✅ RTL/LTR support
- ✅ Performance optimizations

All components are modular, reusable, and follow Next.js best practices.
