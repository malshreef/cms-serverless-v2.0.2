# Migrating from OpenSearch to MariaDB Full-Text Search

This guide walks you through replacing AWS OpenSearch with MariaDB Full-Text Search to reduce costs.

## Cost Comparison

| Service | Monthly Cost |
|---------|--------------|
| AWS OpenSearch (t3.small.search) | ~$30-50/month |
| MariaDB Full-Text (existing RDS) | **$0 additional** |

## Prerequisites

- AWS CLI configured with appropriate permissions
- Access to RDS MariaDB database
- Node.js 18+ for packaging Lambda

---

## Step 1: Create the FULLTEXT Index on RDS

Connect to your RDS MariaDB and run the migration:

```bash
# Connect via MySQL client
mysql -h <your-rds-endpoint> -u <username> -p <database>

# Or use AWS RDS Query Editor in console
```

Run the SQL from `migration-fulltext-index.sql`:

```sql
ALTER TABLE articles
ADD FULLTEXT INDEX ft_article_search (
    s7b_article_title,
    s7b_article_brief,
    s7b_article_body
);
```

**Verify it worked:**
```sql
SHOW INDEX FROM articles WHERE Index_type = 'FULLTEXT';
```

---

## Step 2: Deploy the New Lambda Function

### 2.1 Create deployment package

```bash
cd s7abt-api-backend/Search

# Create package directory
mkdir -p mariadb-search-package
cp mariadb-search-lambda.js mariadb-search-package/index.js

# Install dependencies
cd mariadb-search-package
npm init -y
npm install mysql2 @aws-sdk/client-secrets-manager

# Create ZIP
zip -r ../mariadb-search-lambda.zip .
cd ..
```

### 2.2 Create new Lambda function

```bash
# Create new Lambda (or update existing S7abtSearchApi)
aws lambda create-function \
    --function-name S7abtMariaDBSearch \
    --runtime nodejs18.x \
    --handler index.handler \
    --role arn:aws:iam::<account-id>:role/<existing-lambda-role> \
    --zip-file fileb://mariadb-search-lambda.zip \
    --timeout 30 \
    --memory-size 256 \
    --vpc-config SubnetIds=<subnet-ids>,SecurityGroupIds=<sg-ids> \
    --environment Variables="{SECRET_NAME=s7abt/rds/credentials}" \
    --region me-central-1
```

**Or update the existing function:**

```bash
aws lambda update-function-code \
    --function-name S7abtSearchApi \
    --zip-file fileb://mariadb-search-lambda.zip \
    --region me-central-1
```

### 2.3 Add API Gateway trigger

If creating new function, add HTTP API trigger:

```bash
# Get existing API Gateway ID (use existing one)
aws apigatewayv2 get-apis --region me-central-1

# Add integration to existing API or create new route
aws apigatewayv2 create-integration \
    --api-id <api-id> \
    --integration-type AWS_PROXY \
    --integration-uri arn:aws:lambda:me-central-1:<account>:function:S7abtMariaDBSearch \
    --payload-format-version 2.0 \
    --region me-central-1
```

---

## Step 3: Test the New Search

```bash
# Test search API
curl "https://<api-gateway-url>/search?q=سحابة&limit=10"

# Expected response:
{
  "success": true,
  "data": {
    "articles": [...],
    "total": 15,
    "pagination": {
      "offset": 0,
      "limit": 10,
      "total": 15,
      "hasMore": true
    }
  }
}
```

---

## Step 4: Update Frontend Environment

Update `.env.local` in the frontend:

```bash
# If using new endpoint URL
NEXT_PUBLIC_SEARCH_API_URL=https://<new-api-gateway-url>

# Or keep the same if you updated the existing Lambda
```

---

## Step 5: Disable/Delete OpenSearch (After Testing)

Once confirmed working, you can delete OpenSearch to stop charges:

```bash
# List OpenSearch domains
aws opensearch list-domain-names --region me-central-1

# Delete the domain (CAREFUL - this is irreversible!)
aws opensearch delete-domain \
    --domain-name vpc-s7abt-search-2kixyu6y3ohoeqmdqibzjl473u \
    --region me-central-1
```

**Also delete the indexer Lambda (no longer needed):**

```bash
aws lambda delete-function \
    --function-name S7abtOpenSearchIndexer \
    --region me-central-1
```

---

## Troubleshooting

### Search returns no results

1. Verify FULLTEXT index exists:
   ```sql
   SHOW INDEX FROM articles WHERE Index_type = 'FULLTEXT';
   ```

2. Check if articles exist:
   ```sql
   SELECT COUNT(*) FROM articles;
   ```

3. Test FULLTEXT directly:
   ```sql
   SELECT s7b_article_title
   FROM articles
   WHERE MATCH(s7b_article_title, s7b_article_brief, s7b_article_body)
       AGAINST('test' IN NATURAL LANGUAGE MODE);
   ```

### Lambda timeout

- Increase timeout to 30 seconds
- Ensure Lambda is in same VPC as RDS
- Check security group allows connection to RDS port 3306

### Arabic search issues

MariaDB FULLTEXT works with Arabic by default in NATURAL LANGUAGE MODE. If issues persist:

```sql
-- Check table character set
SHOW CREATE TABLE articles;

-- Should show: CHARSET=utf8mb4
```

---

## Architecture After Migration

```
Frontend (Next.js)
    ↓ GET /search?q=...
API Gateway
    ↓
Lambda (S7abtMariaDBSearch)  ← NEW (replaces OpenSearch)
    ↓ SQL Query
RDS MariaDB (FULLTEXT)
    ↓
Results returned
```

**Removed components:**
- ❌ OpenSearch Domain (~$30-50/month saved)
- ❌ OpenSearch Indexer Lambda
- ❌ Indexing sync process

**Benefits:**
- ✅ Zero additional cost (uses existing RDS)
- ✅ Simpler architecture (no sync needed)
- ✅ Real-time search (queries live data)
- ✅ Native Arabic support
