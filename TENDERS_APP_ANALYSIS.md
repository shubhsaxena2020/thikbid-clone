# ThikBid `/tenders` Route & React SPA Reverse Engineering Analysis

## 1. Executive Summary

This document provides a comprehensive reverse-engineered specification of the public `/tenders` exploration suite, the single tender inspection route `/t/:slug`, and associated qualification dialog components within the ThikBid SPA.

The analysis is based on static analysis, bundle decompilation, AST reconstruction, and runtime verification of the following production Vite/React bundles:
- **`Tenders-D6sPqL2d.js`** — Main tenders listing, dynamic multi-facet filtering, search, and ticker.
- **`Tender-DFIBhd2-.js`** — Tender detail page with countdown timer, financial matrix, plain-language AI summary, eligibility conditions, revision history, and WhatsApp CTA.
- **`tender-DJVszLhY.js`** — Core domain presentation primitives: `TenderCard`, `VerdictBox`, `TradeBadge`, and localized summary resolver.
- **`QualifyDialog-DvcFyUET.js`** — Interactive modal dialog executing profile-based qualification evaluation with 402 paywall protection and user feedback telemetry.

---

## 2. Route Architecture & Component Hierarchy

### 2.1 Route Definitions in `app-VGjPtK0-.js`

The application mounts tenders under both path-based SEO friendly segments and query parameters:

```javascript
// Route tree in app-VGjPtK0-.js
<Route path="/tenders" element={<TendersPage />} />
<Route path="/tenders/:district" element={<TendersPage />} />
<Route path="/tenders/:district/:trade" element={<TendersPage />} />
<Route path="/t/:slug" element={<TenderDetailPage />} />
```

### 2.2 Component Hierarchy & Responsibilities

```
App Router
│
├── <TendersPage /> (`Tenders-D6sPqL2d.js`)
│   ├── <DotPattern /> (Background visual grid)
│   ├── <BlurFade /> (Animated hero section)
│   │   ├── Live pulse badge ("Live · updated every day")
│   │   ├── Dynamic headline: "Open tenders in [District] [Trade]"
│   │   └── Metric cards grid (Open, Total Value ₹Cr, Closing week, New week)
│   ├── <Marquee /> Closing Soon Ticker (12 nearest closing tenders)
│   └── 2-Column Responsive Workspace (`lg:grid-cols-[300px_1fr]`)
│       ├── <aside> (Sticky Left Filter Sidebar)
│       │   ├── Search Form `<Input type="search" />`
│       │   ├── District Select `<Select />` (Grouped by state, showing per-district counts)
│       │   ├── Trade Buttons (Horizontal scroll on mobile, wrap on desktop, with Lucide icons)
│       │   └── Gamusa WhatsApp CTA Card ("Stop checking websites...")
│       └── <main> (Tender Feed Column)
│           ├── Feed Header: Polite live count + Sort `<Select />` (`closing` | `new` | `value`)
│           ├── Tender Cards Grid: 2-column grid of `<TenderCard />`
│           ├── <EmptyState />: When 0 tenders match (with Clear filters & WhatsApp alert CTA)
│           └── Load More Button: Paginated batch appending (`page + 1`)
│
├── <TenderDetailPage /> (`Tender-DFIBhd2-.js`)
│   ├── Breadcrumb / Back button to `/tenders`
│   ├── Corrigendum Alert Banner (if latest revision is an active corrigendum)
│   ├── 2-Column Detail Layout (`lg:grid-cols-[1fr_360px]`)
│   │   ├── Left Column:
│   │   │   ├── Status pill row (Countdown, Trade badge, Corrigendum, Source portal badge)
│   │   │   ├── Full Title (`h1`) & Issuing Authority/Location
│   │   │   ├── 3-Card Money Bar (Estimated Value, EMD, Tender Fee)
│   │   │   ├── "In plain words" AI Summary Card (Assamese / Hindi / English)
│   │   │   ├── "Who can bid" Eligibility Conditions List (Turnover, Experience, Class, JV, MSME, Quotes)
│   │   │   └── Revision / Corrigendum Timeline (`Timeline` steps for Version 1, 2...)
│   │   └── Right Column (Sticky Sidebar):
│   │       ├── Live Countdown Box (Days, Hours, Mins, Secs real-time interval ticker)
│   │       ├── Critical Dates Breakdown (Published, Queries Until, Bid Close, Technical Opening)
│   │       ├── Official Portal Link Button ("Open the official notice ↗")
│   │       ├── Qualification Status Box (<VerdictBox />, Upgrade Card, or WhatsApp CTA)
│   │       ├── Save & Share Tools (Save button, Copy Link, Share on WhatsApp)
│   │       └── Legal Disclaimer Footnote
│
├── <TenderCard /> (`tender-DJVszLhY.js`)
│   ├── Framer Motion spring fade-in entry
│   ├── Status header: Countdown badge, Trade badge, Corrigendum tag, custom right slot
│   ├── Linked title to `/t/:slug`
│   ├── Department & District metadata with Lucide icons
│   └── 3-Column Mini Metrics strip: Value (₹), EMD (₹), Last Date
│
└── <QualifyDialog /> (`QualifyDialog-DvcFyUET.js`)
    ├── Trigger button `<Button><ShieldQuestion /> Do I qualify?</Button>`
    └── Modal Content:
        ├── <TextShimmer> Loading: "Reading the conditions…"
        ├── 402 Paywall state: "“Do I qualify?” is on Starter" -> `/pricing`
        ├── Success state: Render `<VerdictBox />` with pass/fail breakdown
        ├── Telemetry feedback: Thumbs up / down ("Did we get this right?")
        └── Profile completion prompt: Links to `/me/profile` if attributes are missing
```

