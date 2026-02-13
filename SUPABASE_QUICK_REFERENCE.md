# Quick Reference - BrainBuddy Supabase Configuration

## 🚀 Quick Start

### Frontend
```bash
# Already configured! Just verify:
cat .env | grep VITE_SUPABASE

# Should show:
# VITE_SUPABASE_URL=https://irlbqoxqgztgjezzwknm.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend
```bash
# 1. Install dependencies
npm install express cors helmet express-rate-limit dotenv

# 2. Set environment variables
echo 'SUPABASE_URL=https://irlbqoxqgztgjezzwknm.supabase.co' >> .env
echo 'SUPABASE_SERVICE_ROLE_KEY=your_service_role_key' >> .env
echo 'PORT=3001' >> .env

# 3. Start server
npx tsx server/index.ts
```

---

## 📋 Key Files

| File | Purpose |
|------|---------|
| `src/integrations/supabase/client.ts` | Frontend client (anon key) |
| `server/lib/supabaseAdmin.ts` | Backend client (service role) |
| `server/routes/gameUnlock.ts` | Transaction APIs |
| `server/index.ts` | Express server setup |
| `.env` | Frontend env vars (in git) |
| `.env` (backend) | Backend secrets (NOT in git) |
| `.env.example` | Template for env vars |

---

## 🔑 Environment Variables

### Frontend (safe to commit)
```
VITE_SUPABASE_URL = Public project URL
VITE_SUPABASE_ANON_KEY = Public anon key
```

### Backend (SECRET, never commit)
```
SUPABASE_URL = Project URL
SUPABASE_SERVICE_ROLE_KEY = Secret service role key
PORT = Server port (default 3001)
FRONTEND_URL = CORS allowed origin
```

---

## 🔐 Security Rules

### ✅ Frontend can:
- Sign up / sign in
- Read own data (RLS protected)
- Update own profile
- Reset password

### ❌ Frontend cannot:
- Deduct coins (use `/api/unlock-game`)
- Admin operations
- Access other users' data
- Call server functions

### ✅ Backend can:
- Validate transactions
- Deduct coins atomically
- Run admin operations
- Access all data

### ❌ Backend never:
- Trusts frontend values
- Skips validation
- Logs sensitive info
- Exposes service key to frontend

---

## 🏗️ API Endpoints

### POST /api/unlock-game
Unlock game with coins
```bash
curl -X POST localhost:3001/api/unlock-game \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "game-1",
    "gameName": "Game 1",
    "price": 500
  }'
```

### GET /api/user/coins
Get coin balance
```bash
curl -H "Authorization: Bearer TOKEN" \
  localhost:3001/api/user/coins
```

### GET /api/game/:gameId/status
Check unlock status
```bash
curl -H "Authorization: Bearer TOKEN" \
  localhost:3001/api/game/game-1/status
```

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| Missing env vars | Check `.env` file exists with all required variables |
| 401 Unauthorized | Verify JWT token format: `Bearer <token>` |
| 402 Insufficient coins | User doesn't have enough coins (expected) |
| CORS error | Set `FRONTEND_URL` env var correctly |
| 429 Too many requests | Rate limit hit, wait before retrying |

---

## 🔍 Verify Security

```bash
# Check no secrets in git
git log --all --full-history -- '.env'
# Result: should be empty

# Check env vars are validated
grep -n "Missing required" src/integrations/supabase/client.ts
grep -n "Missing required" server/lib/supabaseAdmin.ts
# Result: both should have validation

# Check RLS is enabled
# Login to Supabase console > Tables > Check "Policies" tab
# Result: ROW LEVEL SECURITY should be ON

# Check no hardcoded keys
grep -r "eyJ" src/ | grep -v "\.md:" | grep -v "test"
grep -r "sk_" src/
# Result: should be empty (no real keys)
```

---

## 📚 Documentation

- **Complete Guide**: [SUPABASE_SECURITY_CONFIG.md](SUPABASE_SECURITY_CONFIG.md)
- **Upgrade Details**: [SUPABASE_UPGRADE_COMPLETE.md](SUPABASE_UPGRADE_COMPLETE.md)
- **Backend Setup**: [server/README.md](server/README.md)

---

## 🎯 Before Going to Production

- [ ] Test all API endpoints with valid & invalid inputs
- [ ] Verify RLS policies in Supabase console
- [ ] Set environment variables in CI/CD
- [ ] Test rate limiting
- [ ] Check error messages don't leak sensitive info
- [ ] Verify audit logs are working
- [ ] Set HTTPS in production
- [ ] Enable DDoS protection
- [ ] Configure monitoring & alerts

---

## 💡 Pro Tips

### Use environment variable validation
```typescript
import { validateEnvironment } from '@/utils/security'
validateEnvironment() // Call on app startup
```

### Always get JWT token before API calls
```typescript
const { data } = await supabase.auth.getSession()
const token = data.session?.access_token
```

### Always call backend for transactions
```typescript
// ❌ Don't: supabase.from('profiles').update({ coins })
// ✅ Do: fetch('/api/unlock-game', { auth: token })
```

### Always rate limit on backend
```typescript
// Already configured in server/index.ts
// General: 100 req/15min
// Sensitive: 10 req/1min
```

---

## 🆘 Need Help?

1. Check [SUPABASE_SECURITY_CONFIG.md](SUPABASE_SECURITY_CONFIG.md) for verification steps
2. Review [server/README.md](server/README.md) for API documentation
3. Check `.env.example` for correct variable names
4. Verify Supabase console > Auth > Users logged in
5. Check Supabase console > Functions > Logs for errors

---

**Remember: Security is not a feature, it's a requirement!** 🔐
