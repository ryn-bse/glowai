#!/bin/bash

# Bug Condition Exploration Test Runner
# This script runs the bug exploration tests and documents counterexamples

echo "=========================================="
echo "Vercel Deployment Bug Exploration"
echo "=========================================="
echo ""
echo "CRITICAL: Tests are EXPECTED TO FAIL on unfixed code"
echo "Failures confirm the deployment bugs exist"
echo ""

# Check if VERCEL_URL is set
if [ -z "$VERCEL_URL" ]; then
    echo "ERROR: VERCEL_URL environment variable not set"
    echo "Please set it to your Vercel deployment URL:"
    echo "  export VERCEL_URL=https://your-app.vercel.app"
    echo ""
    exit 1
fi

echo "Testing deployment at: $VERCEL_URL"
echo ""

# Create counterexamples directory
mkdir -p counterexamples

# Run tests and capture output
echo "Running bug exploration tests..."
echo ""

npm run test:bug-exploration 2>&1 | tee counterexamples/bug_exploration_$(date +%Y%m%d_%H%M%S).log

echo ""
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo ""
echo "Counterexamples have been documented in:"
echo "  tests/counterexamples/"
echo ""
echo "Review the log file to see specific failures."
echo ""
echo "Expected failures indicate:"
echo "  - API routing issues"
echo "  - Error serialization problems"
echo "  - Missing environment variables"
echo "  - Authentication flow failures"
echo "  - CORS configuration issues"
echo ""
echo "These counterexamples guide the fix implementation."
echo "=========================================="
