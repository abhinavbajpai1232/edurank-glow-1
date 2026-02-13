#!/bin/bash
# Security Configuration Verification Script
# Run this to verify BrainBuddy Supabase security setup
# Usage: bash verify-security.sh

set -e

echo "🔐 BrainBuddy Supabase Security Verification"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper functions
check_file_exists() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} File exists: $1"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} File missing: $1"
    ((CHECKS_FAILED++))
  fi
}

check_file_contains() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 contains: $2"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} $1 missing: $2"
    ((CHECKS_FAILED++))
  fi
}

check_file_not_contains() {
  if ! grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 doesn't contain: $2 (good!)"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC} $1 contains: $2 (security risk!)"
    ((CHECKS_FAILED++))
  fi
}

echo "📋 Checking Files..."
echo ""

check_file_exists ".env"
check_file_exists ".env.example"
check_file_exists "src/integrations/supabase/client.ts"
check_file_exists "src/utils/security.ts"
check_file_exists "server/index.ts"
check_file_exists "server/lib/supabaseAdmin.ts"
check_file_exists "server/routes/gameUnlock.ts"
check_file_exists "server/README.md"
check_file_exists "SUPABASE_SECURITY_CONFIG.md"
check_file_exists "SUPABASE_UPGRADE_COMPLETE.md"
check_file_exists "SUPABASE_QUICK_REFERENCE.md"

echo ""
echo "🔑 Checking Environment Variables..."
echo ""

check_file_contains ".env" "VITE_SUPABASE_URL"
check_file_contains ".env" "VITE_SUPABASE_ANON_KEY"
check_file_contains ".env.example" "VITE_SUPABASE_URL"
check_file_contains ".env.example" "VITE_SUPABASE_ANON_KEY"

echo ""
echo "🚫 Checking for Secret Exposure..."
echo ""

check_file_not_contains ".env" "VITE_SUPABASE_SERVICE_ROLE_KEY"
check_file_not_contains ".env" "SUPABASE_SERVICE_ROLE_KEY="
check_file_not_contains ".env.example" "SUPABASE_SERVICE_ROLE_KEY=\""
check_file_not_contains "src/integrations/supabase/client.ts" "SERVICE_ROLE"

echo ""
echo "✅ Checking Frontend Security..."
echo ""

check_file_contains "src/integrations/supabase/client.ts" "VITE_SUPABASE_ANON_KEY"
check_file_contains "src/integrations/supabase/client.ts" "throw new Error"
check_file_contains "src/integrations/supabase/client.ts" "sessionStorage"
check_file_contains "src/utils/security.ts" "VITE_SUPABASE_ANON_KEY"

echo ""
echo "🔐 Checking Backend Security..."
echo ""

check_file_contains "server/lib/supabaseAdmin.ts" "SUPABASE_SERVICE_ROLE_KEY"
check_file_contains "server/lib/supabaseAdmin.ts" "validateAdminEnv"
check_file_contains "server/lib/supabaseAdmin.ts" "throw new Error"
check_file_contains "server/index.ts" "helmet()"
check_file_contains "server/index.ts" "rateLimit"
check_file_contains "server/routes/gameUnlock.ts" "deductCoins"

echo ""
echo "🔍 Checking for Hardcoded Secrets..."
echo ""

# Check for common secret patterns in source code (excluding docs)
if ! grep -r "eyJ" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "test" | grep -v ".md" | grep -q "."; then
  echo -e "${GREEN}✓${NC} No JWT tokens found in source code"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Warning: Possible JWT tokens found in source code"
fi

if ! grep -r "sk_" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -q "."; then
  echo -e "${GREEN}✓${NC} No service keys with 'sk_' prefix found"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Warning: Possible keys with 'sk_' prefix found"
fi

echo ""
echo "📦 Checking Documentation..."
echo ""

check_file_contains "server/README.md" "POST /api/unlock-game"
check_file_contains "server/README.md" "GET /api/user/coins"
check_file_contains "SUPABASE_SECURITY_CONFIG.md" "VALIDATION CHECKLIST"
check_file_contains "SUPABASE_UPGRADE_COMPLETE.md" "Implementation Complete"

echo ""
echo "=============================================="
echo "📊 Summary"
echo "=============================================="
echo -e "${GREEN}✓ Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}✗ Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All security checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review SUPABASE_QUICK_REFERENCE.md for quick setup"
  echo "2. Install backend dependencies: npm install express cors helmet express-rate-limit dotenv"
  echo "3. Set backend environment variables in .env (SUPABASE_SERVICE_ROLE_KEY)"
  echo "4. Start backend: npx tsx server/index.ts"
  echo "5. Test API endpoints (see server/README.md)"
  echo "6. Run frontend: npm run dev"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  Some checks failed!${NC}"
  echo ""
  echo "Please review the failures above and consult:"
  echo "- SUPABASE_SECURITY_CONFIG.md for detailed configuration"
  echo "- SUPABASE_UPGRADE_COMPLETE.md for implementation details"
  echo ""
  exit 1
fi
