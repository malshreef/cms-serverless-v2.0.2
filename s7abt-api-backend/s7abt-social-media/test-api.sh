#!/bin/bash

# Test Tweet Generation API

REGION="me-central-1"
STACK_NAME="s7abt-social-media-dev"

echo "=========================================="
echo "Testing Tweet Generation API"
echo "=========================================="
echo ""

# Get API URL from CloudFormation
echo "Getting API URL from CloudFormation..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text 2>/dev/null)

if [ -z "$API_URL" ]; then
  echo "❌ Could not get API URL from CloudFormation"
  echo ""
  echo "Please check:"
  echo "  1. Stack name is correct: $STACK_NAME"
  echo "  2. Stack is deployed successfully"
  echo "  3. AWS CLI is configured for region: $REGION"
  echo ""
  echo "Manual check:"
  echo "  aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION"
  exit 1
fi

echo "✅ API URL: $API_URL"
echo ""

# Test with sample article
echo "Testing tweet generation..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/generate-tweets" \
  -H 'Content-Type: application/json' \
  -d '{
    "article_title": "دليل شامل لـ AWS Lambda - الحوسبة بدون خادم",
    "article_url": "https://s7abt.com/articles/aws-lambda-guide",
    "article_content": "AWS Lambda هي خدمة حوسبة بدون خادم (Serverless) تتيح لك تشغيل الكود دون الحاجة لإدارة الخوادم. في هذا المقال الشامل، سنتعرف على أساسيات Lambda وكيفية استخدامها لبناء تطبيقات serverless قابلة للتوسع. سنغطي المواضيع التالية: إنشاء دالة Lambda، ربطها بمصادر الأحداث، إدارة الأذونات، مراقبة الأداء، وأفضل الممارسات للحصول على أفضل أداء وتكلفة منخفضة."
  }')

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all but last line)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Success! Tweets generated"
  echo ""
  echo "Response:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  
  # Count tweets
  TWEET_COUNT=$(echo "$BODY" | grep -o '"tweets_generated":[0-9]*' | grep -o '[0-9]*')
  if [ -n "$TWEET_COUNT" ]; then
    echo "📊 Generated $TWEET_COUNT tweets"
  fi
  
  echo ""
  echo "=========================================="
  echo "Test Successful! 🎉"
  echo "=========================================="
  echo ""
  echo "Next steps:"
  echo "  1. View tweets in DynamoDB:"
  echo "     aws dynamodb scan --table-name s7abt-tweet-queue-dev --region $REGION --max-items 5"
  echo ""
  echo "  2. Test tweet publisher:"
  echo "     aws lambda invoke --function-name s7abt-tweet-publisher-dev --region $REGION response.json"
  echo ""
  
elif [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "401" ]; then
  echo "❌ Authentication error"
  echo ""
  echo "Response:"
  echo "$BODY"
  echo ""
  echo "This usually means:"
  echo "  • API Gateway requires authentication (check if API key is required)"
  echo "  • CORS issue (shouldn't affect curl)"
  
elif [ "$HTTP_CODE" = "404" ]; then
  echo "❌ Endpoint not found"
  echo ""
  echo "Response:"
  echo "$BODY"
  echo ""
  echo "This means:"
  echo "  • The endpoint path is incorrect"
  echo "  • API Gateway stage is not deployed"
  echo ""
  echo "Check API Gateway console:"
  echo "  https://console.aws.amazon.com/apigateway/home?region=$REGION"
  
elif [ "$HTTP_CODE" = "500" ]; then
  echo "❌ Internal server error"
  echo ""
  echo "Response:"
  echo "$BODY"
  echo ""
  echo "Check CloudWatch logs:"
  echo "  aws logs tail /aws/lambda/s7abt-tweet-generator-dev --region $REGION --follow"
  
else
  echo "❌ Unexpected response"
  echo ""
  echo "Response:"
  echo "$BODY"
  echo ""
  echo "Check:"
  echo "  • API Gateway deployment"
  echo "  • Lambda function configuration"
  echo "  • CloudWatch logs"
fi

echo ""

