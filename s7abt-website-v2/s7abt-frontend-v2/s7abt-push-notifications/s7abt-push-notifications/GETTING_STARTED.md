# Getting Started with S7abt Push Notifications

Welcome! This guide will help you get push notifications up and running quickly.

## 🎯 What You're Building

A complete push notification system that:
- ✅ Sends browser notifications when new content is published
- ✅ Lets users control what types of notifications they receive
- ✅ Works across Chrome, Firefox, and Edge browsers
- ✅ Scales automatically using AWS services
- ✅ Costs only $5-10/month for typical usage

## 🚀 Quick Start (15 minutes)

### Step 1: Generate VAPID Keys (2 minutes)

```bash
npx web-push generate-vapid-keys
```

Save both keys - you'll need them!

### Step 2: Deploy Backend (5 minutes)

```bash
cd aws-backend
chmod +x deploy.sh
./deploy.sh
```

The script will ask for:
- VAPID keys (from step 1)
- Cognito User Pool ARN
- Frontend URL

### Step 3: Configure Frontend (3 minutes)

Add to your `.env` file:
```bash
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

Add to your Settings page:
```jsx
import NotificationSettings from '../components/NotificationSettings';

// In your Settings component:
<NotificationSettings />
```

### Step 4: Test It (5 minutes)

1. Build and run your frontend: `npm run dev`
2. Navigate to Settings
3. Click "Enable Notifications"
4. Click "Send Test Notification"
5. You should see a notification! 🎉

## 📁 What's Included

```
s7abt-push-notifications/
├── 📄 README.md                          # Main documentation
├── 📄 QUICK_REFERENCE.md                 # Quick commands reference
├── 📄 IMPLEMENTATION_CHECKLIST.md        # Step-by-step checklist
├── 📄 ARCHITECTURE.md                    # System architecture
├── 🔧 NotificationSettings.jsx          # React component
├── 🔧 pushNotifications.js              # Service layer
├── 🔧 sw.js                             # Service worker
└── aws-backend/
    ├── 📄 IMPLEMENTATION_GUIDE.md        # Detailed guide
    ├── 🚀 deploy.sh                     # Deployment script
    ├── 📦 package.json                  # Dependencies
    ├── cloudformation/
    │   └── push-notifications.yaml      # AWS infrastructure
    └── lambda/
        ├── subscribeNotifications.js    # Handle subscriptions
        ├── unsubscribeNotifications.js  # Handle unsubscriptions
        ├── notificationPreferences.js   # Manage preferences
        ├── sendPushNotifications.js     # Send notifications
        ├── testNotification.js          # Test notifications
        └── contentCreationTrigger.js    # Auto-send on new content
```

## 🎨 How It Works

### When a user subscribes:
1. User clicks "Enable Notifications"
2. Browser asks for permission
3. Service worker registers
4. Subscription data sent to AWS
5. Stored in DynamoDB
6. User receives confirmation

### When content is published:
1. New article/news/tag/section created
2. DynamoDB Stream triggers Lambda
3. Lambda gets all subscriptions
4. Filters by user preferences
5. Sends push to each subscriber
6. Browser shows notification

## 🔑 Key Files Explained

### Frontend Files

**NotificationSettings.jsx**
- The UI component users see
- Shows subscription status
- Lets users manage preferences
- Handles test notifications

**pushNotifications.js**
- Talks to the backend API
- Manages subscriptions
- Handles service worker registration
- Core notification logic

**sw.js**
- Runs in the background
- Receives push events
- Shows notifications
- Handles clicks

### Backend Files

**Lambda Functions**
- Handle all backend logic
- Process subscriptions
- Send notifications
- Manage preferences

**CloudFormation Template**
- Defines AWS infrastructure
- Creates all resources
- One command deployment

## 🎯 Common Tasks

### Send a test notification
```javascript
import { sendTestNotification } from '../lib/pushNotifications';
await sendTestNotification();
```

### Update user preferences
```javascript
import { updateNotificationPreferences } from '../lib/pushNotifications';
await updateNotificationPreferences({
  articles: true,
  news: false,
  tags: true,
  sections: false
});
```

### Check subscription status
```javascript
import { getSubscription } from '../lib/pushNotifications';
const subscription = await getSubscription();
console.log(subscription ? 'Subscribed' : 'Not subscribed');
```

## ⚠️ Important Notes

### VAPID Private Key
- **Never** commit to Git
- Store in AWS Secrets Manager
- Only use in CloudFormation parameters

### Browser Support
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Opera 37+
- ❌ Safari (limited support)

### Permissions
- Users must grant notification permission
- Permission is per-origin
- Can't be requested too frequently

## 🐛 Troubleshooting

### Notifications not appearing?

1. **Check browser permission**
   - Chrome: Settings > Privacy > Site Settings > Notifications
   - Firefox: Settings > Privacy & Security > Permissions > Notifications

2. **Verify service worker**
   - DevTools > Application > Service Workers
   - Should show "activated and running"

3. **Check console for errors**
   - Look for errors in browser console
   - Check Lambda logs in CloudWatch

4. **Test with curl**
   ```bash
   curl -X POST https://your-api/admin/notifications/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Can't subscribe?

