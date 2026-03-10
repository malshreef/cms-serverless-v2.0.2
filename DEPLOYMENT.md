# S7abt CMS - Complete Deployment Guide

This guide walks you through deploying S7abt CMS from scratch in any AWS region. It documents every step, parameter, and known issue based on real production deployments.

**Estimated time:** 2-3 hours for a complete deployment.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **AWS Account** | With admin-level IAM permissions |
| **AWS CLI v2** | `aws --version` - configured with `aws configure` |
| **AWS SAM CLI** | `sam --version` - install via `pip install aws-sam-cli` |
| **Node.js 20.x** | `node --version` - Lambda runtime must match |
| **npm** | Comes with Node.js |
| **MySQL client** | For running database schema scripts |

### Choose Your Region

This CMS can be deployed to any AWS region that supports the required services (Lambda, API Gateway, RDS, Cognito, S3, Secrets Manager). Tested regions include:

- `us-east-1` (N. Virginia)
- `me-south-1` (Bahrain)
- `me-central-1` (UAE)
- `eu-west-1` (Ireland)

Set your region for the rest of this guide:
```bash
export AWS_REGION=<your-region>
export AWS_PROFILE=<your-profile>   # optional, if using named profiles
```

---

## Step 1: Create Secrets in AWS Secrets Manager

All credentials are stored in Secrets Manager. Lambda functions retrieve them at runtime -- no secrets are hardcoded.

See **[SECRETS-SETUP.md](SECRETS-SETUP.md)** for the complete guide with exact JSON formats.

**Minimum required secret:**
```bash
aws secretsmanager create-secret \
  --name s7abt/database/credentials \
  --secret-string '{"host":"<rds-endpoint>","port":3306,"username":"admin","password":"<password>","dbname":"s7abt"}' \
  --region $AWS_REGION
```

**Optional secrets (for social media features):**
- `s7abt/openai/credentials` -- OpenAI API key for AI tweet generation
- `s7abt/twitter/credentials` -- Twitter/X API keys for automated publishing

> **IMPORTANT:** The `dbname` field is required. Without it, Lambda functions will fail with "No database selected". See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#3-no-database-selected-error).

---

## Step 2: Set Up VPC and Networking

Lambda functions must be in the same VPC as the RDS instance to access the database.

### 2.1 Create or Select a VPC

Use an existing VPC or create a new one:
```bash
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region $AWS_REGION
```

### 2.2 Create Subnets (at least 2 in different AZs)

```bash
aws ec2 create-subnet --vpc-id vpc-XXXX --cidr-block 10.0.1.0/24 --availability-zone ${AWS_REGION}a
aws ec2 create-subnet --vpc-id vpc-XXXX --cidr-block 10.0.2.0/24 --availability-zone ${AWS_REGION}b
```

### 2.3 Create Security Group

```bash
aws ec2 create-security-group \
  --group-name s7abt-lambda-rds \
  --description "S7abt Lambda and RDS access" \
  --vpc-id vpc-XXXX \
  --region $AWS_REGION
```

Add a self-referencing rule so Lambda (in this SG) can reach RDS (in this SG) on port 3306:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXX \
  --protocol tcp \
  --port 3306 \
  --source-group sg-XXXX
```

### 2.4 NAT Gateway or VPC Endpoints

Lambda functions inside a VPC cannot reach the internet or AWS services directly. You need either:

**Option A: NAT Gateway** (simpler, costs ~$0.045/hr)
- Create a NAT Gateway in a public subnet
- Update private subnet route tables to route `0.0.0.0/0` through the NAT Gateway

**Option B: VPC Endpoints** (no per-hour cost, but more setup)
- Create interface endpoints for: `secretsmanager`, `s3` (gateway endpoint)

> Without NAT or VPC endpoints, Lambda functions will time out trying to reach Secrets Manager. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#6-lambda-cannot-reach-database-vpcsecurity-group).

---

## Step 3: Create RDS MySQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier s7abt-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0 \
  --master-username admin \
  --master-user-password "<your-strong-password>" \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-XXXX \
  --db-subnet-group-name <your-db-subnet-group> \
  --no-publicly-accessible \
  --region $AWS_REGION
```

