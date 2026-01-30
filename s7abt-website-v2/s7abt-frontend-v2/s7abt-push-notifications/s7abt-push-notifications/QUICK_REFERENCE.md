# Quick Reference Guide

## 🎯 Common Commands

### Frontend

```bash
# Install dependencies
npm install

# Add NotificationSettings component
# Add to src/pages/Settings.jsx:
import NotificationSettings from '../components/NotificationSettings';

# Update .env file
VITE_VAPID_PUBLIC_KEY=your_public_key_here

# Build and run
npm run dev          # Development
npm run build        # Production build
```

### Backend Deployment

```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Deploy everything
cd aws-backend
./deploy.sh

# Or deploy manually
aws cloudformation deploy --template-file cloudformation/push-notifications.yaml ...
```

### Testing

```bash
# Test subscription
curl -X POST https://your-api.amazonaws.com/dev/admin/notifications/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscription": {...}}'

# Send test notification
aws lambda invoke \
  --function-name dev-test-notification \
  response.json
```

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/notifications/subscribe` | POST | Subscribe to notifications |
| `/admin/notifications/unsubscribe` | POST | Unsubscribe from notifications |
| `/admin/notifications/preferences` | GET | Get user preferences |
| `/admin/notifications/preferences` | PUT | Update user preferences |
| `/admin/notifications/test` | POST | Send test notification |

## 🔑 Required Permissions

### IAM User/Role Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "dynamodb:*",
        "apigateway:*",
        "iam:*",
        "s3:*",
        "logs:*",
        "sns:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## 📦 File Structure

```
s7abt-admin-notifications/
├── src/
│   ├── components/
│   │   └── NotificationSettings.jsx    # UI component
│   └── lib/
│       └── pushNotifications.js        # Service layer
├── public/
│   └── sw.js                           # Service worker
├── aws-backend/
│   ├── lambda/
│   │   ├── subscribeNotifications.js
│   │   ├── unsubscribeNotifications.js
│   │   ├── notificationPreferences.js
│   │   ├── sendPushNotifications.js
│   │   ├── testNotification.js
│   │   └── contentCreationTrigger.js
│   ├── cloudformation/
│   │   └── push-notifications.yaml
│   ├── deploy.sh
│   ├── IMPLEMENTATION_GUIDE.md
│   └── package.json
└── README.md
```

## 🎨 Notification Payload Format

```javascript
{
  type: 'articles',      // 'articles', 'news', 'tags', 'sections'
  title: 'Notification Title',
  body: 'Notification body text',
  url: '/articles/123',  // URL to navigate to
  id: '123',            // Content ID
  imageUrl: 'https://...',  // Optional image
  targetUsers: ['user-id']  // Optional: specific users
}
```

## 🔄 Workflow

### User Subscription Flow

```
1. User clicks "Enable Notifications"
2. Browser requests permission
3. User grants permission
4. Service worker registers
5. Browser creates push subscription
6. Frontend sends subscription to API
7. Lambda stores in DynamoDB
8. User receives confirmation
```

### Notification Sending Flow

```
1. Content created in DynamoDB
2. DynamoDB Stream triggers Lambda
3. Lambda queries active subscriptions
4. Lambda filters by user preferences
5. Lambda sends push to each subscription
6. Browser receives push event
7. Service worker displays notification
8. User clicks notification
9. Browser navigates to URL
```

## 🐛 Debug Checklist

- [ ] VAPID keys are correct and match
- [ ] Service worker is registered
- [ ] Browser has notification permission
- [ ] User is authenticated
- [ ] API endpoints are accessible
- [ ] Lambda functions have correct permissions
- [ ] DynamoDB tables exist
- [ ] DynamoDB Streams are enabled
- [ ] Event source mappings are active
- [ ] CloudWatch logs show no errors

## 📊 Key Metrics to Monitor

1. **Subscription Success Rate**: subscriptions / attempts
2. **Notification Delivery Rate**: delivered / sent
3. **Click-Through Rate**: clicks / delivered
4. **Unsubscribe Rate**: unsubscribes / total subscriptions
5. **Lambda Error Rate**: errors / invocations
6. **API Latency**: average response time

## 🔧 Configuration Checklist

### Frontend Setup
- [ ] Install dependencies (`npm install`)
- [ ] Add VAPID public key to `.env`
- [ ] Import and add `NotificationSettings` component
- [ ] Copy `sw.js` to `public/` directory
- [ ] Build and deploy

### Backend Setup
- [ ] Generate VAPID keys
- [ ] Create S3 bucket for deployments
- [ ] Deploy CloudFormation stack
- [ ] Add API Gateway routes
- [ ] Enable DynamoDB Streams
- [ ] Create event source mappings
- [ ] Grant Lambda permissions
- [ ] Test endpoints

### Testing
- [ ] Browser allows notifications
- [ ] Subscription works
- [ ] Test notification received
- [ ] Create content triggers notification
- [ ] Preferences update correctly
- [ ] Unsubscribe works

## 📞 Emergency Contacts

### AWS Resources
- CloudFormation Stack: `s7abt-push-notifications`
- DynamoDB Tables: `dev-push-subscriptions`, `dev-notification-preferences`
- Lambda Functions: `dev-*-notifications`
- S3 Bucket: `dev-notification-deployments`

### Logs
```bash
# View all Lambda logs
for fn in subscribe-notifications unsubscribe-notifications notification-preferences send-push-notifications test-notification content-creation-trigger; do
  echo "=== $fn ==="
  aws logs tail /aws/lambda/dev-$fn --since 1h
done
```

## 🚨 Rollback Procedure

```bash
# List stack events
aws cloudformation describe-stack-events --stack-name s7abt-push-notifications

# Rollback to previous version
aws cloudformation update-stack \
  --stack-name s7abt-push-notifications \
  --use-previous-template

# Or delete stack entirely
aws cloudformation delete-stack --stack-name s7abt-push-notifications
```

## 💡 Tips and Tricks

1. **Test locally**: Use ngrok to test push notifications on localhost
2. **Debug service worker**: Use Chrome DevTools > Application > Service Workers
3. **Clear subscription**: Use browser DevTools to clear push subscriptions
4. **Monitor costs**: Set up AWS Budget alerts
5. **Batch notifications**: Send multiple notifications in one Lambda invocation
6. **Cache subscriptions**: Use DynamoDB DAX for better performance
7. **Rate limit**: Implement rate limiting to prevent spam
8. **Schedule notifications**: Use EventBridge for scheduled notifications

## 🎓 Learn More

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
