# S7abt CMS - Serverless Content Management System

A production-ready, serverless content management platform built on AWS. Features a bilingual (Arabic/English) public website, a feature-rich admin panel with role-based access control, and automated social media integration.

Deployable to **any AWS region** -- no hardcoded regions or account-specific values.

## Features

### Public Website
- **Bilingual Support** -- Full Arabic and English localization with RTL support
- **Content Types** -- Articles, news, sections, tags, and author profiles
- **Smart Section Icons** -- Automatic keyword-matched icons (AWS, Azure, Google Cloud, security, etc.)
- **Article Comments** -- Public comment submission with moderation workflow
- **Modern UI** -- Responsive design built with Next.js 14 and Tailwind CSS
- **SEO Optimized** -- Server-side rendering, meta tags, and sitemap generation
- **Social Sharing** -- Share buttons with real-time statistics tracking

### Admin Panel
- **Role-Based Access Control** -- Four user roles with backend RBAC authorization
- **AI Image Generator** -- Generate and select from 3 DALL-E images in 4 styles
- **Comment Moderation** -- Approve, reject, delete comments with search and filtering
- **Rich Text Editor** -- TinyMCE integration for article composition
- **Media Management** -- S3-based image upload with presigned URLs
- **Tweet Management** -- Paginated list with server-side stats and filtering
- **Analytics Dashboard** -- Content performance metrics with Recharts visualizations
- **User Management** -- Full CRUD operations for admin users via Cognito
- **Scheduled Publishing** -- Set future publish dates for articles

### AI Features
- **AI Image Generation** -- Generate article/news images using DALL-E 3 with 4 style options:
  - Cartoon -- Vibrant Pixar/Disney-inspired illustrations
  - Official -- Clean, professional corporate style
  - Lego -- Fun LEGO brick art style
  - Minimal -- Ultra-minimalist flat illustrations
- **AI-Powered Tweet Generation** -- Uses OpenAI GPT-4 to generate engaging tweets from articles
- **Smart Content Suggestions** -- AI-assisted topic and content ideas

### Comments & Moderation
- **Article Comments** -- Public comment submission on articles
- **Admin Moderation** -- Approve, reject, or delete comments from admin panel
- **Soft-Delete** -- Comments use soft-delete pattern for data safety

### Social Media Integration
- **Automated Publishing** -- Scheduled tweet publishing via EventBridge with retry logic
- **Split-Lambda Architecture** -- VPC Lambda for DB, non-VPC Lambda for Twitter API
- **Transient Error Retry** -- Up to 5 automatic retries for temporary failures (5xx, timeouts)
- **Twitter/X API Integration** -- Direct posting to Twitter/X
- **Paginated Tweet Management** -- Server-side pagination with overall stats

### Scheduled Publishing
- **Article Scheduling** -- Set future publish dates for articles
- **Automatic Publishing** -- EventBridge triggers publishing at scheduled time

### Infrastructure
- **Fully Serverless** -- AWS Lambda, API Gateway, S3, RDS, DynamoDB
- **Secure Authentication** -- AWS Cognito with JWT tokens and `custom:role` RBAC
- **Secrets Management** -- All credentials stored in AWS Secrets Manager
- **Database** -- MySQL on RDS with connection pooling
- **Infrastructure as Code** -- AWS SAM templates for all resources

## Tech Stack

| Component | Technology |
|-----------|------------|
| Public Frontend | Next.js 14, TypeScript, Tailwind CSS, next-intl |
| Admin Frontend | React 19, Vite, TypeScript, Tailwind CSS, AWS Amplify UI |
| Backend | AWS Lambda (Node.js 20.x), API Gateway |
| Database | AWS RDS MySQL 8.0 |
| Authentication | AWS Cognito |
| Storage | AWS S3 |
| AI (Tweets) | OpenAI GPT-4 (via Secrets Manager) |
| AI (Images) | OpenAI DALL-E 3 (via Secrets Manager) |
| Social Media | Twitter/X API v2 |
| Infrastructure | AWS SAM, CloudFormation |

## Project Structure

```
cms-serverless-v2.0.2/
├── s7abt-website-v2/              # Public website
│   └── s7abt-frontend-v2/        # Next.js 14 app
├── s7abt-admin/                   # Admin system
│   ├── frontend/                  # React + Vite admin UI
│   ├── backend/                   # Admin Lambda functions
│   │   ├── articles/              # Articles CRUD + image upload
│   │   ├── news/                  # News CRUD
│   │   ├── sections/              # Sections CRUD
│   │   ├── tags/                  # Tags CRUD
│   │   ├── auth/                  # Authentication & dashboard
│   │   ├── analytics/             # Insights & metrics
│   │   ├── users/                 # Cognito user management
│   │   ├── tweets/                # Tweet generation & publishing
│   │   ├── comments/              # Comment moderation
│   │   └── ai-images/             # AI image generation (DALL-E 3)
│   └── infrastructure/            # SAM template (Admin API)
├── s7abt-api-backend/             # Public API
│   ├── articles/                  # Article endpoints (list, get, share)
│   ├── news/                      # News endpoints
│   ├── sections/                  # Section endpoints
│   ├── tags/                      # Tag endpoints + articles by tag
│   ├── users/                     # User/author endpoints
│   ├── shared/                    # Database connection module
│   ├── database/                  # Schema init & migrations
│   └── s7abt-social-media/        # SAM template (Social Media API)
├── DEPLOYMENT.md                  # Step-by-step deployment guide
├── SECRETS-SETUP.md               # Secrets Manager setup guide
├── TROUBLESHOOTING.md             # Known issues & solutions
├── ARCHITECTURE.md                # System architecture
└── LICENSE                        # MIT License
```

