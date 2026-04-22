# Vercel Deployment Bug Exploration Tests

## Overview

This directory contains tests for the Vercel deployment bugfix workflow. The tests follow the property-based testing methodology to validate bug conditions and preservation requirements.

## Test Files

### 1. `vercel_deployment_bug_exploration.test.js`
**Purpose**: Surface counterexamples that demonstrate deployment bugs exist

**CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists

**What it tests**:
- API Routing: Frontend `/api` calls reach serverless functions
- Error Serialization: Errors show readable messages, not "[object Object]"
- Environment Variables: Database connectivity works
- Authentication Flow: Signup redirects to dashboard
- CORS Configuration: API calls succeed from production domain

**Expected Outcome**: Test FAILS (proves deployment bugs exist)

### 2. `local_development_preservation.test.js` (Task 2)
**Purpose**: Verify local development functionality remains unchanged

**What it tests**:
- Local API proxy routing
- Local authentication flows
- Local error handling
- Local environment variable loading
- Local database connectivity

**Expected Outcome**: Tests PASS (confirms baseline behavior to preserve)

## Setup

```bash
cd tests
npm install
```

## Running Tests

### Bug Condition Exploration (Task 1)
```bash
# Set your Vercel deployment URL
export VERCEL_URL=https://your-app.vercel.app

# Run bug exploration test
npm run test:bug-exploration
```

**Expected Result**: Tests FAIL - this is CORRECT and proves bugs exist

### Preservation Tests (Task 2)
```bash
# Ensure local development server is running
# Backend: cd backend && python app.py
# Frontend: cd frontend && npm run dev

# Run preservation tests
npm run test:preservation
```

**Expected Result**: Tests PASS - confirms local dev works correctly

## Test Workflow

1. **Task 1**: Run bug exploration test on UNFIXED code deployed to Vercel
   - Document all counterexamples (failures)
   - These failures prove the bugs exist

2. **Task 2**: Run preservation tests on UNFIXED code in local development
   - All tests should PASS
   - This captures the baseline behavior to preserve

3. **Task 3**: Implement fixes (tasks 3.1 - 3.5)

4. **Task 3.6**: Re-run bug exploration test on FIXED code
   - Tests should now PASS
   - Confirms bugs are fixed

5. **Task 3.7**: Re-run preservation tests on FIXED code
   - Tests should still PASS
   - Confirms no regressions in local development

## Counterexample Documentation

When running bug exploration tests, document the failures:

```
✗ COUNTEREXAMPLE FOUND: API routing failure
Error: Request failed with status code 404
Status: 404
Data: Cannot GET /api/health

✗ COUNTEREXAMPLE: Error serialization issue
Response data: { error: '[object Object]' }

✗ COUNTEREXAMPLE: Database connection issue
Likely missing SUPABASE_URL or SUPABASE_SERVICE_KEY

✗ COUNTEREXAMPLE: Registration flow broken
Error: Blank screen after signup, no dashboard redirect

✗ COUNTEREXAMPLE: CORS not configured
Error: CORS policy blocked request from production domain
```

## Notes

- Bug exploration tests are designed to FAIL on unfixed code
- Do NOT "fix" the tests when they fail - the failures are expected
- The tests encode the expected behavior and will validate the fix later
- Preservation tests ensure local development remains unchanged
