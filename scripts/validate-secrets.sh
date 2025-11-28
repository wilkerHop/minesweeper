#!/bin/bash

# Validate Secrets Script
# Checks if required environment variables are set

set -e

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <secrets_file>"
    exit 1
fi

SECRETS_FILE=$1

if [ ! -f "$SECRETS_FILE" ]; then
    echo "Error: Secrets file '$SECRETS_FILE' not found"
    exit 1
fi

MISSING_SECRETS=""

# Read the secrets file line by line
while IFS= read -r secret_name || [ -n "$secret_name" ]; do
    # Skip empty lines and comments
    if [[ -z "$secret_name" || "$secret_name" =~ ^# ]]; then
        continue
    fi

    # Check if the environment variable is set
    if [ -z "${!secret_name}" ]; then
        MISSING_SECRETS="$MISSING_SECRETS $secret_name"
    fi
done < "$SECRETS_FILE"

if [ ! -z "$MISSING_SECRETS" ]; then
    echo "::error::Missing secrets:$MISSING_SECRETS"
    echo "::error::See .github/SECRETS.md for configuration instructions"
    exit 1
fi

echo "✓ All required secrets are configured"
