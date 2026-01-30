# S7abt Admin CMS API Documentation

## Overview

Complete REST API documentation for S7abt Admin Dashboard CMS - Phase 3.

**Base URL:** `https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev`

**Version:** 3.0.0  
**Last Updated:** October 19, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Articles API](#articles-api)
3. [Sections API](#sections-api)
4. [Tags API](#tags-api)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Best Practices](#best-practices)

---

## Authentication

Currently, the API uses **AWS IAM authentication**. Future versions will support **AWS Cognito** authentication.

### Headers

```
Authorization: AWS4-HMAC-SHA256 Credential=...
```

For development/testing, you can configure AWS CLI credentials and use them with Postman AWS Signature authorization.

---

## Articles API

### List Articles

Get a paginated list of articles with optional filters.

**Endpoint:** `GET /admin/articles`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `status` | string | No | all | Filter by status: `published`, `draft`, `all` |
| `section_id` | number | No | - | Filter by section ID |
| `search` | string | No | - | Search in title and content |

**Example Request:**

```bash
curl -X GET "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles?page=1&limit=20&status=published"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "مقدمة إلى AWS Lambda",
        "slug": "intro-to-aws-lambda",
        "excerpt": "تعرف على AWS Lambda",
        "mainImage": "lambda.png",
        "status": "published",
        "views": 150,
        "createdAt": "2025-10-19T10:00:00Z",
        "updatedAt": "2025-10-19T12:00:00Z",
        "user": {
          "id": 1,
          "name": "أحمد محمد"
        },
        "section": {
          "id": 2,
          "name": "AWS"
        },
        "tags": [
          {
            "id": 1,
            "name": "AWS"
          },
          {
            "id": 5,
            "name": "Serverless"
          }
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

---

### Get Article

Get a single article by ID with all details.

**Endpoint:** `GET /admin/articles/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Article ID |

**Example Request:**

```bash
curl -X GET "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles/1"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "مقدمة إلى AWS Lambda",
    "slug": "intro-to-aws-lambda",
    "excerpt": "تعرف على AWS Lambda وكيفية استخدامها",
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
    "mainImage": "lambda.png",
    "status": "published",
    "views": 150,
    "userId": 1,
    "sectionId": 2,
    "tags": [1, 5, 7],
    "createdAt": "2025-10-19T10:00:00Z",
    "updatedAt": "2025-10-19T12:00:00Z",
    "user": {
      "id": 1,
      "name": "أحمد محمد",
      "email": "ahmed@s7abt.com"
    },
    "section": {
      "id": 2,
      "name": "AWS",
      "slug": "aws"
    }
  }
}
```

---

### Create Article

Create a new article.

**Endpoint:** `POST /admin/articles`

**Request Body:**

```json
{
  "title": "string (required)",
  "slug": "string (optional, auto-generated from title)",
  "excerpt": "string (optional)",
  "sections": [
    {
      "title": "string",
      "content": "string (HTML content)"
    }
  ],
  "mainImage": "string (optional, S3 key or URL)",
  "status": "published|draft (default: draft)",
  "userId": "number (required)",
  "sectionId": "number (required)",
  "tagIds": [1, 2, 3]
}
```

**Validation Rules:**

- `title`: Required, 3-500 characters
- `slug`: Optional, auto-generated if not provided, must be unique
- `sections`: Array of 1-5 sections
- `status`: Must be `published` or `draft`
- `userId`: Must exist in database
- `sectionId`: Must exist in database
- `tagIds`: Array of valid tag IDs

**Example Request:**

```bash
curl -X POST "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "مقدمة إلى AWS Lambda",
    "slug": "intro-to-aws-lambda",
    "excerpt": "تعرف على AWS Lambda",
    "sections": [
      {
        "title": "ما هي AWS Lambda؟",
        "content": "<p>AWS Lambda هي خدمة حوسبة بدون خادم...</p>"
      }
    ],
    "mainImage": "lambda.png",
    "status": "published",
    "userId": 1,
    "sectionId": 2,
    "tagIds": [1, 5, 7]
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 43,
    "slug": "intro-to-aws-lambda",
    "message": "Article created successfully"
  }
}
```

---

### Update Article

Update an existing article. Supports partial updates.

**Endpoint:** `PUT /admin/articles/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Article ID |

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "title": "string",
  "slug": "string",
  "excerpt": "string",
  "sections": [...],
  "mainImage": "string",
  "status": "published|draft",
  "sectionId": "number",
  "tagIds": [1, 2, 3]
}
```

**Example Request:**

```bash
curl -X PUT "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles/43" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "مقدمة محدثة إلى AWS Lambda",
    "status": "published"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 43,
    "message": "Article updated successfully"
  }
}
```

---

### Delete Article

Delete an article (soft delete).

**Endpoint:** `DELETE /admin/articles/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Article ID |

**Example Request:**

```bash
curl -X DELETE "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles/43"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 43,
    "message": "Article deleted successfully"
  }
}
```

**Note:** This is a soft delete. The article is marked as deleted (`deleted_at` timestamp) but not removed from the database.

---

### Get Image Upload URL

Get a presigned S3 URL for uploading images.

**Endpoint:** `POST /admin/articles/image-upload-url`

**Request Body:**

```json
{
  "fileName": "string (required)",
  "fileType": "string (required, e.g., image/png, image/jpeg)"
}
```

**Example Request:**

```bash
curl -X POST "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles/image-upload-url" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "article-image.png",
    "fileType": "image/png"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/<your-s3-bucket>/articles/1729341234567-article-image.png?X-Amz-Algorithm=...",
    "fileUrl": "https://s3.amazonaws.com/<your-s3-bucket>/articles/1729341234567-article-image.png",
    "key": "articles/1729341234567-article-image.png"
  }
}
```

**Usage:**

1. Call this endpoint to get the presigned URL
2. Use the `uploadUrl` to PUT your image file directly to S3
3. Save the `fileUrl` or `key` in your article's `mainImage` field

**Example Image Upload:**

```bash
# Step 1: Get upload URL
UPLOAD_URL=$(curl -X POST "..." | jq -r '.data.uploadUrl')

