# Push Notifications Architecture

## System Overview

The S7abt Push Notifications system is a comprehensive, AWS-powered solution for delivering real-time browser notifications when new content is published.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER BROWSER                                  │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐ │
│  │   React App  │◄───┤Service Worker│◄───┤ Push Notification Server │ │
│  │  (Frontend)  │    │    (sw.js)   │    │   (Browser Internal)     │ │
│  └──────┬───────┘    └──────────────┘    └──────────────────────────┘ │
│         │                                                               │
└─────────┼───────────────────────────────────────────────────────────────┘
          │
          │ HTTPS / WSS
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AWS CLOUD                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     API Gateway (REST)                          │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Cognito Authorizer (JWT Validation)                     │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  │                                                                 │    │
│  │  Routes:                                                        │    │
│  │  • POST /admin/notifications/subscribe                         │    │
│  │  • POST /admin/notifications/unsubscribe                       │    │
│  │  • GET/PUT /admin/notifications/preferences                    │    │
│  │  • POST /admin/notifications/test                              │    │
│  └────────────┬───────────────────────────────────────────────────┘    │
│               │                                                          │
│               ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Lambda Functions                             │    │
│  │                                                                 │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                   │    │
│  │  │   Subscribe      │  │   Unsubscribe    │                   │    │
│  │  │  Notifications   │  │  Notifications   │                   │    │
│  │  └────────┬─────────┘  └────────┬─────────┘                   │    │
│  │           │                     │                              │    │
│  │  ┌────────┴────────┐  ┌─────────┴────────┐                   │    │
│  │  │  Notification   │  │       Test       │                   │    │
│  │  │  Preferences    │  │   Notification   │                   │    │
│  │  └────────┬────────┘  └─────────┬────────┘                   │    │
│  │           │                     │                              │    │
│  │  ┌────────┴─────────────────────┴─────────────────┐           │    │
│  │  │        Send Push Notifications                  │           │    │
│  │  │        (with web-push library)                  │           │    │
│  │  └────────┬────────────────────────────────────────┘           │    │
│  │           │                     ▲                              │    │
│  │           │                     │                              │    │
│  │  ┌────────┴─────────────────────┴─────────────────┐           │    │
│  │  │       Content Creation Trigger                  │           │    │
│  │  │       (DynamoDB Stream Handler)                 │           │    │
│  │  └────────▲────────────────────────────────────────┘           │    │
│  └───────────┼──────────────────────────────────────────────────────┘  │
│              │                                                          │
│  ┌───────────┴───────────────────────────────────────────────────┐    │
│  │                    DynamoDB Tables                              │    │
│  │                                                                 │    │
│  │  ┌───────────────────┐  ┌──────────────────┐                  │    │
│  │  │ push-subscriptions│  │   notification-  │                  │    │
│  │  │    (Main Table)   │  │   preferences    │                  │    │
│  │  │                   │  │                  │                  │    │
│  │  │ • subscriptionId  │  │ • userId         │                  │    │
│  │  │ • userId          │  │ • preferences    │                  │    │
│  │  │ • endpoint        │  │   - articles     │                  │    │
│  │  │ • keys           │  │   - news         │                  │    │
│  │  │ • active         │  │   - tags         │                  │    │
│  │  │                   │  │   - sections     │                  │    │
│  │  └───────────────────┘  └──────────────────┘                  │    │
│  │                                                                 │    │
│  │  ┌──────────────────────────────────────────────────────┐     │    │
│  │  │            Content Tables (with Streams)             │     │    │
│  │  │                                                       │     │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│     │    │
│  │  │  │ Articles │ │   News   │ │   Tags   │ │Sections ││     │    │
│  │  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘│     │    │
│  │  │       │            │            │            │      │     │    │
│  │  │       └────────────┴────────────┴────────────┘      │     │    │
│  │  │                     │                                │     │    │
│  │  │              DynamoDB Streams                        │     │    │
│  │  │           (INSERT events only)                       │     │    │
│  │  └──────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                   SNS (Optional)                                 │  │
│  │  • Email notifications backup                                    │  │
│  │  • Alternative notification channel                              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Subscription Flow

