# Postman Quick Test Guide - S7abt Admin CMS API

## 🚀 Quick Testing Workflow

Follow this order to test all endpoints systematically.

---

## 📋 Prerequisites

**Base URL:**
```
https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev
```

**Headers for all requests:**
```
Content-Type: application/json
```

---

## 1️⃣ Sections Management

### Test 1.1: List Sections

**Request:**
```
GET /admin/sections
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "id": 1,
        "name": "Cloud Computing",
        "name_en": "Cloud Computing",
        "article_count": 5
      },
      {
        "id": 2,
        "name": "DevOps",
        "name_en": "DevOps",
        "article_count": 3
      }
    ]
  }
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Returns array of sections
- ✅ Each section has id, name, article_count

**Save for later:** Copy a `section.id` (e.g., `1`) for creating articles

---

### Test 1.2: Create Section

**Request:**
```
POST /admin/sections
```

**Body (JSON):**
```json
{
  "name": "الأمن السيبراني",
  "name_en": "Cybersecurity",
  "description": "مقالات حول أمن المعلومات والحماية الإلكترونية"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Section created successfully",
  "data": {
    "id": 6,
    "name": "الأمن السيبراني",
    "name_en": "Cybersecurity"
  }
}
```

**What to check:**
- ✅ Status code is 201
- ✅ Returns new section with id
- ✅ Arabic name stored correctly

**Save for later:** Copy the new `section.id` for testing

---

### Test 1.3: Update Section

**Request:**
```
PUT /admin/sections/{id}
```

Replace `{id}` with the section ID you just created (e.g., `6`)

**Body (JSON):**
```json
{
  "name": "الأمن السيبراني المتقدم",
  "name_en": "Advanced Cybersecurity",
  "description": "مقالات متقدمة حول أمن المعلومات"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Section updated successfully"
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Success message returned

---

### Test 1.4: Delete Section

**Request:**
```
DELETE /admin/sections/{id}
```

Replace `{id}` with a section that has **no articles** (or the one you just created)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Section deleted successfully"
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Section deleted successfully

**Note:** If section has articles, you'll get an error:
```json
{
  "success": false,
  "error": {
    "message": "Cannot delete section with existing articles",
    "code": "SECTION_HAS_ARTICLES"
  }
}
```

---

## 2️⃣ Tags Management

### Test 2.1: List Tags

**Request:**
```
GET /admin/tags
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "AWS",
        "name_en": "AWS",
        "article_count": 12
      },
      {
        "id": 2,
        "name": "Azure",
        "name_en": "Azure",
        "article_count": 8
      }
    ]
  }
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Returns array of tags
- ✅ Each tag has id, name, article_count

**Save for later:** Copy 2-3 tag IDs for creating articles (e.g., `[1, 2, 3]`)

---

### Test 2.2: Create Tag

**Request:**
```
POST /admin/tags
```

**Body (JSON):**
```json
{
  "name": "الذكاء الاصطناعي",
  "name_en": "Artificial Intelligence"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Tag created successfully",
  "data": {
    "id": 11,
    "name": "الذكاء الاصطناعي",
    "name_en": "Artificial Intelligence"
  }
}
```

**What to check:**
- ✅ Status code is 201
- ✅ Returns new tag with id
- ✅ Arabic name stored correctly

**Save for later:** Copy the new tag ID

---

### Test 2.3: Update Tag

**Request:**
```
PUT /admin/tags/{id}
```

Replace `{id}` with the tag ID you just created

**Body (JSON):**
```json
{
  "name": "الذكاء الاصطناعي والتعلم الآلي",
  "name_en": "AI & Machine Learning"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Tag updated successfully"
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Success message returned

---

### Test 2.4: Delete Tag

**Request:**
```
DELETE /admin/tags/{id}
```

Replace `{id}` with the tag you just created

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Tag deleted successfully"
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Tag deleted successfully

**Note:** Deleting a tag will also remove its associations with articles (cascade delete)

---

## 3️⃣ Articles Management

### Test 3.1: List Articles

**Request:**
```
GET /admin/articles
```

**Query Parameters (optional):**
```
?page=1&limit=20&status=published&section_id=1&search=AWS
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "مقدمة إلى AWS Lambda",
        "slug": "intro-to-aws-lambda",
        "excerpt": "تعرف على خدمة AWS Lambda للحوسبة بدون خادم",
        "status": "published",
        "main_image": "https://<your-s3-bucket>.s3.me-central-1.amazonaws.com/articles/lambda.jpg",
        "views": 150,
        "created_at": "2025-10-15T10:30:00Z",
        "user": {
          "id": 1,
          "name": "أحمد محمد",
          "email": "ahmed@s7abt.com"
        },
        "section": {
          "id": 1,
          "name": "Cloud Computing"
        },
        "tags": [
          {"id": 1, "name": "AWS"},
          {"id": 5, "name": "Serverless"}
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  }
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Returns array of articles
- ✅ Pagination info included
- ✅ User, section, and tags populated

**Save for later:** Copy an `article.id` for testing get/update/delete

---

### Test 3.2: Create Article ⭐ (IMPORTANT)

**Request:**
```
POST /admin/articles
```

**Body (JSON) - Complete Example:**
```json
{
  "title": "دليل شامل لخدمة Amazon S3",
  "slug": "complete-guide-amazon-s3",
  "excerpt": "تعلم كيفية استخدام Amazon S3 لتخزين الملفات والبيانات في السحابة بطريقة آمنة وموثوقة",
  "status": "published",
  "user_id": 1,
  "section_id": 1,
  "main_image_key": "articles/2025/10/s3-guide.jpg",
  "sections": [
    {
      "title": "ما هي خدمة Amazon S3؟",
      "content": "<p>Amazon S3 (Simple Storage Service) هي خدمة تخزين كائنات توفرها Amazon Web Services. تتميز بالموثوقية العالية والأمان والقابلية للتوسع.</p><p>يمكنك استخدام S3 لتخزين أي نوع من الملفات بما في ذلك الصور والفيديوهات والمستندات وملفات النسخ الاحتياطي.</p>"
    },
    {
      "title": "إنشاء Bucket في S3",
      "content": "<p>لبدء استخدام S3، تحتاج أولاً إلى إنشاء Bucket. Bucket هو حاوية لتخزين الكائنات (الملفات).</p><h3>خطوات إنشاء Bucket:</h3><ol><li>افتح AWS Console</li><li>انتقل إلى خدمة S3</li><li>انقر على \"Create bucket\"</li><li>اختر اسماً فريداً للـ Bucket</li><li>اختر المنطقة (Region)</li></ol>"
    },
    {
      "title": "رفع الملفات إلى S3",
      "content": "<p>يمكنك رفع الملفات إلى S3 بعدة طرق:</p><ul><li><strong>AWS Console:</strong> واجهة رسومية سهلة الاستخدام</li><li><strong>AWS CLI:</strong> أوامر سطر الأوامر</li><li><strong>SDK:</strong> مكتبات برمجية لمختلف اللغات</li><li><strong>Presigned URLs:</strong> روابط مؤقتة للرفع المباشر</li></ul><pre><code>aws s3 cp myfile.jpg s3://my-bucket/</code></pre>"
    },
    {
      "title": "إعدادات الأمان والصلاحيات",
      "content": "<p>الأمان في S3 يعتمد على عدة مستويات:</p><h3>1. Bucket Policies</h3><p>سياسات على مستوى الـ Bucket تحدد من يمكنه الوصول إلى الملفات.</p><h3>2. IAM Policies</h3><p>صلاحيات على مستوى المستخدمين والأدوار.</p><h3>3. ACLs</h3><p>قوائم التحكم بالوصول على مستوى الكائنات الفردية.</p>"
    },
    {
      "title": "أفضل الممارسات",
      "content": "<p>لضمان استخدام S3 بكفاءة وأمان، اتبع هذه الممارسات:</p><ol><li><strong>تفعيل التشفير:</strong> استخدم SSE-S3 أو SSE-KMS</li><li><strong>تفعيل Versioning:</strong> للحفاظ على نسخ متعددة من الملفات</li><li><strong>استخدام Lifecycle Policies:</strong> لنقل الملفات القديمة إلى تخزين أرخص</li><li><strong>تفعيل Logging:</strong> لمراقبة الوصول إلى الملفات</li><li><strong>استخدام CloudFront:</strong> لتوزيع المحتوى بسرعة</li></ol><p>باتباع هذه الممارسات، ستحصل على أفضل أداء وأمان لملفاتك في S3.</p>"
    }
  ],
  "tag_ids": [1, 2, 5]
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Article created successfully",
  "data": {
    "id": 43,
    "title": "دليل شامل لخدمة Amazon S3",
    "slug": "complete-guide-amazon-s3",
    "status": "published",
    "created_at": "2025-10-19T13:30:00Z"
  }
}
```

**What to check:**
- ✅ Status code is 201
- ✅ Returns new article with id
- ✅ Arabic title stored correctly
- ✅ Slug generated correctly

**Save for later:** Copy the new `article.id` (e.g., `43`)

---

### Test 3.3: Get Article

**Request:**
```
GET /admin/articles/{id}
```

Replace `{id}` with the article ID you just created

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 43,
    "title": "دليل شامل لخدمة Amazon S3",
    "slug": "complete-guide-amazon-s3",
    "excerpt": "تعلم كيفية استخدام Amazon S3...",
    "status": "published",
    "user_id": 1,
    "section_id": 1,
    "main_image": "https://<your-s3-bucket>.s3.me-central-1.amazonaws.com/articles/2025/10/s3-guide.jpg",
    "views": 0,
    "created_at": "2025-10-19T13:30:00Z",
    "updated_at": "2025-10-19T13:30:00Z",
    "sections": [
      {
        "title": "ما هي خدمة Amazon S3؟",
        "content": "<p>Amazon S3 (Simple Storage Service)...</p>"
      },
      {
        "title": "إنشاء Bucket في S3",
        "content": "<p>لبدء استخدام S3...</p>"
      }
      // ... all 5 sections
    ],
    "user": {
      "id": 1,
      "name": "أحمد محمد",
      "email": "ahmed@s7abt.com"
    },
    "section": {
      "id": 1,
      "name": "Cloud Computing",
      "name_en": "Cloud Computing"
    },
    "tags": [
      {"id": 1, "name": "AWS", "name_en": "AWS"},
      {"id": 2, "name": "Azure", "name_en": "Azure"},
      {"id": 5, "name": "Serverless", "name_en": "Serverless"}
    ]
  }
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Returns complete article data
- ✅ All 5 sections included
- ✅ User, section, and tags populated
- ✅ Arabic content displayed correctly

---

### Test 3.4: Update Article

**Request:**
```
PUT /admin/articles/{id}
```

Replace `{id}` with your article ID

**Body (JSON) - Partial Update:**
```json
{
  "title": "دليل شامل ومحدث لخدمة Amazon S3",
  "excerpt": "تعلم كل شيء عن Amazon S3 من الصفر إلى الاحتراف",
  "status": "published",
  "sections": [
    {
      "title": "ما هي خدمة Amazon S3؟ (محدث)",
      "content": "<p>Amazon S3 هي أفضل خدمة تخزين سحابي في العالم...</p>"
    },
    {
      "title": "إنشاء Bucket في S3",
      "content": "<p>خطوات محدثة لإنشاء Bucket...</p>"
    }
  ],
  "tag_ids": [1, 2, 5, 11]
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Article updated successfully"
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Success message returned
- ✅ Changes saved (verify with GET request)

---

### Test 3.5: Delete Article (Soft Delete)

**Request:**
```
DELETE /admin/articles/{id}
```

Replace `{id}` with your article ID

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Article soft deleted (not visible in list)
- ✅ Article still in database with `deleted_at` timestamp

**Verify:** Run `GET /admin/articles` - deleted article should not appear

---

### Test 3.6: Get Image Upload URL

**Request:**
```
POST /admin/articles/image-upload-url
```

**Body (JSON):**
```json
{
  "filename": "my-article-image.jpg",
  "content_type": "image/jpeg"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "upload_url": "https://<your-s3-bucket>.s3.me-central-1.amazonaws.com/articles/2025/10/abc123.jpg?X-Amz-Algorithm=...",
    "file_url": "https://<your-s3-bucket>.s3.me-central-1.amazonaws.com/articles/2025/10/abc123.jpg",
    "key": "articles/2025/10/abc123.jpg"
  }
}
```

**What to check:**
- ✅ Status code is 200
- ✅ Returns presigned upload URL
- ✅ Returns public file URL
- ✅ Returns S3 key

**How to use:**
1. Get the `upload_url`
2. Use it to upload your image file (PUT request)
3. Use the `key` when creating/updating articles

**Upload example (separate request):**
```
PUT {upload_url}
Headers:
  Content-Type: image/jpeg
Body: (binary image file)
```

---

## 📊 Testing Checklist

### Sections
- [ ] List sections (GET)
- [ ] Create section (POST)
- [ ] Update section (PUT)
- [ ] Delete section (DELETE)

### Tags
- [ ] List tags (GET)
- [ ] Create tag (POST)
- [ ] Update tag (PUT)
- [ ] Delete tag (DELETE)

### Articles
- [ ] List articles (GET)
- [ ] List with filters (GET + query params)
- [ ] Get single article (GET)
- [ ] Create article (POST)
- [ ] Update article (PUT)
- [ ] Delete article (DELETE)
- [ ] Get image upload URL (POST)

---

## 🎯 Quick Test Data Templates

### Minimal Article (for quick testing):
```json
{
  "title": "اختبار مقال جديد",
  "slug": "test-article-" + Date.now(),
  "excerpt": "هذا مقال للاختبار",
  "status": "draft",
  "user_id": 1,
  "section_id": 1,
  "sections": [
    {
      "title": "المقدمة",
      "content": "<p>محتوى المقدمة</p>"
    }
  ],
  "tag_ids": [1]
}
```

### Article with Multiple Tags:
```json
{
  "title": "AWS Lambda مع API Gateway",
  "slug": "aws-lambda-api-gateway",
  "excerpt": "تعلم كيفية ربط Lambda مع API Gateway",
  "status": "published",
  "user_id": 1,
  "section_id": 1,
  "sections": [
    {
      "title": "المقدمة",
      "content": "<p>في هذا المقال سنتعلم...</p>"
    },
    {
      "title": "إنشاء Lambda Function",
      "content": "<p>الخطوة الأولى هي إنشاء Lambda...</p>"
    }
  ],
  "tag_ids": [1, 5, 7]
}
```

---

## 🆘 Common Issues

### Issue: 400 Bad Request
**Cause:** Missing required fields or invalid data

**Solution:** Check that you have:
- `title` (required)
- `user_id` (required)
- `section_id` (required)
- `sections` array with at least one section
- Valid `status` (draft, published, archived)

### Issue: 404 Not Found
**Cause:** Article/Section/Tag doesn't exist

**Solution:** Verify the ID exists by listing all items first

### Issue: 500 Internal Server Error
**Cause:** Database error or Lambda function error

**Solution:** Check CloudWatch logs:
```powershell
aws logs tail /aws/lambda/s7abt-admin-create-article-dev --region me-central-1 --since 5m
```

---

## 💡 Pro Tips

### 1. Use Postman Variables
Save IDs as variables for easy reuse:
```javascript
// In Tests tab after creating article:
pm.environment.set("article_id", pm.response.json().data.id);

// Then use in URL:
GET /admin/articles/{{article_id}}
```

### 2. Test Error Cases
Try invalid requests to test error handling:
```json
{
  "title": "",  // Empty title should fail
  "user_id": 999,  // Non-existent user
  "section_id": 999  // Non-existent section
}
```

### 3. Test Arabic Content
Make sure Arabic text is stored and retrieved correctly:
```json
{
  "title": "اختبار النص العربي مع الرموز الخاصة: @#$%",
  "excerpt": "هذا اختبار للتأكد من دعم اللغة العربية بشكل كامل"
}
```

### 4. Test HTML Content
Verify HTML is stored correctly in sections:
```html
<h2>عنوان فرعي</h2>
<p>فقرة مع <strong>نص غامق</strong> و <em>نص مائل</em></p>
<ul>
  <li>نقطة أولى</li>
  <li>نقطة ثانية</li>
</ul>
```

---

## ✅ Success Criteria

After completing all tests, you should have:

- ✅ Created at least 1 section
- ✅ Created at least 2 tags
- ✅ Created at least 1 complete article
- ✅ Updated an article
- ✅ Retrieved article details
- ✅ Listed articles with filters
- ✅ Generated S3 upload URL
- ✅ Deleted a test article

**All endpoints working = Phase 3 Complete!** 🎉

---

**Happy Testing!** 🚀