# Step 2: Upload image to S3
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/png" \
  --data-binary @image.png
```

---

## Sections API

### List Sections

Get all sections with article counts.

**Endpoint:** `GET /admin/sections`

**Example Request:**

```bash
curl -X GET "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/sections"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "id": 1,
        "name": "AWS",
        "slug": "aws",
        "description": "Amazon Web Services articles",
        "active": true,
        "order": 1,
        "articleCount": 25
      },
      {
        "id": 2,
        "name": "Azure",
        "slug": "azure",
        "description": "Microsoft Azure articles",
        "active": true,
        "order": 2,
        "articleCount": 18
      }
    ]
  }
}
```

---

### Create Section

Create a new section.

**Endpoint:** `POST /admin/sections`

**Request Body:**

```json
{
  "name": "string (required)",
  "slug": "string (optional, auto-generated)",
  "description": "string (optional)",
  "active": "boolean (default: true)",
  "order": "number (optional)"
}
```

**Example Request:**

```bash
curl -X POST "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/sections" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kubernetes",
    "slug": "kubernetes",
    "description": "مقالات عن Kubernetes",
    "active": true,
    "order": 5
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 6,
    "slug": "kubernetes",
    "message": "Section created successfully"
  }
}
```

---

### Update Section

Update an existing section.

**Endpoint:** `PUT /admin/sections/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Section ID |

**Request Body:**

All fields are optional.

```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "active": "boolean",
  "order": "number"
}
```

**Example Request:**

```bash
curl -X PUT "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/sections/6" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kubernetes & Container Orchestration"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 6,
    "message": "Section updated successfully"
  }
}
```

---

### Delete Section

Delete a section (soft delete).

