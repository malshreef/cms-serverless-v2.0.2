# Lambda Function Testing Guide

## Test Events for `/tags/8` Endpoint

I've created test events that simulate API Gateway requests to your Lambda function for the URL:
```
https://<your-api-id>.execute-api.me-central-1.amazonaws.com/Stage/tags/8
```

---

## Method 1: Test in AWS Lambda Console

### Steps:

1. **Open AWS Lambda Console**
   - Go to: https://console.aws.amazon.com/lambda/
   - Region: `me-central-1` (Middle East - UAE)
   - Find your function: `s7abt-list-tags-dev`

2. **Create a Test Event**
   - Click the **"Test"** tab
   - Click **"Create new event"**
   - Event name: `TestTag8WithPageSize100`
   - Copy the content from `test_event_pagesize_100.json`
   - Paste it into the event JSON editor
   - Click **"Save"**

3. **Run the Test**
   - Click **"Test"** button
   - View the execution results
   - Check the **"Execution result"** tab for the response
   - Check the **"Log output"** tab for console.log messages

4. **Verify the Response**
   - Look for `"totalItems": 33` (not 13)
   - Look for `"articles"` array with 33 items
   - Look for `"pagination"` object
   - Ensure there's NO `"news"` array

---

## Method 2: Test Using AWS CLI

### Test with Basic Request (No Parameters)

```bash
aws lambda invoke \
  --function-name s7abt-list-tags-dev \
  --payload file://test_event_basic.json \
  --cli-binary-format raw-in-base64-out \
  --region me-central-1 \
  response_basic.json

# View the response
cat response_basic.json | jq '.'
```

### Test with PageSize 100

```bash
aws lambda invoke \
  --function-name s7abt-list-tags-dev \
  --payload file://test_event_pagesize_100.json \
  --cli-binary-format raw-in-base64-out \
  --region me-central-1 \
  response_pagesize_100.json

# View the response
cat response_pagesize_100.json | jq '.'

# Count articles returned
cat response_pagesize_100.json | jq '.body | fromjson | .data.tag.articles | length'
```

---

## Method 3: Test Using SAM CLI (Local Testing)

### Prerequisites
```bash
# Install SAM CLI if not already installed
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
```

### Test Locally

```bash
# Navigate to your backend directory
cd /path/to/s7abt-list-tags-dev

# Invoke function locally
sam local invoke s7abtlisttagsdev \
  --event test_event_pagesize_100.json \
  --env-vars env.json

# Or start API Gateway locally
sam local start-api
# Then test with: curl http://localhost:3000/tags/8?status=published&pageSize=100
```

---

## Available Test Events

I've created 5 different test scenarios:

### 1. Basic Request (Default Parameters)
**File:** `test_event_basic.json`
```
GET /tags/8
```
- No query parameters
- Uses backend defaults (page=1, pageSize=15, status=published)

### 2. PageSize 100 (Recommended for Bug Testing)
**File:** `test_event_pagesize_100.json`
```
GET /tags/8?status=published&pageSize=100
```
- Explicitly requests 100 items
- Should return all 33 articles

### 3. Pagination Page 1
**File:** Extract from `lambda_test_events.json` → `test_events.3_with_pagination.event`
```
GET /tags/8?status=published&pageSize=15&page=1
```
- First page with 15 items
- Should return articles 1-15

### 4. Pagination Page 2
**File:** Extract from `lambda_test_events.json` → `test_events.4_page_2.event`
```
GET /tags/8?status=published&pageSize=15&page=2
```
- Second page with 15 items
- Should return articles 16-30

### 5. All Articles (Including Drafts)
**File:** Extract from `lambda_test_events.json` → `test_events.5_all_articles_including_drafts.event`
```
GET /tags/8?status=all&pageSize=100
```
- Returns both published and draft articles
- Useful for admin/testing purposes

---

## Expected Results

