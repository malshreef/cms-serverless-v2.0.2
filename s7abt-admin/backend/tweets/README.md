# Tweet Automation Backend

AWS Lambda functions for automated tweet generation and publishing.

## Lambda Functions

| Function | Handler | Purpose |
|----------|---------|---------|
| **generate.js** | `generate.handler` | Generate 3-5 tweets from article using AWS Bedrock AI |
| **list.js** | `list.handler` | List tweets with filtering and pagination |
| **get.js** | `get.handler` | Get single tweet by ID |
| **update.js** | `update.handler` | Update tweet text, schedule, or status |
| **delete.js** | `delete.handler` | Soft delete a tweet |
| **publish.js** | `publish.handler` | Publish tweet to Twitter/X immediately |
| **scheduler.js** | `scheduler.handler` | Daily cron job to auto-publish scheduled tweets |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Deploy

```bash
cd ../../infrastructure
sam build -t template-tweets.yaml
sam deploy --guided
```

### 3. Test Locally (Optional)

```bash
sam local invoke GenerateTweetsFunction -e events/generate-tweet.json
```

## Environment Variables

Set in SAM template or Lambda console:

- `ENVIRONMENT` - Deployment environment (dev/staging/prod)
- `DATABASE_SECRET_ARN` - ARN of RDS credentials in Secrets Manager
- `TWITTER_SECRET_NAME` - Name of Twitter credentials secret
- `AWS_REGION` - Region for Bedrock (default: us-east-1)

## Database Schema

```sql
-- Tweets table (auto-created by migration)
s7b_tweets:
  - s7b_tweet_id (UUID, PK)
  - s7b_article_id (FK to s7b_article)
  - s7b_tweet_text (TEXT)
  - s7b_tweet_tone (ENUM: professional, friendly, engaging)
  - s7b_tweet_hashtags (JSON array)
  - s7b_tweet_status (ENUM: pending, posted, failed)
  - s7b_tweet_scheduled_time (TIMESTAMP)
  - s7b_tweet_twitter_id (Twitter's ID after posting)
  - ...
```

## API Request Examples

### Generate Tweets

```bash
POST /admin/tweets/generate
{
  "articleId": 1,
  "article_title": "Cloud Computing Basics",
  "article_url": "https://s7abt.com/articles/1"
}
```

### List Tweets

```bash
GET /admin/tweets?status=pending&page=1&limit=20
```

### Publish Tweet

```bash
POST /admin/tweets/{tweet_id}/publish
```

## AWS Bedrock Integration

Uses Claude 3.5 Sonnet model for AI tweet generation:

- Model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Region: `us-east-1`
- Input: Article title + content (max 3000 chars)
- Output: 3-5 tweets with tone and hashtags

**Cost**: ~$0.003 per generation

## Twitter API Integration

Uses Twitter API v2 with OAuth 1.0a:

- Rate limit: 300 tweets per 3-hour window
- Max tweet length: 280 characters
- Required permissions: Read + Write
- Credentials stored in AWS Secrets Manager

## Scheduler

EventBridge cron: `0 12 * * ? *` (12:00 UTC = 3:00 PM Riyadh)

Auto-publishes up to 10 pending tweets daily.

## Monitoring

CloudWatch Logs groups:
- `/aws/lambda/s7abt-admin-generate-tweets-{env}`
- `/aws/lambda/s7abt-admin-publish-tweet-{env}`
- `/aws/lambda/s7abt-admin-scheduled-tweet-publisher-{env}`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Bedrock access denied | Enable Claude 3.5 in Bedrock console |
| Twitter auth failed | Verify credentials in Secrets Manager |
| Database connection timeout | Check security group and RDS accessibility |
| Tweets not auto-publishing | Verify EventBridge rule is enabled |

## Testing

```bash
# Test with sample data
npm test

# Deploy and test
sam local invoke GenerateTweetsFunction --event events/test-generate.json
```

## See Also

- [Complete Setup Guide](../../docs/TWEETS_SETUP.md)
- [Database Migration](../../database/migrations/003_tweets_table.sql)
- [SAM Template](../../infrastructure/template-tweets.yaml)
