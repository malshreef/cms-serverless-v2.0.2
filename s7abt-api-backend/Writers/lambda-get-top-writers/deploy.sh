#!/bin/bash

###############################################################################
# Lambda Deployment Script - Get Top Writers
# 
# This script packages and deploys the Lambda function to AWS
# 
# Prerequisites:
# - AWS CLI configured with appropriate credentials
# - Node.js 18.x or higher
# - npm installed
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_NAME="GetTopWriters"
RUNTIME="nodejs18.x"
HANDLER="get-writers.handler"
MEMORY_SIZE="256"
TIMEOUT="30"
REGION="${AWS_REGION:-me-central-1}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Lambda Deployment Script - Get Top Writers${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Step 1: Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js and npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Step 2: Installing dependencies...${NC}"
npm install --production
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo

# Step 3: Create deployment package
echo -e "${YELLOW}📦 Step 3: Creating deployment package...${NC}"

# Remove old zip if exists
rm -f function.zip

# Create zip with Lambda function and dependencies
zip -r function.zip get-writers.js shared/ node_modules/ -x "*.git*" "*.DS_Store" "test-local.js" "deploy.sh"

echo -e "${GREEN}✅ Deployment package created: function.zip${NC}"
echo

# Step 4: Check if function exists
echo -e "${YELLOW}🔍 Step 4: Checking if Lambda function exists...${NC}"

if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    echo -e "${BLUE}📝 Function exists. Updating...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip \
        --region $REGION
    
    echo -e "${GREEN}✅ Lambda function updated successfully${NC}"
else
    echo -e "${RED}❌ Function does not exist.${NC}"
    echo -e "${YELLOW}💡 Please create the function first using AWS Console or AWS CLI:${NC}"
    echo
    echo -e "${BLUE}aws lambda create-function \\${NC}"
    echo -e "${BLUE}  --function-name $FUNCTION_NAME \\${NC}"
    echo -e "${BLUE}  --runtime $RUNTIME \\${NC}"
    echo -e "${BLUE}  --role YOUR_LAMBDA_EXECUTION_ROLE_ARN \\${NC}"
    echo -e "${BLUE}  --handler $HANDLER \\${NC}"
    echo -e "${BLUE}  --zip-file fileb://function.zip \\${NC}"
    echo -e "${BLUE}  --timeout $TIMEOUT \\${NC}"
    echo -e "${BLUE}  --memory-size $MEMORY_SIZE \\${NC}"
    echo -e "${BLUE}  --region $REGION${NC}"
    echo
    exit 1
fi

echo

# Step 5: Update configuration if needed
echo -e "${YELLOW}⚙️  Step 5: Verifying configuration...${NC}"

aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --timeout $TIMEOUT \
    --memory-size $MEMORY_SIZE \
    --region $REGION \
    &> /dev/null

echo -e "${GREEN}✅ Configuration verified${NC}"
echo

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${YELLOW}📊 Function Details:${NC}"
echo -e "   Name:     $FUNCTION_NAME"
echo -e "   Runtime:  $RUNTIME"
echo -e "   Handler:  $HANDLER"
echo -e "   Memory:   ${MEMORY_SIZE}MB"
echo -e "   Timeout:  ${TIMEOUT}s"
echo -e "   Region:   $REGION"
echo
echo -e "${YELLOW}🔗 Next Steps:${NC}"
echo -e "   1. Set environment variables in Lambda Console:"
echo -e "      - DB_SECRET_ARN"
echo -e "      - AWS_REGION"
echo
echo -e "   2. Test the function in Lambda Console or with:"
echo -e "      ${BLUE}aws lambda invoke --function-name $FUNCTION_NAME --region $REGION response.json${NC}"
echo
echo -e "   3. View logs with:"
echo -e "      ${BLUE}aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION${NC}"
echo
echo -e "${GREEN}🎉 Happy coding!${NC}"
echo
