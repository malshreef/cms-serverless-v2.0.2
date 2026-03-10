# S7ABT CMS - Serverless API Backend

A complete serverless API backend for S7abt CMS, built with AWS SAM (Serverless Application Model).

## Architecture

- **Runtime**: Node.js 20.x
- **Database**: AWS RDS MySQL 8.0
- **Compute**: AWS Lambda
- **API**: Amazon API Gateway
- **Secrets**: AWS Secrets Manager

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **AWS SAM CLI** installed
3. **Node.js 20.x** or higher
4. **MySQL Client** (for database initialization)

## Quick Start

### 1. Database Setup

First, initialize the database schema:

```bash
# Navigate to the database directory
cd database

# Install dependencies
npm install mysql2

# Set environment variables
export DB_HOST=your-rds-endpoint.rds.amazonaws.com
export DB_USER=admin
export DB_PASSWORD=your-password
export DB_NAME=s7abt_dubai

# Run the initialization script
node init-db.js
```

Or run the SQL script directly:

```bash
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD < database/init-schema.sql
```

### 2. Deploy the API Stack

```bash
# Build the SAM application
sam build -t api-stack-expanded.yaml

# Deploy (first time - guided)
sam deploy --guided

# Deploy (subsequent times)
sam deploy
```

### 3. Configuration

Update `samconfig.toml` with your settings:

```toml
[default.deploy.parameters]
stack_name = "s7abt-api"
region = "us-east-1"
parameter_overrides = "Environment=\"production\" VpcId=\"vpc-xxx\" SubnetIds=\"subnet-xxx,subnet-yyy\""
```

## Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `s7b_user` | Users and authors |
| `s7b_section` | Content sections/categories |
| `s7b_tags` | Content tags |
| `s7b_article` | Blog articles |
| `s7b_news` | News items |
| `s7b_tags_item` | Tag-to-content relationships |

### Entity Relationship

```
s7b_user (1) ----< (N) s7b_article
s7b_section (1) ----< (N) s7b_article
s7b_article (N) >----< (N) s7b_tags (via s7b_tags_item)
s7b_user (1) ----< (N) s7b_news
s7b_news (N) >----< (N) s7b_tags (via s7b_tags_item)
```

### Key Columns

**s7b_article** - Multi-section content structure:
- `s7b_article_div1` + `s7b_article_div1_body` (Section 1)
- `s7b_article_div2` + `s7b_article_div2_body` (Section 2)
- ... up to 5 sections

## API Endpoints

### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/articles` | List all articles |
| GET | `/articles/{id}` | Get article by ID |
| POST | `/articles/{id}/share` | Increment share count |

### News

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/news` | List all news |
| GET | `/news/{id}` | Get news by ID |

### Sections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sections` | List all sections |
| GET | `/sections/{id}` | Get section by ID |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List all tags |
| GET | `/tags/{id}` | Get tag by ID |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/{id}` | Get user profile |
| GET | `/users/{id}/articles` | Get user's articles |

## Environment Variables

The Lambda functions use these environment variables:

| Variable | Description |
|----------|-------------|
| `DB_SECRET_ARN` | ARN of the Secrets Manager secret containing DB credentials |
| `NODE_ENV` | Environment (dev/staging/production) |

## CORS Configuration

CORS is configured to allow:
- **Origins**: `*` (all origins)
- **Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Headers**: `Content-Type, Authorization, X-Api-Key, X-Amz-Date, X-Amz-Security-Token, X-Requested-With`

## Security

### Database Credentials

Database credentials are stored in AWS Secrets Manager and automatically attached to the RDS instance.

### VPC Configuration

Lambda functions run inside your VPC with a security group that allows MySQL access (port 3306) to RDS.

### API Gateway

- HTTPS only
- CORS enabled
- Rate limiting available via API Gateway

## Troubleshooting

### Common Issues

**Connection Timeout**
- Ensure Lambda security group allows outbound traffic to RDS
- Check RDS security group allows inbound from Lambda security group

**401 Unauthorized**
- Verify API Gateway authorizer configuration
- Check Cognito user pool settings

**Database Connection Failed**
- Verify Secrets Manager secret contains correct credentials
- Ensure RDS is accessible from Lambda's VPC subnets

### Logging

Logs are available in CloudWatch Logs:
- `/aws/lambda/s7abt-list-articles-{env}`
- `/aws/lambda/s7abt-get-article-{env}`
- etc.

## Development

### Local Testing

```bash
# Start local API
sam local start-api

# Invoke a single function
sam local invoke GetArticleFunction --event events/get-article.json
```

### Adding New Endpoints

1. Create handler in appropriate directory (e.g., `articles/create.js`)
2. Add function definition to `api-stack-expanded.yaml`
3. Build and deploy

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Support

For issues and feature requests, please use GitHub Issues.
