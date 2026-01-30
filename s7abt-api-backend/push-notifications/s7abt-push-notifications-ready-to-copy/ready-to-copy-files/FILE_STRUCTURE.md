# 📁 File Structure Reference

## 🎯 Where Each File Goes

```
YOUR PROJECT ROOT
│
├── public/                          
│   └── sw.js                        ← Copy from: ready-to-copy-files/public/sw.js
│
└── src/
    ├── components/
    │   └── NotificationSettings.jsx ← Copy from: ready-to-copy-files/src/components/NotificationSettings.jsx
    │
    └── lib/
        └── pushNotifications.js     ← Copy from: ready-to-copy-files/src/lib/pushNotifications.js
```

## ✏️ Files to Modify

```
YOUR PROJECT ROOT
│
├── .env                             ← ADD: VITE_VAPID_PUBLIC_KEY=your_key
│
└── src/
    └── pages/
        └── Settings.jsx             ← ADD: import and <NotificationSettings />
```

## 📋 Complete File List

### New Files (3)
1. **public/sw.js**
   - Service Worker
   - Handles push notifications
   - Shows notifications
   - 155 lines

2. **src/lib/pushNotifications.js**
   - Service layer
   - API calls
   - Subscription management
   - 278 lines

3. **src/components/NotificationSettings.jsx**
   - React UI component
   - User interface
   - Settings management
   - 245 lines

### Modified Files (2)
1. **.env**
   - Add one line: `VITE_VAPID_PUBLIC_KEY=your_key`

2. **src/pages/Settings.jsx**
   - Add import: `import NotificationSettings from '../components/NotificationSettings';`
   - Add component: `<NotificationSettings />`

## 🎨 Visual Copy Guide

```
┌─────────────────────────────────────────────────────────────┐
│  ready-to-copy-files/          YOUR PROJECT/                │
│                                                              │
│  public/                       public/                      │
│  └── sw.js            ────────►└── sw.js                    │
│                                                              │
│  src/                          src/                         │
│  ├── components/               ├── components/              │
│  │   └── NotificationSettings  │   └── NotificationSettings │
│  │       .jsx          ────────┤       .jsx                 │
│  └── lib/                      └── lib/                     │
│      └── pushNotifications     │   └── pushNotifications    │
│          .js            ───────┤       .js                  │
│                                                              │
│  .env.example          ────────►.env (add key)              │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 How to Find Your Project Folders

### Finding `public/` folder
```
your-project/
├── public/          ← HERE (same level as src/)
│   └── vite.svg
├── src/
└── package.json
```

### Finding `src/components/` folder
```
your-project/
└── src/
    ├── components/  ← HERE
    │   ├── ImageUpload.jsx
    │   └── ... (other components)
    ├── pages/
    └── lib/
```

### Finding `src/lib/` folder
```
your-project/
└── src/
    ├── components/
    ├── lib/         ← HERE
    │   ├── api.js
    │   ├── amplify.js
    │   └── ... (other libraries)
    └── pages/
```

### Finding `src/pages/` folder
```
your-project/
└── src/
    ├── components/
    ├── lib/
    └── pages/       ← HERE (find Settings.jsx)
        ├── Settings.jsx  ← MODIFY THIS
        ├── Dashboard.jsx
        └── ... (other pages)
```

## 📝 Settings.jsx Modification

### Before:
```jsx
// src/pages/Settings.jsx
import React from 'react';

function Settings() {
  return (
    <div className="space-y-6">
      {/* Your existing settings */}
    </div>
  );
}

export default Settings;
```

### After:
```jsx
// src/pages/Settings.jsx
import React from 'react';
import NotificationSettings from '../components/NotificationSettings';  // ← ADD THIS

function Settings() {
  return (
    <div className="space-y-6">
      {/* Your existing settings */}
      
      {/* Push Notifications Section */}
      <NotificationSettings />  {/* ← ADD THIS */}
    </div>
  );
}

export default Settings;
```

## 📋 .env Modification

### Before:
```bash
VITE_COGNITO_USER_POOL_ID=<your-cognito-user-pool-id>
VITE_COGNITO_CLIENT_ID=<your-cognito-client-id>
VITE_AWS_REGION=me-central-1
VITE_API_ENDPOINT=https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev
```

### After:
```bash
# Push Notifications
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

# Existing config
VITE_COGNITO_USER_POOL_ID=<your-cognito-user-pool-id>
VITE_COGNITO_CLIENT_ID=<your-cognito-client-id>
VITE_AWS_REGION=me-central-1
VITE_API_ENDPOINT=https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev
```

## ✅ Final Structure Check

After copying all files, your project should look like:

```
your-project/
├── public/
│   ├── sw.js                        ✅ NEW
│   └── vite.svg                     (existing)
├── src/
│   ├── components/
│   │   ├── NotificationSettings.jsx ✅ NEW
│   │   ├── ImageUpload.jsx          (existing)
│   │   └── ... (existing)
│   ├── lib/
│   │   ├── pushNotifications.js     ✅ NEW
│   │   ├── api.js                   (existing)
│   │   └── amplify.js               (existing)
│   └── pages/
│       ├── Settings.jsx             ✅ MODIFIED
│       ├── Dashboard.jsx            (existing)
│       └── ... (existing)
├── .env                             ✅ MODIFIED
└── package.json                     (existing)
```

## 🎯 Quick Copy Commands

If you prefer command line (from ready-to-copy-files directory):

```bash
# Copy service worker
cp public/sw.js ../YOUR_PROJECT/public/

# Copy notification service
cp src/lib/pushNotifications.js ../YOUR_PROJECT/src/lib/

# Copy UI component
cp src/components/NotificationSettings.jsx ../YOUR_PROJECT/src/components/

# Then manually:
# 1. Add VAPID key to .env
# 2. Update Settings.jsx
```

## 💡 Important Notes

1. **sw.js MUST be in public/** - Service workers don't work from src/
2. **Restart dev server** after adding .env variable
3. **Case sensitive** - Use exact filenames
4. **Path matters** - Maintain exact folder structure

## 🚀 After Copying

1. Check all 3 files are in place
2. Add VAPID key to .env
3. Update Settings.jsx
4. Restart dev server: `npm run dev`
5. Test!
