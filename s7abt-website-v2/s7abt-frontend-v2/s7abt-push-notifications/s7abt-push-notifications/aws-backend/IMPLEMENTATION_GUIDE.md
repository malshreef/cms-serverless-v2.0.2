# Push Notifications Implementation Guide

## Overview

This guide provides a complete implementation of browser push notifications for the S7abt Admin platform using AWS services. The system will send notifications to users when new articles, news, tags, or sections are created.

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ Subscribe/Unsubscribe
       │ Update Preferences
       │
       ▼
┌─────────────────────────────────────┐
│         API Gateway                  │
│  + Cognito Authorizer                │
└──────────┬──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│          Lambda Functions                     │
│  • Subscribe Notifications                    │
│  • Unsubscribe Notifications                  │
│  • Update Preferences                         │
│  • Send Push Notifications (with web-push)    │
│  • Test Notification                          │
│  • Content Creation Trigger                   │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│          DynamoDB Tables                      │
│  • push-subscriptions                         │
│  • notification-preferences                   │
└───────────────────────────────────────────────┘
           ▲
           │
           │ DynamoDB Streams
           │
┌──────────┴───────────────────────────────────┐
│          Content Tables                       │
│  • articles                                   │
│  • news                                       │
│  • tags                                       │
│  • sections                                   │
└───────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured
3. **Node.js** 18.x or later
4. **Existing Infrastructure**:
   - Cognito User Pool
   - API Gateway
   - DynamoDB tables for content (articles, news, tags, sections)

## Step 1: Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using the `web-push` npm package:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

Save the output:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
Private Key: UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
```

⚠️ **Important**: Keep the private key secret! Never commit it to source control.

## Step 2: Prepare Lambda Deployment Packages

### Install Dependencies

For each Lambda function that needs dependencies, create a deployment package:

```bash
# Create directory for Lambda packages
mkdir -p lambda-packages

# For sendPushNotifications function (needs web-push)
cd lambda-packages
mkdir send-push-notifications
cd send-push-notifications
npm init -y
npm install web-push --save
zip -r ../sendPushNotifications.zip .
cd ..

# For other functions (no external dependencies needed)
cd ../aws-backend/lambda

# Package each function
zip subscribeNotifications.zip subscribeNotifications.js
zip unsubscribeNotifications.zip unsubscribeNotifications.js
zip notificationPreferences.zip notificationPreferences.js
zip testNotification.zip testNotification.js
zip contentCreationTrigger.zip contentCreationTrigger.js
```

### Create Lambda Layer for web-push

```bash
# Create layer structure
mkdir -p layer/nodejs/node_modules
cd layer/nodejs
npm install web-push --save
cd ../..
zip -r web-push-layer.zip layer
```

## Step 3: Upload to S3

```bash
# Create S3 bucket for deployments
aws s3 mb s3://dev-notification-deployments --region me-central-1

# Upload Lambda packages
aws s3 cp subscribeNotifications.zip s3://dev-notification-deployments/lambda/
aws s3 cp unsubscribeNotifications.zip s3://dev-notification-deployments/lambda/
aws s3 cp notificationPreferences.zip s3://dev-notification-deployments/lambda/
aws s3 cp sendPushNotifications.zip s3://dev-notification-deployments/lambda/
aws s3 cp testNotification.zip s3://dev-notification-deployments/lambda/
aws s3 cp contentCreationTrigger.zip s3://dev-notification-deployments/lambda/

# Upload layer
aws s3 cp web-push-layer.zip s3://dev-notification-deployments/layers/
```

## Step 4: Deploy CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name s7abt-push-notifications \
  --template-body file://cloudformation/push-notifications.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=VapidPublicKey,ParameterValue="YOUR_PUBLIC_KEY_HERE" \
    ParameterKey=VapidPrivateKey,ParameterValue="YOUR_PRIVATE_KEY_HERE" \
    ParameterKey=VapidSubject,ParameterValue="mailto:admin@s7abt.com" \
    ParameterKey=FrontendUrl,ParameterValue="https://admin.s7abt.com" \
    ParameterKey=CognitoUserPoolArn,ParameterValue="YOUR_USER_POOL_ARN" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region me-central-1

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name s7abt-push-notifications \
  --region me-central-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name s7abt-push-notifications \
  --region me-central-1 \
  --query 'Stacks[0].Outputs'
```