**Endpoint:** `DELETE /admin/sections/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Section ID |

**Example Request:**

```bash
curl -X DELETE "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/sections/6"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 6,
    "message": "Section deleted successfully"
  }
}
```

**Note:** Cannot delete a section that has articles. You must reassign or delete the articles first.

---

## Tags API

### List Tags

Get all tags with article counts.

**Endpoint:** `GET /admin/tags`

**Example Request:**

```bash
curl -X GET "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/tags"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "AWS",
        "slug": "aws",
        "articleCount": 15
      },
      {
        "id": 2,
        "name": "Azure",
        "slug": "azure",
        "articleCount": 8
      }
    ]
  }
}
```

---

### Create Tag

Create a new tag.

**Endpoint:** `POST /admin/tags`

**Request Body:**

```json
{
  "name": "string (required)",
  "slug": "string (optional, auto-generated)"
}
```

**Example Request:**

```bash
curl -X POST "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/tags" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Serverless",
    "slug": "serverless"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 11,
    "slug": "serverless",
    "message": "Tag created successfully"
  }
}
```

---

### Update Tag

Update an existing tag.

**Endpoint:** `PUT /admin/tags/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Tag ID |

**Request Body:**

All fields are optional.

```json
{
  "name": "string",
  "slug": "string"
}
```

**Example Request:**

```bash
curl -X PUT "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/tags/11" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Serverless Computing"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 11,
    "message": "Tag updated successfully"
  }
}
```

---

### Delete Tag

Delete a tag.

**Endpoint:** `DELETE /admin/tags/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Tag ID |

**Example Request:**

```bash
curl -X DELETE "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/tags/11"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 11,
    "message": "Tag deleted successfully"
  }
}
```

**Note:** This also removes all article-tag associations.

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": "Additional details (optional)"
  }
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_SLUG` | Slug already exists |
| `DATABASE_ERROR` | Database operation failed |
| `INVALID_REQUEST` | Invalid request format |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "userId",
        "message": "User ID must be a number"
      }
    ]
  }
}
```

---

## Rate Limiting

Currently, there are no explicit rate limits. However, AWS API Gateway has default limits:

- **10,000 requests per second** per account
- **5,000 concurrent requests** per account

For production use, consider implementing custom rate limiting.

---

## Best Practices

### 1. Use Pagination

Always use pagination for list endpoints to avoid performance issues:

```bash
GET /admin/articles?page=1&limit=20
```

### 2. Filter Results

Use filters to reduce data transfer:

```bash
GET /admin/articles?status=published&section_id=2
```

### 3. Handle Errors Gracefully

Always check the `success` field in responses:

```javascript
const response = await fetch('/admin/articles');
const data = await response.json();

if (data.success) {
  // Handle success
  console.log(data.data.articles);
} else {
  // Handle error
  console.error(data.error.message);
}
```

### 4. Use Slug for SEO

Always provide a slug or let the API auto-generate it:

```json
{
  "title": "مقدمة إلى AWS Lambda",
  "slug": "intro-to-aws-lambda"
}
```

### 5. Validate Before Sending

Validate data on the client side before sending to API:

```javascript
if (!title || title.length < 3) {
  alert('Title must be at least 3 characters');
  return;
}
```

### 6. Use Environment Variables

Store API endpoint in environment variables:

```javascript
const API_ENDPOINT = process.env.VITE_API_ENDPOINT;
```

### 7. Implement Retry Logic

Implement retry logic for failed requests:

```javascript
async function fetchWithRetry(url, options, retries = 3) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}
```

### 8. Cache Responses

Cache frequently accessed data:

```javascript
const cache = new Map();

async function getArticles(page) {
  const cacheKey = `articles-${page}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const response = await fetch(`/admin/articles?page=${page}`);
  const data = await response.json();
  
  cache.set(cacheKey, data);
  return data;
}
```

---

## Testing

### Using Postman

1. Import the Postman collection
2. Import the environment file
3. Set your API endpoint
4. Run requests!

### Using cURL

```bash
# List articles
curl -X GET "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles"

# Create article
curl -X POST "https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Article","userId":1,"sectionId":1}'
```

### Using JavaScript/Fetch

```javascript
// List articles
const response = await fetch('https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles');
const data = await response.json();
console.log(data.data.articles);

// Create article
const response = await fetch('https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Test Article',
    userId: 1,
    sectionId: 1
  })
});
const data = await response.json();
console.log(data.data.id);
```

---

## Support

For issues or questions:
- Email: support@s7abt.com
- GitHub: https://github.com/s7abt/admin-cms

---

**Last Updated:** October 19, 2025  
**Version:** 3.0.0  
**Author:** S7abt Team

