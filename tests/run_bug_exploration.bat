@echo off
REM Bug Condition Exploration Test Runner for Windows
REM This script runs the bug exploration tests and documents counterexamples

echo ==========================================
echo Vercel Deployment Bug Exploration
echo ==========================================
echo.
echo CRITICAL: Tests are EXPECTED TO FAIL on unfixed code
echo Failures confirm the deployment bugs exist
echo.

REM Check if VERCEL_URL is set
if "%VERCEL_URL%"=="" (
    echo ERROR: VERCEL_URL environment variable not set
    echo Please set it to your Vercel deployment URL:
    echo   set VERCEL_URL=https://your-app.vercel.app
    echo.
    exit /b 1
)

echo Testing deployment at: %VERCEL_URL%
echo.

REM Create counterexamples directory
if not exist counterexamples mkdir counterexamples

REM Run tests and capture output
echo Running bug exploration tests...
echo.

npm run test:bug-exploration 2>&1 | tee counterexamples\bug_exploration_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log

echo.
echo ==========================================
echo Test Results
echo ==========================================
echo.
echo Counterexamples have been documented in:
echo   tests\counterexamples\
echo.
echo Review the log file to see specific failures.
echo.
echo Expected failures indicate:
echo   - API routing issues
echo   - Error serialization problems
echo   - Missing environment variables
echo   - Authentication flow failures
echo   - CORS configuration issues
echo.
echo These counterexamples guide the fix implementation.
echo ==========================================