## Step 5: Configure DynamoDB Streams

Enable DynamoDB Streams on your existing content tables and connect them to the Content Creation Trigger Lambda:

```bash
# Enable streams on articles table
aws dynamodb update-table \
  --table-name dev-articles \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region me-central-1

# Get stream ARN
STREAM_ARN=$(aws dynamodb describe-table \
  --table-name dev-articles \
  --region me-central-1 \
  --query 'Table.LatestStreamArn' \
  --output text)

# Create event source mapping
aws lambda create-event-source-mapping \
  --function-name dev-content-creation-trigger \
  --event-source-arn $STREAM_ARN \
  --starting-position LATEST \
  --region me-central-1

# Repeat for news, tags, and sections tables
```

## Step 6: Update API Gateway

Add the notification endpoints to your existing API Gateway:

```bash
# Get your existing API Gateway ID
API_ID="<your-api-id>"

# Create authorizer (if not already exists)
AUTHORIZER_ID=$(aws apigatewayv2 create-authorizer \
  --api-id $API_ID \
  --authorizer-type JWT \
  --identity-source '$request.header.Authorization' \
  --jwt-configuration Audience=<your-cognito-client-id>,Issuer=https://cognito-idp.me-central-1.amazonaws.com/<your-cognito-user-pool-id> \
  --name CognitoAuthorizer \
  --region me-central-1 \
  --query 'AuthorizerId' \
  --output text)

# Create integrations and routes
# Subscribe endpoint
SUBSCRIBE_INTEGRATION=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:me-central-1:ACCOUNT_ID:function:dev-subscribe-notifications \
  --payload-format-version 2.0 \
  --region me-central-1 \
  --query 'IntegrationId' \
  --output text)

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'POST /admin/notifications/subscribe' \
  --authorization-type JWT \
  --authorizer-id $AUTHORIZER_ID \
  --target integrations/$SUBSCRIBE_INTEGRATION \
  --region me-central-1

# Unsubscribe endpoint
UNSUBSCRIBE_INTEGRATION=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:me-central-1:ACCOUNT_ID:function:dev-unsubscribe-notifications \
  --payload-format-version 2.0 \
  --region me-central-1 \
  --query 'IntegrationId' \
  --output text)

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'POST /admin/notifications/unsubscribe' \
  --authorization-type JWT \
  --authorizer-id $AUTHORIZER_ID \
  --target integrations/$UNSUBSCRIBE_INTEGRATION \
  --region me-central-1

# Preferences endpoints (GET and PUT)
PREFERENCES_INTEGRATION=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:me-central-1:ACCOUNT_ID:function:dev-notification-preferences \
  --payload-format-version 2.0 \
  --region me-central-1 \
  --query 'IntegrationId' \
  --output text)

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'GET /admin/notifications/preferences' \
  --authorization-type JWT \
  --authorizer-id $AUTHORIZER_ID \
  --target integrations/$PREFERENCES_INTEGRATION \
  --region me-central-1

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'PUT /admin/notifications/preferences' \
  --authorization-type JWT \
  --authorizer-id $AUTHORIZER_ID \
  --target integrations/$PREFERENCES_INTEGRATION \
  --region me-central-1

# Test notification endpoint
TEST_INTEGRATION=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:me-central-1:ACCOUNT_ID:function:dev-test-notification \
  --payload-format-version 2.0 \
  --region me-central-1 \
  --query 'IntegrationId' \
  --output text)

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'POST /admin/notifications/test' \
  --authorization-type JWT \
  --authorizer-id $AUTHORIZER_ID \
  --target integrations/$TEST_INTEGRATION \
  --region me-central-1

# Deploy API
aws apigatewayv2 create-deployment \
  --api-id $API_ID \
  --stage-name dev \
  --region me-central-1
```

## Step 7: Grant Lambda Permissions

Grant API Gateway permission to invoke Lambda functions:

```bash
# For each Lambda function
for FUNCTION in subscribe-notifications unsubscribe-notifications notification-preferences test-notification; do
  aws lambda add-permission \
    --function-name dev-$FUNCTION \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:me-central-1:ACCOUNT_ID:$API_ID/*/*" \
    --region me-central-1
done
```

