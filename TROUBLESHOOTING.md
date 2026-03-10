# Troubleshooting Guide

This guide documents real issues encountered during production deployment of S7abt CMS Serverless. Every problem listed here was discovered, diagnosed, and resolved in a live AWS environment. If you run into an issue during setup or operation, check this guide first -- the solution is likely here.

---

## Table of Contents

1. [Lambda 30-Second Timeout](#1-lambda-30-second-timeout)
2. [Deleted Articles/News Appearing on Public Website](#2-deleted-articlesnews-appearing-on-public-website)
3. ["No Database Selected" Error](#3-no-database-selected-error)
4. [Cognito custom:role Attribute Not Found](#4-cognito-customrole-attribute-not-found)
5. [Network Error in Admin Panel (CORS / VPC Issues)](#5-network-error-in-admin-panel-cors--vpc-issues)
6. [Lambda Cannot Reach Database (VPC/Security Group)](#6-lambda-cannot-reach-database-vpcsecurity-group)
7. [Share Statistics Not Working](#7-share-statistics-not-working)
8. [Lambda Module Not Found](#8-lambda-module-not-found-cannot-find-module-shareddb)
9. [Tweet Generation / OpenAI Integration Fails](#9-tweet-generation--openai-integration-fails)
10. [Twitter/X Publishing Fails](#10-twitterx-publishing-fails)
11. [AWS Amplify Environment Variables Wiped After Update](#11-aws-amplify-environment-variables-wiped-after-update)
12. [SAM Deploy Stuck in REVIEW_IN_PROGRESS](#12-sam-deploy-stuck-in-review_in_progress)

---

## 1. Lambda 30-Second Timeout

**Symptom:** Lambda functions time out after 30 seconds, even for simple queries that should complete in milliseconds. CloudWatch logs show the function executed the query successfully but never returned a response.

**Root Cause:** Using the `db.getConnection()` + `connection.end()` pattern. The mysql2 connection pool keeps the Node.js event loop alive even after the query completes. Lambda waits for the event loop to drain before returning a response, but the pool never closes, so the function sits idle until it hits the 30-second timeout.

**Fix:** Use the pool methods `db.query()` or `db.rawQuery()` instead. These execute queries and return results without holding connections open in a way that blocks the event loop.

```javascript
// WRONG - causes 30s timeout
const connection = await db.getConnection();
const [rows] = await connection.execute('SELECT * FROM articles');
connection.release();
return rows;

// CORRECT - returns immediately after query
const rows = await db.query('SELECT * FROM articles WHERE id = ?', [id]);
return rows;
```

Only use `getConnection()` when you need explicit transaction control (`BEGIN` / `COMMIT` / `ROLLBACK`), and make sure to call `connection.release()` in a `finally` block.

---

## 2. Deleted Articles/News Appearing on Public Website

**Symptom:** Articles or news items that were soft-deleted through the admin panel still appear on the public website in listings, tag pages, or search results.

**Root Cause:** SQL queries in one or more Lambda functions are missing the soft-delete filter. The system uses soft deletion (setting a `deleted_at` timestamp) rather than physically removing rows, so queries that do not explicitly exclude deleted records will return them.

**Fix:** Add the soft-delete filter to ALL `WHERE` clauses in every list and detail query:

```sql
-- For articles
SELECT * FROM s7b_articles
WHERE s7b_article_published = 1
  AND s7b_article_deleted_at IS NULL   -- Add this line

-- For news
SELECT * FROM s7b_news
WHERE s7b_news_published = 1
  AND s7b_news_deleted_at IS NULL      -- Add this line
```

Audit every Lambda function that reads articles or news. This includes listing endpoints, detail endpoints, tag-based queries, and search endpoints. Every single query must include the `IS NULL` check on the appropriate `deleted_at` column.

---

## 3. "No Database Selected" Error

**Symptom:** Lambda returns a 500 error. CloudWatch logs show `Error: No database selected` or `ER_NO_DB_ERROR`.

**Root Cause:** The database name is missing from the connection configuration. This typically happens when the Secrets Manager secret JSON uses the field `dbname` but the code expects `database`, or vice versa. The connection is established successfully (host, user, and password are correct), but no default database is selected for queries.

**Fix:** Ensure your Secrets Manager secret JSON includes the `dbname` field:

```json
{
  "host": "your-rds-endpoint.rds.amazonaws.com",
  "username": "admin",
  "password": "your-password",
  "dbname": "s7abt_dubai",
  "port": 3306
}
```

The `db.js` module reads both field names for compatibility:

```javascript
database: credentials.dbname || credentials.database
```

If you see this error, check the secret value in Secrets Manager and confirm the field name matches what your `db.js` expects. Also verify the database name itself is correct and that the database has been created on the RDS instance.

---

## 4. Cognito custom:role Attribute Not Found

**Symptom:** Creating users through the admin panel or AWS CLI fails with the error `attribute custom:role does not exist` or `Invalid UserPool attribute: custom:role`.

**Root Cause:** The Cognito User Pool schema is missing the custom `role` attribute. The admin system uses `custom:role` to store user roles (e.g., `admin`, `editor`) and this attribute must be defined in the User Pool schema before it can be set on users.

**Fix:** The SAM template (`template-phase3.yaml`) creates this attribute automatically when deploying the User Pool. If you created the User Pool manually, you must add the custom attribute:

**Via AWS CLI:**
```bash
aws cognito-idp add-custom-attributes \
  --user-pool-id us-east-1_XXXXXXXXX \
  --custom-attributes Name=role,AttributeDataType=String,Mutable=true
```

**Via AWS Console:**
1. Go to Cognito > User Pools > your pool
2. Navigate to "Sign-up experience" > "Custom attributes"
3. Add attribute: Name = `role`, Type = String, Mutable = Yes

Note: Custom attributes cannot be removed once added, and their data type cannot be changed. Make sure to set the type to String.

---

## 5. Network Error in Admin Panel (CORS / VPC Issues)

**Symptom:** The admin panel shows "Network Error" on all API calls. The browser console shows CORS errors or failed requests with no response.

**Root Cause:** This has two common causes:

1. **VPC connectivity:** Lambda functions that are not deployed inside the VPC cannot reach RDS instances in private subnets. The connection attempt times out, and the API Gateway returns an error without CORS headers.

2. **Missing CORS configuration:** API Gateway does not include CORS headers (`Access-Control-Allow-Origin`, etc.) in error responses, or the `OPTIONS` preflight method is not configured.

**Fix:**

For VPC connectivity, ensure all Lambda functions that access the database are deployed in the same VPC as the RDS instance. See [issue #6](#6-lambda-cannot-reach-database-vpcsecurity-group) for detailed VPC configuration.

For CORS, ensure every API Gateway resource has:
- An `OPTIONS` method that returns the required CORS headers
- CORS headers included in all Lambda response objects:

```javascript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};
```

Also ensure your Lambda functions return these headers even in error responses. If the function crashes before setting headers, API Gateway will return a 502 without CORS headers, which the browser reports as a "Network Error" rather than showing the actual status code.

---

## 6. Lambda Cannot Reach Database (VPC/Security Group)

**Symptom:** Lambda function times out when trying to connect to the RDS endpoint. CloudWatch logs show connection timeout errors (not query errors -- the connection itself never establishes).

**Root Cause:** The Lambda function is not in the same VPC as the RDS instance, or the security group rules do not allow traffic between them on port 3306. Lambda functions outside a VPC cannot reach resources in private subnets.

**Fix:** Configure the following:

1. **Place Lambda in the same VPC:** Assign the Lambda function to the same VPC subnets where RDS is deployed. Use at least two subnets in different Availability Zones for reliability.

2. **Configure security groups:** Create or update a security group that allows:
   - **Inbound:** TCP port 3306 from the Lambda function's security group
   - The Lambda function and RDS can share a security group with a self-referencing inbound rule, or use separate groups with explicit cross-references

3. **Ensure outbound internet access:** Lambda functions inside a VPC lose direct internet access. To reach AWS services (Secrets Manager, S3, etc.), you need one of:
   - A NAT Gateway in a public subnet (costs apply)
   - VPC Endpoints for the specific AWS services (Secrets Manager, S3)

**Example security group rule (via CLI):**
```bash
# Allow Lambda SG to reach RDS on port 3306
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXXXXXX \
  --protocol tcp \
  --port 3306 \
  --source-group sg-YYYYYYYYY
```

If you are using a single security group for both Lambda and RDS, add a self-referencing rule:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXXXXXX \
  --protocol tcp \
  --port 3306 \
  --source-group sg-XXXXXXXXX
```

---

## 7. Share Statistics Not Working

**Symptom:** Clicking share buttons on the article page does nothing, or the API returns a 500 error. CloudWatch logs may show `Table 's7b_article_shares' doesn't exist` or reference non-existent columns.

**Root Cause:** The `s7b_article_shares` table was not included in the initial database schema, so it does not exist. Alternatively, the table exists but with different column names than what the `share.js` handler expects.

**Fix:** Run the complete database initialization script, which now includes this table. The schema is:

```sql
CREATE TABLE IF NOT EXISTS s7b_article_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  s7b_article_id INT NOT NULL,
  s7b_share_platform VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_article_id (s7b_article_id),
  INDEX idx_platform (s7b_share_platform)
);
```

The `share.js` handler uses only the `s7b_article_id` and `s7b_share_platform` columns. If the table exists but has different columns, either alter the table to match or update the handler code.

---

## 8. Lambda Module Not Found (`Cannot find module '../shared/db'`)

**Symptom:** Lambda fails immediately on invocation with `Runtime.ImportModuleError: Cannot find module '../shared/db'` or similar path-related import errors.

**Root Cause:** When creating the Lambda deployment zip file, the directory structure was flattened. Lambda handlers use relative imports like `require('../shared/db')`, which expect a specific folder hierarchy inside the zip. If files are placed at the root level instead of inside their respective folders, the imports break.

**Fix:** When creating zip files for deployment, include the folder names themselves, not their contents:

```powershell
# CORRECT - preserves directory structure
Compress-Archive -Path 'articles','shared','node_modules' -DestinationPath deploy.zip

# WRONG - flattens everything to root level
Compress-Archive -Path 'articles/*','shared/*','node_modules/*' -DestinationPath deploy.zip
```

The resulting zip should have this structure:
```
deploy.zip
  articles/
    list.js
    get.js
    ...
  shared/
    db.js
    response.js
    ...
  node_modules/
    mysql2/
    ...
```

Verify the structure before deploying:
```powershell
# List zip contents to verify folder structure
Compress-Archive # (use any zip viewer to inspect)
```

If you are on Linux/macOS, the equivalent:
```bash
zip -r deploy.zip articles/ shared/ node_modules/
```

---

## 9. Tweet Generation / OpenAI Integration Fails

**Symptom:** The "Generate Tweet" feature in the admin panel returns an error or produces empty results. CloudWatch logs may show authentication errors from the OpenAI API or errors retrieving the secret.

**Root Cause:** The OpenAI API key is not stored in Secrets Manager, or the secret exists but has an incorrect JSON field name that the code does not recognize.

**Fix:** Create the Secrets Manager secret with the correct name and format:

```bash
aws secretsmanager create-secret \
  --name s7abt/openai/credentials \
  --secret-string '{"api_key": "sk-..."}'
```

Then ensure the Lambda function has:
- An environment variable `OPENAI_SECRET_NAME` set to `s7abt/openai/credentials`
- IAM permissions to call `secretsmanager:GetSecretValue` on that secret
- Network access to both Secrets Manager and the OpenAI API (requires NAT Gateway or VPC endpoints if Lambda is in a VPC)

If the secret exists but the function still fails, retrieve and inspect the secret value:
```bash
aws secretsmanager get-secret-value --secret-id s7abt/openai/credentials
```

Confirm the JSON contains the `api_key` field (not `apiKey`, `key`, or other variations).

---

## 10. Twitter/X Publishing Fails

**Symptom:** Tweets are saved to the database but never posted to Twitter/X. The admin panel may show the tweet as "saved" without confirming publication, or the publish action returns an error.

**Root Cause:** Twitter API credentials are missing from Secrets Manager, or the secret JSON uses incorrect field names. The Twitter API v2 requires four separate credential values (API key, API secret, access token, access token secret), and all four must be present and valid.

**Fix:** Create the Secrets Manager secret with all required Twitter API credentials:

```bash
aws secretsmanager create-secret \
  --name s7abt/twitter/credentials \
  --secret-string '{
    "api_key": "...",
    "api_secret": "...",
    "access_token": "...",
    "access_token_secret": "..."
  }'
```

See `SECRETS-SETUP.md` for the exact field names and format. Ensure the Lambda function has:
- An environment variable pointing to this secret name
- IAM permissions for `secretsmanager:GetSecretValue`
- Outbound internet access to reach the Twitter API (NAT Gateway required if Lambda is in a VPC)

To verify your credentials are working, test with a simple API call before deploying:
```bash
# Retrieve and inspect the secret
aws secretsmanager get-secret-value --secret-id s7abt/twitter/credentials
```

---

## 11. AWS Amplify Environment Variables Wiped After Update

**Symptom:** After updating a single environment variable on the Amplify app, other features break. For example, images stop loading after you update the API URL, or API calls fail after you update the media bucket URL.

**Root Cause:** The `aws amplify update-app --environment-variables` command REPLACES ALL environment variables on the app, not just the one you specify. If you pass only one variable, all other variables are deleted.

**Fix:** Always include ALL environment variables when updating. Follow this process:

1. **Retrieve current variables first:**
```bash
aws amplify get-app --app-id YOUR_APP_ID --query 'app.environmentVariables'
```

2. **Include all variables in the update command:**
```bash
aws amplify update-app \
  --app-id YOUR_APP_ID \
  --environment-variables \
    NEXT_PUBLIC_API_URL=https://api.example.com \
    NEXT_PUBLIC_MEDIA_URL=https://media.example.com \
    NEXT_PUBLIC_OTHER_VAR=value \
    NEW_VAR=new-value
```

Alternatively, update environment variables through the Amplify Console UI, which preserves existing variables when you add or change one.

**Important:** `NEXT_PUBLIC_*` variables in Next.js are baked into the JavaScript bundle at build time. After changing any `NEXT_PUBLIC_*` variable, you must trigger a new build for the change to take effect on the frontend.

---

## 12. SAM Deploy Stuck in REVIEW_IN_PROGRESS

**Symptom:** Running `sam deploy` hangs indefinitely or fails. The CloudFormation console shows the stack in `REVIEW_IN_PROGRESS` status. Subsequent deploy attempts also fail because the stack is in an unrecoverable state.

**Root Cause:** A previous deployment (often the first one, or one that was interrupted) left the CloudFormation stack in a state that cannot proceed. `REVIEW_IN_PROGRESS` means a changeset was created but never executed, and SAM cannot automatically recover from this.

**Fix:** You have two options:

**Option A: Delete and redeploy**
1. Go to CloudFormation in the AWS Console
2. Select the stuck stack
3. Click "Delete" (this will not affect resources that were never created)
4. Wait for deletion to complete
5. Run `sam deploy` again

**Option B: Direct Lambda updates (for existing functions)**

If your Lambda functions already exist and you only need to update code, bypass SAM entirely:

```bash
# Create deployment package
Compress-Archive -Path 'articles','shared','node_modules' -DestinationPath deploy.zip

# Update function code directly
aws lambda update-function-code \
  --function-name your-function-name \
  --zip-file fileb://deploy.zip
```

This approach is faster and avoids CloudFormation entirely. It is suitable for code updates but cannot modify infrastructure (IAM roles, API Gateway routes, VPC configuration, etc.). For infrastructure changes, fix the CloudFormation stack first.

---

## General Debugging Tips

### Check CloudWatch Logs
Every Lambda invocation writes logs to CloudWatch. Find your function's log group at `/aws/lambda/FUNCTION_NAME` and check the most recent log stream.

```bash
# Tail logs for a specific function (use MSYS_NO_PATHCONV=1 on Git Bash for Windows)
MSYS_NO_PATHCONV=1 aws logs tail /aws/lambda/FUNCTION_NAME --follow
```

### Test Lambda Functions Directly
Use the AWS CLI to invoke a function with a test payload, bypassing API Gateway:

```bash
aws lambda invoke \
  --function-name FUNCTION_NAME \
  --payload '{"queryStringParameters":{"id":"1"}}' \
  response.json
```

### Verify Secrets Manager Access
If a function fails to retrieve secrets, check both IAM permissions and network access:

```bash
# Test from your local machine
aws secretsmanager get-secret-value --secret-id SECRET_NAME

# Check Lambda execution role has secretsmanager:GetSecretValue permission
aws iam get-role-policy --role-name ROLE_NAME --policy-name POLICY_NAME
```

### Inspect API Gateway Configuration
```bash
# List all resources and methods
aws apigateway get-resources --rest-api-id API_ID

# Test an endpoint
curl -v https://API_ID.execute-api.us-east-1.amazonaws.com/STAGE/endpoint
```
