@echo off
REM Local Development Preservation Test Runner for Windows
REM This script runs preservation tests to capture baseline local behavior

echo ==========================================
echo Local Development Preservation Tests
echo ==========================================
echo.
echo These tests capture baseline local development behavior
echo They should PASS on unfixed code
echo.

echo Checking if local servers are running...
echo.

REM Check backend
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓[0m Backend server is running (http://localhost:5000)
) else (
    echo [31m✗[0m Backend server is NOT running
    echo   Please start it: cd backend ^&^& python app.py
    echo.
    exit /b 1
)

REM Check frontend
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓[0m Frontend server is running (http://localhost:5173)
) else (
    echo [31m✗[0m Frontend server is NOT running
    echo   Please start it: cd frontend ^&^& npm run dev
    echo.
    exit /b 1
)

echo.
echo Running preservation tests...
echo.

REM Create results directory
if not exist preservation_results mkdir preservation_results

REM Run tests and capture output
npm run test:preservation 2>&1 | tee preservation_results\preservation_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log

echo.
echo ==========================================
echo Test Results
echo ==========================================
echo.
echo Results have been saved to:
echo   tests\preservation_results\
echo.
echo Expected: All tests PASS
echo This confirms the baseline local development behavior.
echo.
echo After implementing fixes, re-run these tests.
echo They should still PASS (no regressions).
echo ==========================================
