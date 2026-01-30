# Postman Testing Guide for S7abt Admin CMS API

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `S7abt_Admin_CMS_API.postman_collection.json`
4. Click **Import**

### 2. Import Environment

1. Click the **Environments** icon (⚙️) in the top right
2. Click **Import**
3. Select `S7abt_Admin_CMS.postman_environment.json`
4. Click **Import**
5. Select **S7abt Admin CMS - Development** from the environment dropdown

### 3. Configure Environment

Update the `base_url` variable if needed:

```
base_url: https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev
```

---

## Testing Workflow

### Recommended Testing Order

1. **List Sections** → Get available sections
2. **List Tags** → Get available tags
3. **Create Article** → Create a test article
4. **List Articles** → Verify article appears
5. **Get Article** → Get article details
6. **Update Article** → Modify the article
7. **Get Image Upload URL** → Test S3 upload
8. **Delete Article** → Clean up test data

---

## Running Tests

### Option 1: Run Individual Requests

1. Select a request from the collection
2. Click **Send**
3. View response in the bottom panel
4. Check **Test Results** tab for automated tests

### Option 2: Run Entire Collection

1. Click the **...** menu on the collection
2. Select **Run collection**
3. Click **Run S7abt Admin CMS API**
4. View test results

### Option 3: Run with Newman (CLI)

```bash
# Install Newman
npm install -g newman

# Run collection
newman run S7abt_Admin_CMS_API.postman_collection.json \
  -e S7abt_Admin_CMS.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export report.html
```

---

## Automated Tests

Each request includes automated tests that verify:

### Global Tests (All Requests)

✅ Response time < 5000ms  
✅ Content-Type is application/json

### List Articles Tests

✅ Status code is 200  
✅ Response has success field  
✅ Response has articles array  
✅ Response has pagination  
✅ Saves first article ID to environment

### Get Article Tests

✅ Status code is 200  
✅ Response has article data  
✅ Article has sections array

### Create Article Tests

✅ Status code is 201  
✅ Article created successfully  
✅ Response has article ID  
✅ Saves created article ID to environment

### Update Article Tests

✅ Status code is 200  
✅ Article updated successfully  
✅ Response has success message

### Delete Article Tests

✅ Status code is 200  
✅ Article deleted successfully  
✅ Response has success message

### Get Image Upload URL Tests

✅ Status code is 200  
✅ Response has upload URL  
✅ Response has file URL  
✅ Response has key  
✅ Saves URLs to environment

---

## Environment Variables

The collection uses environment variables for dynamic data:

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `base_url` | API endpoint | No |
| `article_id` | Current article ID | Yes |
| `created_article_id` | Newly created article ID | Yes |
| `section_id` | Current section ID | Yes |
| `created_section_id` | Newly created section ID | Yes |
| `tag_id` | Current tag ID | Yes |
| `created_tag_id` | Newly created tag ID | Yes |
| `upload_url` | S3 presigned upload URL | Yes |
| `file_url` | S3 file URL | Yes |

**Auto-Set:** Variables are automatically set by test scripts when you run requests.

---

## Best Practices

### 1. Use Variables

Instead of hardcoding values, use variables:

```
❌ Bad:  GET /admin/articles/1
✅ Good: GET /admin/articles/{{article_id}}
```

### 2. Chain Requests

Use test scripts to save data for subsequent requests:

```javascript
// In Create Article test
pm.environment.set("created_article_id", pm.response.json().data.id);

// In Update Article request
PUT /admin/articles/{{created_article_id}}
```

### 3. Clean Up Test Data

Always delete test data after testing:

```javascript
// In Delete Article test
pm.test("Cleanup successful", function () {
    pm.expect(pm.response.json().success).to.be.true;
    pm.environment.unset("created_article_id");
});
```

### 4. Use Pre-request Scripts

Generate dynamic data before sending requests:

```javascript
// Generate random title
pm.environment.set("random_title", "Test Article " + Date.now());
```

Then use in request body:

```json
{
  "title": "{{random_title}}"
}
```

### 5. Test Error Cases

Create requests to test error handling:

```
POST /admin/articles
{
  "title": ""  // Empty title should fail
}
```

Expected response:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR"
  }
}
```

### 6. Use Folders

Organize requests into folders:

```
📁 Articles
  ├── List Articles
  ├── Get Article
  ├── Create Article
  ├── Update Article
  └── Delete Article
📁 Sections
  └── ...
📁 Tags
  └── ...
```

### 7. Document Requests

Add descriptions to each request:

```markdown
## List Articles

