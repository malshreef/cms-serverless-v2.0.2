# S7abt CMS - System Architecture

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           S7ABT CMS ARCHITECTURE                                          │
│                                              AWS me-central-1                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              CLIENTS                                                         │
├──────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┤
│                                          │                                                                   │
│   ┌──────────────────────────────┐       │       ┌──────────────────────────────┐                           │
│   │     PUBLIC WEBSITE           │       │       │      ADMIN PANEL             │                           │
│   │   s7abt-frontend-v2          │       │       │     s7abt-admin              │                           │
│   │                              │       │       │                              │                           │
│   │   ┌────────────────────┐     │       │       │   ┌────────────────────┐     │                           │
│   │   │   Next.js 14.2     │     │       │       │   │   React 19 + Vite  │     │                           │
│   │   │   TypeScript       │     │       │       │   │   TypeScript       │     │                           │
│   │   │   Tailwind CSS     │     │       │       │   │   Tailwind CSS     │     │                           │
│   │   │   next-intl (i18n) │     │       │       │   │   AWS Amplify UI   │     │                           │
│   │   │   react-markdown   │     │       │       │   │   TinyMCE Editor   │     │                           │
│   │   └────────────────────┘     │       │       │   │   Recharts         │     │                           │
│   │                              │       │       │   └────────────────────┘     │                           │
│   │   Routes:                    │       │       │                              │                           │
│   │   /[locale]/articles/[id]    │       │       │   Routes:                    │                           │
│   │   /[locale]/news/[id]        │       │       │   /articles                  │                           │
│   │   /[locale]/sections/[id]    │       │       │   /news                      │                           │
│   │   /[locale]/tags/[id]        │       │       │   /sections                  │                           │
│   │                              │       │       │   /tags                      │                           │
│   └──────────────────────────────┘       │       │   /users                     │                           │
│                │                         │       │   /analytics                 │                           │
│                │ HTTP (no auth)          │       └──────────────────────────────┘                           │
│                │                         │                    │                                              │
│                ▼                         │                    │ Cognito JWT Auth                             │
└──────────────────────────────────────────┴────────────────────┼──────────────────────────────────────────────┘
                                                                │
