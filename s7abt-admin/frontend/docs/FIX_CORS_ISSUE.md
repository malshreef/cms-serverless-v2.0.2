# Fix CORS Issue - Complete Guide

## The Problem

Your frontend (`http://localhost:5173`) cannot access the API because of CORS (Cross-Origin Resource Sharing) restrictions.

**Error Message**:
```
Access to XMLHttpRequest at 'https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/articles' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

---

## Solution Options

### Option 1: Update CloudFormation Template (Recommended)

This is the best long-term solution as it updates the infrastructure properly.

**Step 1**: Update `template-phase3-final.yaml`

Find the `AWS::Serverless::Api` resource and update the `Cors` configuration:

```yaml
  AdminApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: dev
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'http://localhost:5173,https://yourdomain.com'"  # Add your origins
        AllowCredentials: true
```

**Step 2**: Redeploy the stack

```bash
cd s7abt-admin/infrastructure

sam build

sam deploy ^
  --template-file .aws-sam/build/template.yaml ^
  --stack-name s7abt-api-dev ^
  --capabilities CAPABILITY_IAM ^
  --region me-central-1 ^
  --resolve-s3
```

---

### Option 2: Quick Fix via AWS Console (Fastest)

**Step 1**: Go to API Gateway Console
1. Open https://console.aws.amazon.com/apigateway
2. Select region: `me-central-1`
3. Click on your API: `s7abt-admin-api-dev`

**Step 2**: Enable CORS
1. Click on any resource (e.g., `/admin/articles`)
2. Click "Actions" → "Enable CORS"
3. In the popup:
   - **Access-Control-Allow-Origin**: `http://localhost:5173`
   - **Access-Control-Allow-Headers**: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
   - **Access-Control-Allow-Methods**: `GET,POST,PUT,DELETE,OPTIONS`
4. Click "Enable CORS and replace existing CORS headers"
5. Click "Yes, replace existing values"

**Step 3**: Deploy Changes
1. Click "Actions" → "Deploy API"
2. Select "dev" stage
3. Click "Deploy"

**Step 4**: Test
- Refresh your browser
- Try loading the Articles page

---

### Option 3: Use AWS CLI Script (Automated)

Run the `fix-cors.bat` script:

```bash
cd s7abt-admin
fix-cors.bat
```

This will automatically update CORS for all endpoints.

---

## Verification

### Test 1: Check CORS Headers

Open browser DevTools → Network tab → Refresh page → Click on a failed request → Check Response Headers:

You should see:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
```

### Test 2: Test API Directly

```bash
curl -i https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev/admin/sections
```

Check for CORS headers in the response.

### Test 3: Test from Frontend

Refresh the Articles page - it should load without errors.

---

## For Production

When deploying to production, update the `AllowOrigin` to include your production domain:

```yaml
AllowOrigin: "'https://admin.s7abt.com,http://localhost:5173'"
```

**Security Note**: Never use `'*'` (allow all origins) in production as it's a security risk.

---

## Common Issues

### Issue 1: Still getting CORS error after fix

**Solution**: 
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Wait 1-2 minutes for API Gateway to propagate changes

### Issue 2: CORS works for some endpoints but not others

**Solution**: 
- Enable CORS for ALL resources in API Gateway
- Make sure OPTIONS method exists for each resource
- Redeploy the API

### Issue 3: Preflight request fails

**Solution**:
- Check that OPTIONS method is configured
- Verify response includes all required headers
- Check that status code is 200

---

## Understanding CORS

**What is CORS?**
- Security feature that blocks web pages from making requests to a different domain
- Prevents malicious websites from accessing your API

**How it works:**
1. Browser sends a "preflight" OPTIONS request
2. Server responds with allowed origins, methods, and headers
3. If allowed, browser sends the actual request
4. Server includes CORS headers in response

**Why we need it:**
- Your frontend is on `http://localhost:5173`
- Your API is on `https://<your-api-id>.execute-api.me-central-1.amazonaws.com`
- Different domains = CORS required

---

## Next Steps

After fixing CORS:
1. ✅ Test Articles page loads
2. ✅ Test Sections page loads
3. ✅ Test Tags page loads
4. ✅ Test creating/editing content
5. ✅ Move to authentication setup

---

**Recommended**: Use Option 2 (AWS Console) for the quickest fix, then update the CloudFormation template for the permanent solution.

