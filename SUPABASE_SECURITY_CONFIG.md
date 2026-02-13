/**
 * SECURITY CONFIGURATION & VERIFICATION GUIDE
 * BrainBuddy Supabase Setup
 * 
 * This document outlines the security architecture and provides
 * verification steps to ensure proper configuration.
 */

/**
 * ============================================
 * SECTION 1: ENVIRONMENT VARIABLES CHECKLIST
 * ============================================
 */

const SECURITY_CHECKLIST = {
  ENVIRONMENT_VARIABLES: {
    frontend: {
      "✔ VITE_SUPABASE_URL": "Frontend Supabase project URL",
      "✔ VITE_SUPABASE_ANON_KEY": "Public anon key (safe for frontend)",
      "⚠️  NO VITE_SUPABASE_SERVICE_ROLE_KEY": "Service keys must NEVER be in frontend",
    },
    backend: {
      "✔ SUPABASE_URL": "Backend Supabase project URL",
      "✔ SUPABASE_SERVICE_ROLE_KEY": "Service role key (backend only)",
      "✔ PORT": "Server port (default 3001)",
      "✔ FRONTEND_URL": "CORS allowed frontend URL",
    },
    rules: {
      "✔ Never commit .env files": "Add to .gitignore",
      "✔ Use .env.example as template": "Shows placeholder values only",
      "✔ Rotate keys regularly": "Update keys in Supabase console",
      "✔ Use different keys per environment": "Dev, staging, production",
    }
  },

  /**
   * ============================================
   * SECTION 2: FRONTEND SECURITY CHECKLIST
   * ============================================
   */
  FRONTEND_SECURITY: {
    supabase_client: {
      "✔ src/integrations/supabase/client.ts": [
        "✔ Validates VITE_SUPABASE_URL at startup",
        "✔ Validates VITE_SUPABASE_ANON_KEY at startup",
        "✔ Uses sessionStorage for auth tokens",
        "✔ Auto-refreshes tokens within session",
        "✔ Clears tokens on browser tab close",
      ]
    },
    environment_validation: {
      "✔ src/utils/security.ts": [
        "✔ validateEnvironment() throws on missing vars",
        "✔ Warns on insecure HTTP (non-localhost)",
        "✔ Prevents certain sensitive data in localStorage",
      ]
    },
    api_usage_rules: {
      "✔ Use supabase client ONLY for:": [
        "✓ User authentication (sign up, sign in, sign out)",
        "✓ Reading own RLS-protected data",
        "✓ Writing own RLS-protected data",
        "✉️  Email/password reset",
      ],
      "❌ NEVER use frontend for:": [
        "✗ Admin operations",
        "✗ Coin deduction (MUST use backend API)",
        "✗ Accessing other users' data",
        "✗ Sensitive transactions",
      ]
    }
  },

  /**
   * ============================================
   * SECTION 3: BACKEND SECURITY CHECKLIST
   * ============================================
   */
  BACKEND_SECURITY: {
    admin_client: {
      "✔ server/lib/supabaseAdmin.ts": [
        "✔ Uses SUPABASE_SERVICE_ROLE_KEY",
        "✔ Validates environment variables on import",
        "✔ Has session persistence disabled",
        "✔ Has auto refresh token disabled",
        "✔ Logs all sensitive operations",
      ]
    },
    api_routes: {
      "✔ server/routes/gameUnlock.ts": [
        "✔ POST /api/unlock-game - Deduct coins atomically",
        "✔ GET /api/user/coins - Get user coin balance",
        "✔ GET /api/game/:gameId/status - Check unlock status",
      ]
    },
    middleware: {
      "✔ Authentication": "Validates JWT tokens from Supabase",
      "✔ Rate Limiting": "General API limits + stricter limits on sensitive routes",
      "✔ CORS": "Restricts to frontend URL only",
      "✔ Helmet": "Security headers protection",
    },
    validation_rules: {
      "✔ VERIFY coin price matches DB": "Prevent frontend price tampering",
      "✔ VERIFY user has coins server-side": "Never trust frontend values",
      "✔ ATOMIC transactions": "Deduct coins and log in single operation",
      "✔ LOG all sensitive ops": "Audit trail for all transactions",
    }
  },

  /**
   * ============================================
   * SECTION 4: DATABASE SECURITY CHECKLIST
   * ============================================
   */
  DATABASE_SECURITY: {
    row_level_security: {
      "✔ ENABLED on all tables:": [
        "profiles - Users can view/update own",
        "user_daily_challenges - Only own records",
        "quiz_results - Only own results",
        "user_achievements - Only own achievements",
        "user_unlocks - Only own unlocks",
        "audit_logs - Only own audit logs",
        "rate_limit_logs - Only own rate limits",
      ]
    },
    service_role_access: {
      "✔ Service role can:": [
        "✓ Insert/update/delete user records (admin ops)",
        "✓ Read all data for analytics",
        "✓ Insert audit/rate limit logs",
        "✓ Call admin RPC functions",
      ]
    },
    anon_key_access: {
      "✔ Anon key can ONLY:": [
        "✓ Authenticate (sign up/sign in)",
        "✓ Read own profile",
        "✓ Update own password/email",
        "✓ Read own records (RLS protected)",
      ]
    }
  },

  /**
   * ============================================
   * SECTION 5: SECRETS MANAGEMENT CHECKLIST
   * ============================================
   */
  SECRETS_MANAGEMENT: {
    no_exposed_secrets: {
      "✔ Search results verified:": [
        "✓ No hardcoded API keys in source code",
        "✓ No hardcoded JWT tokens",
        "✓ No hardcoded service role keys",
        "✓ All sensitive values use environment variables",
      ]
    },
    git_protection: {
      "✔ .gitignore includes:": [
        ".env - Never commit",
        ".env.local - Never commit",
        ".env.*.local - Never commit",
        ".env.production - Never commit",
      ]
    },
    key_rotation: {
      "⏰ Regular rotation schedule:": [
        "🔄 Rotate keys every 90 days",
        "🔄 Rotate immediately if exposed",
        "🔄 Use Supabase console to regenerate",
        "🔄 Test thoroughly before deploying",
      ]
    }
  },

  /**
   * ============================================
   * SECTION 6: API SECURITY CHECKLIST
   * ============================================
   */
  API_SECURITY: {
    authentication: {
      "✔ All endpoints require JWT": "Via Authorization header",
      "✔ Tokens validated server-side": "Against Supabase",
      "✔ Tokens have expiration": "Configured in Supabase",
    },
    input_validation: {
      "✔ Request body validated": "Schema checking",
      "✔ Price validation": "Matches server config",
      "✔ User ID validation": "From JWT token only",
    },
    rate_limiting: {
      "✔ General API limit": "100 requests per 15 minutes",
      "✔ Sensitive operations limit": "10 requests per minute",
      "✔ Coin operations": "Strictly rate limited",
    },
    error_handling: {
      "✔ No sensitive info in errors": "Generic messages to client",
      "✔ Detailed logs server-side": "For debugging",
      "✔ Proper HTTP status codes": "401 auth, 402 payment, 500 server",
    }
  },

  /**
   * ============================================
   * SECTION 7: DEPLOYMENT CHECKLIST
   * ============================================
   */
  DEPLOYMENT: {
    pre_deployment: {
      "☐ Run security audit": "npm run lint & security scan",
      "☐ Test all API endpoints": "With valid & invalid inputs",
      "☐ Verify RLS policies": "In Supabase console",
      "☐ Check .env.example": "Updated with new variable names",
      "☐ Verify no secrets in git": "git log for exposed keys",
    },
    environment_setup: {
      "☐ Set VITE_SUPABASE_URL": "In CI/CD frontend build",
      "☐ Set VITE_SUPABASE_ANON_KEY": "In CI/CD frontend build",
      "☐ Set SUPABASE_URL": "In server environment",
      "☐ Set SUPABASE_SERVICE_ROLE_KEY": "In server environment (secret)",
      "☐ Set FRONTEND_URL": "For CORS configuration",
    },
    production: {
      "☐ Use HTTPS only": "No HTTP allowed",
      "☐ Enable DDoS protection": "Cloudflare or similar",
      "☐ Monitor rate limits": "Set up alerts",
      "☐ Monitor audit logs": "Set up alerts for suspicious activity",
      "☐ Regular backups": "Supabase automated backups enabled",
    }
  }
};

