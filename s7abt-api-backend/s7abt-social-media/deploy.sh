#!/bin/bash

# S7abt Social Media Automation - Deployment Script
# Deploys the complete system to AWS

set -e

REGION="me-central-1"
ENVIRONMENT="dev"
STACK_NAME="s7abt-social-media-${ENVIRONMENT}"

echo "=========================================="
echo "S7abt Social Media Automation Deployment"
echo "=========================================="
echo ""
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"
echo "Stack Name: $STACK_NAME"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured"
    echo "Please run 'aws configure' first"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Check if OpenAI secret exists
echo "Checking OpenAI credentials..."
if aws secretsmanager describe-secret --secret-id "s7abt/openai/credentials" --region "$REGION" > /dev/null 2>&1; then
    echo "✅ OpenAI credentials found"
else
    echo "❌ OpenAI credentials not found in Secrets Manager"
    echo ""
    echo "Please create the secret first:"
    echo "  aws secretsmanager create-secret \\"
    echo "    --name s7abt/openai/credentials \\"
    echo "    --secret-string '{\"api_key\":\"YOUR_OPENAI_KEY\"}' \\"
    echo "    --region $REGION"
    exit 1
fi

# Check if Twitter secret exists
echo "Checking Twitter credentials..."
if aws secretsmanager describe-secret --secret-id "s7abt/twitter/credentials" --region "$REGION" > /dev/null 2>&1; then
    echo "✅ Twitter credentials found"
else
    echo "❌ Twitter credentials not found in Secrets Manager"
    echo "Please ensure Twitter credentials are stored in Secrets Manager"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 1: Building Lambda Functions"
echo "=========================================="
echo ""

# Build Tweet Generator
echo "Building Tweet Generator..."
cd tweet-generator
npm install --production
cd ..
echo "✅ Tweet Generator built"

# Build Tweet Publisher
echo "Building Tweet Publisher..."
cd tweet-publisher
npm install --production
cd ..
echo "✅ Tweet Publisher built"

echo ""
echo "=========================================="
echo "Step 2: Packaging with SAM"
echo "=========================================="
echo ""

sam build --region "$REGION"

if [ $? -ne 0 ]; then
    echo "❌ SAM build failed"
    exit 1
fi

echo "✅ SAM build successful"

echo ""
echo "=========================================="
echo "Step 3: Deploying to AWS"
echo "=========================================="
echo ""

sam deploy \
  --template-file template.yaml \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment="$ENVIRONMENT" \
  --no-fail-on-empty-changeset \
  --resolve-s3

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "Deployment Successful!"
echo "=========================================="
echo ""

# Get outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`TweetQueueTableName`].OutputValue' \
  --output text)

echo "📊 Stack Outputs:"
echo "  API URL: $API_URL"
echo "  Tweet Queue Table: $TABLE_NAME"
echo ""

echo "🎯 Next Steps:"
echo ""
echo "1. Test Tweet Generation:"
echo "   curl -X POST $API_URL/generate-tweets \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"article_id\": \"YOUR_ARTICLE_ID\"}'"
echo ""
echo "2. View Tweet Queue:"
echo "   aws dynamodb scan --table-name $TABLE_NAME --region $REGION"
echo ""
echo "3. Test Tweet Publisher (manual trigger):"
echo "   aws lambda invoke \\"
echo "     --function-name s7abt-tweet-publisher-${ENVIRONMENT} \\"
echo "     --region $REGION \\"
echo "     response.json"
echo ""
echo "4. Check CloudWatch Logs:"
echo "   - Tweet Generator: /aws/lambda/s7abt-tweet-generator-${ENVIRONMENT}"
echo "   - Tweet Publisher: /aws/lambda/s7abt-tweet-publisher-${ENVIRONMENT}"
echo ""

echo "=========================================="
echo "Deployment Complete! 🎉"
echo "=========================================="