Get a paginated list of articles with optional filters.

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
```

---

## Advanced Testing

### 1. Test Pagination

```javascript
pm.test("Pagination works correctly", function () {
    var jsonData = pm.response.json();
    var pagination = jsonData.data.pagination;
    
    pm.expect(pagination.page).to.equal(1);
    pm.expect(pagination.limit).to.equal(20);
    pm.expect(pagination.total).to.be.a('number');
    pm.expect(pagination.totalPages).to.be.a('number');
});
```

### 2. Test Filtering

```javascript
pm.test("Status filter works", function () {
    var jsonData = pm.response.json();
    var articles = jsonData.data.articles;
    
    articles.forEach(function(article) {
        pm.expect(article.status).to.equal('published');
    });
});
```

### 3. Test Search

```javascript
pm.test("Search works correctly", function () {
    var jsonData = pm.response.json();
    var articles = jsonData.data.articles;
    var searchTerm = pm.request.url.query.get('search');
    
    articles.forEach(function(article) {
        var titleMatch = article.title.includes(searchTerm);
        var excerptMatch = article.excerpt && article.excerpt.includes(searchTerm);
        pm.expect(titleMatch || excerptMatch).to.be.true;
    });
});
```

### 4. Test Data Integrity

```javascript
pm.test("Article has all required fields", function () {
    var article = pm.response.json().data;
    
    pm.expect(article).to.have.property('id');
    pm.expect(article).to.have.property('title');
    pm.expect(article).to.have.property('slug');
    pm.expect(article).to.have.property('status');
    pm.expect(article).to.have.property('userId');
    pm.expect(article).to.have.property('sectionId');
    pm.expect(article).to.have.property('createdAt');
});
```

### 5. Test Relationships

```javascript
pm.test("Article has user and section data", function () {
    var article = pm.response.json().data;
    
    pm.expect(article.user).to.be.an('object');
    pm.expect(article.user).to.have.property('id');
    pm.expect(article.user).to.have.property('name');
    
    pm.expect(article.section).to.be.an('object');
    pm.expect(article.section).to.have.property('id');
    pm.expect(article.section).to.have.property('name');
});
```

---

## Troubleshooting

### Issue: 404 Not Found

**Cause:** Endpoint doesn't exist or wrong API Gateway stage

**Solution:**
1. Check `base_url` in environment
2. Verify API Gateway deployment
3. Check endpoint path in request

### Issue: 500 Internal Server Error

**Cause:** Lambda function error or database connection issue

**Solution:**
1. Check CloudWatch Logs for Lambda function
2. Verify database credentials in Secrets Manager
3. Check RDS security group allows Lambda access

### Issue: Timeout

**Cause:** Lambda cold start or slow database query

**Solution:**
1. Increase timeout in Postman (Settings → General → Request timeout)
2. Optimize database queries
3. Add database indexes

### Issue: CORS Error (in browser)

**Cause:** CORS not configured in API Gateway

**Solution:**
1. Enable CORS in API Gateway
2. Add `Access-Control-Allow-Origin` header
3. Redeploy API

### Issue: Variables Not Working

**Cause:** Environment not selected or variable not set

**Solution:**
1. Select environment from dropdown (top right)
2. Check variable is set in environment
3. Use `{{variable_name}}` syntax

---

## Performance Testing

### Load Testing with Newman

```bash
# Run collection 100 times
newman run S7abt_Admin_CMS_API.postman_collection.json \
  -e S7abt_Admin_CMS.postman_environment.json \
  -n 100 \
  --delay-request 100

# Run with multiple iterations
newman run S7abt_Admin_CMS_API.postman_collection.json \
  -e S7abt_Admin_CMS.postman_environment.json \
  --iteration-count 50 \
  --reporters cli,json \
  --reporter-json-export results.json
```

### Analyze Results

```javascript
// Parse Newman results
const results = require('./results.json');

const avgResponseTime = results.run.timings.responseAverage;
const totalRequests = results.run.stats.requests.total;
const failedRequests = results.run.stats.requests.failed;

console.log(`Average Response Time: ${avgResponseTime}ms`);
console.log(`Total Requests: ${totalRequests}`);
console.log(`Failed Requests: ${failedRequests}`);
console.log(`Success Rate: ${((totalRequests - failedRequests) / totalRequests * 100).toFixed(2)}%`);
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Newman
        run: npm install -g newman
      
      - name: Run API Tests
        run: |
          newman run S7abt_Admin_CMS_API.postman_collection.json \
            -e S7abt_Admin_CMS.postman_environment.json \
            --reporters cli,junit \
            --reporter-junit-export results.xml
      
      - name: Publish Test Results
        uses: EnricoMi/publish-unit-test-result-action@v1
        if: always()
        with:
          files: results.xml
```

---

## Monitoring

### Set Up Postman Monitors

1. Click **Monitors** in Postman
2. Click **Create Monitor**
3. Select collection
4. Set schedule (e.g., every hour)
5. Configure notifications

### Monitor Metrics

- Response time trends
- Error rates
- Availability
- Success rates

---

## Resources

- [Postman Documentation](https://learning.postman.com/)
- [Newman Documentation](https://github.com/postmanlabs/newman)
- [Postman API Testing Guide](https://www.postman.com/api-testing/)

---

**Happy Testing!** 🚀

