# S7abt CMS - Secrets Manager Setup Guide

All sensitive credentials are stored in AWS Secrets Manager. Lambda functions retrieve these at runtime using the AWS SDK, so no secrets are ever hardcoded or committed to source control. This guide covers creating all required secrets for a complete S7abt CMS deployment.

---

## Prerequisites

- AWS CLI configured with appropriate permissions (`secretsmanager:CreateSecret`, `secretsmanager:GetSecretValue`, `secretsmanager:UpdateSecret`)
- Target region selected (e.g., `me-south-1` for Bahrain, `us-east-1` for N. Virginia)
- RDS instance already provisioned (for database credentials)

---

## Required Secrets

### 1. Database Credentials

**Secret Name:** `s7abt/database/credentials`

This is the only **mandatory** secret. Every Lambda function in the stack requires it to connect to the MySQL/Aurora database.

**JSON Format:**
```json
{
  "host": "<your-rds-endpoint>.rds.amazonaws.com",
  "port": 3306,
  "username": "admin",
  "password": "<your-strong-password>",
  "dbname": "s7abt"
}
```

**IMPORTANT:** The `dbname` field is required. The application reads both `dbname` and `database` fields, but `dbname` is the standard. If this field is missing or incorrect, Lambda functions will fail to connect to the correct database.

**Create command:**
```bash
aws secretsmanager create-secret \
  --name s7abt/database/credentials \
  --description "S7abt CMS database credentials" \
  --secret-string '{"host":"<rds-endpoint>","port":3306,"username":"admin","password":"<password>","dbname":"s7abt"}' \
  --region <your-region>
```

---

### 2. OpenAI API Key (for Tweet Generation)

**Secret Name:** `s7abt/openai/credentials`

**JSON Format:**
```json
{
  "api_key": "sk-..."
}
```

**Create command:**
```bash
aws secretsmanager create-secret \
  --name s7abt/openai/credentials \
  --description "OpenAI API key for S7abt tweet generation" \
  --secret-string '{"api_key":"sk-your-openai-api-key"}' \
  --region <your-region>
```

**Note:** This is optional. Only needed if you want AI-powered tweet generation from article content. You can obtain an API key from [platform.openai.com](https://platform.openai.com/).

---

### 3. Twitter/X API Credentials (for Tweet Publishing)

**Secret Name:** `s7abt/twitter/credentials`

**JSON Format:**
```json
{
  "api_key": "<Twitter API Key>",
  "api_key_secret": "<Twitter API Key Secret>",
  "access_token": "<Twitter Access Token>",
  "access_token_secret": "<Twitter Access Token Secret>",
  "bearer_token": "<Twitter Bearer Token>"
}
```

**Create command:**
```bash
aws secretsmanager create-secret \
  --name s7abt/twitter/credentials \
  --description "Twitter/X API credentials for S7abt tweet publishing" \
  --secret-string '{"api_key":"...","api_key_secret":"...","access_token":"...","access_token_secret":"...","bearer_token":"..."}' \
  --region <your-region>
```

**Note:** This is optional. Only needed if you want automated Twitter/X publishing. Get your keys from the [Twitter Developer Portal](https://developer.twitter.com/). You will need a project with OAuth 1.0a (read and write) and OAuth 2.0 enabled.

---

## Lambda Environment Variables

The following environment variables tell Lambda functions which secrets to retrieve. These are configured in the SAM template or set directly on each Lambda function.

| Environment Variable | Expected Value | Used By |
|---|---|---|
| `DB_SECRET_ARN` or `DB_SECRET_NAME` | ARN or name of `s7abt/database/credentials` | All Lambda functions |
| `OPENAI_SECRET_NAME` | `s7abt/openai/credentials` | Tweet generator Lambda |
| `TWITTER_SECRET_NAME` | `s7abt/twitter/credentials` | Tweet publisher Lambda |

When deploying via SAM, the `DB_SECRET_ARN` is typically passed as a stack parameter (`DatabaseSecretArn`) and injected into all function environment variables automatically. For the optional tweet-related secrets, you set the secret name directly in the Lambda configuration.

---

## Verifying Secrets

After creating a secret, verify it was stored correctly:

```bash
aws secretsmanager get-secret-value \
  --secret-id s7abt/database/credentials \
  --region <your-region> \
  --query 'SecretString' --output text | python -m json.tool
```

To list all S7abt secrets in your account:

```bash
aws secretsmanager list-secrets \
  --filter Key="name",Values="s7abt" \
  --region <your-region> \
  --query 'SecretList[].{Name:Name,ARN:ARN}' --output table
```

To verify a Lambda function can reach the secret (useful for debugging VPC/endpoint issues):

```bash
aws lambda invoke \
  --function-name <your-lambda-name> \
  --payload '{}' \
  --region <your-region> \
  /dev/stdout
```

If you see a timeout or access-denied error, check that the Lambda's execution role has `secretsmanager:GetSecretValue` permission and that VPC-deployed Lambdas have a Secrets Manager VPC endpoint or NAT gateway.

---

## Updating Secrets

To update an existing secret value (e.g., after a password rotation or API key refresh):

```bash
aws secretsmanager update-secret \
  --secret-id s7abt/database/credentials \
  --secret-string '{"host":"<rds-endpoint>","port":3306,"username":"admin","password":"<new-password>","dbname":"s7abt"}' \
  --region <your-region>
```

You can also update a single field using the `put-secret-value` command with the full JSON (Secrets Manager stores the entire JSON string, so you must always provide the complete object):

```bash
# First retrieve the current value
CURRENT=$(aws secretsmanager get-secret-value \
  --secret-id s7abt/database/credentials \
  --region <your-region> \
  --query 'SecretString' --output text)

# Modify and put back (example using jq to change the password)
echo "$CURRENT" | jq '.password = "new-password"' | \
  xargs -0 -I {} aws secretsmanager put-secret-value \
    --secret-id s7abt/database/credentials \
    --secret-string '{}' \
    --region <your-region>
```

**Note:** After updating database credentials, Lambda functions will pick up the new values on their next cold start. To force an immediate update, you can redeploy or update the function configuration to trigger a new execution environment.

---

## Security Best Practices

- **Never commit secrets to git.** The `.gitignore` should exclude any files containing credentials. Use Secrets Manager or environment variables exclusively.
- **Use IAM policies to restrict which Lambdas can access which secrets.** Each Lambda's execution role should only have `secretsmanager:GetSecretValue` permission for the specific secret ARNs it needs. The SAM templates grant Lambda functions access to only the database secret ARN specified in parameters.
- **Enable secret rotation for database credentials.** AWS Secrets Manager supports automatic rotation with a Lambda rotation function. This is strongly recommended for production environments. See [AWS documentation on rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html).
- **Use separate secrets for dev/staging/prod environments.** Use a naming convention such as:
  - `s7abt/database/credentials-dev`
  - `s7abt/database/credentials-staging`
  - `s7abt/database/credentials-production`
- **Enable AWS CloudTrail logging** to audit all access to secrets. This helps detect unauthorized retrieval attempts.
- **Use resource-based policies** on secrets to add an additional layer of access control beyond IAM roles.
- **Encrypt secrets with a customer-managed KMS key** (instead of the default `aws/secretsmanager` key) if you need fine-grained encryption key management or cross-account access.