---

## 3. Decompiled Tender Data Model & Schemas

### 3.1 Primary Tender Entity Schema

| Field Name | Type | Description | Example / Notes |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique internal identifier | `"tb-tender-001"` |
| `slug` | `string` | URL-safe kebab-case slug | `"rcc-culvert-kampur-nagaon-pwd"` |
| `title` | `string` | Complete name of work from NIT | `"Construction of RCC culvert on Kampur-Nagaon road..."` |
| `tender_ref` | `string` | Official NIT / Tender reference number | `"NIT/PWRD/NGN/RBD/2026-27/04"` |
| `department` | `string` | Procuring department name | `"Public Works (Roads) Department"` |
| `organisation` | `string` | Issuing state board or authority | `"Govt of Assam"` |
| `district` | `string` | District identifier slug | `"nagaon"`, `"kamrup-metropolitan"` |
| `district_name` | `string` | English district name | `"Nagaon"` |
| `district_name_as` | `string` | Assamese script district name | `"নগাঁও"` |
| `location_text` | `string` | Detailed physical site location | `"Kampur to Nagaon Road, Nagaon District"` |
| `state` | `string` | Two-letter state code | `"AS"` (Assam) |
| `trade` | `string` | Standardized category slug | `"road"`, `"building"`, `"water"`, `"flood"`, `"electrical"`, `"supply"`, `"bridge"` |
| `status` | `string` | Lifecycle status | `"open"`, `"closed"`, `"review"`, `"approved"`, `"rejected"` |
| `value_inr` | `number` | Estimated tender value in Indian Rupees | `4860000` (₹48.6 Lakhs) |
| `emd_inr` | `number` | Earnest Money Deposit amount | `97200` (Typically 2% of value) |
| `fee_inr` | `number` | Tender document / processing fee | `1000` (or `0` for GeM) |
| `published_at` | `ISO 8601` | Date and time tender was released | `"2026-10-15T10:00:00+05:30"` |
| `query_until` | `ISO 8601` | Pre-bid clarification deadline | `"2026-10-25T16:00:00+05:30"` |
| `bid_close_at` | `ISO 8601` | Bid submission closing deadline | `"2026-11-04T15:00:00+05:30"` |
| `opening_at` | `ISO 8601` | Technical bid opening timestamp | `"2026-11-05T15:30:00+05:30"` |
| `source_portal` | `string` | Human-readable e-procurement portal | `"Assam Tenders"`, `"GeM"`, `"CPPP"`, `"IREPS"` |
| `source_name` | `string` | Portal name alias used in badges | `"Assam Tenders"` |
| `source_url` | `string` | Direct link to official tender page | `"https://assamtenders.gov.in/nicgep/app?..."` |
| `source_ref` | `string` | Portal-internal tender ID / GeM bid ID | `"2026_PWRD_39812_1"` |
| `has_corrigendum`| `boolean` | Flag indicating amendment notice exists | `false` or `true` |
| `summary_en` | `string` | Plain-English summary of work | Concise 1-2 sentence description |
| `summary_as` | `string` | Plain-Assamese summary | অসমীয়া অনুবাদ |
| `summary_hi` | `string` | Plain-Hindi summary | हिंदी अनुवाद |
| `conditions` | `Array` | Normalized qualification conditions | See Section 3.2 |
| `versions` | `Array` | History of amendments & corrigenda | See Section 3.3 |
| `verdict` | `Object` | Evaluated contractor eligibility | See Section 3.4 |

