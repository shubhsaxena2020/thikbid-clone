/**
 * ThikBid Automated End-to-End Route Integration QA Test Suite
 * Tests HTTP status, MIME types, SPA fallback, API endpoints, and static asset streaming.
 */

const http = require('http');
const { server, ROUTE_MAP } = require('./server');

// Ephemeral port by default so the suite never collides with an already
// running dev server (which previously made results ambiguous).
const TEST_PORT = parseInt(process.env.TEST_PORT || '0', 10);

// Populated once the server is bound, so requests hit the ephemeral port
// actually assigned by the OS.
let activePort = TEST_PORT;

function fetchUrl(path, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: activePort,
            path: path,
            method: options.method || 'GET',
            headers: options.headers || {}
        }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
    await new Promise(resolve => server.listen(TEST_PORT, 'localhost', resolve));
    // Resolve the actual bound port (0 => OS-assigned ephemeral port).
    const boundPort = server.address().port;
    activePort = boundPort;
    console.log('Starting ThikBid Integration QA Test Runner on port', boundPort);

  const results = [];
  let passed = 0;
  let failed = 0;

  const testCases = [
    // 8 Core Routes
    { path: '/', expectedStatus: 200, expectedType: 'text/html', desc: 'Home Landing Page (index.html)' },
    { path: '/tenders', expectedStatus: 200, expectedType: 'text/html', desc: 'Tenders Directory (tenders.html)' },
    { path: '/firm', expectedStatus: 200, expectedType: 'text/html', desc: 'For Firms B2B Page (firm.html)' },
    { path: '/login', expectedStatus: 200, expectedType: 'text/html', desc: 'Login WhatsApp Page (login.html)' },
    { path: '/start', expectedStatus: 200, expectedType: 'text/html', desc: 'Start 1-Min Onboarding (start.html)' },
    { path: '/partners', expectedStatus: 200, expectedType: 'text/html', desc: 'Partners Network Page (partners.html)' },
    { path: '/privacy', expectedStatus: 200, expectedType: 'text/html', desc: 'Privacy Policy Page (privacy.html)' },
    { path: '/terms', expectedStatus: 200, expectedType: 'text/html', desc: 'Terms of Use Page (terms.html)' },
    { path: '/consent', expectedStatus: 200, expectedType: 'text/html', desc: 'WhatsApp Consent Page (consent.html)' },

    // Showcase Preview
    { path: '/preview.html', expectedStatus: 200, expectedType: 'text/html', desc: 'Showcase Preview Page (preview.html)' },
    { path: '/preview', expectedStatus: 200, expectedType: 'text/html', desc: 'Showcase Clean Route (/preview)' },

    // SPA Fallbacks & Dynamic Subroutes
    { path: '/tenders/Jorhat', expectedStatus: 200, expectedType: 'text/html', desc: 'SPA Route: /tenders/:district' },
    { path: '/tenders/Jorhat/road', expectedStatus: 200, expectedType: 'text/html', desc: 'SPA Route: /tenders/:district/:trade' },
    { path: '/t/pwd-roads-jorhat-titabar-3km', expectedStatus: 200, expectedType: 'text/html', desc: 'SPA Route: /t/:slug' },
    { path: '/checkout', expectedStatus: 200, expectedType: 'text/html', desc: 'SPA Route: /checkout' },
    { path: '/me', expectedStatus: 200, expectedType: 'text/html', desc: 'SPA Route: /me' },

    // Static Assets
    { path: '/assets/app-CgXZS96D.css', expectedStatus: 200, expectedType: 'text/css', desc: 'Main CSS Bundle' },
    { path: '/assets/app-VGjPtK0-.js', expectedStatus: 200, expectedType: 'text/javascript', desc: 'Main JS App Bundle' },
    { path: '/assets/index-kwNebdeb.js', expectedStatus: 200, expectedType: 'text/javascript', desc: 'Landing Page JS Bundle' },
    { path: '/assets/index-CKzG2lPy.css', expectedStatus: 200, expectedType: 'text/css', desc: 'Landing Page CSS' },

    // Video Asset & Range Request
    { path: '/assets/site-crew-drift.mp4', expectedStatus: 200, expectedType: 'video/mp4', desc: 'MP4 Video Asset' },

    // API Mock Endpoints
    { path: '/api/public/config', expectedStatus: 200, expectedType: 'application/json', desc: 'API: /api/public/config' },
    { path: '/api/public/tenders', expectedStatus: 200, expectedType: 'application/json', desc: 'API: /api/public/tenders' },
    { path: '/api/public/tenders/facets', expectedStatus: 200, expectedType: 'application/json', desc: 'API: /api/public/tenders/facets' },
    { path: '/health', expectedStatus: 200, expectedType: 'application/json', desc: 'API: /health' }
  ];

  console.log('\n--- Running Route & Header Verification Tests ---\n');

  for (const tc of testCases) {
    try {
      const res = await fetchUrl(tc.path);
      const isStatusOk = res.statusCode === tc.expectedStatus;
      const contentType = res.headers['content-type'] || '';
      const isTypeOk = contentType.includes(tc.expectedType);

      if (isStatusOk && isTypeOk) {
        passed++;
        console.log(`[PASS] ${tc.path.padEnd(35)} -> ${res.statusCode} (${contentType.split(';')[0]}) - ${tc.desc}`);
        results.push({ path: tc.path, status: res.statusCode, type: contentType, pass: true, desc: tc.desc });
      } else {
        failed++;
        console.error(`[FAIL] ${tc.path} -> Expected ${tc.expectedStatus} / ${tc.expectedType}, got ${res.statusCode} / ${contentType}`);
        results.push({ path: tc.path, status: res.statusCode, type: contentType, pass: false, desc: tc.desc });
      }
    } catch (err) {
      failed++;
      console.error(`[ERROR] ${tc.path} -> ${err.message}`);
      results.push({ path: tc.path, status: 0, type: 'error', pass: false, desc: tc.desc, error: err.message });
    }
  }

  // Test Range Request for Video
  console.log('\n--- Testing HTTP Range Requests (Video Streaming) ---');
  try {
    const rangeRes = await fetchUrl('/assets/site-crew-drift.mp4', {
      headers: { 'Range': 'bytes=0-1023' }
    });
    if (rangeRes.statusCode === 206 && rangeRes.headers['content-range']) {
      passed++;
      console.log(`[PASS] Range Request /assets/site-crew-drift.mp4 -> 206 Partial Content (Content-Range: ${rangeRes.headers['content-range']})`);
    } else {
      failed++;
      console.error(`[FAIL] Range Request failed: got status ${rangeRes.statusCode}`);
    }
  } catch (err) {
    failed++;
    console.error(`[ERROR] Range Request error: ${err.message}`);
  }

  console.log('\n==================================================');
  console.log(`Integration QA Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  server.close();
  return { passed, failed, results };
}

if (require.main === module) {
  runTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

module.exports = { runTests };