## Step 8: Frontend Integration

### Update Environment Variables

Add the VAPID public key to your frontend `.env` file:

```bash
# Add to .env
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
```

### Update the Settings Page

Add the NotificationSettings component to your Settings page:

```jsx
// src/pages/Settings.jsx
import NotificationSettings from '../components/NotificationSettings';

function Settings() {
  return (
    <div className="space-y-6">
      {/* Existing settings */}
      
      {/* Add Notification Settings */}
      <NotificationSettings />
    </div>
  );
}
```

### Update the Service Worker

Copy the `sw.js` file to your `public` directory (already done in the files created above).

### Build and Deploy

```bash
npm run build
# Deploy to your hosting service
```

## Step 9: Testing

### Test the Implementation

1. **Open the admin panel** in a browser that supports push notifications (Chrome, Firefox, Edge)

2. **Navigate to Settings** and find the Push Notifications section

3. **Click "Enable Notifications"** and grant permission when prompted

4. **Click "Send Test Notification"** to verify the setup

5. **Create new content** (article, news, tag, or section) and verify that you receive a notification

### Verify Backend

```bash
# Check DynamoDB for subscriptions
aws dynamodb scan \
  --table-name dev-push-subscriptions \
  --region me-central-1

# Check Lambda logs
aws logs tail /aws/lambda/dev-subscribe-notifications --follow

# Test sending notification directly
aws lambda invoke \
  --function-name dev-send-push-notifications \
  --payload '{"body": "{\"type\": \"articles\", \"title\": \"Test\", \"body\": \"Testing\", \"url\": \"/\", \"id\": \"123\"}"}' \
  --region me-central-1 \
  response.json
```

## Step 10: Monitoring and Maintenance

### CloudWatch Dashboards

Create a CloudWatch dashboard to monitor notifications:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name s7abt-notifications \
  --dashboard-body file://cloudwatch-dashboard.json \
  --region me-central-1
```

### Set Up Alarms

```bash
# Alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name notification-lambda-errors \
  --alarm-description "Alert when notification Lambda has errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=dev-send-push-notifications \
  --region me-central-1
```

## Troubleshooting

### Common Issues

1. **Notifications not being received**
   - Check browser permissions
   - Verify VAPID keys are correct
   - Check Lambda logs for errors
   - Ensure DynamoDB streams are enabled

2. **CORS errors**
   - Verify API Gateway CORS configuration
   - Check that Authorization header is included in allowed headers

3. **Subscription fails**
   - Check that the service worker is registered
   - Verify API endpoint is correct
   - Check network tab for errors

4. **Invalid subscriptions**
   - The `sendPushNotifications` Lambda automatically cleans up invalid subscriptions (410 errors)

### Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow --region me-central-1

# View API Gateway logs
aws logs tail /aws/apigateway/API_ID/dev --follow --region me-central-1
```

## Cost Optimization

### Estimated Monthly Costs

- **DynamoDB**: ~$1-5 (based on usage)
- **Lambda**: ~$1-10 (based on invocations)
- **API Gateway**: ~$3.50 per million requests
- **CloudWatch Logs**: ~$0.50 per GB

### Optimization Tips

1. Use DynamoDB on-demand pricing for variable workloads
2. Set appropriate Lambda timeout and memory settings
3. Use Lambda layers to reduce deployment package sizes
4. Implement batch processing for sending notifications
5. Clean up inactive subscriptions regularly

## Security Best Practices

1. **Never expose VAPID private key** in frontend code
2. **Use Cognito authorization** for all API endpoints
3. **Validate all user input** in Lambda functions
4. **Encrypt sensitive data** in DynamoDB
5. **Use IAM roles** with least privilege
6. **Enable API Gateway throttling** to prevent abuse
7. **Monitor CloudWatch logs** for suspicious activity

## Next Steps

1. **Add analytics** to track notification engagement
2. **Implement notification scheduling** for optimal timing
3. **Add rich media support** for notification images
4. **Create admin dashboard** for notification statistics
5. **Implement A/B testing** for notification content
6. **Add multilingual support** for notification text

## Support

For issues or questions:
- Check AWS CloudWatch logs
- Review API Gateway execution logs
- Test with CloudWatch Insights queries
- Monitor DynamoDB metrics

## References

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Amazon DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
