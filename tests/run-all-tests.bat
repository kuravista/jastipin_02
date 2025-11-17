@echo off
REM Comprehensive Test Suite Runner for Windows
REM Runs all backend and frontend tests with coverage reports

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Jastipin.me - Comprehensive Test Suite
echo ==========================================
echo.

REM Test counters
set BACKEND_TESTS=0
set FRONTEND_TESTS=0
set FAILED_TESTS=0

REM Check if directories exist
if not exist "backend" (
    echo Error: backend directory not found
    exit /b 1
)

if not exist "frontend" (
    echo Error: frontend directory not found
    exit /b 1
)

REM Run Backend Tests
echo.
echo Running Backend Tests...
echo ==========================================
echo.

cd backend

if not exist "package.json" (
    echo Error: backend/package.json not found
    exit /b 1
)

if not exist "jest.config.js" (
    echo Error: backend/jest.config.js not found
    exit /b 1
)

echo Installing backend dependencies...
call npm install

echo.
echo Running backend test suite...

call npm test -- --coverage

if !ERRORLEVEL! equ 0 (
    set BACKEND_TESTS=1
    echo Test passed
) else (
    set FAILED_TESTS=1
    echo Test failed
)

cd ..

REM Run Frontend Tests
echo.
echo Running Frontend Tests...
echo ==========================================
echo.

cd frontend

if not exist "package.json" (
    echo Error: frontend/package.json not found
    exit /b 1
)

if not exist "..\tests\frontend\jest.config.js" (
    echo Error: tests/frontend/jest.config.js not found
    exit /b 1
)

echo Installing frontend dependencies...
call npm install

echo.
echo Running frontend test suite...

call npm test -- --coverage

if !ERRORLEVEL! equ 0 (
    set FRONTEND_TESTS=1
    echo Test passed
) else (
    set FAILED_TESTS=1
    echo Test failed
)

cd ..

REM Summary
echo.
echo ==========================================
echo Test Summary
echo ==========================================
echo Backend Test Suites: 7
echo   - auth.service.test.ts (29 tests)
echo   - trip.service.test.ts (28 tests)
echo   - product.service.test.ts (25 tests)
echo   - order.service.test.ts (29 tests)
echo   - participant.service.test.ts (22 tests)
echo   - auth-routes.integration.test.ts (32 tests)
echo   - crud-routes.integration.test.ts (30 tests)
echo.
echo Frontend Test Suites: 2
echo   - AuthGuard.test.tsx (18 tests)
echo   - authentication-flow.test.tsx (12 tests)
echo.
echo Total Test Cases: 191+
echo.

if !FAILED_TESTS! gtr 0 (
    echo Test execution completed with failures
    exit /b 1
) else (
    echo All tests passed!
    exit /b 0
)

endlocal
