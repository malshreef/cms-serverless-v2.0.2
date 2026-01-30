#!/bin/bash

# Setup API Gateway for Tweets CRUD
# Usage: ./setup-api-gateway.sh

set -e

API_ID="<your-api-id>"
REGION="me-central-1"
ACCOUNT_ID="<your-aws-account-id>"
ADMIN_RESOURCE_ID="dr5bre"

echo "🔧 Setting up API Gateway for Tweets..."
echo "API ID: $API_ID"
echo "Region: $REGION"
echo ""

# Step 1: Create /admin/tweets resource
echo "1️⃣ Creating /admin/tweets resource..."
TWEETS_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ADMIN_RESOURCE_ID \
    --path-part tweets \
    --region $REGION)

TWEETS_RESOURCE_ID=$(echo $TWEETS_RESOURCE | jq -r '.id')
echo "✓ Created /admin/tweets (ID: $TWEETS_RESOURCE_ID)"
echo ""

# Step 2: Create /admin/tweets/{id} resource
echo "2️⃣ Creating /admin/tweets/{id} resource..."
TWEET_ID_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $TWEETS_RESOURCE_ID \
    --path-part '{id}' \
    --region $REGION)

TWEET_ID_RESOURCE_ID=$(echo $TWEET_ID_RESOURCE | jq -r '.id')
echo "✓ Created /admin/tweets/{id} (ID: $TWEET_ID_RESOURCE_ID)"
echo ""

# Step 3: Create /admin/tweets/{id}/approve resource
echo "3️⃣ Creating /admin/tweets/{id}/approve resource..."
APPROVE_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $TWEET_ID_RESOURCE_ID \
    --path-part approve \
    --region $REGION)

APPROVE_RESOURCE_ID=$(echo $APPROVE_RESOURCE | jq -r '.id')
echo "✓ Created /admin/tweets/{id}/approve (ID: $APPROVE_RESOURCE_ID)"
echo ""

# Step 4: Create /admin/tweets/{id}/publish resource
echo "4️⃣ Creating /admin/tweets/{id}/publish resource..."
PUBLISH_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $TWEET_ID_RESOURCE_ID \
    --path-part publish \
    --region $REGION)

PUBLISH_RESOURCE_ID=$(echo $PUBLISH_RESOURCE | jq -r '.id')
echo "✓ Created /admin/tweets/{id}/publish (ID: $PUBLISH_RESOURCE_ID)"
echo ""

# Get authorizer ID
echo "5️⃣ Getting Cognito authorizer..."
AUTHORIZER_ID=$(aws apigateway get-authorizers \
    --rest-api-id $API_ID \
    --query 'items[?type==`COGNITO_USER_POOLS`].id' \
    --output text \
    --region $REGION)
echo "✓ Authorizer ID: $AUTHORIZER_ID"
echo ""

# Step 6: Create GET method for /admin/tweets (list)
echo "6️⃣ Creating GET /admin/tweets..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $TWEETS_RESOURCE_ID \
    --http-method GET \
    --authorization-type COGNITO_USER_POOLS \
    --authorizer-id $AUTHORIZER_ID \
    --region $REGION > /dev/null

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $TWEETS_RESOURCE_ID \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:s7abt-tweets-list-dev/invocations \
    --region $REGION > /dev/null

aws lambda add-permission \
    --function-name s7abt-tweets-list-dev \
    --statement-id apigateway-tweets-list \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/GET/admin/tweets" \
    --region $REGION 2>/dev/null || true

echo "✓ Created GET /admin/tweets"
echo ""

# Step 7: Create DELETE method for /admin/tweets/{id}
echo "7️⃣ Creating DELETE /admin/tweets/{id}..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $TWEET_ID_RESOURCE_ID \
    --http-method DELETE \
    --authorization-type COGNITO_USER_POOLS \
    --authorizer-id $AUTHORIZER_ID \
    --region $REGION > /dev/null

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $TWEET_ID_RESOURCE_ID \
    --http-method DELETE \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:s7abt-tweets-delete-dev/invocations \
    --region $REGION > /dev/null

aws lambda add-permission \
    --function-name s7abt-tweets-delete-dev \
    --statement-id apigateway-tweets-delete \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/DELETE/admin/tweets/*" \
    --region $REGION 2>/dev/null || true

echo "✓ Created DELETE /admin/tweets/{id}"
echo ""

# Step 8: Create POST method for /admin/tweets/{id}/approve
echo "8️⃣ Creating POST /admin/tweets/{id}/approve..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $APPROVE_RESOURCE_ID \
    --http-method POST \
    --authorization-type COGNITO_USER_POOLS \
    --authorizer-id $AUTHORIZER_ID \
    --region $REGION > /dev/null

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $APPROVE_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:s7abt-tweets-approve-dev/invocations \
    --region $REGION > /dev/null

aws lambda add-permission \
    --function-name s7abt-tweets-approve-dev \
    --statement-id apigateway-tweets-approve \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/admin/tweets/*/approve" \
    --region $REGION 2>/dev/null || true

echo "✓ Created POST /admin/tweets/{id}/approve"
echo ""

# Step 9: Create POST method for /admin/tweets/{id}/publish
echo "9️⃣ Creating POST /admin/tweets/{id}/publish..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PUBLISH_RESOURCE_ID \
    --http-method POST \
    --authorization-type COGNITO_USER_POOLS \
    --authorizer-id $AUTHORIZER_ID \
    --region $REGION > /dev/null

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PUBLISH_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:s7abt-tweets-publish-dev/invocations \
    --region $REGION > /dev/null

aws lambda add-permission \
    --function-name s7abt-tweets-publish-dev \
    --statement-id apigateway-tweets-publish \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/admin/tweets/*/publish" \
    --region $REGION 2>/dev/null || true

echo "✓ Created POST /admin/tweets/{id}/publish"
echo ""

# Step 10: Enable CORS for all resources
echo "🔟 Enabling CORS..."
for RESOURCE_ID in $TWEETS_RESOURCE_ID $TWEET_ID_RESOURCE_ID $APPROVE_RESOURCE_ID $PUBLISH_RESOURCE_ID; do
    # Create OPTIONS method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION 2>/dev/null || true
    
    # Add method response
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":true,\"method.response.header.Access-Control-Allow-Methods\":true,\"method.response.header.Access-Control-Allow-Origin\":true}" \
        --region $REGION 2>/dev/null || true
    
    # Add mock integration
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates "{\"application/json\":\"{\\\"statusCode\\\": 200}\"}" \
        --region $REGION 2>/dev/null || true
    
    # Add integration response
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\",\"method.response.header.Access-Control-Allow-Origin\":\"'*'\"}" \
        --region $REGION 2>/dev/null || true
done
echo "✓ CORS enabled"
echo ""

# Step 11: Deploy API
echo "🚀 Deploying API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name dev \
    --region $REGION > /dev/null

echo "✓ API deployed"
echo ""

echo "✅ API Gateway setup complete!"
echo ""
echo "Endpoints created:"
echo "  GET    https://$API_ID.execute-api.$REGION.amazonaws.com/dev/admin/tweets"
echo "  DELETE https://$API_ID.execute-api.$REGION.amazonaws.com/dev/admin/tweets/{id}"
echo "  POST   https://$API_ID.execute-api.$REGION.amazonaws.com/dev/admin/tweets/{id}/approve"
echo "  POST   https://$API_ID.execute-api.$REGION.amazonaws.com/dev/admin/tweets/{id}/publish"

