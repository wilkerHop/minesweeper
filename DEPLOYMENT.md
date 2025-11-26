# Deployment Guide: Infinite Minesweeper

This guide walks you through deploying the Infinite Minesweeper application to production.

## Prerequisites

Before deploying, ensure you have accounts and credentials for:

1. **Supabase**: https://app.supabase.com
2. **Turso**: https://turso.tech
3. **Cloudflare R2**: https://dash.cloudflare.com
4. **Vercel**: https://vercel.com (or another Next.js hosting platform)

## Step 1: Database Setup

### Supabase Setup

1. Create a new Supabase project
2. Navigate to the SQL Editor
3. Execute the schema from `supabase/schema.sql`
4. Note your project URL and API keys from Settings → API

### Turso Setup

1. Install Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
2. Create a database: `turso db create minesweeper-prod`
3. Get the database URL: `turso db show minesweeper-prod`
4. Create an auth token: `turso db tokens create minesweeper-prod`
5. Execute the schema:
   ```bash
   turso db shell minesweeper-prod < turso/schema.sql
   ```

### Cloudflare R2 Setup

1. Log in to Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket: `minesweeper-replays`
4. Create API credentials:
   - Go to R2 → Manage R2 API Tokens
   - Create a new API token with read/write permissions
   - Save the Access Key ID and Secret Access Key

## Step 2: Local Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in your credentials in `.env.local`:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Turso
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-turso-token

   # Cloudflare R2
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret
   R2_BUCKET_NAME=minesweeper-replays

   # App
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Run tests to verify setup:
   ```bash
   npm run test:unit
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

## Step 3: Vercel Deployment Setup

1. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

2. Link your project to Vercel:
   ```bash
   vercel link
   ```

3. Add environment variables to Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local` for **Production** environment
   - Repeat for **Preview** (staging) environment with staging credentials

## Step 4: GitHub Secrets Configuration

Configure the following secrets in your GitHub repository (Settings → Secrets and variables → Actions):

### Vercel Secrets
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Staging Environment
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`
- `STAGING_TURSO_DATABASE_URL`
- `STAGING_TURSO_AUTH_TOKEN`
- `STAGING_R2_ACCOUNT_ID`
- `STAGING_R2_ACCESS_KEY_ID`
- `STAGING_R2_SECRET_ACCESS_KEY`
- `STAGING_R2_BUCKET_NAME`

### Production Environment
- `PRODUCTION_URL`: Your production domain
- `PRODUCTION_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY`
- `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`
- `PRODUCTION_TURSO_DATABASE_URL`
- `PRODUCTION_TURSO_AUTH_TOKEN`
- `PRODUCTION_R2_ACCOUNT_ID`
- `PRODUCTION_R2_ACCESS_KEY_ID`
- `PRODUCTION_R2_SECRET_ACCESS_KEY`
- `PRODUCTION_R2_BUCKET_NAME`

## Step 5: Configure GitHub Environment Protection

1. Go to Settings → Environments
2. Create two environments:
   - **staging**: No protection rules (auto-deploy)
   - **production**: Add required reviewers for manual approval

## Step 6: Deploy

### Automatic Deployment

1. Push to `develop` branch to deploy to staging:
   ```bash
   git push origin develop
   ```

2. Push to `main` branch to trigger production deployment (requires approval):
   ```bash
   git push origin main
   ```

### Manual Deployment (Vercel CLI)

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## Step 7: Post-Deployment Verification

1. **Check Health Endpoint**: Visit `/api/health` to verify database connections
2. **Test Game Creation**: Start a new game and verify it creates a session in Supabase
3. **Test Cell Modifications**: Make moves and check Turso for recorded cells
4. **Test Leaderboard**: Submit a score and verify it appears in the leaderboard
5. **Test Replay**: Complete a game and download the replay from R2

## Monitoring

### Error Tracking (Optional)

Add Sentry or similar error tracking:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Database Monitoring

- **Supabase**: Monitor via Supabase Dashboard → Database → Logs
- **Turso**: Use `turso db show <db-name>` for stats

### Performance Monitoring

Check Server Action latencies in Vercel Dashboard → Analytics

## Troubleshooting

### Build Failures

- Verify all environment variables are set correctly
- Check that database schemas are deployed
- Review build logs in GitHub Actions

### Database Connection Errors

- Verify API keys and credentials
- Check that IP allowlists include Vercel's IP ranges (if applicable)
- Ensure database instances are running

### R2 Upload Failures

- Verify R2 bucket exists and credentials are correct
- Check that bucket permissions allow read/write operations

## Rollback Procedure

If issues arise in production:

1. Go to Vercel Dashboard → Deployments
2. Find the last known good deployment
3. Click "..." → "Promote to Production"

Or via CLI:
```bash
vercel rollback
```

## Security Checklist

- [ ] All environment variables secured in GitHub Secrets
- [ ] Supabase RLS policies enabled
- [ ] API rate limiting configured
- [ ] CORS settings properly configured
- [ ] Database backups enabled
- [ ] Monitoring and alerts set up

## Next Steps

- Set up automated database backups
- Configure CDN for static assets
- Implement user authentication (optional)
- Add monetization features (ads, premium)
- Set up analytics tracking