```
User Action                Browser              API Gateway           Lambda              DynamoDB
    │                         │                      │                   │                    │
    │  Click "Enable"         │                      │                   │                    │
    ├────────────────────────►│                      │                   │                    │
    │                         │  Request Permission  │                   │                    │
    │                         ├─────────────────────►│                   │                    │
    │                         │                      │                   │                    │
    │  Grant Permission       │                      │                   │                    │
    ◄─────────────────────────┤                      │                   │                    │
    │                         │                      │                   │                    │
    │                         │  Register SW         │                   │                    │
    │                         ├──────┐              │                   │                    │
    │                         │      │              │                   │                    │
    │                         │◄─────┘              │                   │                    │
    │                         │                      │                   │                    │
    │                         │  Subscribe Push      │                   │                    │
    │                         ├──────┐              │                   │                    │
    │                         │      │              │                   │                    │
    │                         │◄─────┘              │                   │                    │
    │                         │                      │                   │                    │
    │                         │  POST /subscribe     │                   │                    │
    │                         ├─────────────────────►│                   │                    │
    │                         │                      │  Validate JWT     │                    │
    │                         │                      ├──────┐           │                    │
    │                         │                      │      │           │                    │
    │                         │                      │◄─────┘           │                    │
    │                         │                      │                   │                    │
    │                         │                      │  Invoke Lambda    │                    │
    │                         │                      ├──────────────────►│                    │
    │                         │                      │                   │  Store Subscription│
    │                         │                      │                   ├───────────────────►│
    │                         │                      │                   │                    │
    │                         │                      │                   │  Success Response  │
    │                         │                      │                   │◄───────────────────┤
    │                         │                      │                   │                    │
    │                         │                      │  Return Result    │                    │
    │                         │                      │◄──────────────────┤                    │
    │                         │                      │                   │                    │
    │                         │  Success Response    │                   │                    │
    │                         │◄─────────────────────┤                   │                    │
    │                         │                      │                   │                    │
    │  Show Confirmation      │                      │                   │                    │
    ◄─────────────────────────┤                      │                   │                    │
```

### 2. Notification Sending Flow

```
Content Creation     DynamoDB Stream     Lambda (Trigger)    Lambda (Send)     Browser
       │                    │                   │                  │              │
       │  INSERT Article    │                   │                  │              │
       ├───────────────────►│                   │                  │              │
       │                    │                   │                  │              │
       │                    │  Stream Event     │                  │              │
       │                    ├──────────────────►│                  │              │
       │                    │                   │                  │              │
       │                    │                   │  Parse Event     │              │
       │                    │                   ├──────┐          │              │
       │                    │                   │      │          │              │
       │                    │                   │◄─────┘          │              │
       │                    │                   │                  │              │
       │                    │                   │  Create Payload  │              │
       │                    │                   ├──────┐          │              │
       │                    │                   │      │          │              │
       │                    │                   │◄─────┘          │              │
       │                    │                   │                  │              │
       │                    │                   │  Invoke Send     │              │
       │                    │                   ├─────────────────►│              │
       │                    │                   │                  │              │
       │                    │                   │                  │  Get Subs    │
       │                    │                   │                  ├──────┐      │
       │                    │                   │                  │      │      │
       │                    │                   │                  │◄─────┘      │
       │                    │                   │                  │              │
       │                    │                   │                  │  Filter      │
       │                    │                   │                  ├──────┐      │
       │                    │                   │                  │      │      │
       │                    │                   │                  │◄─────┘      │
       │                    │                   │                  │              │
       │                    │                   │                  │  Send Push   │
       │                    │                   │                  ├─────────────►│
       │                    │                   │                  │              │
       │                    │                   │                  │              │  Show
       │                    │                   │                  │              │◄─────┐
       │                    │                   │                  │              │      │
       │                    │                   │                  │              │      │
       │                    │                   │  Result          │              │      │
       │                    │                   │◄─────────────────┤              │      │
```

## Component Details

### Frontend Components

**NotificationSettings.jsx**
- React component for managing notifications
- Displays subscription status
- Handles permission requests
- Manages user preferences
- Sends test notifications

**pushNotifications.js**
- Service layer for push notifications
- Handles subscription lifecycle
- Communicates with backend API
- Manages service worker registration

