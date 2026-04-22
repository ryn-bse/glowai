# Vercel Environment Variables Setup Guide

## Required Environment Variables

To deploy GlowAI on Vercel, you need to configure the following environment variables in your Vercel project settings.

### How to Set Environment Variables in Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below

## Environment Variables List

### 1. Database Configuration

#### `DATABASE_URL` (Required)
Your Supabase PostgreSQL connection string

**Format:**
```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
```

**Example:**
```
postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

**Where to find it:**
- Supabase Dashboard → Settings → Database → Connection String
- Use the "URI" format

---

#### `SUPABASE_URL` (Required)
Your Supabase project URL

**Format:**
```
https://[PROJECT_ID].supabase.co
```

**Example:**
```
https://oufkyoraefgryjxjbiep.supabase.co
```

**Where to find it:**
- Supabase Dashboard → Settings → API → Project URL

---

#### `SUPABASE_ANON_KEY` (Required)
Your Supabase anonymous/public API key

**Format:** Long JWT token string

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Zmt5b3JhZWZncnlqeGpiaWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDI5NTAsImV4cCI6MjA5MTY3ODk1MH0.3Wuo6h80uWIV6Xs2ddPN0lyRH0pRCTaFetcqhked2UQ
```

**Where to find it:**
- Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

---

#### `SUPABASE_SERVICE_KEY` (Required)
Your Supabase service role key (keep this secret!)

**Format:** Long JWT token string

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Zmt5b3JhZWZncnlqeGpiaWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjEwMjk1MCwiZXhwIjoyMDkxNjc4OTUwfQ.9Wi1TtLrhWNK1CQLzENR7dajXGnX-FXHE0ejt8BVU0I
```

**Where to find it:**
- Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`

**⚠️ IMPORTANT:** This key has admin privileges. Never expose it in frontend code!

---

### 2. Authentication Configuration

#### `JWT_SECRET` (Required)
Secret key for JWT token generation

**Format:** Random string (at least 32 characters recommended)

**Example:**
```
glowai-production-secret-key-change-this-to-random-string
```

**How to generate:**
```bash
# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Using OpenSSL
openssl rand -base64 32
```

---

### 3. CORS Configuration

#### `FRONTEND_URL` (Required)
Your Vercel frontend deployment URL

**Format:**
```
https://your-app.vercel.app
```

**Example:**
```
https://glowai.vercel.app
```

**Where to find it:**
- After first deployment, Vercel will assign you a URL
- You can also set a custom domain in Vercel settings

**Note:** This is used for CORS configuration to allow API requests from your frontend

---

### 4. AI/ML Configuration

#### `GROQ_API_KEY` (Required for AI features)
Your Groq API key for AI-powered chat and analysis

**Format:** String starting with `gsk_`

**Example:**
```
gsk_YOUR_GROQ_API_KEY_HERE
```

**Where to get it:**
- Sign up at https://console.groq.com/
- Go to API Keys section
- Create a new API key

---

### 5. Optional Configuration

#### `UPLOAD_DIR` (Optional)
Directory for uploaded images (default: "uploads")

**Default:** `uploads`

**Note:** On Vercel, file uploads are ephemeral. Consider using Supabase Storage for persistent uploads.

---

#### `GOOGLE_CLIENT_ID` (Optional)
Google OAuth client ID for social login

**Format:** String ending in `.apps.googleusercontent.com`

**Where to get it:**
- Google Cloud Console → APIs & Services → Credentials

---

#### `GOOGLE_CLIENT_SECRET` (Optional)
Google OAuth client secret

**Where to get it:**
- Google Cloud Console → APIs & Services → Credentials

---

## Quick Setup Checklist

- [ ] `DATABASE_URL` - Supabase PostgreSQL connection string
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_KEY` - Supabase service role key
- [ ] `JWT_SECRET` - Random secret string for JWT
- [ ] `FRONTEND_URL` - Your Vercel deployment URL
- [ ] `GROQ_API_KEY` - Groq API key for AI features

## Environment Scope

When adding variables in Vercel, set the scope to:
- ✅ **Production** (required)
- ✅ **Preview** (recommended for testing)
- ✅ **Development** (optional)

## Verification

After setting all environment variables:

1. Redeploy your application
2. Visit `https://your-app.vercel.app/api/health`
3. You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "supabase_auth": "configured",
  "environment": "production"
}
```

If you see errors, check the Vercel function logs for details.

## Troubleshooting

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check that Supabase project is active
- Ensure connection string includes `?sslmode=require`

### Supabase Auth Not Configured
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Check that keys match your Supabase project

### CORS Errors
- Verify `FRONTEND_URL` matches your actual deployment URL
- Check that URL includes `https://` protocol
- Ensure no trailing slash in URL

### 500 Errors
- Check Vercel function logs for detailed error messages
- Verify all required environment variables are set
- Ensure `JWT_SECRET` is set and not empty

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.env` for local development
   - Add `.env` to `.gitignore`

2. **Rotate secrets regularly**
   - Change `JWT_SECRET` periodically
   - Regenerate API keys if compromised

3. **Use different secrets for production and development**
   - Don't use production keys in local development
   - Use separate Supabase projects for dev/prod

4. **Limit service role key usage**
   - Only use `SUPABASE_SERVICE_KEY` in backend
   - Never expose it in frontend code or logs
