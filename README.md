# S7abt CMS

A production-ready, serverless content management platform built on AWS. Features a bilingual (Arabic/English) public website, a feature-rich admin panel with role-based access control, and automated social media integration.

## Features

### Public Website
- **Bilingual Support** - Full Arabic and English localization with RTL support
- **Content Types** - Articles, news, sections, tags, and author profiles
- **Modern UI** - Responsive design built with Next.js 14 and Tailwind CSS
- **SEO Optimized** - Server-side rendering, meta tags, and sitemap generation
- **Push Notifications** - Web push notifications for new content

### Admin Panel
- **Role-Based Access Control (RBAC)** - Four user roles: Admin, Content Manager, Content Specialist, Viewer
- **Rich Text Editor** - TinyMCE integration for article composition
- **Media Management** - S3-based image upload with automatic optimization
- **Analytics Dashboard** - Content performance metrics with Recharts visualizations
- **User Management** - Full CRUD operations for admin users

### Social Media Integration
- **AI-Powered Tweet Generation** - Uses AWS Bedrock (Claude) to generate engaging tweets
- **Automated Publishing** - Scheduled tweet publishing via EventBridge
- **Twitter API Integration** - Direct posting to Twitter/X

### Infrastructure
- **Fully Serverless** - AWS Lambda, API Gateway, S3, RDS
- **Secure Authentication** - AWS Cognito with JWT tokens
- **Database** - MySQL on RDS with connection pooling
- **Infrastructure as Code** - AWS SAM templates for all resources

## Tech Stack

| Component | Technology |
|-----------|------------|
| Public Frontend | Next.js 14, TypeScript, Tailwind CSS, next-intl |
| Admin Frontend | React 19, Vite, TypeScript, Tailwind CSS, AWS Amplify UI |
| Backend | AWS Lambda (Node.js 20.x), API Gateway |
| Database | AWS RDS MySQL |
| Authentication | AWS Cognito |
| Storage | AWS S3 |
| AI/ML | AWS Bedrock (Claude) |
| Infrastructure | AWS SAM, CloudFormation |

## Project Structure

```
s7abt-dubai/
├── s7abt-website-v2/          # Public website (Next.js)
│   └── s7abt-frontend-v2/
├── s7abt-admin/               # Admin panel
│   ├── frontend/              # React + Vite admin UI
│   ├── backend/               # Admin Lambda functions
│   └── infrastructure/        # SAM templates
├── s7abt-api-backend/         # Public API
│   ├── articles/              # Article endpoints
│   ├── news/                  # News endpoints
│   ├── sections/              # Section endpoints
│   ├── tags/                  # Tag endpoints
│   ├── users/                 # User endpoints
│   ├── s7abt-social-media/    # Twitter integration
│   └── infrastructure/        # SAM templates
├── ARCHITECTURE.md            # Detailed system architecture
├── DEPLOYMENT.md              # Deployment instructions
└── LICENSE                    # MIT License
```

## Quick Start

### Prerequisites

- Node.js 20.x or later
- AWS CLI configured with credentials
- AWS SAM CLI (`pip install aws-sam-cli`)
- MySQL database (local or AWS RDS)

### 1. Clone the Repository

```bash
git clone https://github.com/malshreef/cms-serverless-v2.0.2.git
```

### 2. Deploy Backend & Database

The backend infrastructure includes the API, Lambda functions, and the RDS MySQL database.

**Public API & Database:**
```bash
cd s7abt-api-backend
sam build -t api-stack-expanded.yaml
sam deploy --guided
```
Follow the prompts. SAM will create the database, secrets, and API resources.

**Admin API:**
```bash
cd ../../s7abt-admin/infrastructure
sam build -t template-phase3.yaml
sam deploy --guided
```

### 3. Configure Environment Variables

**Public Website** (`s7abt-website-v2/s7abt-frontend-v2/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/Stage
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**Admin Panel** (`s7abt-admin/frontend/.env`):
```env
VITE_COGNITO_USER_POOL_ID=<your-cognito-user-pool-id>
VITE_COGNITO_CLIENT_ID=<your-cognito-client-id>
VITE_AWS_REGION=<your-aws-region>
VITE_API_ENDPOINT=https://<your-api-id>.execute-api.<region>.amazonaws.com/dev
VITE_S3_BASE_URL=https://<your-s3-bucket>.s3.<region>.amazonaws.com
```

### 4. Run Frontend Locally



**Public Website:**
```bash
cd s7abt-website-v2/s7abt-frontend-v2
npm install
npm run dev
```

**Admin Panel:**
```bash
cd s7abt-admin/frontend
npm install
npm run dev
```

## Documentation

- [Architecture Guide](ARCHITECTURE.md) - Detailed system architecture and data flow
- [Deployment Guide](DEPLOYMENT.md) - Step-by-step deployment instructions
- [Admin Testing Plan](s7abt-admin/TESTING_PLAN.md) - Comprehensive test cases

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, settings |
| **Content Manager** | Full content CRUD, publish permissions |
| **Content Specialist** | Own content only, no publish access |
| **Viewer** | Read-only access |

## API Endpoints

### Public API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/articles` | List articles |
| GET | `/articles/{id}` | Get article by ID |
| GET | `/news` | List news items |
| GET | `/sections` | List sections |
| GET | `/tags` | List tags |
| GET | `/users/{id}` | Get user profile |

### Admin API (Cognito Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/articles` | Create article |
| PUT | `/articles/{id}` | Update article |
| DELETE | `/articles/{id}` | Delete article |
| GET | `/auth/me` | Get current user |
| GET | `/dashboard/stats` | Get dashboard statistics |

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Mohammed Alshareef**

---

Built with AWS Serverless technologies
