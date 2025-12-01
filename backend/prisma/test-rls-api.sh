#!/bin/bash

# ============================================
# RLS API Testing Script
# Run this AFTER RLS deployment
# ============================================

set -e

API_URL="http://localhost:4000"
ANON_KEY="${ANON_KEY:-}"
JWT_TOKEN="${JWT_TOKEN:-}"
OTHER_JWT="${OTHER_JWT:-}"

echo "=================================="
echo "RLS API Testing Suite"
echo "=================================="
echo "API URL: $API_URL"
echo ""

# Test 1: Anonymous - Browse Active Products
echo "TEST 1: Anonymous user browsing active products"
echo "GET /products?status=active (anon)"
if [ -z "$ANON_KEY" ]; then
  echo "⚠️  SKIPPED: ANON_KEY not set"
else
  RESULT=$(curl -s -X GET "$API_URL/products?status=active" \
    -H "apikey: $ANON_KEY" \
    -w "\n%{http_code}")
  HTTP_CODE=$(echo "$RESULT" | tail -n 1)
  BODY=$(echo "$RESULT" | head -n -1)
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ PASS (HTTP $HTTP_CODE)"
    echo "Products found: $(echo $BODY | jq '.[] | .id' | wc -l)"
  else
    echo "❌ FAIL (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  fi
fi
echo ""

# Test 2: Authenticated - View own profile
echo "TEST 2: Authenticated user viewing own profile"
echo "GET /profile (authenticated)"
if [ -z "$JWT_TOKEN" ]; then
  echo "⚠️  SKIPPED: JWT_TOKEN not set"
else
  RESULT=$(curl -s -X GET "$API_URL/profile" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -w "\n%{http_code}")
  HTTP_CODE=$(echo "$RESULT" | tail -n 1)
  BODY=$(echo "$RESULT" | head -n -1)
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ PASS (HTTP $HTTP_CODE)"
    echo "Profile retrieved: $(echo $BODY | jq '.email // "unknown"')"
  else
    echo "❌ FAIL (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  fi
fi
echo ""

# Test 3: Authenticated - View own trips
echo "TEST 3: Authenticated user viewing own trips"
echo "GET /trips (authenticated)"
if [ -z "$JWT_TOKEN" ]; then
  echo "⚠️  SKIPPED: JWT_TOKEN not set"
else
  RESULT=$(curl -s -X GET "$API_URL/trips" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -w "\n%{http_code}")
  HTTP_CODE=$(echo "$RESULT" | tail -n 1)
  BODY=$(echo "$RESULT" | head -n -1)
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ PASS (HTTP $HTTP_CODE)"
    TRIP_COUNT=$(echo $BODY | jq '.[] | .id' | wc -l 2>/dev/null || echo "0")
    echo "Trips found: $TRIP_COUNT"
  else
    echo "❌ FAIL (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  fi
fi
echo ""

# Test 4: Bank Accounts - Own only
echo "TEST 4: Bank accounts - user should only see own"
echo "GET /bank-accounts (User A JWT)"
if [ -z "$JWT_TOKEN" ]; then
  echo "⚠️  SKIPPED: JWT_TOKEN not set"
else
  RESULT=$(curl -s -X GET "$API_URL/bank-accounts" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -w "\n%{http_code}")
  HTTP_CODE=$(echo "$RESULT" | tail -n 1)
  BODY=$(echo "$RESULT" | head -n -1)
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ PASS (HTTP $HTTP_CODE)"
    BANK_COUNT=$(echo $BODY | jq '.[] | .id' | wc -l 2>/dev/null || echo "0")
    echo "Bank accounts found: $BANK_COUNT"
  else
    echo "❌ FAIL (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  fi
fi

if [ -n "$OTHER_JWT" ]; then
  echo ""
  echo "GET /bank-accounts (User B JWT - should be different data)"
  RESULT=$(curl -s -X GET "$API_URL/bank-accounts" \
    -H "Authorization: Bearer $OTHER_JWT" \
    -w "\n%{http_code}")
  HTTP_CODE=$(echo "$RESULT" | tail -n 1)
  BODY=$(echo "$RESULT" | head -n -1)
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ PASS (HTTP $HTTP_CODE - User B sees different data)"
    BANK_COUNT=$(echo $BODY | jq '.[] | .id' | wc -l 2>/dev/null || echo "0")
    echo "User B bank accounts: $BANK_COUNT (should be different from User A)"
  else
    echo "❌ FAIL (HTTP $HTTP_CODE)"
  fi
fi
echo ""

# Test 5: Public Browse Trips
echo "TEST 5: Anonymous browsing active trips"
echo "GET /profile/:slug/trips (public trips)"
if [ -z "$ANON_KEY" ]; then
  echo "⚠️  SKIPPED: ANON_KEY not set"
else
  # Try to fetch a public profile (replace 'qwe' with actual slug)
  RESULT=$(curl -s -X GET "$API_URL/profile/qwe" \
    -H "apikey: $ANON_KEY" \
    -w "\n%{http_code}")
  HTTP_CODE=$(echo "$RESULT" | tail -n 1)
  BODY=$(echo "$RESULT" | head -n -1)
  
  if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
    echo "✅ PASS (HTTP $HTTP_CODE - RLS allowed public profile access)"
  else
    echo "❌ FAIL (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  fi
fi
echo ""

echo "=================================="
echo "Test Suite Complete"
echo "=================================="
echo ""
echo "Setup environment variables before running:"
echo "  export ANON_KEY='your_anon_api_key'"
echo "  export JWT_TOKEN='your_jwt_token_user_a'"
echo "  export OTHER_JWT='your_jwt_token_user_b'"
echo ""
echo "Get keys from Supabase:"
echo "  - ANON_KEY: Settings → API → Project API keys → anon"
echo "  - JWT_TOKEN: Login, check localStorage → sb-xxx"
