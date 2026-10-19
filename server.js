/**
 * ThikBid Production-Ready Unified Local Server
 * Zero-dependency Node.js HTTP server with SPA routing, static asset serving,
 * HTTP Range requests for video, and API mock fallbacks.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Supported MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf'
};

// Explicit route mapping for ThikBid pages
const ROUTE_MAP = {
  '/': 'index.html',
  '/index': 'index.html',
  '/index.html': 'index.html',
  '/tenders': 'tenders.html',
  '/tenders.html': 'tenders.html',
  '/firm': 'firm.html',
  '/firm.html': 'firm.html',
  '/login': 'login.html',
  '/login.html': 'login.html',
  '/start': 'start.html',
  '/start.html': 'start.html',
  '/partners': 'partners.html',
  '/partners.html': 'partners.html',
  '/privacy': 'privacy.html',
  '/privacy.html': 'privacy.html',
  '/terms': 'terms.html',
  '/terms.html': 'terms.html',
  '/consent': 'consent.html',
  '/consent.html': 'consent.html',
  '/404': '404.html',
  '/404.html': '404.html',
  '/preview': 'preview.html',
  '/preview.html': 'preview.html',
  // SPA aliases
  '/me': 'tenders.html',
  '/me/setup': 'start.html',
  '/me/profile': 'tenders.html',
  '/me/saved': 'tenders.html',
  '/me/billing': 'tenders.html',
  '/me/team': 'firm.html',
  '/me/insights': 'firm.html',
  '/pricing': 'tenders.html',
  '/checkout': 'start.html',
  '/checkout/success': 'start.html',
  '/admin': 'login.html',
  '/signin': 'login.html',
  '/signup': 'start.html'
};

// Root directories to search for assets and HTML
const ROOT_DIRS = [
  path.join(__dirname, 'scraped'),
  __dirname,
  path.join(__dirname, 'public')
];

/**
 * Find absolute path of a file across candidate root directories
 */
function findFile(relPath) {
  // Normalize and prevent path traversal
  const cleanPath = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
  for (const rootDir of ROOT_DIRS) {
    const fullPath = path.join(rootDir, cleanPath);
    if (fs.existsSync(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) return fullPath;
      } catch (err) {
        // ignore
      }
    }
  }
  return null;
}

// Load verified reverse-engineered tender database
let TENDERS_DATA = { tenders: [], facets: { totals: { open: 0, value: 0, closing_week: 0, new_week: 0 }, byDistrict: [], byTrade: [] } };
try {
  const tendersFilePath = path.join(__dirname, 'tenders_data.json');
  if (fs.existsSync(tendersFilePath)) {
    TENDERS_DATA = JSON.parse(fs.readFileSync(tendersFilePath, 'utf-8'));
  }
} catch (e) {
  console.error("Failed to load tenders_data.json:", e.message);
}

