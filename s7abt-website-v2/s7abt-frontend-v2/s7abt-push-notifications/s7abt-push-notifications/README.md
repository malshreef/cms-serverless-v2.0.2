# S7abt Push Notifications System

A comprehensive browser push notifications system for the S7abt admin platform, built with AWS services.

## 🚀 Features

- **Browser Push Notifications**: Native browser notifications using Web Push API
- **AWS-Powered Backend**: Serverless architecture using Lambda, DynamoDB, SNS, and API Gateway
- **Real-time Content Updates**: Automatic notifications when new content is published
- **User Preferences**: Granular control over notification types (articles, news, tags, sections)
- **Subscription Management**: Easy subscribe/unsubscribe functionality
- **Multi-language Support**: Ready for Arabic and English notifications
- **Automatic Cleanup**: Invalid subscriptions are automatically removed
- **Scalable**: Built on AWS serverless architecture for unlimited scale

## 📋 Architecture

### Frontend Components
- **NotificationSettings.jsx**: React component for managing notification preferences
- **pushNotifications.js**: Service for handling push notification subscriptions
- **sw.js**: Service Worker for receiving and displaying notifications

### Backend Services (AWS)
- **Lambda Functions**:
  - `subscribeNotifications`: Handle user subscriptions
  - `unsubscribeNotifications`: Handle user unsubscriptions
  - `notificationPreferences`: Manage user preferences
  - `sendPushNotifications`: Send push notifications to subscribers
  - `testNotification`: Send test notifications
  - `contentCreationTrigger`: Automatically send notifications when content is created

- **DynamoDB Tables**:
  - `push-subscriptions`: Store user subscription data
  - `notification-preferences`: Store user notification preferences

- **API Gateway**: RESTful API for notification management
- **DynamoDB Streams**: Trigger notifications on content creation
- **SNS**: Optional email notifications

## 🛠️ Installation

### Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS account with required permissions
- Existing S7abt infrastructure (Cognito, API Gateway, DynamoDB)

### Quick Start

1. **Generate VAPID Keys**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Deploy Backend**
   ```bash
   cd aws-backend
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Configure Frontend**
   ```bash
   # Add to your .env file
   echo "VITE_VAPID_PUBLIC_KEY=your_public_key_here" >> .env
   ```

4. **Build and Deploy Frontend**
   ```bash
   npm install
   npm run build
   # Deploy to your hosting service
   ```

For detailed installation instructions, see [IMPLEMENTATION_GUIDE.md](aws-backend/IMPLEMENTATION_GUIDE.md).

## 📖 Usage

### Frontend Integration

1. **Add NotificationSettings to your Settings page**:
   ```jsx
   import NotificationSettings from '../components/NotificationSettings';

   function Settings() {
     return (
       <div>
         <NotificationSettings />
       </div>
     );
   }
   ```

2. **Subscribe to Notifications**:
   ```javascript
   import { subscribeToPush } from '../lib/pushNotifications';

   await subscribeToPush();
   ```

3. **Update Preferences**:
   ```javascript
   import { updateNotificationPreferences } from '../lib/pushNotifications';

   await updateNotificationPreferences({
     articles: true,
     news: true,
     tags: false,
     sections: false
   });
   ```

### Backend - Sending Notifications

**Manually trigger a notification**:
```bash
aws lambda invoke \
  --function-name dev-send-push-notifications \
  --payload '{
    "body": "{
      \"type\": \"articles\",
      \"title\": \"New Article Published\",
      \"body\": \"Check out our latest article!\",
      \"url\": \"/articles/123\",
      \"id\": \"123\"
    }"
  }' \
  --region me-central-1 \
  response.json
```

**Automatic notifications** are sent via DynamoDB Streams when content is created.

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env`):
```bash
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_API_ENDPOINT=https://your-api-gateway-url
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_CLIENT_ID=your_client_id
VITE_AWS_REGION=me-central-1
```

**Backend** (CloudFormation parameters):
- `VapidPublicKey`: VAPID public key
- `VapidPrivateKey`: VAPID private key (keep secret!)
- `VapidSubject`: VAPID subject (email or URL)
- `FrontendUrl`: Your frontend URL
- `CognitoUserPoolArn`: Cognito User Pool ARN

## 📊 Monitoring

### CloudWatch Metrics

Monitor these key metrics:
- Lambda invocation count and errors
- DynamoDB read/write capacity
- API Gateway request count and latency
- Push notification success/failure rate

### CloudWatch Logs

View logs for each Lambda function:
```bash
aws logs tail /aws/lambda/dev-send-push-notifications --follow
```

## 🐛 Troubleshooting

### Notifications not appearing

1. Check browser permissions (Settings > Privacy > Notifications)
2. Verify service worker is registered (DevTools > Application > Service Workers)
3. Check Lambda logs for errors
4. Ensure VAPID keys are correct

### Subscription fails

1. Verify API endpoint is correct
2. Check CORS configuration
3. Ensure user is authenticated
4. Check network tab for errors

### Content notifications not sent

1. Verify DynamoDB Streams are enabled
2. Check event source mapping is active
3. Review content creation trigger Lambda logs
4. Ensure content tables have streams configured

For more troubleshooting tips, see the [Implementation Guide](aws-backend/IMPLEMENTATION_GUIDE.md).

## 💰 Cost Estimation

**Monthly costs** (based on 1,000 active users, 100 notifications/day):

- DynamoDB: ~$2-5
- Lambda: ~$1-3
- API Gateway: ~$0.50
- CloudWatch Logs: ~$0.50
- SNS (optional): ~$0.50

**Total**: ~$5-10/month

Costs scale linearly with usage. See [Cost Optimization](aws-backend/IMPLEMENTATION_GUIDE.md#cost-optimization) for tips.

## 🔒 Security

- ✅ Cognito authentication for all API endpoints
- ✅ VAPID keys for secure push notifications
- ✅ IAM roles with least privilege
- ✅ HTTPS only
- ✅ Input validation on all endpoints
- ✅ Rate limiting via API Gateway
- ✅ CloudWatch logging for audit trail

## 🤝 Contributing

This is a private implementation for S7abt. For issues or improvements, contact the development team.

## 📄 License

Private - All rights reserved by S7abt

## 🙏 Acknowledgments

Built with:
- [Web Push](https://github.com/web-push-libs/web-push) - Web Push library for Node.js
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - AWS SDK for JavaScript
- [React](https://reactjs.org/) - Frontend framework
- [Lucide React](https://lucide.dev/) - Icon library

## 📞 Support

For questions or issues:
1. Check the [Implementation Guide](aws-backend/IMPLEMENTATION_GUIDE.md)
2. Review CloudWatch logs
3. Contact the development team

---

**Note**: Keep your VAPID private key and AWS credentials secure. Never commit them to source control.
