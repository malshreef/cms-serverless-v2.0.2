/**
 * S7abt CMS Production API Test Suite
 * Run: node production-test.js
 */

const https = require('https');

// Configuration
const CONFIG = {
  API_BASE: 'https://wtti9qhhe3.execute-api.us-east-1.amazonaws.com/prod',
  // You'll need to get a valid JWT token from Cognito after login
  AUTH_TOKEN: process.env.AUTH_TOKEN || 'YOUR_JWT_TOKEN_HERE'
};

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests
function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.API_BASE + path);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test runner
async function runTest(name, testFn) {
  process.stdout.write(`  Testing: ${name}... `);
  try {
    await testFn();
    console.log('✅ PASSED');
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// ============================================
// TEST SUITES
// ============================================

async function testSections() {
  console.log('\n📂 SECTIONS API TESTS');

  await runTest('List sections', async () => {
    const res = await apiRequest('GET', '/admin/sections');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.data.success === true, 'Response should have success: true');
    assert(Array.isArray(res.data.data.sections), 'Should return sections array');
  });

  await runTest('List sections with pagination', async () => {
    const res = await apiRequest('GET', '/admin/sections?page=1&limit=5');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.data.data.pagination, 'Should include pagination info');
  });
}

async function testTags() {
  console.log('\n🏷️  TAGS API TESTS');

  await runTest('List tags', async () => {
    const res = await apiRequest('GET', '/admin/tags');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.data.success === true, 'Response should have success: true');
  });

  await runTest('List tags with pagination', async () => {
    const res = await apiRequest('GET', '/admin/tags?page=1&limit=10');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
  });
}

async function testArticles() {
  console.log('\n📰 ARTICLES API TESTS');

  await runTest('List articles', async () => {
    const res = await apiRequest('GET', '/admin/articles?page=1&limit=10');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.data.success === true, 'Response should have success: true');
    assert(Array.isArray(res.data.data.articles), 'Should return articles array');
  });

  await runTest('List articles with section filter', async () => {
    const res = await apiRequest('GET', '/admin/articles?page=1&limit=5&section=1');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
  });

  await runTest('Get single article (ID=1)', async () => {
    const res = await apiRequest('GET', '/admin/articles/1');
    // May return 404 if article doesn't exist, which is valid
    assert(res.status === 200 || res.status === 404, `Status should be 200 or 404, got ${res.status}`);
  });
}

async function testNews() {
  console.log('\n📢 NEWS API TESTS');

  await runTest('List news', async () => {
    const res = await apiRequest('GET', '/admin/news?page=1&limit=10');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.data.success === true, 'Response should have success: true');
  });

  await runTest('List news with pagination', async () => {
    const res = await apiRequest('GET', '/admin/news?page=1&limit=5');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.data.data.pagination, 'Should include pagination info');
  });
}

async function testTweets() {
  console.log('\n🐦 TWEETS API TESTS');

  await runTest('List tweets', async () => {
    const res = await apiRequest('GET', '/admin/tweets');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.data.success === true, 'Response should have success: true');
    assert(Array.isArray(res.data.data.tweets), 'Should return tweets array');
  });

  await runTest('List tweets with status filter', async () => {
    const res = await apiRequest('GET', '/admin/tweets?status=pending');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
  });
}

async function testAnalytics() {
  console.log('\n📊 ANALYTICS API TESTS');

  await runTest('Get insights (90 days)', async () => {
    const res = await apiRequest('GET', '/admin/analytics/insights?range=90d&contentType=all');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.data.success === true, 'Response should have success: true');
  });

  await runTest('Get insights (30 days)', async () => {
    const res = await apiRequest('GET', '/admin/analytics/insights?range=30d&contentType=all');
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
  });
}

async function testAuth() {
  console.log('\n🔐 AUTH API TESTS');

  await runTest('Get current user', async () => {
    const res = await apiRequest('GET', '/admin/auth/me');
    // Will fail without valid token, but should return 401 not 500
    assert(res.status === 200 || res.status === 401, `Status should be 200 or 401, got ${res.status}`);
  });

  await runTest('Get dashboard stats', async () => {
    const res = await apiRequest('GET', '/admin/dashboard/stats');
    assert(res.status === 200 || res.status === 401, `Status should be 200 or 401, got ${res.status}`);
  });
}

async function testCORS() {
  console.log('\n🌐 CORS TESTS');

  await runTest('OPTIONS preflight request', async () => {
    const res = await apiRequest('OPTIONS', '/admin/sections');
    // OPTIONS should return 200 or 204
    assert(res.status === 200 || res.status === 204 || res.status === 403,
      `OPTIONS should work, got ${res.status}`);
  });
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  S7ABT CMS PRODUCTION API TEST SUITE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  API: ${CONFIG.API_BASE}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════');

  try {
    await testSections();
    await testTags();
    await testArticles();
    await testNews();
    await testTweets();
    await testAnalytics();
    await testAuth();
    await testCORS();
  } catch (error) {
    console.error('\n⚠️  Test suite error:', error.message);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  📊 Total:  ${results.passed + results.failed}`);
  console.log('═══════════════════════════════════════════════════════');

  if (results.failed > 0) {
    console.log('\n  Failed Tests:');
    results.tests.filter(t => t.status === 'failed').forEach(t => {
      console.log(`    - ${t.name}: ${t.error}`);
    });
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

main();
