#!/bin/bash
# Setup API Gateway for Tweets CRUD
# Usage: ./setup-tweets-api-gateway.sh

set -e  # Exit on error

# Configuration
API_ID="<your-api-id>"
REGION="me-central-1"
ACCOUNT_ID="<your-aws-account-id>"
ADMIN_RESOURCE_ID="dr5bre"

echo ""
echo "========================================"
echo "  Setting up API Gateway for Tweets"
echo "========================================"
echo "API ID: $API_ID"
echo "Region: $REGION"
echo ""

# Function to create resource if it doesn't exist
create_resource_if_not_exists() {
    local parent_id=$1
    local path_part=$2
    local resource_name=$3
    
    echo "Checking if resource '$path_part' exists..."
    
    # Check if resource exists
    existing_id=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --region $REGION \
        --query "items[?pathPart=='$path_part' && parentId=='$parent_id'].id" \
        --output text)
    
    if [ -n "$existing_id" ]; then
        echo "  ✓ Resource '$path_part' already exists (ID: $existing_id)"
        echo "$existing_id"
    else
        echo "  Creating resource '$path_part'..."
        new_id=$(aws apigateway create-resource \
            --rest-api-id $API_ID \
            --parent-id $parent_id \
            --path-part "$path_part" \
            --region $REGION \
            --query 'id' \
            --output text)
        echo "  ✓ Created resource '$path_part' (ID: $new_id)"
        echo "$new_id"
    fi
}

