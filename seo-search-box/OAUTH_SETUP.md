# OAuth Setup Guide

This application uses NextAuth v5 for OAuth authentication with Google and GitHub providers.

## Prerequisites

1. A Google Cloud Console project with OAuth 2.0 credentials
2. A GitHub OAuth App (optional, if you want GitHub login)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if you haven't already
6. For Application type, select "Web application"
7. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://YOUR-DOMAIN.com/api/auth/callback/google`
     - Replace `YOUR-DOMAIN.com` with your actual production domain (e.g., `seobandwagon.dev`)
8. Copy the Client ID and Client Secret

## GitHub OAuth Setup (Optional)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: Your App Name (e.g., "SEO Bandwagon")
   - Homepage URL: `https://YOUR-DOMAIN.com` (replace with your actual domain)
   - Authorization callback URL: 
     - Development: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://YOUR-DOMAIN.com/api/auth/callback/github`
       - Replace `YOUR-DOMAIN.com` with your actual production domain
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the following variables:

```bash
# Required: Generate with: openssl rand -base64 32
AUTH_SECRET=your-secret-key-here

# Required: Your application URL
AUTH_URL=http://localhost:3000  # For production: https://YOUR-DOMAIN.com

# Required: Google OAuth credentials
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Optional: GitHub OAuth credentials
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
```

### Generating AUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## Testing OAuth Flow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Click "Continue with Google" or "Continue with GitHub"

4. Complete the OAuth flow

5. You should be redirected to `/dashboard` after successful authentication

## Troubleshooting

### "Configuration" Error

- Ensure `AUTH_SECRET` is set in your environment variables
- Ensure `AUTH_URL` matches your current URL (http://localhost:3000 for dev)
- Verify your OAuth client credentials are correct

### "AccessDenied" Error

- Check that your OAuth redirect URIs are correctly configured in Google/GitHub
- Ensure the redirect URI matches exactly (including http/https)

### "Verification" Error

- This typically means the OAuth state token has expired
- Try signing in again

## NextAuth v5 Changes

This application uses NextAuth v5, which has several breaking changes from v4:

- The auth configuration is now in `src/lib/auth.ts`
- API routes are at `src/app/api/auth/[...nextauth]/route.ts`
- Middleware is at `src/middleware.ts` for route protection
- SessionProvider is wrapped in a client component

## Protected Routes

The following routes require authentication:
- `/dashboard` - User dashboard
- `/history` - Search history
- `/saved-searches` - Saved searches

Unauthenticated users will be redirected to `/auth/signin`.
