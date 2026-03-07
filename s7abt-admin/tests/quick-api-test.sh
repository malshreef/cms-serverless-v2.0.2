#!/bin/bash
# Quick API Health Check for S7abt CMS
# Run: bash quick-api-test.sh

API="https://wtti9qhhe3.execute-api.us-east-1.amazonaws.com/prod"

echo "═══════════════════════════════════════════════════════"
echo "  S7ABT CMS - Quick API Health Check"
echo "═══════════════════════════════════════════════════════"
echo ""

PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected=$3

    printf "  %-30s " "$name..."

    response=$(curl -s -o /dev/null -w "%{http_code}" "$API$endpoint" \
        -H "Content-Type: application/json" \
        -H "Origin: https://s7abt-admin.s3.amazonaws.com")

    if [ "$response" == "$expected" ]; then
        echo "✅ $response"
        ((PASSED++))
    else
        echo "❌ Expected $expected, got $response"
        ((FAILED++))
    fi
}

echo "📂 Testing API Endpoints (expecting 401 without auth):"
echo ""

test_endpoint "Sections List" "/admin/sections" "401"
test_endpoint "Tags List" "/admin/tags" "401"
test_endpoint "Articles List" "/admin/articles?page=1&limit=5" "401"
test_endpoint "News List" "/admin/news?page=1&limit=5" "401"
test_endpoint "Tweets List" "/admin/tweets" "401"
test_endpoint "Analytics Insights" "/admin/analytics/insights?range=30d" "401"
test_endpoint "Auth Me" "/admin/auth/me" "401"
test_endpoint "Dashboard Stats" "/admin/dashboard/stats" "401"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RESULTS: $PASSED passed, $FAILED failed"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Note: 401 responses are EXPECTED - it means the API is"
echo "working but requires authentication (Cognito JWT token)"
echo ""