// Complete public configuration dictionary matching app-VGjPtK0-.js schema
const PUBLIC_CONFIG = {
  appName: 'ThikBid',
  version: '1.0.0',
  waNumber: '919387854327',
  states: [
    { code: "AS", name: "Assam" }
  ],
  districts: [
    { slug: "baksa", name: "Baksa", name_as: "বাক্সা", state_code: "AS" },
    { slug: "barpeta", name: "Barpeta", name_as: "বৰপেটা", state_code: "AS" },
    { slug: "biswanath", name: "Biswanath", name_as: "বিশ্বনাথ", state_code: "AS" },
    { slug: "bongaigaon", name: "Bongaigaon", name_as: "বঙাইগাঁও", state_code: "AS" },
    { slug: "cachar", name: "Cachar", name_as: "কাছাৰ", state_code: "AS" },
    { slug: "charaideo", name: "Charaideo", name_as: "চৰাইদেউ", state_code: "AS" },
    { slug: "chirang", name: "Chirang", name_as: "চিৰাং", state_code: "AS" },
    { slug: "darrang", name: "Darrang", name_as: "দৰং", state_code: "AS" },
    { slug: "dhemaji", name: "Dhemaji", name_as: "ধেমাজি", state_code: "AS" },
    { slug: "dhubri", name: "Dhubri", name_as: "ধুবুৰী", state_code: "AS" },
    { slug: "dibrugarh", name: "Dibrugarh", name_as: "ডিব্ৰুগড়", state_code: "AS" },
    { slug: "dima-hasao", name: "Dima Hasao", name_as: "ডিমা হাছাও", state_code: "AS" },
    { slug: "goalpara", name: "Goalpara", name_as: "গোৱালপাৰা", state_code: "AS" },
    { slug: "golaghat", name: "Golaghat", name_as: "গোলাঘাট", state_code: "AS" },
    { slug: "hailakandi", name: "Hailakandi", name_as: "হাইলাকান্দি", state_code: "AS" },
    { slug: "hojai", name: "Hojai", name_as: "হোজাই", state_code: "AS" },
    { slug: "jorhat", name: "Jorhat", name_as: "যোৰহাট", state_code: "AS" },
    { slug: "kamrup", name: "Kamrup", name_as: "কামৰূপ", state_code: "AS" },
    { slug: "kamrup-metropolitan", name: "Kamrup Metropolitan", name_as: "কামৰূপ মহানগৰ", state_code: "AS" },
    { slug: "karbi-anglong", name: "Karbi Anglong", name_as: "কাৰ্বি আংলং", state_code: "AS" },
    { slug: "karimganj", name: "Karimganj", name_as: "কৰিমগঞ্জ", state_code: "AS" },
    { slug: "kokrajhar", name: "Kokrajhar", name_as: "কোকৰাঝাৰ", state_code: "AS" },
    { slug: "lakhimpur", name: "Lakhimpur", name_as: "লক্ষীমপুৰ", state_code: "AS" },
    { slug: "majuli", name: "Majuli", name_as: "মাজুলী", state_code: "AS" },
    { slug: "morigaon", name: "Morigaon", name_as: "মৰিগাঁও", state_code: "AS" },
    { slug: "nagaon", name: "Nagaon", name_as: "নগাঁও", state_code: "AS" },
    { slug: "nalbari", name: "Nalbari", name_as: "নলবাৰী", state_code: "AS" },
    { slug: "sivasagar", name: "Sivasagar", name_as: "শিৱসাগৰ", state_code: "AS" },
    { slug: "sonitpur", name: "Sonitpur", name_as: "শোণিতপুৰ", state_code: "AS" },
    { slug: "south-salmara-mankachar", name: "South Salmara-Mankachar", name_as: "দক্ষিণ শালমাৰা-মানকাচৰ", state_code: "AS" },
    { slug: "tamulpur", name: "Tamulpur", name_as: "তামুলপুৰ", state_code: "AS" },
    { slug: "tinsukia", name: "Tinsukia", name_as: "তিনিচুকীয়া", state_code: "AS" },
    { slug: "udalguri", name: "Udalguri", name_as: "ওদালগুৰি", state_code: "AS" },
    { slug: "west-karbi-anglong", name: "West Karbi Anglong", name_as: "পশ্চিম কাৰ্বি আংলং", state_code: "AS" }
  ],
  trades: [
    { slug: "road", name: "Roads & Bridges", name_as: "পথ আৰু দলং", name_hi: "सड़क एवं पुल", icon: "route" },
    { slug: "building", name: "Civil & Buildings", name_as: "ভৱন নিৰ্মাণ", name_hi: "भवन निर्माण", icon: "building" },
    { slug: "water", name: "Water & PHED", name_as: "পানী যোগান", name_hi: "जल आपूर्ति", icon: "droplet" },
    { slug: "flood", name: "Flood & Embankments", name_as: "বান নিয়ন্ত্ৰণ", name_hi: "बाढ़ नियंत्रण", icon: "waves" },
    { slug: "electrical", name: "Electrical & Solar", name_as: "বৈদ্যুতিক কাম", name_hi: "विद्युत कार्य", icon: "zap" },
    { slug: "supply", name: "Supply & Goods", name_as: "যোগান আৰু সামগ্ৰী", name_hi: "आपूर्ति एवं सामग्री", icon: "package" },
    { slug: "bridge", name: "Bridges & Culverts", name_as: "দলং আৰু কালভাৰ্ট", name_hi: "पुल एवं कल्वर्ट", icon: "compass" }
  ],
  regClasses: [
    { id: "class_1", label: "Class I" },
    { id: "class_2", label: "Class II" },
    { id: "class_3", label: "Class III" },
    { id: "class_4", label: "Class IV" }
  ],
  turnoverBands: [
    { id: "under_10l", label: "Under ₹10 Lakh" },
    { id: "10l_50l", label: "₹10L – ₹50 Lakh" },
    { id: "50l_2cr", label: "₹50L – ₹2 Crore" },
    { id: "above_2cr", label: "Above ₹2 Crore" }
  ],
  yearsBands: [
    { id: "0_2", label: "< 2 years" },
    { id: "3_5", label: "3 – 5 years" },
    { id: "5_plus", label: "5+ years" }
  ],
  languages: [
    { id: "en", label: "English" },
    { id: "as", label: "অসমীয়া" },
    { id: "hi", label: "हिंदी" }
  ]
};