## Quick Start

### Prerequisites

- Node.js 20.x
- AWS CLI v2 configured with credentials
- AWS SAM CLI (`pip install aws-sam-cli`)
- MySQL client

### Deployment Overview

The full deployment involves 10 steps. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the complete guide.

1. **Create secrets** in AWS Secrets Manager ([SECRETS-SETUP.md](SECRETS-SETUP.md))
2. **Set up VPC** and networking (subnets, security groups, NAT gateway)
3. **Create RDS** MySQL instance
4. **Initialize database** schema
5. **Deploy Admin API** via SAM (creates Cognito, S3, API Gateway, Lambda functions)
6. **Create admin users** in Cognito with `custom:role` attribute
7. **Deploy Public API** Lambda functions
8. **Deploy Admin Panel** (React + Vite) to S3 + CloudFront
9. **Deploy Public Website** (Next.js) to Amplify or Vercel
10. **Deploy Social Media** integration (optional)

### AWS Secrets Manager (Required)

All credentials are stored in Secrets Manager -- never hardcoded. You must create these secrets before deploying:

| Secret | Required | Purpose |
|--------|----------|---------|
| `s7abt/database/credentials` | Yes | MySQL connection (host, port, username, password, dbname) |
| `s7abt/openai/credentials` | No | OpenAI API key for tweet generation and AI image generation (DALL-E 3) |
| `s7abt/twitter/credentials` | No | Twitter/X API keys for publishing |

See **[SECRETS-SETUP.md](SECRETS-SETUP.md)** for exact JSON formats and creation commands.

## User Roles

All Cognito users **must** have the `custom:role` attribute set. The admin panel uses this for role-based access control.

| Role | `custom:role` Value | Permissions |
|------|---------------------|-------------|
| **Admin** | `admin` | Full system access, user management, settings |
| **Content Manager** | `content_manager` | Full content CRUD, publish permissions |
| **Content Specialist** | `content_specialist` | Own content only, no publish access |
| **Viewer** | `viewer` | Read-only access |

See [DEPLOYMENT.md - Step 6](DEPLOYMENT.md#step-6-create-admin-users-in-cognito) for user creation commands.

## API Endpoints

### Public API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/articles` | List articles (paginated) |
| GET | `/articles/{id}` | Get article by ID |
| POST | `/articles/{id}/share` | Record share event |
| GET | `/news` | List news items |
| GET | `/news/{id}` | Get news by ID |
| GET | `/sections` | List sections |
| GET | `/tags` | List tags |
| GET | `/GetArticlesByTagid?tagId={id}` | Articles by tag ID |
| GET | `/GetArticlesByTags?tags={names}` | Articles by tag names |
| GET | `/users/{id}` | Get user/author profile |
| POST | `/articles/{id}/comments` | Submit a comment on an article |
| GET | `/contact` | Contact form submission |

### Admin API (Cognito Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Get current authenticated user |
| GET | `/admin/dashboard/stats` | Dashboard statistics |
| GET | `/admin/analytics/insights` | Analytics insights |
| GET/POST | `/admin/articles` | List / Create articles |
| PUT/DELETE | `/admin/articles/{id}` | Update / Delete article |
| POST | `/admin/articles/image-upload-url` | Get S3 presigned upload URL |
| GET/POST | `/admin/news` | List / Create news |
| PUT/DELETE | `/admin/news/{id}` | Update / Delete news |
| GET/POST | `/admin/sections` | List / Create sections |
| PUT/DELETE | `/admin/sections/{id}` | Update / Delete section |
| GET/POST | `/admin/tags` | List / Create tags |
| PUT/DELETE | `/admin/tags/{id}` | Update / Delete tag |
| GET | `/admin/tweets` | List tweets (paginated, with stats) |
| POST | `/admin/ai/generate-images` | Generate 3 AI images (DALL-E 3) |
| GET | `/admin/comments` | List comments (with filtering) |
| PATCH | `/admin/comments/{id}/status` | Approve / Reject comment |
| DELETE | `/admin/comments/{id}` | Delete comment |

## Documentation

| Guide | Description |
|-------|-------------|
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Complete 10-step deployment guide |
| **[SECRETS-SETUP.md](SECRETS-SETUP.md)** | AWS Secrets Manager configuration |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | 12 known issues with proven fixes |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture and data flow |

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Mohammed Alshareef** - m.alshreef@gmail.com

---

Built with AWS Serverless technologies
