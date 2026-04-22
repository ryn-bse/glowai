# Vercel Deployment Checklist

This checklist ensures successful deployment of GlowAI to Vercel.

## Pre-Deployment Checklist

### 1. Code Changes Complete

- [x] Fixed API routing configuration (`vercel.json`)
- [x] Fixed error serialization in backend
- [x] Improved CORS configuration for production
- [x] Enhanced frontend error handling
- [x] Created environment variable setup guide

### 2. Local Testing

- [ ] Backend runs successfully locally (`cd backend && python app.py`)
- [ ] Frontend runs successfully locally (`cd frontend && npm run dev`)
- [ ] Can complete signup flow locally
- [ ] Can login successfully locally
- [ ] Dashboard displays correctly locally
- [ ] No console errors in browser
- [ ] Run preservation tests: `cd tests && npm run test:preservation`
- [ ] All preservation tests PASS

### 3. Environment Variables Prepared

Gather the following values (see `VERCEL_ENV_SETUP.md` for details):

- [ ] `DATABASE_URL` - Supabase PostgreSQL connection string
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_KEY` - Supabase service role key
- [ ] `JWT_SECRET` - Random secret string (generate new for production)
- [ ] `GROQ_API_KEY` - Groq API key for AI features
- [ ] `FRONTEND_URL` - Will be set after first deployment

---

## Deployment Steps

### Step 1: Push Code to Git

```bash
# Ensure all changes are committed
git add .
git commit -m "Fix Vercel deployment issues - API routing, error handling, CORS"
git push origin main
```

### Step 2: Connect to Vercel (First Time Only)

If not already connected:

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your Git repository
4. Select the repository
5. Click "Import"

### Step 3: Configure Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable from the list above
3. Set scope to: Production, Preview, Development
4. Click "Save"

**Important:** Don't set `FRONTEND_URL` yet - you'll get this after first deployment

### Step 4: Configure Build Settings

Vercel should auto-detect settings, but verify:

- **Framework Preset:** Vite
- **Build Command:** `cd frontend && npm install && npm run build`
- **Output Directory:** `frontend/dist`
- **Install Command:** `npm install`

### Step 5: Deploy

1. Click "Deploy" button
2. Wait for deployment to complete (2-5 minutes)
3. Note your deployment URL (e.g., `https://your-app-xyz.vercel.app`)

### Step 6: Set FRONTEND_URL

1. Go back to Settings → Environment Variables
2. Add `FRONTEND_URL` with your deployment URL
3. Set scope to: Production, Preview, Development
4. Click "Save"

### Step 7: Redeploy

1. Go to Deployments tab
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Wait for redeployment to complete

---

## Post-Deployment Verification

### Step 1: Health Check

Visit: `https://your-app.vercel.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "supabase_auth": "configured",
  "environment": "production"
}
```

If you see errors, check Vercel function logs.

### Step 2: Run Bug Exploration Tests

```bash
cd tests
export VERCEL_URL=https://your-app.vercel.app
npm run test:bug-exploration
```

Expected: All tests PASS ✅

### Step 3: Manual Testing

- [ ] Visit `https://your-app.vercel.app`
- [ ] Frontend loads without errors
- [ ] Click "Create Account"
- [ ] Fill in signup form (all 3 steps)
- [ ] Submit registration
- [ ] Verify redirect to dashboard (not blank screen)
- [ ] Verify user info displays correctly
- [ ] Verify no "[object Object]" errors
- [ ] Click "Sign out"
- [ ] Click "Sign in"
- [ ] Login with created account
- [ ] Verify dashboard loads correctly

### Step 4: Check Browser Console

- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Verify no errors (red messages)
- [ ] Check Network tab for failed requests
- [ ] Verify all API calls return 200 or expected status codes

### Step 5: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" → Latest Deployment
3. Click "Functions" tab
4. Click on `api/index.py` function
5. Review logs for any errors

---

## Troubleshooting

### Issue: 404 on /api/* routes

**Cause:** API routing not configured correctly

**Solution:**
1. Verify `vercel.json` has correct rewrites
2. Verify `api/index.py` exists
3. Redeploy

### Issue: 500 Internal Server Error

**Cause:** Missing environment variables or database connection issue

**Solution:**
1. Check `/api/health` endpoint for specific error
2. Verify all environment variables are set in Vercel
3. Check Vercel function logs for detailed error
4. Verify Supabase credentials are correct

### Issue: "[object Object]" errors

**Cause:** Error serialization issue

**Solution:**
1. Check backend error handlers return string messages
2. Verify frontend error parsing handles objects
3. Check browser console for actual error object

### Issue: Blank screen after signup

**Cause:** Authentication flow or routing issue

**Solution:**
1. Check browser console for errors
2. Verify token is stored in localStorage
3. Check auth context updates correctly
4. Verify `/dashboard` route exists

### Issue: CORS errors

**Cause:** CORS not configured for production domain

**Solution:**
1. Verify `FRONTEND_URL` is set correctly in Vercel
2. Check CORS configuration in `backend/app.py`
3. Ensure URL includes `https://` and no trailing slash
4. Redeploy after fixing

### Issue: Database connection fails

**Cause:** Incorrect database credentials

**Solution:**
1. Verify `DATABASE_URL` format is correct
2. Check Supabase project is active
3. Verify connection string includes `?sslmode=require`
4. Test connection from Supabase dashboard

---

## Rollback Procedure

If deployment fails and you need to rollback:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." menu
4. Click "Promote to Production"
5. Confirm promotion

---

## Success Criteria

Deployment is successful when:

- ✅ Health check returns "healthy" status
- ✅ Bug exploration tests all PASS
- ✅ Can complete signup flow without errors
- ✅ Dashboard displays after signup (no blank screen)
- ✅ No "[object Object]" errors appear
- ✅ Browser console shows no errors
- ✅ All API calls succeed
- ✅ Local development still works (preservation tests PASS)

---

## Post-Deployment Tasks

After successful deployment:

- [ ] Update README with deployment URL
- [ ] Document any custom domain setup
- [ ] Set up monitoring/alerts (optional)
- [ ] Configure custom domain (optional)
- [ ] Set up CI/CD pipeline (optional)
- [ ] Share deployment URL with team/users

---

## Maintenance

### Regular Tasks

- Monitor Vercel function logs for errors
- Check Supabase usage and quotas
- Rotate secrets periodically (JWT_SECRET, API keys)
- Keep dependencies updated
- Monitor performance metrics

### When to Redeploy

- After code changes
- After environment variable changes
- After Vercel configuration changes
- If experiencing persistent errors

---

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Project Documentation:**
  - `VERCEL_ENV_SETUP.md` - Environment variables guide
  - `tests/VERIFICATION_GUIDE.md` - Testing guide
  - `tests/README.md` - Test documentation

---

## Notes

- First deployment may take longer (5-10 minutes)
- Subsequent deployments are faster (2-3 minutes)
- Preview deployments are created for pull requests
- Production deployment happens on main branch push
- Environment variables are encrypted by Vercel
- Function logs are retained for 24 hours on free plan