After the instance is ready, note the endpoint:
```bash
aws rds describe-db-instances \
  --db-instance-identifier s7abt-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

Update the database credentials secret with this endpoint.

---

## Step 4: Initialize the Database

### 4.1 Connect to RDS

Use a bastion host, VPN, or EC2 instance in the same VPC:
```bash
mysql -h <rds-endpoint> -u admin -p
```

### 4.2 Run Schema Initialization

```sql
CREATE DATABASE IF NOT EXISTS s7abt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run the full schema:
```bash
mysql -h <rds-endpoint> -u admin -p s7abt < s7abt-api-backend/database/init-schema.sql
```

This creates all tables: `s7b_articles`, `s7b_news`, `s7b_sections`, `s7b_tags`, `s7b_tags_item`, `s7b_user`, `s7b_article_shares`, `s7b_comment`, `s7b_tweets`.

### 4.3 Run Migrations (if needed)

```bash
mysql -h <rds-endpoint> -u admin -p s7abt < s7abt-api-backend/infrastructure/migrations/001_phase3_schema_updates.sql
mysql -h <rds-endpoint> -u admin -p s7abt < s7abt-api-backend/infrastructure/migrations/002_add_article_shares.sql
mysql -h <rds-endpoint> -u admin -p s7abt < s7abt-api-backend/infrastructure/migrations/003_add_user_cognito_columns.sql
```

---

## Step 5: Deploy Admin API (SAM)

This creates the Cognito User Pool, S3 media bucket, API Gateway, and all admin Lambda functions.

```bash
cd s7abt-admin/infrastructure

# Build the SAM application
sam build -t template-phase3.yaml

# Deploy (first time - guided)
sam deploy --guided
```

**SAM will prompt for these parameters:**

| Parameter | Description | Example |
|---|---|---|
| `Stack Name` | CloudFormation stack name | `s7abt-admin` |
| `AWS Region` | Target region | `me-south-1` |
| `Environment` | `dev`, `staging`, or `prod` | `prod` |
| `DatabaseSecretArn` | ARN of your database secret | `arn:aws:secretsmanager:me-south-1:123456:secret:s7abt/database/credentials-AbCdE` |
| `VpcSubnetIds` | Comma-separated subnet IDs | `subnet-aaa,subnet-bbb` |
| `VpcSecurityGroupIds` | Comma-separated SG IDs | `sg-xxxx` |

**Save outputs -- you will need them later:**
- `ApiEndpoint` -- Admin API URL
- `UserPoolId` -- Cognito User Pool ID
- `UserPoolClientId` -- Cognito Client ID
- `MediaBucketName` -- S3 bucket for media
- `MediaBucketUrl` -- S3 URL for media access

> If SAM deploy gets stuck, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md#12-sam-deploy-stuck-in-review_in_progress).

---

## Step 6: Create Admin Users in Cognito

**CRITICAL:** Users must have the `custom:role` attribute. Without it, the admin panel will reject login attempts.

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id <UserPoolId> \
  --username admin@yourdomain.com \
  --temporary-password "TempPassword123!" \
  --region $AWS_REGION

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id <UserPoolId> \
  --username admin@yourdomain.com \
  --password "YourSecurePassword123!" \
  --permanent \
  --region $AWS_REGION

# Set the role (REQUIRED)
aws cognito-idp admin-update-user-attributes \
  --user-pool-id <UserPoolId> \
  --username admin@yourdomain.com \
  --user-attributes Name=custom:role,Value=admin \
  --region $AWS_REGION
```

**Available roles:**

| Role | `custom:role` Value | Access Level |
|------|---------------------|-------------|
| Admin | `admin` | Full system access, user management |
| Content Manager | `content_manager` | Full content CRUD, publish permissions |
| Content Specialist | `content_specialist` | Own content only |
| Viewer | `viewer` | Read-only access |

> If you get "attribute custom:role does not exist", see [TROUBLESHOOTING.md](TROUBLESHOOTING.md#4-cognito-customrole-attribute-not-found).

---

## Step 7: Deploy Public API Lambda Functions

The public API consists of individual Lambda functions for articles, news, sections, tags, and users.

### 7.1 Install Dependencies

```bash
cd s7abt-api-backend
npm install
```

### 7.2 Create Deployment Package

```powershell
# Windows (PowerShell)
Compress-Archive -Path 'articles','news','sections','tags','users','shared','node_modules' -DestinationPath public-api.zip

