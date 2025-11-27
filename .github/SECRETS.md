# GitHub Secrets Configuration

This document outlines all required GitHub Secrets for the deployment pipelines.

## Vercel Configuration (Shared)

These secrets are used across all environments:

```
VERCEL_TOKEN           # Vercel API token
VERCEL_ORG_ID          # Your Vercel organization ID  
VERCEL_PROJECT_ID      # Your Vercel project ID
```

## Development Environment Secrets

Prefix: `DEV_*`

```
DEV_SUPABASE_URL
DEV_SUPABASE_ANON_KEY
DEV_SUPABASE_SERVICE_ROLE_KEY
DEV_TURSO_DATABASE_URL
DEV_TURSO_AUTH_TOKEN
DEV_R2_ACCOUNT_ID
DEV_R2_ACCESS_KEY_ID
DEV_R2_SECRET_ACCESS_KEY
DEV_R2_BUCKET_NAME
```

## Staging Environment Secrets

Prefix: `STAGING_*`

```
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_SUPABASE_SERVICE_ROLE_KEY
STAGING_TURSO_DATABASE_URL
STAGING_TURSO_AUTH_TOKEN
STAGING_R2_ACCOUNT_ID
STAGING_R2_ACCESS_KEY_ID
STAGING_R2_SECRET_ACCESS_KEY
STAGING_R2_BUCKET_NAME
```

## Production Environment Secrets

Prefix: `PRODUCTION_*`

```
PRODUCTION_SUPABASE_URL
PRODUCTION_SUPABASE_ANON_KEY
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY
PRODUCTION_TURSO_DATABASE_URL
PRODUCTION_TURSO_AUTH_TOKEN
PRODUCTION_R2_ACCOUNT_ID
PRODUCTION_R2_ACCESS_KEY_ID
PRODUCTION_R2_SECRET_ACCESS_KEY
PRODUCTION_R2_BUCKET_NAME
PRODUCTION_URL                     # Your production URL for smoke tests
```

## Setup Instructions

1. **Go to Repository Settings**
   - Navigate to your GitHub repository
   - Click on "Settings" → "Secrets and variables" → "Actions"

2. **Create Environment Secrets**
   - Create environments: `development`, `staging`, `production`
   - Add the corresponding secrets to each environment

3. **Configure Environment Protection Rules**
   - **Development**: No protection (auto-deploy)
   - **Staging**: Optional - manual approval
   - **Production**: Required reviewers + deployment branches (main only)

## Deployment Triggers

- **Development**: Auto-deploys on push to `develop` branch
- **Staging**: Manual workflow dispatch OR tags matching `v*-staging`
- **Production**: Push to `main` branch (requires approval)

## Getting Secret Values

### Vercel
```bash
# After installing Vercel CLI
vercel link
vercel env pull .env.vercel
# Extract VERCEL_ORG_ID and VERCEL_PROJECT_ID from .vercel/project.json
```

### Supabase
- Get from Supabase project settings → API

### Turso
```bash
turso db show <database-name>
turso db tokens create <database-name>
```

### Cloudflare R2
- Get from Cloudflare dashboard → R2 → Settings
