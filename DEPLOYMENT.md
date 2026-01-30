# S7abt CMS - Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS SAM CLI installed (`pip install aws-sam-cli`)
- Node.js 20.x or later
- npm or yarn

---

## 1. Backend APIs (AWS Lambda)

### 1.1 Public API Deployment

```bash
cd s7abt-api-backend

# Install dependencies
npm install

# Build SAM application
sam build

# Deploy to AWS (first time - guided)
sam deploy --guided

# Deploy to AWS (subsequent deployments)
sam deploy
```

**SAM Configuration (samconfig.toml):**
```toml
[default.deploy.parameters]
stack_name = "s7abt-api-stack"
region = "me-central-1"
confirm_changeset = true
capabilities = "CAPABILITY_IAM"
```

### 1.2 Admin API Deployment

```bash
cd s7abt-admin/infrastructure

# Build SAM application
sam build -t template-phase3.yaml

# Deploy to AWS
sam deploy --template-file .aws-sam/build/template.yaml --guided
```

### 1.3 Social Media API Deployment

```bash
cd s7abt-api-backend/s7abt-social-media

# Build and deploy
sam build
sam deploy
```

---

## 2. Public Frontend (Next.js)

### 2.1 Environment Configuration

Create `.env.production` in `s7abt-website-v2/s7abt-frontend-v2/`:

```env
NEXT_PUBLIC_API_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/Stage
NEXT_PUBLIC_SITE_URL=https://<your-domain>
MAILERLITE_API_KEY=<your-mailerlite-api-key>

# For contact form email (AWS SES)
AWS_REGION=<your-aws-region>
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
```

### 2.2 Build for Production

```bash
cd s7abt-website-v2/s7abt-frontend-v2

# Install dependencies
npm install

# Build production bundle
npm run build

# Test production build locally
npm run start
```

### 2.3 Deployment Options

#### Option A: Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Or deploy via CLI
npm i -g vercel
vercel --prod
```

#### Option B: AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

#### Option C: Docker + EC2/ECS

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t s7abt-frontend .
docker run -p 3000:3000 s7abt-frontend
```

---

## 3. Admin Panel (React + Vite)

### 3.1 Environment Configuration

Create `.env.production` in `s7abt-admin/frontend/`:

```env
VITE_COGNITO_USER_POOL_ID=<your-cognito-user-pool-id>
VITE_COGNITO_CLIENT_ID=<your-cognito-client-id>
VITE_AWS_REGION=<your-aws-region>
VITE_API_ENDPOINT=https://<your-api-id>.execute-api.<region>.amazonaws.com/dev
VITE_API_BASE_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/dev
VITE_S3_BASE_URL=https://<your-s3-bucket>.s3.<region>.amazonaws.com
```

### 3.2 Build for Production

```bash
cd s7abt-admin/frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Preview locally
npm run preview
```

### 3.3 Deploy to S3 + CloudFront

```bash
# Create S3 bucket for admin panel
aws s3 mb s3://s7abt-admin-frontend --region me-central-1

# Sync build to S3
aws s3 sync dist/ s3://s7abt-admin-frontend --delete

# Configure bucket for static website hosting
aws s3 website s3://s7abt-admin-frontend --index-document index.html --error-document index.html
```

**CloudFront Distribution:**
1. Create CloudFront distribution pointing to S3 bucket
2. Configure custom error pages (404 -> /index.html for SPA routing)
3. Add SSL certificate for custom domain
4. Set cache behaviors for static assets

---

## 4. Database (RDS MySQL)

### 4.1 Connection Details (Secrets Manager)

Secret: `s7abt/database/credentials-dubai`

```json
{
  "host": "<rds-endpoint>",
  "port": 3306,
  "username": "<db-user>",
  "password": "<db-password>",
  "database": "s7abt_dubai"
}
```

### 4.2 Run Migrations

```bash
# Connect to RDS via bastion or VPN
mysql -h <rds-endpoint> -u <username> -p < database/migrations/001_phase3_schema_updates.sql
```

---

## 5. Post-Deployment Checklist

### API Endpoints Verification

```bash
# Test Public API
curl https://<your-api-id>.execute-api.<region>.amazonaws.com/Stage/articles

# Test Admin API (requires auth token)
curl -H "Authorization: Bearer <token>" \
  https://<your-admin-api-id>.execute-api.<region>.amazonaws.com/dev/articles
```

### Verify S3 CORS Configuration

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

### CloudWatch Logs

Monitor these log groups for errors:
- `/aws/lambda/s7abt-list-articles-dev`
- `/aws/lambda/s7abt-get-article-dev`
- `/aws/lambda/s7abt-admin-*`

---

## 6. Environment URLs

| Environment | Component | URL |
|-------------|-----------|-----|
| Production | Public Website | https://your-domain.com |
| Production | Admin Panel | https://admin.your-domain.com |
| Production | Public API | https://<api-id>.execute-api.<region>.amazonaws.com/Stage |
| Production | Admin API | https://<admin-api-id>.execute-api.<region>.amazonaws.com/dev |
| Production | S3 Media | https://<bucket-name>.s3.<region>.amazonaws.com |

---

## 7. Rollback Procedures

### Lambda Functions

```bash
# List function versions
aws lambda list-versions-by-function --function-name s7abt-list-articles-dev

# Point alias to previous version
aws lambda update-alias \
  --function-name s7abt-list-articles-dev \
  --name prod \
  --function-version <previous-version>
```

### Frontend Rollback

```bash
# S3 versioning - restore previous version
aws s3api list-object-versions --bucket s7abt-admin-frontend

# Or redeploy from previous commit
git checkout <previous-commit>
npm run build
aws s3 sync dist/ s3://s7abt-admin-frontend --delete
```

---

## 8. Monitoring & Alerts

### CloudWatch Alarms (Recommended)

1. **Lambda Error Rate** > 1%
2. **Lambda Duration** > 10s (approaching timeout)
3. **API Gateway 5xx** > 0
4. **RDS CPU** > 80%
5. **RDS Connections** > 80% of max

### Set up alarm example:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "S7abt-Lambda-Errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=s7abt-list-articles-dev \
  --evaluation-periods 1 \
  --alarm-actions <sns-topic-arn>
```