---

### 3.2 Qualification Criteria (`conditions`) Schema

Extracted by ThikBid's AI ingestion pipeline and human-verified prior to publication.

```typescript
interface TenderCondition {
  field: 
    | "registration_class"       // Contractor registration level
    | "min_years_experience"     // General operating experience
    | "min_turnover_inr"         // Financial capacity
    | "similar_work"             // Technical work capability text
    | "similar_work_value_inr"   // Value threshold for past similar contract
    | "msme_exemption"           // Whether MSEs get EMD/fee waivers
    | "joint_venture_allowed"    // Whether consortiums can bid
    | "other_conditions";        // Additional constraints (machinery, GST, solvency)
  value: string | number | boolean | string[];
  unsure: boolean;               // True if clause in notice was ambiguous
  quote?: string;                // Verbatim text extracted from NIT document
}
```

#### Field Rendering Logic in `Tender-DFIBhd2-.js`:
- `*.endsWith("_inr")`: Formatted via Indian currency formatter `N(val)`.
- `registration_class`: Mapped against `config.regClasses` and displayed as `"{Class} or above"`.
- `min_years_experience`: Displayed as `"{n} years"`.
- `boolean`: Rendered as localized `"Yes"` or `"No"`.
- `Array.isArray(value)`: Rendered as an unordered bulleted list (`<ul className="list-disc">`).
- `unsure === true`: Displays amber badge `"Check the document"`.
- `quote`: Renders inside `<blockquote className="bg-cotton">` with quote icon.

---

### 3.3 Versioning & Corrigendum (`versions`) Schema

```typescript
interface TenderVersion {
  version: number;               // 1 for original, 2+ for corrigendum
  kind: "original" | "corrigendum";
  seen_at: string;               // ISO 8601 date when crawler discovered revision
  summary: string;               // Plain-text explanation of amendments
}
```

When `versions.length > 1`, `Tender-DFIBhd2-.js` renders a vertical timeline with steps:
- Step 1: "Original notice" + formatted timestamp
- Step 2..N: "Corrigendum {n - 1}" + summary description + timestamp

---

### 3.4 Qualification Verdict (`verdict`) Schema

Used by `<VerdictBox />` in both `Tender-DFIBhd2-.js` and `QualifyDialog-DvcFyUET.js`:

```typescript
interface QualificationVerdict {
  verdict: "likely" | "likely_not" | "check";
  reasons: Array<{
    status: "pass" | "fail" | "info" | "warn";
    text: string;
    quote?: string;
  }>;
  disclaimer: string;
}
```

#### Visual Styling Map (`tender-DJVszLhY.js`):
- `likely`: `bg-ok-bg text-ok border-ok/20` with `CircleCheck` icon.
- `likely_not`: `bg-blush text-red-2 border-red/20` with `CircleX` icon.
- `check`: `bg-amber-bg text-amber border-amber/20` with `TriangleAlert` icon.

---

## 4. Search, Filter, Sorting & Navigation Flow

### 4.1 URL State & Navigation Engine

The tenders page coordinates state between React Router parameters and query strings:

```javascript
// URL generation rule in Tenders-D6sPqL2d.js:
const g = (s) => {
  const district = s.district ?? currentDistrict;
  const trade = s.trade ?? currentTrade;
  const sort = s.sort ?? currentSort;
  const q = s.q ?? currentSearch;

  // 1. Path segment construction
  const path = (district && trade) 
    ? `/tenders/${district}/${trade}`
    : district 
      ? `/tenders/${district}`
      : trade 
        ? `/tenders/all/${trade}`
        : `/tenders`;

  // 2. Query string construction
  const params = new URLSearchParams();
  if (sort && sort !== "closing") params.set("sort", sort);
  if (q) params.set("q", q);

  navigate(path + (params.toString() ? `?${params}` : ""));
};
```

### 4.2 Facets & Aggregations API (`/api/public/tenders/facets`)