### ✅ Correct Response (After Fix)

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"success\":true,\"data\":{\"tag\":{\"id\":8,\"name\":\"الخدمات-السحابية\",\"totalItems\":33,\"totalArticles\":33,\"articlesCount\":33,\"articles\":[...]},\"pagination\":{\"page\":1,\"currentPage\":1,\"totalPages\":1,\"pageSize\":100,\"offset\":0,\"totalItems\":33,\"hasMore\":false,\"itemsOnPage\":33,\"nextPage\":null,\"previousPage\":null},\"filter\":{\"status\":\"published\",\"description\":\"Published articles only\"}}}"
}
```

**Key Points:**
- ✅ `totalItems: 33` (not 13)
- ✅ `articles` array has 33 items
- ✅ `pagination` object exists
- ✅ NO `news` array

### ❌ Incorrect Response (Old Deployment)

```json
{
  "statusCode": 200,
  "body": "{\"success\":true,\"data\":{\"tag\":{\"id\":8,\"name\":\"الخدمات-السحابية\",\"articles\":[...12 items...],\"news\":[...1 item...],\"totalItems\":13}}}"
}
```

**Problems:**
- ❌ `totalItems: 13` (should be 33)
- ❌ `articles` array has only 12 items
- ❌ `news` array exists (shouldn't be there)
- ❌ NO `pagination` object

---

## CloudWatch Logs to Check

After running the test, check CloudWatch logs for these key messages:

### Expected Log Output (Correct Version)

```
🔍 FULL EVENT OBJECT: {...}
📌 Tag ID: 8
📊 Raw queryStringParameters: { status: 'published', pageSize: '100' }
✅ Parsed pageSize: 100
📊 TOTAL ARTICLES FOUND: 33
📊 Total pages: 1
📊 ARTICLES RETURNED: 33
✅ Response built successfully
```

### What to Look For

1. **Total Articles Count:**
   ```
   📊 TOTAL ARTICLES FOUND: 33
   ```
   - Should be 33, not 13

2. **Articles Returned:**
   ```
   📊 ARTICLES RETURNED: 33
   ```
   - Should match the total when pageSize=100

3. **Pagination Info:**
   ```
   📊 Pagination info: {"page":1,"totalPages":1,"pageSize":100,"totalItems":33,...}
   ```
   - Should show correct pagination

4. **No Errors:**
   - No `❌ ERROR:` messages
   - No database connection errors

---

## Troubleshooting

### Issue: Function Not Found

```bash
# List all Lambda functions
aws lambda list-functions --region me-central-1 | grep s7abt

# Check if function exists
aws lambda get-function --function-name s7abt-list-tags-dev --region me-central-1
```

### Issue: Permission Denied

```bash
# Check your AWS credentials
aws sts get-caller-identity

# Ensure you have lambda:InvokeFunction permission
```

### Issue: VPC Timeout

If the function times out, it might be a VPC configuration issue:
- Check security groups allow database access
- Check subnet routing to database
- Increase timeout in Lambda configuration

### Issue: Database Connection Error

```bash
# Check if the database secret is accessible
aws secretsmanager get-secret-value \
  --secret-id s7abt/database/credentials-dubai \
  --region me-central-1
```

---

## Quick Test Script

Create a bash script to test all scenarios:

```bash
#!/bin/bash
# test_lambda.sh

FUNCTION_NAME="s7abt-list-tags-dev"
REGION="me-central-1"

echo "Testing Lambda Function: $FUNCTION_NAME"
echo "========================================"

# Test 1: Basic request
echo -e "\n1. Testing basic request..."
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload file://test_event_basic.json \
  --cli-binary-format raw-in-base64-out \
  --region $REGION \
  response_basic.json > /dev/null

echo "Articles returned: $(cat response_basic.json | jq -r '.body | fromjson | .data.tag.articles | length')"
echo "Total items: $(cat response_basic.json | jq -r '.body | fromjson | .data.tag.totalItems')"

# Test 2: PageSize 100
echo -e "\n2. Testing with pageSize=100..."
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload file://test_event_pagesize_100.json \
  --cli-binary-format raw-in-base64-out \
  --region $REGION \
  response_pagesize_100.json > /dev/null

echo "Articles returned: $(cat response_pagesize_100.json | jq -r '.body | fromjson | .data.tag.articles | length')"
echo "Total items: $(cat response_pagesize_100.json | jq -r '.body | fromjson | .data.tag.totalItems')"
echo "Has pagination: $(cat response_pagesize_100.json | jq -r '.body | fromjson | .data.pagination != null')"
echo "Has news array: $(cat response_pagesize_100.json | jq -r '.body | fromjson | .data.tag.news != null')"

echo -e "\n✅ Tests completed!"
```

Make it executable and run:
```bash
chmod +x test_lambda.sh
./test_lambda.sh
```

---

## Summary

Use these test events to:
1. ✅ Verify the Lambda function is working correctly
2. ✅ Check if the new code is deployed
3. ✅ Confirm all 33 articles are returned with pageSize=100
4. ✅ Test pagination functionality
5. ✅ Debug issues by checking CloudWatch logs

**Recommended Test:** Use `test_event_pagesize_100.json` to verify the bug is fixed!