1. **HTTPS required**
   - Push notifications only work on HTTPS
   - Use localhost for development

2. **Check CORS**
   - API must allow your origin
   - Check API Gateway CORS settings

3. **Verify authentication**
   - Must be logged in with Cognito
   - Token must be valid

## 📊 Monitoring

### Key Metrics to Watch

1. **Subscription Rate**: New subscriptions per day
2. **Active Subscriptions**: Total active subscribers
3. **Delivery Rate**: Notifications delivered / sent
4. **Click-Through Rate**: Notifications clicked / delivered
5. **Error Rate**: Failed notifications / total sent

### Where to Look

- **CloudWatch Logs**: Lambda execution logs
- **DynamoDB Metrics**: Table usage and throttling
- **API Gateway Metrics**: Request count and latency

## 💰 Cost Optimization Tips

1. Use DynamoDB on-demand (pay per request)
2. Set appropriate Lambda timeout (30s for most)
3. Clean up inactive subscriptions monthly
4. Use batch operations when possible
5. Monitor and set budget alerts

## 🎓 Learn More

### Documentation
- [README.md](README.md) - Complete overview
- [IMPLEMENTATION_GUIDE.md](aws-backend/IMPLEMENTATION_GUIDE.md) - Detailed setup
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design

### External Resources
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)

## 🆘 Need Help?

### Checklist
- [ ] Read IMPLEMENTATION_GUIDE.md
- [ ] Check CloudWatch logs
- [ ] Review browser console
- [ ] Test with curl
- [ ] Check IMPLEMENTATION_CHECKLIST.md

### Common Issues
- Permission denied → Check browser settings
- CORS error → Configure API Gateway CORS
- 401 error → Verify authentication token
- 410 error → Subscription expired (auto-cleaned)

## 🎉 Next Steps

After getting the basics working:

1. **Enable Auto-Notifications**
   - Connect DynamoDB Streams to trigger Lambda
   - Test with new content creation

2. **Customize Notifications**
   - Add your logo/icon
   - Customize notification text
   - Add notification images

3. **Add Analytics**
   - Track click-through rates
   - Monitor engagement
   - A/B test notification copy

4. **Optimize**
   - Review Lambda logs
   - Optimize memory settings
   - Set up CloudWatch alarms

## ✅ Success Checklist

- [ ] Backend deployed successfully
- [ ] Frontend integrated
- [ ] Can subscribe to notifications
- [ ] Test notification works
- [ ] New content triggers notification
- [ ] Preferences update correctly
- [ ] Can unsubscribe
- [ ] Monitoring set up

## 🚀 You're Ready!

You now have a complete, production-ready push notification system! 

Start by testing in development, then deploy to production when ready.

For detailed technical information, see the other documentation files.

Good luck! 🎊
