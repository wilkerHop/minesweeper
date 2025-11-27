# Deployment Scripts

This directory contains deployment scripts for various environments.

## Development Deployment

### Quick Start

```bash
./scripts/deploy-dev.sh
```

### What it does

The `deploy-dev.sh` script:
1. ✓ Verifies you're in the project root
2. ✓ Checks/switches to `develop` branch
3. ✓ Detects uncommitted changes and offers to commit
4. ✓ Lists required GitHub Secrets for development
5. ✓ Pushes to `origin/develop` to trigger deployment
6. ✓ Provides links to monitor deployment progress

### Required GitHub Secrets

The script checks for these environment variables (must be configured as GitHub Secrets):

**Vercel (shared):**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Development environment:**
- `DEV_SUPABASE_URL`
- `DEV_SUPABASE_ANON_KEY`
- `DEV_SUPABASE_SERVICE_ROLE_KEY`
- `DEV_TURSO_DATABASE_URL`
- `DEV_TURSO_AUTH_TOKEN`
- `DEV_R2_ACCOUNT_ID`
- `DEV_R2_ACCESS_KEY_ID`
- `DEV_R2_SECRET_ACCESS_KEY`
- `DEV_R2_BUCKET_NAME`

See [`.github/SECRETS.md`](../.github/SECRETS.md) for setup instructions.

### Manual Deployment

If you prefer to deploy manually:

```bash
# 1. Switch to develop branch
git checkout develop

# 2. Commit your changes
git add .
git commit -m "your message"

# 3. Push to trigger deployment
git push origin develop
```

### Monitoring Deployment

After running the script, monitor your deployment at:
- GitHub Actions: `https://github.com/YOUR_ORG/minesweeper/actions`
- Vercel Dashboard: `https://vercel.com/dashboard`

### Troubleshooting

**"Not on develop branch"**
- The script will offer to switch/create the branch
- Or manually: `git checkout -b develop`

**"No GitHub remote"**
- Add remote: `git remote add origin https://github.com/YOUR_ORG/minesweeper.git`

**"Push failed"**
- Check you have push access to the repository
- Verify remote URL: `git remote -v`

**Deployment skipped**
- Verify GitHub Secrets are configured
- Check Actions tab for error messages
