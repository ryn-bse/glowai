#!/bin/bash

# Local Development Preservation Test Runner
# This script runs preservation tests to capture baseline local behavior

echo "=========================================="
echo "Local Development Preservation Tests"
echo "=========================================="
echo ""
echo "These tests capture baseline local development behavior"
echo "They should PASS on unfixed code"
echo ""

# Check if servers are running
echo "Checking if local servers are running..."
echo ""

# Check backend
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend server is running (http://localhost:5000)"
else
    echo "✗ Backend server is NOT running"
    echo "  Please start it: cd backend && python app.py"
    echo ""
    exit 1
fi

# Check frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✓ Frontend server is running (http://localhost:5173)"
else
    echo "✗ Frontend server is NOT running"
    echo "  Please start it: cd frontend && npm run dev"
    echo ""
    exit 1
fi

echo ""
echo "Running preservation tests..."
echo ""

# Create results directory
mkdir -p preservation_results

# Run tests and capture output
npm run test:preservation 2>&1 | tee preservation_results/preservation_$(date +%Y%m%d_%H%M%S).log

echo ""
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo ""
echo "Results have been saved to:"
echo "  tests/preservation_results/"
echo ""
echo "Expected: All tests PASS"
echo "This confirms the baseline local development behavior."
echo ""
echo "After implementing fixes, re-run these tests."
echo "They should still PASS (no regressions)."
echo "=========================================="
