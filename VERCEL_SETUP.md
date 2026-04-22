# Vercel Deployment Setup Guide

## Environment Variables Configuration

Your `.env` file is NOT automatically deployed to Vercel. You must configure environment variables in the Vercel dashboard.

### Required Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

#### Database & Auth
```
DATABASE_URL=your_postgresql_connection_string_from_supabase
JWT_SECRET=your_strong_random_secret_key_here
```

#### Supabase Configuration
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
```

**⚠️ IMPORTANT**: Get these values from your Supabase project dashboard:
- Go to Project Settings → API
- Copy the Project URL, anon/public key, and service_role key

#### API Keys
```
GROQ_API_KEY=your_groq_api_key_here
```

**⚠️ IMPORTANT**: Get your Groq API key from https://console.groq.com/

#### Optional (if using Google OAuth)
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

#### Other Settings
```
UPLOAD_DIR=uploads
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Important Notes

1. **FRONTEND_URL**: Update this to your actual Vercel deployment URL
2. **JWT_SECRET**: Change this to a strong random string in production
3. **Environment Scope**: Set variables for "Production", "Preview", and "Development" environments
4. **Redeploy**: After adding environment variables, trigger a new deployment

## Debugging Registration Issues

If registration still fails after setting environment variables:

1. **Check Vercel Logs**:
   - Go to your Vercel project → Deployments
   - Click on the latest deployment
   - View "Functions" logs to see backend errors

2. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for detailed error messages

3. **Common Issues**:
   - Missing `SUPABASE_SERVICE_KEY` → Check it's set in Vercel
   - Supabase Auth disabled → Enable Email Auth in Supabase dashboard
   - CORS errors → Check `FRONTEND_URL` matches your deployment URL
   - Database connection → Verify `DATABASE_URL` is correct

## Testing Locally

To test the same configuration locally:

```bash
# Backend
cd backend
python app.py

# Frontend (in another terminal)
cd frontend
npm run dev
```

Make sure your local `.env` file has all the required variables.

## Vercel Deployment Structure

Your project uses Vercel's experimental services feature:
- Frontend: Served from `/` (Vite app)
- Backend: Served from `/api` (Python Flask app)

The `vercel.json` in the root configures this routing.
