#!/bin/bash

# S7abt Push Notifications - Deployment Script
# This script automates the deployment of push notification infrastructure

set -e

echo "🚀 S7abt Push Notifications Deployment"
echo "======================================="
echo ""

# Configuration
REGION="me-central-1"
ENVIRONMENT="dev"
STACK_NAME="s7abt-push-notifications"
DEPLOYMENT_BUCKET="${ENVIRONMENT}-notification-deployments"

# Check for required tools
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "❌ zip is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"
echo ""

# Prompt for VAPID keys
echo "📝 VAPID Keys Configuration"
echo "If you don't have VAPID keys yet, generate them with: npx web-push generate-vapid-keys"
echo ""
read -p "Enter VAPID Public Key: " VAPID_PUBLIC_KEY
read -sp "Enter VAPID Private Key: " VAPID_PRIVATE_KEY
echo ""
read -p "Enter VAPID Subject (e.g., mailto:admin@s7abt.com): " VAPID_SUBJECT
echo ""

# Prompt for other parameters
read -p "Enter Cognito User Pool ARN: " COGNITO_USER_POOL_ARN
read -p "Enter Frontend URL (default: https://admin.s7abt.com): " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-https://admin.s7abt.com}

echo ""
echo "🏗️  Building Lambda packages..."

# Create build directory
mkdir -p build/lambda
mkdir -p build/layers

# Package Lambda functions
cd lambda

echo "  • Packaging subscribeNotifications..."
zip -q ../build/lambda/subscribeNotifications.zip subscribeNotifications.js

echo "  • Packaging unsubscribeNotifications..."
zip -q ../build/lambda/unsubscribeNotifications.zip unsubscribeNotifications.js

echo "  • Packaging notificationPreferences..."
zip -q ../build/lambda/notificationPreferences.zip notificationPreferences.js

echo "  • Packaging testNotification..."
zip -q ../build/lambda/testNotification.zip testNotification.js

echo "  • Packaging contentCreationTrigger..."
zip -q ../build/lambda/contentCreationTrigger.zip contentCreationTrigger.js

# Package sendPushNotifications with dependencies
echo "  • Building sendPushNotifications with dependencies..."
mkdir -p ../build/temp/send-push
cp sendPushNotifications.js ../build/temp/send-push/
cd ../build/temp/send-push
npm init -y > /dev/null 2>&1
npm install web-push --save > /dev/null 2>&1
zip -q -r ../../lambda/sendPushNotifications.zip . > /dev/null 2>&1
cd ../../../lambda

echo "  • Creating web-push Lambda layer..."
cd ../build/temp
mkdir -p layer/nodejs
cd layer/nodejs
npm init -y > /dev/null 2>&1
npm install web-push --save > /dev/null 2>&1
cd ../..
zip -q -r ../layers/web-push-layer.zip layer > /dev/null 2>&1
cd ../../

echo "✅ Lambda packages built"
echo ""

echo "☁️  Creating S3 deployment bucket..."
aws s3 mb s3://${DEPLOYMENT_BUCKET} --region ${REGION} 2>/dev/null || echo "  Bucket already exists"

echo "📤 Uploading Lambda packages to S3..."
aws s3 cp build/lambda/ s3://${DEPLOYMENT_BUCKET}/lambda/ --recursive --quiet
aws s3 cp build/layers/ s3://${DEPLOYMENT_BUCKET}/layers/ --recursive --quiet

echo "✅ Upload complete"
echo ""

echo "🎯 Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file cloudformation/push-notifications.yaml \
  --stack-name ${STACK_NAME} \
  --parameter-overrides \
    Environment=${ENVIRONMENT} \
    VapidPublicKey=${VAPID_PUBLIC_KEY} \
    VapidPrivateKey=${VAPID_PRIVATE_KEY} \
    VapidSubject=${VAPID_SUBJECT} \
    FrontendUrl=${FRONTEND_URL} \
    CognitoUserPoolArn=${COGNITO_USER_POOL_ARN} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${REGION}

echo ""
echo "✅ CloudFormation stack deployed successfully!"
echo ""

echo "📊 Getting stack outputs..."
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Next Steps:"
echo "1. Add the VAPID public key to your frontend .env file:"
echo "   VITE_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}"
echo ""
echo "2. Enable DynamoDB Streams on your content tables and connect to the trigger Lambda"
echo ""
echo "3. Update your API Gateway to include the notification endpoints"
echo ""
echo "4. Test the implementation:"
echo "   - Enable notifications in the admin panel"
echo "   - Send a test notification"
echo "   - Create new content and verify notifications are sent"
echo ""
echo "📖 See IMPLEMENTATION_GUIDE.md for detailed instructions"

# Cleanup
rm -rf build/temp

echo ""
echo "✨ Done!"
