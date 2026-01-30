# S7abt Admin Frontend - Setup Guide

## Prerequisites

- Node.js 18+ installed
- pnpm installed
- Backend deployed and `.env` file configured

## Installation

```bash
# Install dependencies
pnpm install
```

## Configuration

Ensure `.env` file exists with the following variables:

```env
VITE_COGNITO_USER_POOL_ID=<your-cognito-user-pool-id>
VITE_COGNITO_CLIENT_ID=<your-client-id>
VITE_AWS_REGION=me-central-1
VITE_API_ENDPOINT=https://<your-api-id>.execute-api.me-central-1.amazonaws.com/dev
```

## Development

```bash
# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

## Login Credentials

- **Email**: admin@example.com
- **Password**: TempPass123! (you'll be prompted to change it)

## Features Implemented

### Phase 2 (Current)
- ✅ Login page with Cognito authentication
- ✅ Protected routes
- ✅ Admin layout with sidebar and top bar
- ✅ Dashboard with statistics from API
- ✅ Quick Actions section
- ✅ Recent articles widget
- ✅ Tweet queue widget

### Phase 3 (Coming Soon)
- ⏳ Articles CRUD
- ⏳ News management
- ⏳ Tags management
- ⏳ Sections management
- ⏳ Users management

### Phase 4 (Coming Soon)
- ⏳ Tweet automation management
- ⏳ Tweet queue management
- ⏳ Tweet generation

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx    # Route protection
│   └── layout/
│       └── AdminLayout.jsx        # Main admin layout
├── contexts/
│   └── AuthContext.jsx            # Authentication state
├── lib/
│   ├── amplify.js                 # AWS Amplify config
│   └── api.js                     # API client
├── pages/
│   ├── Login.jsx                  # Login page
│   └── Dashboard.jsx              # Dashboard page
├── assets/
│   └── cloud-icon.png             # S7abt logo
├── App.jsx                        # Main app component
├── main.jsx                       # Entry point
└── index.css                      # Global styles
```

## Building for Production

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment

The frontend can be deployed to:
- AWS Amplify
- AWS S3 + CloudFront
- Vercel
- Netlify

### AWS Amplify Deployment

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

## Troubleshooting

### "Unauthorized" error when fetching dashboard stats

- Ensure you're logged in
- Check that `.env` has correct API endpoint
- Verify Cognito tokens are valid

### Login fails

- Check Cognito User Pool ID and Client ID in `.env`
- Verify user exists in Cognito
- Check password meets requirements

### Styles not loading

- Ensure Tailwind CSS is properly configured
- Check `tailwind.config.js` content paths
- Verify `@tailwind` directives in `index.css`

## Support

For issues or questions, refer to:
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Phase 2 Summary](../PHASE2_SUMMARY.md)

