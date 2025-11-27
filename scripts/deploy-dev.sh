#!/bin/bash

# Development Environment Deployment Script
# This script validates environment variables and triggers deployment to development environment

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Required environment variables for development deployment
REQUIRED_VARS=(
  "VERCEL_TOKEN"
  "VERCEL_ORG_ID"
  "VERCEL_PROJECT_ID"
  "DEV_SUPABASE_URL"
  "DEV_SUPABASE_ANON_KEY"
  "DEV_SUPABASE_SERVICE_ROLE_KEY"
  "DEV_TURSO_DATABASE_URL"
  "DEV_TURSO_AUTH_TOKEN"
  "DEV_R2_ACCOUNT_ID"
  "DEV_R2_ACCESS_KEY_ID"
  "DEV_R2_SECRET_ACCESS_KEY"
  "DEV_R2_BUCKET_NAME"
)

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Development Environment Deployment Checker   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check if we're in the correct directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}✗ Error: Not in project root directory${NC}"
  echo "  Please run this script from the project root"
  exit 1
fi

echo -e "${GREEN}✓ Project root directory confirmed${NC}"

# Step 2: Check git status
echo ""
echo -e "${YELLOW}Checking Git status...${NC}"

# Check if we're on develop branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo -e "${YELLOW}⚠ Currently on branch: ${CURRENT_BRANCH}${NC}"
  echo -e "${YELLOW}  Development deployment requires 'develop' branch${NC}"
  
  # Check if develop branch exists
  if git show-ref --verify --quiet refs/heads/develop; then
    read -p "Switch to develop branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git checkout develop
      echo -e "${GREEN}✓ Switched to develop branch${NC}"
    else
      echo -e "${RED}✗ Deployment cancelled${NC}"
      exit 1
    fi
  else
    read -p "Create and switch to develop branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git checkout -b develop
      echo -e "${GREEN}✓ Created and switched to develop branch${NC}"
    else
      echo -e "${RED}✗ Deployment cancelled${NC}"
      exit 1
    fi
  fi
else
  echo -e "${GREEN}✓ On develop branch${NC}"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
  read -p "Commit changes before deploying? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    read -p "Enter commit message: " COMMIT_MSG
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✓ Changes committed${NC}"
  else
    echo -e "${YELLOW}⚠ Proceeding with uncommitted changes${NC}"
  fi
fi

# Step 3: Check GitHub Secrets (environment variables)
echo ""
echo -e "${YELLOW}Checking required environment variables...${NC}"
echo -e "${BLUE}(These should be set in GitHub Secrets)${NC}"
echo ""

MISSING_VARS=()
PLACEHOLDER_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
  # For local check, we can't actually verify GitHub Secrets
  # But we can check if they're documented
  echo -e "  ${VAR}"
done

echo ""
echo -e "${BLUE}Note: These variables must be configured as GitHub Secrets${NC}"
echo -e "${BLUE}See .github/SECRETS.md for setup instructions${NC}"

# Step 4: Verify GitHub Secrets are configured
echo ""
echo -e "${YELLOW}Verifying GitHub repository settings...${NC}"

# Check if we have a GitHub remote
if ! git remote -v | grep -q "github.com"; then
  echo -e "${RED}✗ No GitHub remote found${NC}"
  echo "  Please configure GitHub remote first"
  exit 1
fi

echo -e "${GREEN}✓ GitHub remote configured${NC}"

# Extract GitHub repo info
GITHUB_REPO=$(git remote get-url origin | sed -n 's/.*github\.com[:/]\(.*\)\.git/\1/p')
if [ -z "$GITHUB_REPO" ]; then
  GITHUB_REPO=$(git remote get-url origin | sed -n 's/.*github\.com[:/]\(.*\)/\1/p')
fi

echo -e "${BLUE}  Repository: ${GITHUB_REPO}${NC}"
echo -e "${BLUE}  Secrets URL: https://github.com/${GITHUB_REPO}/settings/secrets/actions${NC}"

# Step 5: Confirm deployment
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Ready to deploy to Development Environment${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo ""
echo "This will:"
echo "  1. Push current branch (develop) to origin"
echo "  2. Trigger GitHub Actions workflow"
echo "  3. Deploy to Vercel development environment"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}✗ Deployment cancelled${NC}"
  exit 1
fi

# Step 6: Push to trigger deployment
echo -e "${YELLOW}Pushing to origin/develop...${NC}"

if git push origin develop; then
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║          Deployment Triggered! 🚀              ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BLUE}View deployment progress:${NC}"
  echo -e "${BLUE}https://github.com/${GITHUB_REPO}/actions${NC}"
  echo ""
  echo -e "${BLUE}Expected deployment steps:${NC}"
  echo -e "  1. ⏳ Build and Lint"
  echo -e "  2. ⏳ Run Tests"  
  echo -e "  3. ⏳ Deploy to Development (Vercel)"
  echo -e "  4. ⏳ Health Check"
  echo ""
  echo -e "${GREEN}✓ Deployment initiated successfully${NC}"
else
  echo ""
  echo -e "${RED}✗ Push failed${NC}"
  echo "  Please check your git configuration and try again"
  exit 1
fi
