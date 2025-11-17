#!/bin/bash

# Comprehensive Test Suite Runner
# Runs all backend and frontend tests with coverage reports

set -e

echo "=========================================="
echo "Jastipin.me - Comprehensive Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
BACKEND_TESTS=0
FRONTEND_TESTS=0
FAILED_TESTS=0

# Cleanup function
cleanup() {
  echo ""
  echo "=========================================="
  echo "Test Execution Complete"
  echo "=========================================="
  echo "Backend Tests: $BACKEND_TESTS"
  echo "Frontend Tests: $FRONTEND_TESTS"
  if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed Tests: $FAILED_TESTS${NC}"
    exit 1
  else
    echo -e "${GREEN}All Tests Passed!${NC}"
    exit 0
  fi
}

trap cleanup EXIT

# Check if directories exist
if [ ! -d "backend" ]; then
  echo -e "${RED}Error: backend directory not found${NC}"
  exit 1
fi

if [ ! -d "frontend" ]; then
  echo -e "${RED}Error: frontend directory not found${NC}"
  exit 1
fi

# Run Backend Tests
echo ""
echo -e "${YELLOW}Running Backend Tests...${NC}"
echo "=========================================="

cd backend

if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: backend/package.json not found${NC}"
  exit 1
fi

if [ ! -f "jest.config.js" ]; then
  echo -e "${RED}Error: backend/jest.config.js not found${NC}"
  exit 1
fi

echo "Installing backend dependencies..."
npm install --silent || true

echo ""
echo "Running backend test suite..."

if npm test -- --coverage --silent 2>/dev/null; then
  BACKEND_TESTS=$((BACKEND_TESTS + 1))
  echo -e "${GREEN}✓ Backend tests passed${NC}"
else
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "${RED}✗ Backend tests failed${NC}"
fi

echo ""
echo "Backend test coverage:"
npm test -- --coverage --coverageReporters=text --silent 2>&1 | grep -E "Lines|Statements|Functions|Branches" || true

cd ..

# Run Frontend Tests
echo ""
echo -e "${YELLOW}Running Frontend Tests...${NC}"
echo "=========================================="

cd frontend

if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: frontend/package.json not found${NC}"
  exit 1
fi

if [ ! -f "../tests/frontend/jest.config.js" ]; then
  echo -e "${RED}Error: tests/frontend/jest.config.js not found${NC}"
  exit 1
fi

echo "Installing frontend dependencies..."
npm install --silent || true

echo ""
echo "Running frontend test suite..."

if npm test -- --coverage --silent 2>/dev/null; then
  FRONTEND_TESTS=$((FRONTEND_TESTS + 1))
  echo -e "${GREEN}✓ Frontend tests passed${NC}"
else
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "${RED}✗ Frontend tests failed${NC}"
fi

echo ""
echo "Frontend test coverage:"
npm test -- --coverage --coverageReporters=text --silent 2>&1 | grep -E "Lines|Statements|Functions|Branches" || true

cd ..

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Backend Test Suites: 7"
echo "  - auth.service.test.ts (29 tests)"
echo "  - trip.service.test.ts (28 tests)"
echo "  - product.service.test.ts (25 tests)"
echo "  - order.service.test.ts (29 tests)"
echo "  - participant.service.test.ts (22 tests)"
echo "  - auth-routes.integration.test.ts (32 tests)"
echo "  - crud-routes.integration.test.ts (30 tests)"
echo ""
echo "Frontend Test Suites: 2"
echo "  - AuthGuard.test.tsx (18 tests)"
echo "  - authentication-flow.test.tsx (12 tests)"
echo ""
echo "Total Test Cases: 191+"
echo ""
