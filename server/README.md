# Backend Server Setup - BrainBuddy

This directory contains the secure backend server for BrainBuddy with proper Supabase integration.

## Structure

```
server/
├── index.ts                    # Main Express server setup
├── lib/
│   └── supabaseAdmin.ts       # Admin Supabase client with service role
└── routes/
    └── gameUnlock.ts          # Game unlock transaction endpoints
```

## Environment Variables

Create a `.env` file in the project root with:

```bash
# Backend Supabase Configuration
SUPABASE_URL=https://irlbqoxqgztgjezzwknm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Optional: Logging level
LOG_LEVEL=info
```

⚠️ **IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` is sensitive. Never commit it or expose it in frontend code.

## Installation & Running

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Add Backend Dependencies (if not installed)

```bash
npm install express cors helmet express-rate-limit dotenv
npm install -D @types/express @types/node typescript
```

### 3. Build (if using TypeScript)

```bash
# If using ts-node
npx ts-node server/index.ts

# Or build to JavaScript first
npx tsc server/index.ts --outDir dist
node dist/server/index.js
```

### 4. Run Development Server

```bash
# Using ts-node (requires TypeScript)
npx ts-node server/index.ts

# Or with tsx (faster)
npx tsx server/index.ts
```

The server will start on `http://localhost:3001`

## API Endpoints

### POST /api/unlock-game
Unlock a game by deducting coins from user account.

**Requirements:**
- Authorization header with valid JWT token
- Request body with gameId, gameName, and price

**Example:**
```bash
curl -X POST http://localhost:3001/api/unlock-game \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "epic-era-battles",
    "gameName": "Epic Era Battles",
    "price": 500
  }'
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Game \"Epic Era Battles\" unlocked successfully",
  "remainingCoins": 450
}
```

**Response (Insufficient Coins - 402):**
```json
{
  "success": false,
  "error": "Insufficient coins"
}
```

**Response (Unauthorized - 401):**
```json
{
  "success": false,
  "error": "Unauthorized: User not authenticated"
}
```

### GET /api/user/coins
Get current coin balance for authenticated user.

**Example:**
```bash
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:3001/api/user/coins
```

**Response:**
```json
{
  "success": true,
  "coins": 1000
}
```

### GET /api/game/:gameId/status
Check if a game is unlocked for authenticated user.

**Example:**
```bash
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:3001/api/game/epic-era-battles/status
```

**Response (Unlocked):**
```json
{
  "success": true,
  "unlocked": true,
  "unlockedAt": "2026-02-13T10:30:00Z"
}
```

**Response (Locked):**
```json
{
  "success": true,
  "unlocked": false,
  "unlockedAt": null
}
```

## Security Features

### 1. Authentication
- All endpoints require valid JWT token in `Authorization: Bearer <token>` header
- Tokens validated against Supabase

### 2. Rate Limiting
- **General**: 100 requests per 15 minutes
- **Sensitive Operations**: 10 requests per minute (stricter for transactions)

### 3. Input Validation
- Request body validated for required fields
- Game price verified against database configuration

### 4. Authorization
- Users can only access their own data (enforced via JWT)
- Admin operations use service role (backend only)

### 5. CORS
- Restricted to frontend URL (configurable via FRONTEND_URL env)
- Prevents unauthorized cross-origin requests

### 6. Security Headers
- Helmet.js protection against common vulnerabilities
- Content Security Policy headers
- X-Frame-Options protection

### 7. Audit Logging
- All sensitive operations logged to database
- Transaction history maintained for compliance

## Backend Supabase Client

The `supabaseAdmin` client in `server/lib/supabaseAdmin.ts`:

- Uses `SUPABASE_SERVICE_ROLE_KEY` (backend only)
- Has session persistence disabled
- Has auto-refresh tokens disabled
- Includes helper functions for common operations

**Usage Example:**
```typescript
import { supabaseAdmin, adminOperations } from './lib/supabaseAdmin';

// Verify user has coins
const hasCoins = await adminOperations.verifyUserCoins(userId, 500);

// Deduct coins atomically
const result = await adminOperations.deductCoins(userId, 500);

// Log transaction
await adminOperations.logTransaction(userId, 'coin_deduction', {
  amount: 500,
  reason: 'game_unlock'
});
```

## Frontend Integration

### 1. Get JWT Token
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;
```

### 2. Call Backend API
```typescript
const response = await fetch('http://localhost:3001/api/unlock-game', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    gameId: 'game-1',
    gameName: 'Game 1',
    price: 500
  })
});

const data = await response.json();
```

### 3. Handle Responses
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

try {
  const response = await fetch(apiUrl, { /* ... */ });
  const data = await response.json();

  if (data.success) {
    toast({
      title: 'Success',
      description: data.message,
    });
  } else {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: data.error,
    });
  }
} catch (error) {
  toast({
    variant: 'destructive',
    title: 'Error',
    description: 'Network error',
  });
}
```

## Database Functions Required

The backend expects certain Supabase database functions to exist:

### 1. `deduct_user_coins(user_id UUID, amount INTEGER)`
Atomically deducts coins from a user's account.

### 2. RLS Policies on `user_profiles` table
- Users can view their own profile
- Service role can view/update all profiles

### 3. `user_unlocks` table
Structure:
```sql
CREATE TABLE user_unlocks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_id TEXT NOT NULL,
  unlocked_at TIMESTAMP NOT NULL
)
```

## Troubleshooting

### Server won't start: "Missing required backend environment variables"
- Ensure `.env` file exists in project root
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### 401 Unauthorized errors
- Verify JWT token is valid and not expired
- Check token format: `Authorization: Bearer <token>`
- Ensure token is from correct Supabase project

### 402 Insufficient coins errors
- This is expected! Verify user actually has coins in database
- Check `user_profiles.coins` field

### CORS errors
- Verify `FRONTEND_URL` env var is set correctly
- Frontend must be at the exact URL specified

### Rate limiting errors (429)
- Wait before retrying
- Implement exponential backoff on client
- Consider caching frequently-accessed data

## Production Deployment

### Security Checklist

- [ ] Environment variables set in production (not hardcoded)
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] FRONTEND_URL set to production domain
- [ ] Rate limits tuned for expected traffic
- [ ] Monitoring and alerts set up
- [ ] Database backups configured
- [ ] Audit logging enabled
- [ ] Regular key rotation schedule established

### Deployment Steps

1. Set environment variables in your deployment platform
2. Build and deploy the application
3. Verify all endpoints respond correctly
4. Monitor logs for errors
5. Test transaction flows

## References

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Admin SDK](https://supabase.com/docs/reference/javascript/admin-api)
- [JWT Authentication](https://supabase.com/docs/guides/auth/jwts)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
