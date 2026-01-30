#!/bin/bash

# Deploy All Tweets CRUD Lambda Functions
# Usage: ./deploy-all.sh

set -e

REGION="me-central-1"
ACCOUNT_ID="<your-aws-account-id>"
TABLE_NAME="s7abt-tweet-queue-dev"

echo "🚀 Deploying Tweets CRUD Lambda Functions..."
echo "Region: $REGION"
echo "Table: $TABLE_NAME"
echo ""

# Install dependencies once
echo "📦 Installing dependencies..."
npm install
echo ""

# Function to create Lambda if it doesn't exist
create_lambda_if_not_exists() {
    local FUNCTION_NAME=$1
    local HANDLER=$2
    local DESCRIPTION=$3
    
    if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
        echo "✓ Lambda $FUNCTION_NAME already exists"
    else
        echo "Creating Lambda $FUNCTION_NAME..."
        aws lambda create-function \
            --function-name $FUNCTION_NAME \
            --runtime nodejs20.x \
            --role arn:aws:iam::$ACCOUNT_ID:role/s7abt-lambda-execution-role \
            --handler $HANDLER \
            --zip-file fileb://deployment-package.zip \
            --timeout 30 \
            --memory-size 256 \
            --environment Variables="{TWEET_QUEUE_TABLE=$TABLE_NAME}" \
            --region $REGION
        echo "✓ Created $FUNCTION_NAME"
    fi
}

# Function to deploy a Lambda
deploy_lambda() {
    local FUNCTION_DIR=$1
    local FUNCTION_NAME=$2
    local HANDLER=$3
    local DESCRIPTION=$4
    
    echo "📦 Packaging $FUNCTION_NAME..."
    
    # Create deployment package
    cd $FUNCTION_DIR
    cp ../package.json .
    cp -r ../node_modules . 2>/dev/null || true
    zip -q -r ../deployment-package.zip index.js node_modules/ package.json
    cd ..
    
    # Create or update Lambda
    create_lambda_if_not_exists $FUNCTION_NAME $HANDLER "$DESCRIPTION"
    
    echo "🚀 Deploying $FUNCTION_NAME..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://deployment-package.zip \
        --region $REGION > /dev/null
    
    echo "✓ Deployed $FUNCTION_NAME"
    echo ""
    
    # Cleanup
    rm deployment-package.zip
}

# Deploy all Lambda functions
deploy_lambda "list" "s7abt-tweets-list-dev" "index.handler" "List all tweets with filtering"
deploy_lambda "delete" "s7abt-tweets-delete-dev" "index.handler" "Delete a tweet"
deploy_lambda "approve" "s7abt-tweets-approve-dev" "index.handler" "Approve a tweet"
deploy_lambda "publish" "s7abt-tweets-publish-dev" "index.handler" "Publish a tweet immediately"

echo "✅ All Lambda functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Create API Gateway resources and methods"
echo "2. Deploy API Gateway"
echo "3. Test the endpoints"