# Linux/macOS
zip -r public-api.zip articles/ news/ sections/ tags/ users/ shared/ node_modules/
```

> **IMPORTANT:** Include folder names, not `folder/*`. The `/*` pattern flattens the structure and breaks `require('../shared/db')` imports. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#8-lambda-module-not-found-cannot-find-module-shareddb).

### 7.3 Create Lambda Functions

For each endpoint, create a Lambda function. Example for `ListArticles`:

```bash
aws lambda create-function \
  --function-name s7abt-list-articles \
  --runtime nodejs20.x \
  --handler articles/list.handler \
  --role <LambdaExecutionRoleArn> \
  --zip-file fileb://public-api.zip \
  --timeout 30 \
  --memory-size 256 \
  --vpc-config SubnetIds=subnet-aaa,subnet-bbb,SecurityGroupIds=sg-xxxx \
  --environment "Variables={DB_SECRET_ARN=<secret-arn>,AWS_NODEJS_CONNECTION_REUSE_ENABLED=1}" \
  --region $AWS_REGION
```

**Lambda functions to create:**

| Function Name | Handler | Method | API Path |
|---|---|---|---|
| `s7abt-list-articles` | `articles/list.handler` | GET | `/articles` |
| `s7abt-get-article` | `articles/get.handler` | GET | `/articles/{id}` |
| `s7abt-share-article` | `articles/share.handler` | POST | `/articles/{id}/share` |
| `s7abt-get-articles-by-tagid` | `tags/getArticlesByTagid.handler` | GET | `/GetArticlesByTagid` |
| `s7abt-get-articles-by-tags` | `tags/getArticlesByTags.handler` | GET | `/GetArticlesByTags` |
| `s7abt-list-news` | `news/list.handler` | GET | `/news` |
| `s7abt-get-news` | `news/get.handler` | GET | `/news/{id}` |
| `s7abt-list-sections` | `sections/list.handler` | GET | `/sections` |
| `s7abt-get-section` | `sections/get.handler` | GET | `/sections/{id}` |
| `s7abt-list-tags` | `tags/list.handler` | GET | `/tags` |
| `s7abt-get-tag` | `tags/get.handler` | GET | `/tags/{id}` |
| `s7abt-get-user` | `users/get.handler` | GET | `/users/{id}` |
| `s7abt-get-user-articles` | `users/getArticles.handler` | GET | `/users/{id}/articles` |

### 7.4 Create API Gateway

Create a REST API in API Gateway and connect each Lambda function to the corresponding method and path. Enable CORS on all resources.

### 7.5 Update Code (subsequent deploys)

```bash
aws lambda update-function-code \
  --function-name s7abt-list-articles \
  --zip-file fileb://public-api.zip \
  --region $AWS_REGION
```

---

## Step 8: Deploy Admin Panel (React + Vite)

### 8.1 Configure Environment

Copy `.env.example` to `.env`:
```bash
cd s7abt-admin/frontend
cp .env.example .env
```

Fill in values from Step 5 outputs:
```env
VITE_COGNITO_USER_POOL_ID=<UserPoolId from Step 5>
VITE_COGNITO_CLIENT_ID=<UserPoolClientId from Step 5>
VITE_AWS_REGION=<your-region>
VITE_API_ENDPOINT=<ApiEndpoint from Step 5>
VITE_API_BASE_URL=<ApiEndpoint from Step 5>
VITE_S3_BASE_URL=<MediaBucketUrl from Step 5>
```

### 8.2 Build and Deploy

```bash
npm install
npm run build
```

Deploy the `dist/` folder to S3 + CloudFront:
```bash
# Create S3 bucket for admin UI
aws s3 mb s3://s7abt-admin-frontend-<your-account-id> --region $AWS_REGION

# Upload build
aws s3 sync dist/ s3://s7abt-admin-frontend-<your-account-id> --delete

# Enable static website hosting
aws s3 website s3://s7abt-admin-frontend-<your-account-id> \
  --index-document index.html \
  --error-document index.html
```

Create a CloudFront distribution pointing to this S3 bucket. Set error page to redirect to `/index.html` (SPA routing).

---

## Step 9: Deploy Public Website (Next.js)

### 9.1 Configure Environment

Copy `.env.example` to `.env.local`:
```bash
cd s7abt-website-v2/s7abt-frontend-v2
cp .env.example .env.local
```

Fill in values:
```env
NEXT_PUBLIC_API_URL=https://<public-api-id>.execute-api.<region>.amazonaws.com/<stage>
NEXT_PUBLIC_SITE_URL=https://<your-domain>
NEXT_PUBLIC_TAGS_API_URL=https://<public-api-id>.execute-api.<region>.amazonaws.com/<stage>/GetArticlesByTagid
NEXT_PUBLIC_S3_BASE_URL=https://<MediaBucketName>.s3.<region>.amazonaws.com
```

### 9.2 Build and Test

```bash
npm install
npm run build
npm run start   # test locally on port 3000
```

### 9.3 Deploy to AWS Amplify

1. Push code to a Git repository (GitHub, CodeCommit, etc.)
2. Create an Amplify app connected to the repository
3. Set environment variables in Amplify Console (Build settings > Environment variables)

> **WARNING:** `aws amplify update-app --environment-variables` **REPLACES ALL** env vars, not just the one you specify. Always pass ALL variables when using the CLI. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#11-aws-amplify-environment-variables-wiped-after-update).

> **NOTE:** `NEXT_PUBLIC_*` variables are baked into the JavaScript bundle at build time. After changing any `NEXT_PUBLIC_*` variable, you must trigger a new Amplify build.

### Alternative: Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set environment variables in the Vercel dashboard.

---

## Step 10: Deploy Social Media Integration (Optional)

This creates the tweet generator and publisher Lambda functions with DynamoDB queue.

```bash
cd s7abt-api-backend/s7abt-social-media

sam build
sam deploy --guided
```

**Parameters:**

| Parameter | Description | Example |
|---|---|---|
| `Environment` | `dev` or `prod` | `prod` |
| `TwitterSecretName` | Secrets Manager name | `s7abt/twitter/credentials` |
| `OpenAISecretName` | Secrets Manager name | `s7abt/openai/credentials` |
| `S7abtApiUrl` | Public API URL (from Step 7) | `https://xxx.execute-api.<region>.amazonaws.com/production` |
| `CognitoUserPoolId` | From Step 5 output | `<region>_XXXXXXXXX` |

---

## Post-Deployment Verification

### Test Public API
```bash
curl https://<public-api-id>.execute-api.$AWS_REGION.amazonaws.com/<stage>/articles
curl https://<public-api-id>.execute-api.$AWS_REGION.amazonaws.com/<stage>/sections
```

### Test Admin API (requires Cognito token)
```bash
# Get a token first
TOKEN=$(aws cognito-idp initiate-auth \
  --client-id <UserPoolClientId> \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@yourdomain.com,PASSWORD=YourPassword \
  --query 'AuthenticationResult.IdToken' --output text)

curl -H "Authorization: Bearer $TOKEN" \
  https://<admin-api-id>.execute-api.$AWS_REGION.amazonaws.com/<stage>/articles
```

### Verify S3 Media Access
```bash
curl -I https://<MediaBucketName>.s3.$AWS_REGION.amazonaws.com/
```

### Check CloudWatch Logs
```bash
# Tail a Lambda function's logs
aws logs tail /aws/lambda/s7abt-list-articles --follow --region $AWS_REGION
```

---

## Environment URLs Summary

| Component | URL Pattern |
|---|---|
| Public Website | `https://<your-domain>` |
| Admin Panel | `https://<admin-domain>` or S3 website URL |
| Public API | `https://<api-id>.execute-api.<region>.amazonaws.com/<stage>` |
| Admin API | `https://<admin-api-id>.execute-api.<region>.amazonaws.com/<stage>` |
| S3 Media | `https://<bucket>.s3.<region>.amazonaws.com` |

---

## Related Documentation

- **[SECRETS-SETUP.md](SECRETS-SETUP.md)** -- Creating and managing all AWS Secrets Manager secrets
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** -- Solutions to every known deployment issue
- **[ARCHITECTURE.md](ARCHITECTURE.md)** -- System architecture and data flow diagrams