/**
 * ============================================
 * SECTION 8: VERIFICATION STEPS
 * ============================================
 */

const VERIFY_SECURITY = {
  step1_check_env_files: `
    // Verify .env is not in git
    $ git log --all --full-history -- '.env'
    // Should show: no results
    
    // Verify .env is in .gitignore
    $ cat .gitignore | grep .env
    // Should show: .env (and variants)
  `,

  step2_check_frontend_client: `
    // File: src/integrations/supabase/client.ts
    // Should contain:
    - import.meta.env.VITE_SUPABASE_URL ✓
    - import.meta.env.VITE_SUPABASE_ANON_KEY ✓
    - Error thrown if vars missing ✓
    - sessionStorage for auth tokens ✓
    
    // Should NOT contain:
    - SUPABASE_SERVICE_ROLE_KEY ✗
    - VITE_SUPABASE_PUBLISHABLE_KEY ✗ (deprecated)
    - Hardcoded URLs or keys ✗
  `,

  step3_check_backend_client: `
    // File: server/lib/supabaseAdmin.ts
    // Should contain:
    - process.env.SUPABASE_URL ✓
    - process.env.SUPABASE_SERVICE_ROLE_KEY ✓
    - Validation on import ✓
    - Session persistence disabled ✓
    - Auto refresh disabled ✓
    
    // Should NOT be imported in frontend ✗
  `,

  step4_check_no_secrets: `
    // Search for potential secrets
    $ grep -r "eyJ" src/  // JWTs
    $ grep -r "sk_" src/  // API keys
    $ grep -r "sb_" src/  // Supabase keys
    
    // Only results should be in:
    - Comments explaining keys
    - .env.example (placeholder values)
    - Migration files referencing roles
  `,

  step5_verify_rls: `
    // In Supabase console:
    1. Navigate to each table
    2. Check "Policies" tab
    3. Verify "Row Level Security" is ENABLED
    4. Verify policies exist for:
       - SELECT with auth.uid() = user_id
       - UPDATE with auth.uid() = user_id
       - INSERT with auth.uid() = user_id
       - Service role can also access
  `,

  step6_test_api_endpoints: `
    // Test with curl/Postman
    
    // 1. Get valid token
    $ curl -X POST https://project.supabase.co/auth/v1/token \\
      -H "Content-Type: application/json" \\
      -d '{"grant_type":"password","email":"user@example.com","password":"password"}'
    
    // 2. Test with valid token (should work)
    $ curl -H "Authorization: Bearer <token>" \\
      http://localhost:3001/api/user/coins
    // Expected: 200 with coins data
    
    // 3. Test without token (should fail)
    $ curl http://localhost:3001/api/user/coins
    // Expected: 401 Unauthorized
    
    // 4. Test coin deduction (should validate price)
    $ curl -X POST http://localhost:3001/api/unlock-game \\
      -H "Authorization: Bearer <token>" \\
      -H "Content-Type: application/json" \\
      -d '{"gameId":"game1","gameName":"Game 1","price":100}'
    // Expected: 200 with remainingCoins or error if insufficient
  `,

  step7_final_audit: `
    // Security audit checklist
    - [ ] All env vars use correct names
    - [ ] No hardcoded secrets found
    - [ ] RLS enabled on all tables
    - [ ] Backend validates all inputs
    - [ ] API rate limiting configured
    - [ ] CORS restricted to frontend only
    - [ ] Error messages don't leak info
    - [ ] Audit logging working
    - [ ] .env not committable
    - [ ] HTTPS enforced in production
  `
};

/**
 * Export for reference
 */
export { SECURITY_CHECKLIST, VERIFY_SECURITY };

/**
 * ============================================
 * CRITICAL REMINDERS
 * ============================================
 * 
 * 🔐 NEVER expose service role keys in:
 *    - Frontend code
 *    - Client-side JavaScript
 *    - Environment variables visible to users
 *    - Public git repositories
 * 
 * 🔐 ALWAYS validate on backend:
 *    - User ID from JWT token
 *    - Coin amounts (check database)
 *    - Transaction legitimacy
 *    - Rate limits
 * 
 * 🔐 ALWAYS use secure storage:
 *    - sessionStorage for auth tokens
 *    - Backend session for sensitive data
 *    - Never use localStorage for tokens
 * 
 * 🔐 ALWAYS log transactions:
 *    - Who did what
 *    - When they did it
 *    - What changed
 *    - Any errors that occurred
 */