┌───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────┐
│                                         AWS SERVICES          │                                              │
├───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│                                                               │                                              │
│   ┌─────────────────────────────────────────────────────────┐ │ ┌─────────────────────────────────────────┐  │
│   │                   AWS COGNITO                           │◄┼─┤         COGNITO USER POOL               │  │
│   │               (Authentication)                          │ │ │     <your-user-pool-id>              │  │
│   │                                                         │ │ │                                         │  │
│   │   - User Pool: <your-user-pool-id>                  │ │ │   ┌─────────────────────────────────┐   │  │
│   │   - Client ID: <your-client-id>              │ │ │   │   ROLES (custom:role)           │   │  │
│   │   - Custom attributes: custom:role                      │ │ │   │                                 │   │  │
│   │   - JWT Token validation                                │ │ │   │   ADMIN                         │   │  │
│   │                                                         │ │ │   │   ├── Full system access        │   │  │
│   └─────────────────────────────────────────────────────────┘ │ │   │   ├── User management           │   │  │
│                           │                                   │ │   │   └── Settings & Analytics      │   │  │
│                           │ Authorizer                        │ │   │                                 │   │  │
│                           ▼                                   │ │   │   CONTENT_MANAGER               │   │  │
│   ┌───────────────────────────────────────────────────────────┼─┤   │   ├── Full content CRUD         │   │  │
│   │                                                           │ │   │   └── Publish permissions       │   │  │
│   │                    API GATEWAY                            │ │   │                                 │   │  │
│   │                                                           │ │   │   CONTENT_SPECIALIST            │   │  │
│   │   ┌─────────────────────────┐ ┌─────────────────────────┐ │ │   │   ├── Own content only          │   │  │
│   │   │    PUBLIC API           │ │     ADMIN API           │ │ │   │   └── No publish access        │   │  │
│   │   │                         │ │   (Cognito Protected)   │ │ │   │                                 │   │  │
│   │   │ <your-public-api-id>.execute-api  │ │                         │ │ │   │   VIEWER                        │   │  │
│   │   │ .me-central-1           │ │ <your-admin-api-id>.execute-api  │ │ │   │   └── Read-only access          │   │  │
│   │   │ .amazonaws.com/Stage    │ │ .me-central-1           │ │ │   │                                 │   │  │
│   │   │                         │ │ .amazonaws.com/dev      │ │ │   └─────────────────────────────────┘   │  │
│   │   │ Endpoints:              │ │                         │ │ │                                         │  │
│   │   │ GET /articles           │ │ Endpoints:              │ │ └─────────────────────────────────────────┘  │
│   │   │ GET /articles/{id}      │ │ GET/POST /articles      │ │                                              │
│   │   │ POST /articles/{id}/    │ │ PUT/DELETE /articles/{id}│ │                                              │
│   │   │      share              │ │ GET/POST /news          │ │                                              │
│   │   │ GET /news               │ │ PUT/DELETE /news/{id}   │ │                                              │
│   │   │ GET /news/{id}          │ │ GET/POST /sections      │ │                                              │
│   │   │ GET /sections           │ │ PUT/DELETE /sections/{id}│ │                                              │
│   │   │ GET /sections/{id}      │ │ GET/POST /tags          │ │                                              │
│   │   │ GET /tags               │ │ PUT/DELETE /tags/{id}   │ │                                              │
│   │   │ GET /tags/{id}          │ │ GET /auth/me            │ │                                              │
│   │   │ GET /users/{id}         │ │ GET /dashboard/stats    │ │                                              │
│   │   │ GET /users/{id}/articles│ │ POST /image-upload-url  │ │                                              │
│   │   │                         │ │ GET /analytics/insights │ │                                              │
│   │   └─────────────────────────┘ └─────────────────────────┘ │                                              │
│   │               │                           │               │                                              │
│   └───────────────┼───────────────────────────┼───────────────┘                                              │
│                   │                           │                                                              │
│                   ▼                           ▼                                                              │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                      AWS LAMBDA (Node.js 20.x)                                        │  │
│   │                                         VPC Connected                                                  │  │
│   │                                                                                                       │  │
│   │   ┌─────────────────────────────────┐   ┌─────────────────────────────────┐   ┌─────────────────────┐ │  │
│   │   │      PUBLIC LAMBDAS             │   │       ADMIN LAMBDAS             │   │  SOCIAL MEDIA       │ │  │
│   │   │   s7abt-api-backend/            │   │    s7abt-admin/backend/         │   │     LAMBDAS         │ │  │
│   │   │                                 │   │                                 │   │                     │ │  │
│   │   │   ┌───────────────────────┐     │   │   ┌───────────────────────┐     │   │ tweet-generator     │ │  │
│   │   │   │ articles/             │     │   │   │ articles/             │     │   │   └── OpenAI GPT-4  │ │  │
│   │   │   │  ├── list.js          │     │   │   │  ├── create.js        │     │   │                     │ │  │
│   │   │   │  ├── get.js           │     │   │   │  ├── update.js        │     │   │ tweet-publisher     │ │  │
│   │   │   │  └── share.js         │     │   │   │  ├── delete.js        │     │   │   └── Twitter API   │ │  │
│   │   │   └───────────────────────┘     │   │   │  └── getImageUploadUrl│     │   │                     │ │  │
│   │   │                                 │   │   └───────────────────────┘     │   │ EventBridge         │ │  │
│   │   │   ┌───────────────────────┐     │   │                                 │   │ (12 PM UTC daily)   │ │  │
│   │   │   │ news/                 │     │   │   ┌───────────────────────┐     │   │                     │ │  │
│   │   │   │  ├── list.js          │     │   │   │ news/                 │     │   └─────────────────────┘ │  │
│   │   │   │  └── get.js           │     │   │   │  ├── create.js        │     │                           │  │
│   │   │   └───────────────────────┘     │   │   │  ├── update.js        │     │                           │  │
│   │   │                                 │   │   │  └── delete.js        │     │                           │  │
│   │   │   ┌───────────────────────┐     │   │   └───────────────────────┘     │                           │  │
│   │   │   │ sections/             │     │   │                                 │                           │  │
│   │   │   │  ├── list.js          │     │   │   ┌───────────────────────┐     │                           │  │
│   │   │   │  └── get.js           │     │   │   │ shared/               │     │                           │  │
│   │   │   └───────────────────────┘     │   │   │  ├── db.js (pooling)  │     │                           │  │
│   │   │                                 │   │   │  ├── permissions.js   │     │                           │  │
│   │   │   ┌───────────────────────┐     │   │   │  ├── authorize.js     │     │                           │  │
│   │   │   │ tags/                 │     │   │   │  ├── response.js      │     │                           │  │
│   │   │   │  ├── list.js          │     │   │   │  └── validation.js    │     │                           │  │
│   │   │   │  └── get.js           │     │   │   └───────────────────────┘     │                           │  │
│   │   │   └───────────────────────┘     │   │                                 │                           │  │
│   │   │                                 │   │   ┌───────────────────────┐     │                           │  │
│   │   │   ┌───────────────────────┐     │   │   │ auth/                 │     │                           │  │
│   │   │   │ users/                │     │   │   │  ├── getCurrentUser   │     │                           │  │
│   │   │   │  └── get.js           │     │   │   │  └── getDashboardStats│     │                           │  │
│   │   │   └───────────────────────┘     │   │   └───────────────────────┘     │                           │  │
│   │   │                                 │   │                                 │                           │  │
│   │   │   Memory: 512 MB               │   │   Memory: 512 MB               │                           │  │
│   │   │   Timeout: 30s                  │   │   Timeout: 30s                  │                           │  │
│   │   └─────────────────────────────────┘   └─────────────────────────────────┘                           │  │
│   │                   │                                   │                                               │  │
│   └───────────────────┼───────────────────────────────────┼───────────────────────────────────────────────┘  │
│                       │                                   │                                                  │
│                       │ VPC Security Group                │                                                  │
│                       │ Port 3306                         │                                                  │
│                       ▼                                   ▼                                                  │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                        DATA LAYER                                                      │  │
│   │                                                                                                       │  │
│   │   ┌─────────────────────────────────────────────────────┐   ┌───────────────────────────────────────┐ │  │
│   │   │              AWS RDS MySQL                          │   │         AWS S3                        │ │  │
│   │   │                                                     │   │                                       │ │  │
│   │   │   Database: s7abt_dubai                             │   │   Bucket: <your-s3-bucket>             │ │  │
│   │   │   Engine: MySQL 5.6+                                │   │                                       │ │  │
│   │   │   VPC: Private Subnet                               │   │   ┌───────────────────────────────┐   │ │  │
│   │   │                                                     │   │   │  /articles/                   │   │ │  │
│   │   │   ┌─────────────────────────────────────────────┐   │   │   │  /news/                       │   │ │  │
│   │   │   │                TABLES                       │   │   │   │  /users/                      │   │ │  │
│   │   │   │                                             │   │   │   │  /sections/                   │   │ │  │
│   │   │   │  s7b_article                                │   │   │   └───────────────────────────────┘   │ │  │
│   │   │   │   ├── s7b_article_id (PK)                   │   │   │                                       │ │  │
│   │   │   │   ├── s7b_article_title                     │   │   │   CORS: Enabled                       │ │  │
│   │   │   │   ├── s7b_article_brief                     │   │   │   Public Read Access                  │ │  │
│   │   │   │   ├── s7b_article_body (markdown)           │   │   │   Presigned URLs for Upload           │ │  │
│   │   │   │   ├── s7b_article_image                     │   │   │                                       │ │  │
│   │   │   │   ├── s7b_user_id (FK)                      │   │   │   URL:                                │ │  │
│   │   │   │   ├── s7b_section_id (FK)                   │   │   │   <your-s3-bucket>.s3.<region>    │ │  │
│   │   │   │   └── s7b_article_active                    │   │   │   .amazonaws.com                     │ │  │
│   │   │   │                                             │   │   │                                       │ │  │
│   │   │   │  s7b_news                                   │   │   └───────────────────────────────────────┘ │  │
│   │   │   │   ├── s7b_news_id (PK)                      │   │                                             │  │
│   │   │   │   ├── s7b_news_title                        │   │   ┌───────────────────────────────────────┐ │  │
│   │   │   │   ├── s7b_news_brief                        │   │   │       AWS DynamoDB                    │ │  │
│   │   │   │   ├── s7b_news_body                         │   │   │                                       │ │  │
│   │   │   │   └── s7b_user_id (FK)                      │   │   │   Table: s7abt-tweet-queue-dev        │ │  │
│   │   │   │                                             │   │   │                                       │ │  │
│   │   │   │  s7b_section                                │   │   │   ├── tweet_id (PK)                   │ │  │
│   │   │   │   ├── s7b_section_id (PK)                   │   │   │   ├── article_id                      │ │  │
│   │   │   │   ├── s7b_section_name                      │   │   │   ├── content                         │ │  │
│   │   │   │   └── s7b_section_order                     │   │   │   ├── status (pending/published)     │ │  │
│   │   │   │                                             │   │   │   └── scheduled_time                  │ │  │
│   │   │   │  s7b_tags                                   │   │   │                                       │ │  │
│   │   │   │   ├── s7b_tags_id (PK)                      │   │   │   GSI: status-scheduled_time-index    │ │  │
│   │   │   │   └── s7b_tags_name                         │   │   │                                       │ │  │
│   │   │   │                                             │   │   └───────────────────────────────────────┘ │  │
│   │   │   │  s7b_tags_item (M2M)                        │   │                                             │  │
│   │   │   │   ├── s7b_article_id (FK)                   │   │   ┌───────────────────────────────────────┐ │  │
│   │   │   │   └── s7b_tags_id (FK)                      │   │   │    AWS Secrets Manager                │ │  │
│   │   │   │                                             │   │   │                                       │ │  │
│   │   │   │  s7b_user                                   │   │   │  s7abt/database/credentials-dubai     │ │  │
│   │   │   │   ├── s7b_user_id (PK)                      │   │   │    └── host, port, user, password    │ │  │
│   │   │   │   ├── s7b_user_name                         │   │   │                                       │ │  │
│   │   │   │   ├── s7b_user_image                        │   │   │  s7abt/twitter/credentials            │ │  │
│   │   │   │   ├── s7b_user_brief                        │   │   │    └── API keys for Twitter v2       │ │  │
│   │   │   │   ├── s7b_user_twitter                      │   │   │                                       │ │  │
│   │   │   │   ├── s7b_user_facebook                     │   │   │  s7abt/openai/credentials             │ │  │
│   │   │   │   ├── s7b_user_linkedin                     │   │   │    └── GPT-4 API key                  │ │  │
│   │   │   │   └── s7b_user_role                         │   │   │                                       │ │  │
│   │   │   │                                             │   │   └───────────────────────────────────────┘ │  │
│   │   │   │  s7b_article_shares                         │   │                                             │  │
│   │   │   │   ├── s7b_article_id (FK)                   │   │                                             │  │
│   │   │   │   ├── s7b_share_platform                    │   │                                             │  │
│   │   │   │   └── s7b_share_count                       │   │                                             │  │
│   │   │   │                                             │   │                                             │  │
│   │   │   │  s7b_comment                                │   │                                             │  │
│   │   │   │   ├── s7b_comment_id (PK)                   │   │                                             │  │
│   │   │   │   ├── s7b_article_id (FK)                   │   │                                             │  │
│   │   │   │   └── s7b_comment_body                      │   │                                             │  │
│   │   │   │                                             │   │                                             │  │
│   │   │   └─────────────────────────────────────────────┘   │                                             │  │
│   │   │                                                     │                                             │  │
│   │   └─────────────────────────────────────────────────────┘                                             │  │
│   │                                                                                                       │  │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                       MONITORING & LOGGING                                            │  │
│   │                                                                                                       │  │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐ │  │
│   │   │                              AWS CloudWatch                                                      │ │  │
│   │   │                                                                                                 │ │  │
│   │   │   Log Groups:                                                                                   │ │  │
│   │   │   ├── /aws/lambda/s7abt-list-articles-dev                                                       │ │  │
│   │   │   ├── /aws/lambda/s7abt-get-article-dev                                                         │ │  │
│   │   │   ├── /aws/lambda/s7abt-admin-create-article                                                    │ │  │
│   │   │   ├── /aws/lambda/s7abt-tweet-generator-dev                                                     │ │  │
│   │   │   └── ... (all Lambda functions)                                                                │ │  │
│   │   │                                                                                                 │ │  │
│   │   │   Retention: 7-14 days                                                                          │ │  │
│   │   │                                                                                                 │ │  │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                                                       │  │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘


                                           DATA FLOW DIAGRAMS

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CONTENT CREATION FLOW (Admin)                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│   ┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐    │
│   │  Admin   │────▶│  Cognito │────▶│  API Gateway │────▶│  Lambda  │────▶│   RDS    │────▶│ Content  │    │
│   │  User    │     │   Auth   │     │  (Authorizer)│     │  (CRUD)  │     │  MySQL   │     │  Stored  │    │
│   └──────────┘     └──────────┘     └──────────────┘     └──────────┘     └──────────┘     └──────────┘    │
│        │                                                       │                                            │
│        │                                                       │                                            │
│        │           ┌───────────────────────────────────────────┘                                            │
│        │           │  For Images:                                                                           │
│        │           ▼                                                                                        │
│        │     ┌──────────┐     ┌──────────┐     ┌──────────┐                                                 │
│        └────▶│  Lambda  │────▶│ Presigned│────▶│    S3    │                                                 │
│              │(getUpload│     │   URL    │     │  Bucket  │                                                 │
│              │   URL)   │     │          │     │          │                                                 │
│              └──────────┘     └──────────┘     └──────────┘                                                 │
│                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CONTENT RETRIEVAL FLOW (Public)                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│   ┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐    │
│   │  Public  │────▶│ Next.js  │────▶│  API Gateway │────▶│  Lambda  │────▶│   RDS    │────▶│  Return  │    │
│   │  User    │     │  SSR     │     │  (No Auth)   │     │  (Read)  │     │  MySQL   │     │   JSON   │    │
│   └──────────┘     └──────────┘     └──────────────┘     └──────────┘     └──────────┘     └──────────┘    │
│        │                                                                                                    │
│        │           ┌──────────────────────────────────────────────────────────────────────┐                 │
│        │           │  Images loaded directly from S3 via public URL                       │                 │
│        │           ▼                                                                                        │
│        │     ┌─────────────────────────────────────────────────────┐                                        │
│        └────▶│  https://<your-s3-bucket>.s3.<region>.amazonaws.com/...                                   │
│              └─────────────────────────────────────────────────────┘                                        │
│                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TWEET AUTOMATION FLOW                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐                         │
│   │  Admin   │────▶│  Lambda  │────▶│  OpenAI  │────▶│ DynamoDB │────▶│  Queued  │                         │
│   │  User    │     │ (Generate│     │  GPT-4   │     │  Table   │     │  Tweets  │                         │
│   └──────────┘     │  Tweets) │     └──────────┘     └──────────┘     └──────────┘                         │
│                    └──────────┘                            │                                                │
│                                                            │                                                │
│                                                            ▼                                                │
│              ┌──────────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐                           │
│              │ EventBridge  │────▶│  Lambda  │────▶│ Twitter  │────▶│  Tweet   │                           │
│              │ (12 PM UTC)  │     │ (Publish)│     │  API v2  │     │ Posted   │                           │
│              └──────────────┘     └──────────┘     └──────────┘     └──────────┘                           │
│                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘


                                           API ENDPOINTS SUMMARY

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         PUBLIC API                                                          │
│                    https://<your-public-api-id>.execute-api.me-central-1.amazonaws.com/Stage                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Endpoint                          │ Method │ Description                                                   │
├────────────────────────────────────┼────────┼───────────────────────────────────────────────────────────────┤
│  /articles                         │ GET    │ List all published articles                                   │
│  /articles/{id}                    │ GET    │ Get single article with author, tags, sections                │
│  /articles/{id}/share              │ POST   │ Track article shares (twitter/linkedin/whatsapp/copy)         │
│  /news                             │ GET    │ List all published news                                       │
│  /news/{id}                        │ GET    │ Get single news item                                          │
│  /sections                         │ GET    │ List all sections/categories                                  │
│  /sections/{id}                    │ GET    │ Get section with articles                                     │
│  /tags                             │ GET    │ List all tags                                                 │
│  /tags/{id}                        │ GET    │ Get tag with articles                                         │
│  /users/{id}                       │ GET    │ Get user/author profile                                       │
│  /users/{id}/articles              │ GET    │ Get articles by author                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         ADMIN API (Cognito Protected)                                       │
│                    https://<your-admin-api-id>.execute-api.me-central-1.amazonaws.com/dev                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Endpoint                          │ Method │ Description                        │ Required Role            │
├────────────────────────────────────┼────────┼────────────────────────────────────┼──────────────────────────┤
│  /articles                         │ GET    │ List articles (all/own)            │ VIEWER+                  │
│  /articles                         │ POST   │ Create new article                 │ CONTENT_SPECIALIST+      │
│  /articles/{id}                    │ GET    │ Get article details                │ VIEWER+                  │
│  /articles/{id}                    │ PUT    │ Update article                     │ CONTENT_SPECIALIST+ (own)│
│  /articles/{id}                    │ DELETE │ Delete article                     │ CONTENT_MANAGER+         │
│  /articles/image-upload-url        │ POST   │ Get S3 presigned URL               │ CONTENT_SPECIALIST+      │
│  /news                             │ GET    │ List news                          │ VIEWER+                  │
│  /news                             │ POST   │ Create news                        │ CONTENT_SPECIALIST+      │
│  /news/{id}                        │ PUT    │ Update news                        │ CONTENT_SPECIALIST+ (own)│
│  /news/{id}                        │ DELETE │ Delete news                        │ CONTENT_MANAGER+         │
│  /sections                         │ GET    │ List sections                      │ VIEWER+                  │
│  /sections                         │ POST   │ Create section                     │ CONTENT_MANAGER+         │
│  /sections/{id}                    │ PUT    │ Update section                     │ CONTENT_MANAGER+         │
│  /sections/{id}                    │ DELETE │ Delete section                     │ ADMIN                    │
│  /tags                             │ GET    │ List tags                          │ VIEWER+                  │
│  /tags                             │ POST   │ Create tag                         │ CONTENT_MANAGER+         │
│  /tags/{id}                        │ PUT    │ Update tag                         │ CONTENT_MANAGER+         │
│  /tags/{id}                        │ DELETE │ Delete tag                         │ ADMIN                    │
│  /auth/me                          │ GET    │ Get current user info              │ Any authenticated        │
│  /admin/dashboard/stats            │ GET    │ Dashboard statistics               │ CONTENT_MANAGER+         │
│  /admin/analytics/insights         │ GET    │ Analytics data                     │ CONTENT_MANAGER+         │
│  /admin/users                      │ GET    │ List Cognito users                 │ ADMIN                    │
│  /admin/users                      │ POST   │ Create Cognito user                │ ADMIN                    │
│  /admin/users/{id}                 │ PUT    │ Update Cognito user                │ ADMIN                    │
│  /admin/users/{id}                 │ DELETE │ Delete Cognito user                │ ADMIN                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘


                                           DEPLOYMENT CONFIGURATION

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Component              │ Technology           │ Deployment Method                                          │
├─────────────────────────┼──────────────────────┼────────────────────────────────────────────────────────────┤
│  Public Frontend        │ Next.js 14           │ Vercel / AWS Amplify / EC2                                 │
│  Admin Frontend         │ React 19 + Vite      │ S3 + CloudFront / Amplify                                  │
│  API Backend            │ AWS Lambda           │ AWS SAM (sam build && sam deploy)                          │
│  Database               │ RDS MySQL            │ CloudFormation / Manual                                    │
│  Storage                │ S3                   │ CloudFormation (part of SAM template)                      │
│  Authentication         │ Cognito              │ CloudFormation (part of SAM template)                      │
│  Infrastructure Files   │                      │                                                            │
│  ├── Public API         │                      │ s7abt-api-backend/template.yaml                            │
│  ├── Admin API          │                      │ s7abt-admin/infrastructure/template-phase3.yaml            │
│  └── Social Media       │                      │ s7abt-api-backend/template.yaml (Tweet functions)          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Key Technologies

| Layer | Technology |
|-------|------------|
| Public Frontend | Next.js 14, TypeScript, Tailwind CSS, next-intl |
| Admin Frontend | React 19, Vite, AWS Amplify UI, TinyMCE |
| API | AWS Lambda (Node.js 20.x), API Gateway |
| Database | AWS RDS MySQL 5.6+ |
| Storage | AWS S3 |
| Authentication | AWS Cognito |
| Secrets | AWS Secrets Manager |
| Monitoring | AWS CloudWatch |
| IaC | AWS SAM / CloudFormation |

## Region

All resources are deployed in **AWS me-central-1 (Middle East - Bahrain)**.