const SAMPLE_TENDERS = TENDERS_DATA.tenders;

/**
 * Handle API requests
 */
function handleApi(req, res, pathname, query) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  // Health check
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      service: 'ThikBid Unified Server',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      routes: Object.keys(ROUTE_MAP)
    }));
    return true;
  }

  // Public config
  if (pathname === '/api/public/config') {
    res.writeHead(200);
    res.end(JSON.stringify(PUBLIC_CONFIG));
    return true;
  }

  // Public tenders list
  if (pathname === '/api/public/tenders') {
    const district = query.get('district');
    const trade = query.get('trade');
    const q = (query.get('q') || '').toLowerCase().trim();
    const sort = query.get('sort') || 'closing';
    const page = parseInt(query.get('page') || '1', 10);
    const pageSize = 12;

    let filtered = [...TENDERS_DATA.tenders];

    if (district && district !== 'all') {
      filtered = filtered.filter(t => t.district === district);
    }
    if (trade && trade !== 'all') {
      filtered = filtered.filter(t => t.trade === trade);
    }
    if (q) {
      filtered = filtered.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        (t.district_name && t.district_name.toLowerCase().includes(q)) ||
        (t.summary_en && t.summary_en.toLowerCase().includes(q))
      );
    }

    if (sort === 'new') {
      filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    } else if (sort === 'value') {
      filtered.sort((a, b) => (b.value_inr || 0) - (a.value_inr || 0));
    } else {
      // Default: closing soonest
      filtered.sort((a, b) => new Date(a.bid_close_at) - new Date(b.bid_close_at));
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < total;

    res.writeHead(200);
    res.end(JSON.stringify({
      items: paginatedItems,
      total: total,
      page: page,
      hasMore: hasMore
    }));
    return true;
  }

  // Tender facets / filters
  if (pathname === '/api/public/tenders/facets') {
    res.writeHead(200);
    res.end(JSON.stringify(TENDERS_DATA.facets));
    return true;
  }

  // Tender single inspection (/api/public/t/:slug)
  if (pathname.startsWith('/api/public/t/')) {
    const slug = pathname.replace('/api/public/t/', '');
    const found = TENDERS_DATA.tenders.find(t => t.slug === slug);
    if (!found) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Tender not found' }));
      return true;
    }
    res.writeHead(200);
    res.end(JSON.stringify({
      tender: found,
      conditions: found.conditions || [],
      versions: found.versions || [],
      verdict: found.verdict || null,
      disclaimer: "This is a guide, not a decision. The official tender document governs."
    }));
    return true;
  }

  // Qualification check evaluation (/api/me/check/:tenderId)
  if (pathname.startsWith('/api/me/check/')) {
    const parts = pathname.split('/');
    const tenderId = parts[4];
    const isFeedback = parts[5] === 'feedback';

    if (isFeedback) {
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
      return true;
    }

    const tender = TENDERS_DATA.tenders.find(t => t.id === tenderId);
    if (tender && tender.verdict) {
      res.writeHead(200);
      res.end(JSON.stringify({
        checkId: `chk_${Date.now()}_${tender.id}`,
        verdict: tender.verdict.verdict,
        reasons: tender.verdict.reasons,
        disclaimer: tender.verdict.disclaimer
      }));
      return true;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      checkId: `chk_${Date.now()}`,
      verdict: 'check',
      reasons: [
        { status: 'info', text: 'Evaluation generated from general profile data.' }
      ]
    }));
    return true;
  }

  // Page view beacon
  if (pathname === '/api/public/pv') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
    return true;
  }

  // Partners list
  if (pathname === '/api/public/partners') {
    res.writeHead(200);
    res.end(JSON.stringify({ items: [] }));
    return true;
  }

  // Current user profile (/api/me)
  if (pathname === '/api/me') {
    res.writeHead(200);
    res.end(JSON.stringify(null));
    return true;
  }

  return false;
}