# Function to create method if it doesn't exist
create_method_if_not_exists() {
    local resource_id=$1
    local http_method=$2
    local lambda_function=$3
    local auth_type=$4
    local authorizer_id=$5
    
    echo "Checking if $http_method method exists..."
    
    # Check if method exists
    method_exists=$(aws apigateway get-method \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method $http_method \
        --region $REGION 2>&1 || echo "not_found")
    
    if [[ "$method_exists" != *"not_found"* ]] && [[ "$method_exists" != *"NotFoundException"* ]]; then
        echo "  ✓ $http_method method already exists"
        return 0
    fi
    
    echo "  Creating $http_method method..."
    
    # Create method
    if [ "$auth_type" == "COGNITO_USER_POOLS" ]; then
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --resource-id $resource_id \
            --http-method $http_method \
            --authorization-type $auth_type \
            --authorizer-id $authorizer_id \
            --region $REGION \
            --output text > /dev/null
    else
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --resource-id $resource_id \
            --http-method $http_method \
            --authorization-type $auth_type \
            --region $REGION \
            --output text > /dev/null
    fi
    
    # Add Lambda integration (if lambda function provided)
    if [ -n "$lambda_function" ]; then
        echo "  Adding Lambda integration..."
        aws apigateway put-integration \
            --rest-api-id $API_ID \
            --resource-id $resource_id \
            --http-method $http_method \
            --type AWS_PROXY \
            --integration-http-method POST \
            --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$lambda_function/invocations" \
            --region $REGION \
            --output text > /dev/null
        
        # Grant permission to API Gateway
        echo "  Granting Lambda permission..."
        aws lambda add-permission \
            --function-name $lambda_function \
            --statement-id "apigateway-${lambda_function}-${RANDOM}" \
            --action lambda:InvokeFunction \
            --principal apigateway.amazonaws.com \
            --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/$http_method/*" \
            --region $REGION \
            --output text > /dev/null 2>&1 || echo "    (Permission may already exist)"
    fi
    
    echo "  ✓ $http_method method created"
}

# Function to enable CORS
enable_cors() {
    local resource_id=$1
    local methods=$2
    
    echo "Enabling CORS for resource..."
    
    # Create OPTIONS method
    echo "  Creating OPTIONS method..."
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION \
        --output text > /dev/null 2>&1 || echo "    (OPTIONS may already exist)"
    
    # Add method response
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' \
        --region $REGION \
        --output text > /dev/null 2>&1 || echo "    (Method response may already exist)"
    
    # Add mock integration
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
        --region $REGION \
        --output text > /dev/null 2>&1 || echo "    (Integration may already exist)"
    
    # Add integration response
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",\"method.response.header.Access-Control-Allow-Methods\":\"'$methods'\",\"method.response.header.Access-Control-Allow-Origin\":\"'*'\"}" \
        --region $REGION \
        --output text > /dev/null 2>&1 || echo "    (Integration response may already exist)"
    
    echo "  ✓ CORS enabled"
}

# Get Cognito authorizer ID
echo "Getting Cognito authorizer..."
AUTHORIZER_ID=$(aws apigateway get-authorizers \
    --rest-api-id $API_ID \
    --region $REGION \
    --query "items[?type=='COGNITO_USER_POOLS'].id" \
    --output text)

if [ -z "$AUTHORIZER_ID" ]; then
    echo "  ✗ Error: Cognito authorizer not found!"
    exit 1
fi
echo "  ✓ Authorizer ID: $AUTHORIZER_ID"
echo ""

# Step 1: Get or create /admin/tweets resource
echo "[1/6] Setting up /admin/tweets..."
TWEETS_RESOURCE_ID=$(create_resource_if_not_exists "$ADMIN_RESOURCE_ID" "tweets" "/admin/tweets")
echo ""

# Step 2: Create GET method for /admin/tweets
echo "[2/6] Setting up GET /admin/tweets..."
create_method_if_not_exists "$TWEETS_RESOURCE_ID" "GET" "s7abt-tweets-list-dev" "COGNITO_USER_POOLS" "$AUTHORIZER_ID"
enable_cors "$TWEETS_RESOURCE_ID" "GET,OPTIONS"
echo ""

# Step 3: Get or create /admin/tweets/{id} resource
echo "[3/6] Setting up /admin/tweets/{id}..."
TWEET_ID_RESOURCE_ID=$(create_resource_if_not_exists "$TWEETS_RESOURCE_ID" "{id}" "/admin/tweets/{id}")
echo ""

# Step 4: Create DELETE method for /admin/tweets/{id}
echo "[4/6] Setting up DELETE /admin/tweets/{id}..."
create_method_if_not_exists "$TWEET_ID_RESOURCE_ID" "DELETE" "s7abt-tweets-delete-dev" "COGNITO_USER_POOLS" "$AUTHORIZER_ID"
enable_cors "$TWEET_ID_RESOURCE_ID" "DELETE,OPTIONS"
echo ""

# Step 5: Get or create /admin/tweets/{id}/publish resource
echo "[5/6] Setting up /admin/tweets/{id}/publish..."
PUBLISH_RESOURCE_ID=$(create_resource_if_not_exists "$TWEET_ID_RESOURCE_ID" "publish" "/admin/tweets/{id}/publish")
echo ""

# Step 6: Create POST method for /admin/tweets/{id}/publish
echo "[6/6] Setting up POST /admin/tweets/{id}/publish..."
create_method_if_not_exists "$PUBLISH_RESOURCE_ID" "POST" "s7abt-tweets-publish-dev" "COGNITO_USER_POOLS" "$AUTHORIZER_ID"
enable_cors "$PUBLISH_RESOURCE_ID" "POST,OPTIONS"
echo ""

# Deploy API
echo "Deploying API to 'dev' stage..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name dev \
    --region $REGION \
    --query 'id' \
    --output text)
echo "  ✓ Deployment ID: $DEPLOYMENT_ID"
echo ""

echo "========================================"
echo "  ✓ API Gateway Setup Complete!"
echo "========================================"
echo ""
echo "Endpoints created:"
echo "  GET    https://$API_ID.execute-api.$REGION.amazonaws.com/dev/admin/tweets"
echo "  DELETE https://$API_ID.execute-api.$REGION.amazonaws.com/dev/admin/tweets/{id}"
echo "  POST   https://$API_ID.execute-api.$REGION.amazonaws.com/dev/admin/tweets/{id}/publish"
echo ""
echo "Resources created:"
echo "  /admin/tweets              (ID: $TWEETS_RESOURCE_ID)"
echo "  /admin/tweets/{id}         (ID: $TWEET_ID_RESOURCE_ID)"
echo "  /admin/tweets/{id}/publish (ID: $PUBLISH_RESOURCE_ID)"
echo ""
echo "Next steps:"
echo "  1. Clear browser cache (Ctrl+Shift+Delete)"
echo "  2. Refresh your admin dashboard"
echo "  3. Test the Tweets page"
echo ""

