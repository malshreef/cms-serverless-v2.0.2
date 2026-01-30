#!/bin/bash

# Quick update script for tweet generator Lambda function

REGION="me-central-1"
FUNCTION_NAME="s7abt-tweet-generator-dev"

echo "=========================================="
echo "Updating Tweet Generator Lambda"
echo "=========================================="
echo ""

# Install dependencies
echo "Installing dependencies..."
cd tweet-generator
npm install --production
cd ..

# Create deployment package
echo "Creating deployment package..."
cd tweet-generator
zip -r ../function.zip . -x "*.git*" "node_modules/.cache/*"
cd ..

# Update Lambda function
echo "Updating Lambda function..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb://function.zip \
  --region "$REGION"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Lambda function updated successfully!"
  echo ""
  echo "The function now uses gpt-4o-mini model"
  echo "This model is:"
  echo "  • Available on all OpenAI accounts"
  echo "  • Cheaper than GPT-4 (~$0.15 per 1M tokens)"
  echo "  • Fast and high-quality"
  echo ""
  echo "Test again with:"
  echo "  curl -X POST https://xxxxx.execute-api.me-central-1.amazonaws.com/dev/generate-tweets \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"article_title\":\"...\", \"article_url\":\"...\", \"article_content\":\"...\"}'"
else
  echo ""
  echo "❌ Failed to update Lambda function"
  exit 1
fi

# Clean up
rm -f function.zip

echo ""
echo "=========================================="
echo "Update Complete!"
echo "=========================================="

