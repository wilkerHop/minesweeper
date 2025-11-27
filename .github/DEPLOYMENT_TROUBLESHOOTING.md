# Deployment Troubleshooting Guide

This guide helps diagnose and fix common deployment issues.

## Quick Diagnosis

### 1. Check Workflow Status
Visit: `https://github.com/YOUR_ORG/minesweeper/actions`

Look for:
- ❌ Failed jobs (red X)
- ⚠️  Warnings (yellow triangle)
- ⏭️  Skipped jobs (gray dash)

### 2. Common Issues

#### Issue: "Secrets Validation Failed"
**Symptoms:**
- `validate-secrets` job fails
- Error message lists missing secrets

**Solution:**
1. Go to repo Settings → Secrets and variables → Actions
2. Add missing secrets listed in error message
3. See `.github/SECRETS.md` for values
4. Re-run workflow

#### Issue: "Deployment Skipped"
**Symptoms:**
- `deploy-development` job shows as skipped
- No deployment URL generated

**Causes:**
1. **Wrong branch**: Development deploys only from `develop` branch
   ```bash
   # Check current branch
   git branch --show-current
   
   # Switch to develop
   git checkout develop
   git push origin develop
   ```

2. **Condition not met**: Check workflow conditions match your trigger

#### Issue: "Health Check Failed"
**Symptoms:**
- Deployment succeeds but health check fails
- HTTP codes like 404, 500, or timeout

**Solutions:**
1. **Check Vercel deployment logs**
   - Go to Vercel dashboard
   - Check build logs for errors

2. **Environment variables not set**
   - Verify all required env vars are in GitHub Secrets
   - Check for typos in secret names

3. **Build errors**
   - Check build artifacts from `build-and-lint` job
   - Review Next.js build output

#### Issue: "Vercel Deploy Action Failed"
**Symptoms:**
- `amondnet/vercel-action` step fails
- Authentication errors

**Solutions:**
1. **Invalid Vercel Token**
   ```bash
   # Generate new token
   # Go to Vercel → Settings → Tokens
   # Create new token with deployment permissions
   # Update VERCEL_TOKEN secret
   ```

2. **Wrong Project/Org IDs**
   ```bash
   # Get correct IDs
   vercel link
   cat .vercel/project.json
   # Update VERCEL_ORG_ID and VERCEL_PROJECT_ID
   ```

## Step-by-Step Debugging

### 1. Validate Local Setup
```bash
# Run the deployment script
./scripts/deploy-dev.sh

# It will check:
# - Correct branch
# - Uncommitted changes
# - GitHub remote configuration
```

### 2. Check GitHub Secrets

**Required for all deployments:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**For development environment:**
- All secrets with `DEV_` prefix (9 total)

**For staging environment:**
- All secrets with `STAGING_` prefix (9 total)

**Validation script:**
```bash
# Check if secrets exist (GitHub UI)
# Settings → Secrets and variables → Actions → Secrets
```

### 3. Review Workflow Logs

1. Go to failed workflow run
2. Expand failed job
3. Look for error messages with `::error::`
4. Check each step's output

**Common error patterns:**
- `Error: supabaseUrl is required` → Missing SUPABASE secrets
- `ENOTFOUND` → Invalid URL in secrets  
- `403 Forbidden` → Invalid API keys
- `404 Not Found` → Wrong project/org ID

### 4. Test Deployment Manually

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Deploy preview
vercel --env NEXT_PUBLIC_SUPABASE_URL="your-url" ...

# 4. If manual deploy works, issue is with GitHub Secrets
```

## Environment-Specific Issues

### Development Environment

**Trigger:** Push to `develop` branch

**Common issues:**
1. Pushed to wrong branch (`main` instead of `develop`)
2. Missing `DEV_*` secrets
3. Invalid development database URLs

**Fix:**
```bash
git checkout develop
git push origin develop
```

### Staging Environment

**Trigger:** Manual workflow dispatch OR tags (`v*-staging`)

**Common issues:**
1. Wrong tag format
2. Missing `STAGING_*` secrets
3. Environment not created in GitHub

**Fix:**
```bash
# Create proper tag
git tag v1.0.0-staging
git push origin v1.0.0-staging

# OR use manual trigger in GitHub Actions UI
```

### Production Environment

**Trigger:** Push to `main` branch + manual approval

**Common issues:**
1. Approval not granted
2. Missing `PRODUCTION_*` secrets
3. Protected environment rules blocking deployment

## Preventive Measures

### 1. Use Deployment Script
Always use `./scripts/deploy-dev.sh` for development deployments.
It validates configuration before pushing.

### 2. Test in Development First
1. Deploy to development
2. Verify it works
3. Then deploy to staging
4. Finally deploy to production

### 3. Keep Secrets Updated
- Review secrets monthly
- Rotate tokens quarterly
- Document all secret changes

### 4. Monitor Deployments
- Set up GitHub notifications
- Check deployment status regularly
- Review Vercel dashboard

## Getting Help

1. **Check this guide** for common issues
2. **Review `.github/SECRETS.md`** for configuration
3. **Check workflow files** for conditions and requirements
4. **Review Vercel logs** for runtime errors

## Useful Commands

```bash
# Check current branch
git branch --show-current

# View recent workflow runs
gh run list --limit 5

# View specific workflow run
gh run view RUN_ID

# Re-run failed workflow
gh run rerun RUN_ID

# Check git remote
git remote -v

# View recent commits
git log --oneline -5
```

## Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Secrets missing | Add in GitHub Settings → Secrets |
| Wrong branch | `git checkout develop && git push` |
| Health check fails | Check Vercel logs, verify env vars |
| Deployment skipped | Check branch/trigger conditions |
| Build fails | Review build logs, check dependencies |
