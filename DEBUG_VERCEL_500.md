# Debugging the 500 Error on Vercel

## What Changed

I've added comprehensive error logging that will show you the **exact error** instead of the generic 500 message.

## Steps to Debug

### 1. Wait for Vercel Deployment
- Go to your Vercel dashboard
- Wait for the new deployment to complete (2-3 minutes)
- The deployment should show commit: "Add comprehensive error logging and health check endpoint"

### 2. Test the Health Check Endpoint

Once deployed, visit:
```
https://your-app.vercel.app/api/health
```

This will tell you:
- ✅ If the database connection is working
- ✅ If Supabase Auth is configured
- ❌ The exact error if something is wrong

**Expected Response (if healthy):**
```json
{
  "status": "healthy",
  "database": "connected",
  "supabase_auth": "configured",
  "environment": "production"
}
```

**If unhealthy, you'll see:**
```json
{
  "status": "unhealthy",
  "error": "actual error message here",
  "type": "ErrorType"
}
```

### 3. Try Registration Again

After the deployment completes, try registering a new user. The error message will now show the **actual problem** instead of "[object Object]".

### 4. Check Vercel Function Logs

If you still get an error:

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" → Latest Deployment
3. Click "Functions" tab
4. Look for the `/api/auth/register` function
5. Click on it to see the detailed logs

The logs will now show:
```
================================================================================
REGISTRATION ERROR:
Step1: {...}
Step2: {...}
Error: [actual error message]
[full stack trace]
================================================================================
```

## Common Issues and Solutions

### Issue 1: Missing Environment Variables
**Error:** `SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set`

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Add `SUPABASE_SERVICE_KEY` with your service role key
3. Redeploy

### Issue 2: Database Table Not Found
**Error:** `relation "users" does not exist`

**Solution:**
1. Go to your Supabase dashboard
2. Open SQL Editor
3. Run the SQL from `backend/supabase_schema.sql`

### Issue 3: Supabase Auth Error
**Error:** `Authentication service configuration error`

**Solution:**
1. Check that `SUPABASE_ANON_KEY` is set in Vercel
2. Verify the key is correct in Supabase → Settings → API

### Issue 4: Database Connection Error
**Error:** `Invalid API key` or `Unauthorized`

**Solution:**
1. Verify `SUPABASE_SERVICE_KEY` in Vercel matches your Supabase service_role key
2. Check that the key hasn't expired
3. Ensure you're using the service_role key, not the anon key

## Next Steps

1. **Wait for deployment** to complete
2. **Visit `/api/health`** to check system status
3. **Try registration** and note the exact error message
4. **Check Vercel logs** for detailed stack traces
5. **Report back** with the actual error message you see

The improved logging will pinpoint the exact issue!