Before the user filters, the app executes a fast facets query:
```json
{
  "totals": {
    "open": 489,
    "value": 1420000000,
    "closing_week": 34,
    "new_week": 58
  },
  "byDistrict": [
    { "slug": "kamrup-metropolitan", "n": 64 },
    { "slug": "jorhat", "n": 38 },
    { "slug": "nagaon", "n": 28 }
  ],
  "byTrade": [
    { "trade": "road", "n": 142 },
    { "trade": "building", "n": 118 },
    { "trade": "water", "n": 86 }
  ]
}
```

- District select displays counts: `Kokrajhar (14)`, `Kamrup Metropolitan (64)`.
- Trade buttons display count badges next to the trade name.

### 4.3 Search Architecture

- Input text is bound to local state `[L, P] = useState(h)`.
- On `<form onSubmit={...}>`, `e.preventDefault()` calls `g({ q: L.trim() })`.
- URL is updated to `?q=search_term`.
- An effect listening to `[c, m, u, h]` triggers data fetch `z(1)`.

### 4.4 Sorting Options

- **Closing first (`closing`, default)**: `ORDER BY bid_close_at ASC` (shows urgently closing bids first).
- **Newest first (`new`)**: `ORDER BY published_at DESC` (shows recently indexed tenders).
- **Biggest value (`value`)**: `ORDER BY value_inr DESC` (shows high-value infrastructure projects).

### 4.5 Pagination ("Show More" Pattern)

- API endpoint: `/api/public/tenders?page=${page}&sort=${sort}&district=${district}&trade=${trade}&q=${q}`.
- Response payload: `{ items: Tender[], hasMore: boolean, total: number }`.
- When `hasMore === true`, a bottom button displays: `"Show more tenders"`.
- Clicking "Show more" calls `z(page + 1)`, appending the new slice into the existing items list:
  `setItems(prev => page === 1 ? res.items : [...prev, ...res.items])`.

---

## 5. Modal View & Qualification Interaction Flow

The modal workflow in `QualifyDialog-DvcFyUET.js` connects contractor profiles to tender requirements:

```
Contractor clicks "Do I qualify?"
               │
               ▼
       Opens Modal Dialog
               │
               ▼
Display <TextShimmer> ("Reading the conditions…")
               │
               ▼
  Call GET /api/me/check/:tenderId
               │
      ┌────────┴────────┐
      ▼                 ▼
HTTP 402              HTTP 200 (Success)
(Unpaid User)          (Starter / Pro Plan)
      │                 │
      ▼                 ▼
Show Paywall UI:      Render <VerdictBox />
- "“Do I qualify?”     - "You likely qualify" / "Check manually"
  is on Starter"       - Itemized pass/fail reasons with quotes
- Link to /pricing     - Thumbs Up/Down feedback buttons
                        │
                        ▼
               User clicks Thumbs Up/Down
                        │
                        ▼
               POST /api/me/check/:checkId/feedback
               Body: { right: boolean }
                        │
                        ▼
               Displays "Thanks for the feedback"
```

---

## 6. Official Source Portals Covered

ThikBid aggregates government tender notices across 4 primary portals:

1. **Assam Tenders (`assamtenders.gov.in`)**:
   - GePNIC / NIC Assam eProcurement portal.
   - Primary source for APWD (Roads & Building), PHED (Jal Jeevan Mission), Water Resources Dept, and Bodoland Territorial Council (BTC).
2. **GeM (`gem.gov.in`)**:
   - Government e-Marketplace.
   - Primary source for goods, services, office furniture, IT hardware, vehicles, and rate contracts.
3. **CPPP (`eprocure.gov.in`)**:
   - Central Public Procurement Portal.
   - Smart City projects, NHAI/NHIDCL projects in Assam, central universities (IITG, Gauhati Univ, Tezpur Univ), and airport tenders.
4. **IREPS (`ireps.gov.in`)**:
   - Indian Railways E-Procurement System.
   - Northeast Frontier Railway (NFR) works, station platform development, and track maintenance contracts.

---

## 7. Artifact Deliverables Summary

- **`tenders_data.json`**: 12 complete, schema-compliant tender records extracted from reverse-engineered bundles, complete with localized names, conditions, quotes, corrigenda, and qualification verdicts.
- **`server.js` update readiness**: Schema parameters match the expected contracts for `/api/public/tenders`, `/api/public/tenders/facets`, `/api/public/t/:slug`, and `/api/me/check/:tenderId`.
