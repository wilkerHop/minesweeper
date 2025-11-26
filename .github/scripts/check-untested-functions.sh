#!/bin/bash

# Check for untested functions in newly added or modified TypeScript files
# This script finds all exported functions in modified .ts/.tsx files and checks if they have corresponding tests

set -e

echo "🔍 Checking for untested functions in modified TypeScript files..."

# Get list of modified TypeScript files (excluding test files)
MODIFIED_FILES=$(git diff --name-only --diff-filter=AM origin/main...HEAD | grep -E '\.(ts|tsx)$' | grep -v '\.test\.' | grep -v '\.spec\.' | grep -E '^(lib|app|components)/' || true)

if [ -z "$MODIFIED_FILES" ]; then
  echo "✓ No modified TypeScript files to check"
  exit 0
fi

UNTESTED_FUNCTIONS=()

for FILE in $MODIFIED_FILES; do
  if [ ! -f "$FILE" ]; then
    continue
  fi
  
  echo "📄 Checking $FILE..."
  
  # Extract exported function names using regex
  # Matches: export function name(...) and export const name = (...) =>
  FUNCTIONS=$(grep -oP '(?:export\s+(?:async\s+)?function\s+\K\w+|export\s+const\s+\K\w+(?=\s*=\s*(?:\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)))' "$FILE" || true)
  
  if [ -z "$FUNCTIONS" ]; then
    continue
  fi
  
  # Check if these functions have tests
  for FUNC in $FUNCTIONS; do
    # Look for test files that might test this function
    # Check in tests/ directory and adjacent test files
    BASE_NAME=$(basename "$FILE" .ts)
    BASE_NAME=$(basename "$BASE_NAME" .tsx)
    DIR_NAME=$(dirname "$FILE")
    
    # Possible test file locations
    TEST_FILES=(
      "tests/unit/${BASE_NAME}.test.ts"
      "tests/integration/${BASE_NAME}.test.ts"
      "${DIR_NAME}/${BASE_NAME}.test.ts"
      "${DIR_NAME}/${BASE_NAME}.test.tsx"
      "${DIR_NAME}/__tests__/${BASE_NAME}.test.ts"
    )
    
    FOUND_TEST=false
    for TEST_FILE in "${TEST_FILES[@]}"; do
      if [ -f "$TEST_FILE" ]; then
        # Check if function name appears in test file
        if grep -q "$FUNC" "$TEST_FILE"; then
          FOUND_TEST=true
          break
        fi
      fi
    done
    
    if [ "$FOUND_TEST" = false ]; then
      UNTESTED_FUNCTIONS+=("$FUNC in $FILE")
    fi
  done
done

if [ ${#UNTESTED_FUNCTIONS[@]} -eq 0 ]; then
  echo "✓ All exported functions have tests!"
  exit 0
else
  echo "❌ Found untested functions:"
  printf '  - %s\n' "${UNTESTED_FUNCTIONS[@]}"
  echo ""
  echo "Please add tests for these functions before merging."
  exit 1
fi