**sw.js (Service Worker)**
- Receives push events
- Displays notifications
- Handles notification clicks
- Manages notification actions

### Backend Components

**Lambda Functions**

1. **subscribeNotifications**
   - Stores push subscriptions
   - Creates SNS subscriptions
   - Validates subscription data
   - Returns subscription confirmation

2. **unsubscribeNotifications**
   - Deactivates subscriptions
   - Removes SNS subscriptions
   - Cleans up user data
   - Returns confirmation

3. **notificationPreferences**
   - Stores user preferences
   - Retrieves preferences
   - Validates preference data
   - Supports GET and PUT methods

4. **sendPushNotifications**
   - Main notification sender
   - Queries active subscriptions
   - Filters by preferences
   - Uses web-push library
   - Handles delivery failures
   - Cleans up invalid subscriptions

5. **testNotification**
   - Sends test notifications
   - For testing purposes
   - Validates setup

6. **contentCreationTrigger**
   - Monitors DynamoDB Streams
   - Detects new content
   - Formats notification payload
   - Invokes send function

### Database Schema

**push-subscriptions Table**
```
{
  subscriptionId: String (PK),
  userId: String (GSI),
  userEmail: String,
  endpoint: String (GSI),
  keys: {
    p256dh: String,
    auth: String
  },
  subscription: Object,
  snsSubscriptionArn: String,
  active: Boolean,
  createdAt: String,
  updatedAt: String,
  preferences: {
    articles: Boolean,
    news: Boolean,
    tags: Boolean,
    sections: Boolean
  }
}
```

**notification-preferences Table**
```
{
  userId: String (PK),
  preferences: {
    articles: Boolean,
    news: Boolean,
    tags: Boolean,
    sections: Boolean
  },
  updatedAt: String
}
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
│                                                              │
│  Layer 1: HTTPS/TLS                                         │
│  └─► All communication encrypted                            │
│                                                              │
│  Layer 2: Cognito Authentication                            │
│  └─► JWT tokens for API access                             │
│                                                              │
│  Layer 3: API Gateway Authorization                         │
│  └─► Validates JWT on every request                        │
│                                                              │
│  Layer 4: IAM Roles                                         │
│  └─► Least privilege access for Lambdas                    │
│                                                              │
│  Layer 5: VAPID Keys                                        │
│  └─► Secure push notification authentication               │
│                                                              │
│  Layer 6: Input Validation                                  │
│  └─► Validate all data in Lambda functions                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

1. **DynamoDB**: On-demand capacity auto-scales
2. **Lambda**: Concurrent execution handles spikes
3. **API Gateway**: Unlimited requests (with throttling)
4. **Push Service**: Browser's push service handles delivery

## Monitoring Points

- Lambda invocations and errors
- DynamoDB read/write units
- API Gateway requests and latency
- Push notification delivery rate
- Subscription growth rate
- User engagement metrics

## Cost Breakdown

```
Monthly Cost Estimate (1,000 users, 100 notifications/day):

┌─────────────────────────┬──────────┐
│ Service                 │ Cost     │
├─────────────────────────┼──────────┤
│ DynamoDB                │ $2-5     │
│ Lambda                  │ $1-3     │
│ API Gateway             │ $0.50    │
│ CloudWatch              │ $0.50    │
│ SNS (optional)          │ $0.50    │
├─────────────────────────┼──────────┤
│ TOTAL                   │ $5-10    │
└─────────────────────────┴──────────┘

Note: Scales linearly with usage
```

## Disaster Recovery

1. **DynamoDB**: Point-in-time recovery enabled
2. **Lambda**: Multi-AZ deployment automatic
3. **CloudFormation**: Infrastructure as Code
4. **Rollback**: CloudFormation stack rollback capability
5. **Backup**: Regular exports to S3

## Future Enhancements

- [ ] Rich media support in notifications
- [ ] Scheduled notifications
- [ ] Notification analytics dashboard
- [ ] A/B testing framework
- [ ] Advanced targeting rules
- [ ] Notification templates
- [ ] Multi-language support
- [ ] Priority levels
- [ ] Delivery scheduling
- [ ] Push notification groups