/**
 * Create HTTP Server
 */
const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // Normalize trailing slash (except root)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Check API routes first
  if (pathname.startsWith('/api/') || pathname === '/health') {
    if (handleApi(req, res, pathname, reqUrl.searchParams)) return;
  }

  // 1. Check direct route map
  if (ROUTE_MAP[pathname]) {
    const targetFile = ROUTE_MAP[pathname];
    const foundPath = findFile(targetFile);
    if (foundPath) {
      return serveStaticFile(req, res, foundPath, '.html');
    }
  }

  // 2. Check for SPA subroutes like /tenders/*, /t/*
  if (pathname.startsWith('/tenders/') || pathname.startsWith('/t/')) {
    const tendersHtml = findFile('tenders.html');
    if (tendersHtml) {
      return serveStaticFile(req, res, tendersHtml, '.html');
    }
  }

  // 3. Check exact static file path
  let relativeFilePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  let directFilePath = findFile(relativeFilePath);

  // If not found, check with .html extension
  if (!directFilePath && !path.extname(pathname)) {
    directFilePath = findFile(relativeFilePath + '.html');
  }

  if (directFilePath) {
    const ext = path.extname(directFilePath).toLowerCase();
    return serveStaticFile(req, res, directFilePath, ext);
  }

  // 4. SPA Fallback: for client-side navigation without extension, fallback to index.html
  if (!path.extname(pathname)) {
    const fallbackHtml = findFile('tenders.html') || findFile('index.html');
    if (fallbackHtml) {
      return serveStaticFile(req, res, fallbackHtml, '.html');
    }
  }

  // 5. 404 Not Found
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>404 - Not Found · ThikBid</title>
<style>body{font-family:sans-serif;background:#F6EFE4;color:#34111A;padding:40px;text-align:center}a{color:#B91F2B}</style>
</head>
<body>
  <h1>404 · Page Not Found</h1>
  <p>The requested route <code>${pathname}</code> was not found on this server.</p>
  <p><a href="/">Back to Home</a> · <a href="/preview.html">Open Showcase Preview</a></p>
</body>
</html>`);
});

/**
 * Serve static file with caching, compression, and Range request support
 */
function serveStaticFile(req, res, filePath, ext) {
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (err) {
    res.writeHead(404);
    res.end('File not found');
    return;
  }

  // Cache headers
  if (filePath.includes('assets') && (ext === '.js' || ext === '.css' || ext === '.webp' || ext === '.png' || ext === '.mp4')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (ext === '.html') {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  // Handle Video Range Requests (essential for .mp4 streaming)
  if (ext === '.mp4' || ext === '.webm') {
    const range = req.headers.range;
    const total = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      const chunkSize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': total,
      'Accept-Ranges': 'bytes',
      'Content-Type': mime
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Standard static file serving
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Last-Modified', stat.mtime.toUTCString());

  // 304 Not Modified check
  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince && new Date(ifModifiedSince) >= stat.mtime) {
    res.writeHead(304);
    res.end();
    return;
  }

  res.writeHead(200);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

// Start listening if run directly
if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`\n======================================================`);
    console.log(`  🚀 ThikBid Unified Server is running!`);
    console.log(`  Local URL:    http://localhost:${PORT}`);
    console.log(`  Network URL:  http://${HOST}:${PORT}`);
    console.log(`  Showcase:     http://localhost:${PORT}/preview.html`);
    console.log(`======================================================`);
    console.log(`  Verified Routes:`);
    console.log(`  - Home:       http://localhost:${PORT}/`);
    console.log(`  - Tenders:    http://localhost:${PORT}/tenders`);
    console.log(`  - For Firms:  http://localhost:${PORT}/firm`);
    console.log(`  - Login:      http://localhost:${PORT}/login`);
    console.log(`  - Start:      http://localhost:${PORT}/start`);
    console.log(`  - Partners:   http://localhost:${PORT}/partners`);
    console.log(`  - Privacy:    http://localhost:${PORT}/privacy`);
    console.log(`  - Terms:      http://localhost:${PORT}/terms`);
    console.log(`======================================================\n`);
  });
}

module.exports = { server, findFile, ROUTE_MAP, MIME_TYPES };
