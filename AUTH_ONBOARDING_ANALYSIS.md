# ThikBid Reverse-Engineering Analysis: Auth & Onboarding Flows
**Target:** [https://thikbid.vercel.app](https://thikbid.vercel.app) / [thikbid.in](https://thikbid.in)  
**Artifacts Analyzed:**
- `Start-DC6j42Ew.js` (Public `/start` onboarding wizard)
- `Setup-JolGlvTb.js` (Authenticated `/me/setup` step wizard)
- `ProfileFields-C6YjE4mv.js` (Shared profile form schemas, widgets, cmdk multi-selector, and validators)
- `Login-BeO6zsgn.js` (Contractor passwordless WhatsApp login & token verification)
- `Login-8nfaPTs1.js` (Admin magic-link email login)
- `Verify-cWapbdsW.js` (Admin token verification)
- `Profile-CqJpSF4d.js` (Profile management, keywords, instant alerts, pause/resume, delete)
- `app-VGjPtK0-.js` (Router, bootstrap config provider, i18n dictionaries, and global utilities)

---

## 1. Executive Summary & Architecture Overview

ThikBid's onboarding and authentication architecture employs an asymmetric, **WhatsApp-First** design tailored to Indian government contractors:
1. **Public Conversion Wizard (`/start`)**:
   - Zero-registration, low-friction funnel.
   - The user selects work trades, district, and preferred language.
   - Instead of asking for phone number and OTP on the web, it compiles the user's choices into a structured deep link payload (`[go:${lang}~${trades.join(",")}~${district_slug}]`) and launches **WhatsApp** (`https://wa.me/...`).
   - The actual contractor account creation and subscription opt-in happen when the user transmits this message in WhatsApp and replies "YES" to the DPDP-compliant consent notice.

2. **Authenticated Profile Setup (`/me/setup`)**:
   - Activated after a user authenticates via WhatsApp magic link (`/me/login?token=...`) if `profileComplete === false`.
   - Comprehensive 6-step wizard using `@radix-ui` / Lucide / custom Stepper:
     1. Work categories (Trades)
     2. Geographical Area (Districts, Whole State, Radius)
     3. Work Size (Tender Value Bands)
     4. Firm Details (Registration Class, Annual Turnover, Experience, MSME)
     5. Alerts Language & Contractor/Firm Name
     6. Review & Save (`PUT /api/me/profile`)

3. **Passwordless WhatsApp Authentication (`/login`, `/signin`, `/me/login`)**:
   - Zero passwords, zero PINs.
   - User inputs an Indian 10-digit mobile number (`+91`).
   - Server sends a secure 30-minute one-time magic link inside the user's WhatsApp chat (`POST /api/me/auth/request`).
   - Clicking the magic link lands on `/me/login?token=...`, which verifies the token (`POST /api/me/auth/verify`) and establishes a session cookie (`credentials: "same-origin"`).
   - Alternatively, existing subscribers can text `PROFILE` to the ThikBid WhatsApp bot to receive a direct login link without typing their number on the website.

4. **Admin Authentication (`/admin/login`, `/admin/verify`)**:
   - Passwordless magic link via email (`POST /api/admin/auth/request`).
   - Single-use token valid for 15 minutes.
   - Verification route `/admin/verify?token=...` calls `POST /api/admin/auth/verify` and routes to `/admin`.
   - Development mode support prints the link in the server log and provides `/api/admin/auth/dev-link` when no email provider (`RESEND_API_KEY`) is configured.

---

## 2. Public Onboarding Flow (`/start`)

### Source File: `Start-DC6j42Ew.js`
- **Route:** `/start` (also redirects `/signup` -> `/start`).
- **Dependencies:** `confetti.module-B5JVzsfH.js`, `border-beam-cw-PDHoW.js`, `dot-pattern-JSFyYsXC.js`.
- **Global Context Hook:** `jg()` / `R()` providing config from `/api/public/config`.

### 2.1 State Variables
```typescript
const [r, _] = useState(0);       // Current step index (0 to 3)
const [g, w] = useState(1);       // Transition direction (+1 for forward, -1 for back)
const [n, o] = useState([]);      // Selected trades slugs: string[] (max 3)
const [d, W] = useState(null);    // Selected district ID: number | null
const [b, q] = useState(i);       // Selected language ID: 'en' | 'as' | 'hi'
const [N, H] = useState("");      // District search input filter query
const [J, S] = useState(null);    // Live preview tenders: TenderItem[] | null
```

### 2.2 Step Transitions & Navigation
The wizard consists of 4 visual steps:
```typescript
const D = [
  { icon: ne, label: t("start.step1"), ok: n.length > 0 }, // Step 0: Work
  { icon: F,  label: t("start.step2"), ok: !!c },          // Step 1: District
  { icon: xe, label: t("start.step3"), ok: !!b },          // Step 2: Language
  { icon: pe, label: t("start.step4"), ok: !0 }            // Step 3: Done/Launch
];
```
- Users can click on previous step indicators (`button onClick={() => a < r && v(a)}`) to navigate backwards.
- "Next" (`start.next`) is disabled when `!D[r].ok`.
- "Back" (`start.back`) is disabled on Step 0.
- Slide and blur transition: `initial: { opacity: 0, x: 40 * g, filter: "blur(4px)" }`, `animate: { opacity: 1, x: 0, filter: "blur(0px)" }`, `exit: { opacity: 0, x: -40 * g, filter: "blur(4px)" }`.

---

### 2.3 Step-by-Step Breakdown

#### Step 0 (UI Step 1): Work Categories
- **Header:** `start.h1` ("What work do you bid for?")
- **Subheader:** `start.p1` ("Pick up to {n}. You can add more later.", default `n = 3`).
- **Data Source:** `l.trades` array from `/api/public/config`.
- **Trade Object Schema:**
  ```typescript
  interface Trade {
    slug: string;       // e.g. "roads", "buildings", "water", "flood", "electrical", "supply"
    name: string;       // English name
    name_as?: string;   // Assamese name
    name_hi?: string;   // Hindi name
    icon: string;       // Icon identifier (route, building, droplet, waves, zap, package, etc.)
    keywords: string[]; // Representative keywords
  }
  ```
- **Validation Rule:**
  - `n.length >= 1` required to proceed (`D[0].ok = n.length > 0`).
  - Hard limit `I = 3`: unselected trade buttons become `disabled` when `n.length >= 3`.
- **UI Interaction:**
  - 2-column (mobile) or 3-column (sm) grid of cards.
  - Active state: `border-red bg-blush/60 shadow-[0_0_0_3px_rgba(185,31,43,.12)]`, red icon background with white glyph, animated spring checkmark indicator (`layoutId="tick-${s.slug}"`).

#### Step 1 (UI Step 2): Location / Districts
- **Header:** `start.h2` ("Where do you work?")
- **Subheader:** `start.p2` ("Pick your home district. You can add more districts later.")
- **Data Filtering:**
  1. Filters states where `active === true`:
     ```typescript
     const activeStates = new Set(l.states.filter(a => a.active).map(a => a.code));
     const availableDistricts = l.districts.filter(a => activeStates.has(a.state_code));
     ```
  2. Search input filtering (case-insensitive across English `name` and Assamese `name_as`):
     ```typescript
     const filtered = availableDistricts.filter(s =>
       !N || s.name.toLowerCase().includes(N.toLowerCase()) || (s.name_as || "").includes(N)
     );
     ```
- **Validation Rule:**
  - Single selection required (`D[1].ok = !!c`).
- **Live Preview Fetch Effect:**
  Whenever a district `c` and at least one trade `n[0]` are chosen, a live tender query fires:
  ```typescript
  fetch(`/api/public/tenders?district=${c.slug}&trade=${n[0]}`)
    .then(res => res.json())
    .then(data => setLiveTenders(data.items))
    .catch(() => setLiveTenders(null));
  ```

#### Step 2 (UI Step 3): Alert Language
- **Header:** `start.h3` ("Which language for alerts?")
- **Subheader:** `start.p3` ("Tender names stay exactly as the office published them.")
- **Data Source:** `l.languages`:
  - `en`: English ("English")
  - `as`: Assamese ("অসমীয়া")
  - `hi`: Hindi ("हिन्दी")
- **Behavior:**
  - Selecting language updates component state `b` and triggers global app language switch `setLang(s.id)` for instant preview localization.

#### Step 3 (UI Step 4): Final Confirmation & WhatsApp Launch
- **Header:** `start.h4` ("Your alerts are ready.")
- **Subheader:** `start.p4` ("Send this to ThikBid on WhatsApp. Say YES to the consent message and your first tenders arrive right away.")
- **Celebration Effect:**
  - Triggers canvas confetti on mount (120 particles, spread 80, colors: `["#B91F2B", "#F5D5D7", "#34111A", "#00A884"]`), respecting `prefers-reduced-motion`.
- **Selection Summary (`dl`):**
  - Work: Comma-separated localized trade names.
  - District: Localized district name.
  - Language: Native language label.
- **Trust Badges (`ul`):**
  - "Free forever for one district" (`start.free`)
  - "14 days of Starter free" (`start.trial`)
  - "No card, no app" (`start.nocard`)

---

### 2.4 WhatsApp Payload & Deep Link Specification

#### Referral Source Attribution (`localStorage["tb-src"]`)
When building the message, the client reads referral attribution from local storage:
```typescript
let s = "web";
try {
  const x = JSON.parse(localStorage.getItem("tb-src") || "null");
  // 30 days TTL (30 * 86400 * 1000 ms = 2,592,000,000 ms)
  if (x && Date.now() - x.t < 30 * 864e5) {
    s = x.v;
  }
} catch {}
```

#### Message Template
```text
Hi ThikBid [{source}]
Work: {trades_en_comma_separated}
District: {district_name}
[go:{lang}~{trade1,trade2,trade3}~{district_slug}]
```

#### Example Message:
```text
Hi ThikBid [web]
Work: Roads, Buildings
District: Nagaon
[go:en~roads,buildings~nagaon]
```

#### Final WhatsApp URL
```typescript
const waNumber = l?.waNumber || "919387854327";
const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
```

---

### 2.5 Live WhatsApp Mockup Component (`be`)
A sticky right-hand mobile phone mockup (`w-[330px] rounded-[36px] border-[7px] border-maroon bg-wa-wall`) demonstrates the incoming 7:00 AM WhatsApp digest:
- WhatsApp top bar: Avatar, "ThikBid", "online", clock `7:00`.
- Preview tag: "YOUR 7 AM MESSAGE".
- Digest message card (`bg-white rounded-xl shadow-sm`):
  - Greeting: `"☀️ Good morning! New tenders for {trade} in {district}:"`
  - 3 preview items:
    - If `live` tenders are returned from `/api/public/tenders`, displays real items (Title, `₹ XX L`, submission deadline).
    - If no live tenders exist or loading, generates mock placeholder tenders for the trade (e.g., roads: "Black-topping of village road", "RCC culvert on PWD road", "Repair of approach road to bridge", values ₹48.6L, ₹12.4L, ₹7.9L).
  - WhatsApp action prompt: `"Reply 1–3 for details · SAVE 1 to get a reminder"`.

---

## 3. Authenticated Post-Login Onboarding (`/me/setup`)

### Source Files: `Setup-JolGlvTb.js` & `ProfileFields-C6YjE4mv.js`
- **Route:** `/me/setup`
- **Trigger:** Navigated here automatically if `GET /api/me` returns `profileComplete: false`.
- **Purpose:** Collect complete profile data to power the eligibility matching engine ("Do I qualify?") and fine-tune alerts.

### 3.1 Stepper Structure (6 Steps)
```typescript
const f = [
  { icon: ue, title: "Work",     h: "What work do you bid for?",      p: "Pick the types of work you do...",   ok: a.trades.length > 0 },
  { icon: xe, title: "Area",     h: "Where do you work?",             p: "Choose your districts...",           ok: a.district_ids.length > 0 || a.states.length > 0 },
  { icon: Y,  title: "Size",     h: "What size of work fits you?",    p: "We use this to rank tenders...",     ok: !0 },
  { icon: ge, title: "Firm",     h: "Get “Do I qualify?” on tenders", p: "Three quick answers about your firm...", ok: !0 },
  { icon: fe, title: "Language", h: "Which language do you read best?", p: "Summaries and messages come in...", ok: !0 },
  { icon: v,  title: "Review",   h: "Everything look right?",         p: "Check your choices...",              ok: !0 }
];
```

---

### 3.2 Detailed Step Operations

#### Step 1: Work Categories (`ne` / `TradesField`)
- Multi-select trade cards.
- Max selectable trades constrained by user's plan: `o.limits.trades` (e.g., Free = 1, Starter = 3, Pro = 6, Firm = unlimited).
- Validation: `a.trades.length > 0` required.

#### Step 2: Location (`oe` / `AreaField`)
- **Plan Gate:** If `plan !== "free"`, shows a segmented tab switcher:
  - `districts`: "Pick districts"
  - `state`: "Whole state"
- **Whole State Mode (`g = a.states.length > 0`):**
  - Allows selecting from active states (e.g. `AS` for Assam).
  - When selected, clears `district_ids`.
- **District Selector Mode (`MultipleSelector` cmdk component):**
  - Multi-select input with badge tags and search dropdown.
  - Districts are grouped by State (`state.name`).
  - Max selected: `limits.districts` (or 500 max).
  - Validation: `a.district_ids.length > 0 || a.states.length > 0`.
- **Radius Slider (`radius_km`):**
  - Visible only if `limits.radiusKm > 0`.
  - Range input: `min: 0`, `max: limits.radiusKm`, `step: 5`.
  - Label: `e.radius_km ? "Also tell me about tenders within {n} km of my districts." : "Only tenders inside my districts."`.

#### Step 3: Size / Tender Value Band (`le` / `ValueBandField`)
- Single choice radio-card grid with 5-dot visual height bars.
- Values loaded from `config.valueBands`:
  ```typescript
  interface ValueBand {
    id: string;        // e.g. "upto_25l", "25l_1cr", "1cr_5cr", "above_5cr"
    label: string;     // e.g. "Up to ₹25 Lakh", "₹25 Lakh – ₹1 Crore"
    min: number | null;
    max: number | null;
  }
  ```
- Optional selection: User can click "Any size" button to reset `value_band: null`.

#### Step 4: Firm Details & Eligibility Qualifications (`de` / `FirmField`)
- Notice: *"No documents required. We only keep tiers like “Class III”, not your certificates."*
- **Contractor Class (`registration_class`):**
  Pills from `config.regClasses`:
  - `class_1` ("Class 1")
  - `class_2` ("Class 2")
  - `class_3` ("Class 3")
  - `class_4` ("Class 4")
  - `unregistered` ("Not registered")
- **Turnover Band (`turnover_band`):**
  Pills from `config.turnoverBands`:
  - `under_25l` ("Under ₹25 L")
  - `25l_1cr` ("₹25 L – ₹1 Cr")
  - `1cr_5cr` ("₹1 Cr – ₹5 Cr")
  - `above_5cr` ("Above ₹5 Cr")
- **Experience Years (`years_band`):**
  Pills from `config.yearsBands`:
  - `under_2y` ("< 2 years")
  - `2y_5y` ("2–5 years")
  - `5y_10y` ("5–10 years")
  - `above_10y` ("10+ years")
- **MSME (Udyam) Registration (`msme`):**
  Pills: `[{ id: "y", label: "Yes" }, { id: "n", label: "No" }]`.
- **Skip Logic:** If Step 4 has no class and no turnover selected, the primary action button changes its label from "Next" (`btn.next`) to "Skip for now" (`me.skip`).

#### Step 5: Language & Name
- Language selection card group: English, Assamese, Hindi.
- Full name / firm name text input (`input id="nm"`, `placeholder: "e.g. Das Constructions"`).

#### Step 6: Review & Final Submission
- Form summary definition list (`dl`) rendering all 8 attributes.
- Submission action triggers:
  ```typescript
  POST / PUT /api/me/profile
  Content-Type: application/json
  Body: preparePayload(form)
  ```
- On success:
  - Sets active language if changed.
  - Fires celebration confetti (`confetti({ particleCount: 110, spread: 75, origin: { y: 0.4 } })`).
  - Displays Success View (`me.setup_done_h`: "All set!"), with CTA button "See my matches" (`/me`).

---

## 4. Profile Form Schema & Data Normalization

### Source File: `ProfileFields-C6YjE4mv.js`

### 4.1 State Schema (`FormState`)
```typescript
interface ProfileFormState {
  name: string;                         // User / Firm name
  language: "en" | "as" | "hi";          // UI and digest language
  trades: string[];                     // Selected trade slugs
  district_ids: number[];               // Selected district IDs
  states: string[];                     // State codes if whole-state selected
  radius_km: number;                    // Proximity radius in km (0 to limits.radiusKm)
  value_band: string | null;            // Selected value band ID
  turnover_band: string | null;         // Turnover band ID
  registration_class: string | null;    // Contractor registration class ID
  years_band: string | null;            // Experience years band ID
  msme: boolean | null;                 // MSME registration boolean or null
  keywords: string[];                   // Custom keyword tags (max 10)
  instant_alerts: boolean;              // Immediate tender notifications toggle
}
```

### 4.2 Initialization Helper (`zt` / `initFormState`)
Initializes the form state by resolving stored DB values against current config:
```javascript
function initFormState(meResponse, valueBands) {
  const profile = meResponse?.profile || {};
  // Reverse lookup value_band ID from value_min & value_max
  const matchedBand = valueBands.find(
    b => (b.min ?? null) === (profile.value_min ?? null) &&
         (b.max ?? null) === (profile.value_max ?? null) &&
         profile.value_min != null
  );

  return {
    name: meResponse?.name || "",
    language: meResponse?.language || "en",
    trades: profile.trades || [],
    district_ids: profile.district_ids || [],
    states: profile.states || [],
    radius_km: profile.radius_km || 0,
    value_band: matchedBand?.id || null,
    turnover_band: profile.turnover_band || null,
    registration_class: profile.registration_class || null,
    years_band: profile.years_band || null,
    msme: typeof profile.msme === "boolean" ? profile.msme : null,
    keywords: profile.keywords || [],
    instant_alerts: profile.instant_alerts !== false
  };
}
```

### 4.3 Payload Sanitizer (`Jt` / `preparePayload`)
```javascript
const preparePayload = form => ({
  ...form,
  msme: form.msme === null ? undefined : form.msme
});
```

---

## 5. Contractor WhatsApp Authentication Flow (`/login`)

### Source File: `Login-BeO6zsgn.js`
- **Routes:** `/login`, `/signin`, `/me/login`
- **Sub-components:**
  - `SignInPanel` (`X`): Form for requesting WhatsApp magic link.
  - `HowToSignIn` (`oe`): Explanatory widget explaining passwordless flow.
  - WhatsApp Interactive Simulator preview (`Q`): Animates chat receiving sign-in link.

```
       +-------------------------------------------------------+
       |               Contractor visits /login                |
       +-------------------------------------------------------+
                                   |
                   Has ?token=... in URL query?
                  /                                           [YES]                           [NO]
                 |                               |
       +--------------------+          Already logged in? (GET /api/me)
       | Show Shimmer:      |         /                      | "Signing you in…"  |      [YES]              [NO]
       +--------------------+        |                  |
                 |             Redirect to /me   Show Phone Input Form
     POST /api/me/auth/verify                       (🇮🇳 +91)
         { token }                                      |
         /        \                             User inputs phone & submits
      [OK]      [FAIL]                                  |
        |          |                            POST /api/me/auth/request
   GET /api/me  Show Error:                       { phone: "91...", next }
        |       "Link expired"                          |
 profileComplete?                               Show "Check WhatsApp"
     /       \                                  (devLink shown if dev mode)
  [YES]      [NO]
    |          |
Route /me   Route /me/setup
```

### 5.1 Mobile Number Input & Validation Rules
- **Prefix:** Country code `🇮🇳 +91` fixed in input decorator.
- **Phone Sanitization Algorithm:**
  ```javascript
  const handlePhoneChange = e => {
    const raw = e.target.value
      .replace(/\D/g, "")                    // Strip non-digits
      .replace(/^(91|0)(?=\d{10})/, "")      // Strip leading country code 91 or leading 0
      .slice(0, 10);                         // Max 10 digits
    setPhone(raw);
    setError(null);
  };
  ```
- **Phone Format Validation Regex:**
  ```javascript
  const isValidPhone = /^[6-9]\d{9}$/.test(phone);
  ```
  Indian standard valid mobile series (starting with 6, 7, 8, or 9, exactly 10 digits).
- **Phone Display Formatter:**
  ```javascript
  const formatPhone = s => s.length > 5 ? `${s.slice(0, 5)} ${s.slice(5)}` : s;
  ```
  Formats `9876543210` -> `98765 43210`.
- **Validation Feedback:**
  - When valid, an animated green circle with double checkmark (`DwsvOZ6e.js`) scales up in the input trailing slot.
  - If invalid on submit, shows error alert: `"Enter a 10-digit mobile number."` (`auth.bad_phone`).

### 5.2 Magic Link Request Submission
```typescript
POST /api/me/auth/request
Content-Type: application/json

{
  "phone": "919876543210",
  "next": "/tenders/nagaon" // Optional redirect target
}
```
**Response Schema:**
```typescript
interface AuthRequestResponse {
  ok: boolean;
  devLink?: string; // e.g. "https://thikbid.vercel.app/me/login?token=abc123xyz"
}
```

### 5.3 Post-Request State ("Check WhatsApp")
- Icon changes to WhatsApp green bubble (`bg-wa text-white`).
- Heading: `"Check WhatsApp"` (`auth.sent_h`).
- Body: `"If +91 {phone} uses ThikBid, a sign-in link is on its way. It works once, for 30 minutes."` (`auth.sent_p`).
- **Dev Mode Banner:** If `devLink` is present in response, renders a dashed amber notice box:
  `"Setup mode: WhatsApp is simulated, so here is the link that was sent."` with a direct clickable link.
- Action Buttons:
  - "Open WhatsApp" -> `https://wa.me/${waNumber}`
  - "Use another number" -> resets state back to `idle`.

### 5.4 In-Chat Fallback Route (`auth.alt_cta`)
For contractors already in WhatsApp who do not want to fill web forms:
- Instructions: *"Send PROFILE to ThikBid and tap the link we reply with."*
- Deep-link button launches WhatsApp with message `PROFILE`:
  `https://wa.me/{waNumber}?text=PROFILE`

### 5.5 Magic Link Token Verification
When contractor clicks the link in WhatsApp (`/me/login?token={TOKEN}&next={PATH}`):
1. Sets state `working`, rendering shimmer text: `"Signing you in…"`.
2. Calls verification API:
   ```typescript
   POST /api/me/auth/verify
   Content-Type: application/json

   { "token": token }
   ```
3. On verification success:
   - Fetches current session: `GET /api/me`.
   - Routing decision:
     ```javascript
     const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
     if (safeNext) {
       navigate(safeNext, { replace: true });
     } else if (me.profileComplete) {
       navigate("/me", { replace: true });
     } else {
       navigate("/me/setup", { replace: true });
     }
     ```
4. On verification failure:
   - Sets state `bad`.
   - Renders alert message: `"This link has expired or was already used."` (`me.login_bad`).
   - Falls back to rendering the phone number entry form.

---

## 6. Admin Authentication Flow (`/admin/login` & `/admin/verify`)

### Source Files: `Login-8nfaPTs1.js` & `Verify-cWapbdsW.js`

### 6.1 Admin Login (`Login-8nfaPTs1.js`)
- **Route:** `/admin/login`
- **Method:** Email magic link restricted to allowlisted administrators.
- **Form Schema:** Single email input (`type="email"`, required, autofocus).
- **Submission:**
  ```typescript
  POST /api/admin/auth/request
  Content-Type: application/json

  { "email": "admin@example.com" }
  ```
  **Response:** `{ devMode: boolean }`.
- **Sent State:**
  - Displays `"Check your e-mail"`.
  - Body: *"If {email} is on the admin list, a sign-in link is on its way. It works once and expires in 15 minutes."*
  - **Dev Mode Fallback:**
    If `devMode === true` (indicating `RESEND_API_KEY` is unset), shows button `"Open sign-in link (dev mode)"`.
    Clicking fires `GET /api/admin/auth/dev-link`, parses the returned URL, and navigates directly.

### 6.2 Admin Verification (`Verify-cWapbdsW.js`)
- **Route:** `/admin/verify`
- **Reads Query Param:** `token = searchParams.get("token")`.
- **Verification Call:**
  ```typescript
  POST /api/admin/auth/verify
  Content-Type: application/json

  { "token": token }
  ```
- **Redirection:**
  - On success: `navigate("/admin", { replace: true })`.
  - On failure or missing token: Shows error card with clock icon:
    `"This link has expired. Links work once and last 15 minutes."`
    Includes action button: `"Get a new link"` (`/admin/login`).

---

## 7. Local Storage & Client State Dictionary

| Key | Type / Structure | Stored In | Read In | Purpose & TTL |
| :--- | :--- | :--- | :--- | :--- |
| `tb-lang` | `"en" \| "as" \| "hi"` | `app-VGjPtK0-.js`, `index-kwNebdeb.js` | App bootstrap | Persists selected UI language across sessions. |
| `tb-src` | `JSON.stringify({ v: string, t: number })` | Landing page URL parameter capture | `Start-DC6j42Ew.js`, `app-VGjPtK0-.js` (`wk`) | Tracks referral campaign / UTM source tag (e.g. `"poster-ghy"`). Valid for **30 days** (`Date.now() - t < 30 * 864e5`). Defaults to `"web"`. |
| `tb-sim-phones` | `Array<{ phone: string, name: string }>` | `Simulator-DL91cjVW.js` | Admin Simulator | Maintains the simulated test phone numbers used in the WhatsApp bot simulator. Defaults to `[{ phone: "919999900001", name: "Test Contractor" }]`. |

---

## 8. Complete API Contracts Specification

### 8.1 Public APIs
```typescript
// GET /api/public/config
interface PublicConfigResponse {
  trades: Array<{
    slug: string;
    name: string;
    name_as?: string;
    name_hi?: string;
    icon: string;
    keywords: string[];
  }>;
  districts: Array<{
    id: number;
    name: string;
    name_as?: string;
    slug: string;
    state_code: string;
  }>;
  states: Array<{
    code: string;
    name: string;
    active: boolean;
  }>;
  languages: Array<{
    id: "en" | "as" | "hi";
    label: string;
    native: string;
  }>;
  valueBands: Array<{
    id: string;
    label: string;
    min: number | null;
    max: number | null;
  }>;
  regClasses: Array<{ id: string; label: string }>;
  turnoverBands: Array<{ id: string; label: string }>;
  yearsBands: Array<{ id: string; label: string }>;
  plans: Array<{
    id: string;
    name: string;
    monthly: number;
    yearly: number;
    blurb: string;
  }>;
  waNumber: string; // e.g. "919387854327"
  modes: {
    whatsapp: "live" | "simulated";
    payments: "live" | "test";
  };
}

// GET /api/public/tenders?district={slug}&trade={slug}
interface PublicTendersResponse {
  items: Array<{
    id: string;
    slug: string;
    title: string;
    value_inr: number;
    bid_close_at: string; // ISO 8601
    department?: string;
    district_name?: string;
    trade?: string;
    has_corrigendum?: boolean;
  }>;
  total: number;
  hasMore: boolean;
}
```

### 8.2 Contractor Auth & Profile APIs
```typescript
// POST /api/me/auth/request
interface AuthRequestBody {
  phone: string;  // e.g. "919876543210"
  next?: string;  // e.g. "/tenders"
}
interface AuthRequestResponse {
  ok: boolean;
  devLink?: string;
}

// POST /api/me/auth/verify
interface AuthVerifyBody {
  token: string;
}
interface AuthVerifyResponse {
  ok: boolean;
  user_id: string;
}

// GET /api/me
interface MeResponse {
  id: string;
  phone_last4: string;
  name: string | null;
  language: "en" | "as" | "hi";
  plan: "free" | "starter" | "pro" | "firm";
  effectivePlan: "free" | "starter" | "pro" | "firm";
  status: "active" | "paused" | "stopped";
  profileComplete: boolean;
  limits: {
    trades: number;
    districts: number;
    radiusKm: number;
    instant: boolean;
  };
  profile: {
    trades: string[];
    district_ids: number[];
    states: string[];
    radius_km: number;
    value_min: number | null;
    value_max: number | null;
    turnover_band: string | null;
    registration_class: string | null;
    years_band: string | null;
    msme: boolean | null;
    keywords: string[];
    instant_alerts: boolean;
  };
}

// PUT /api/me/profile
interface UpdateProfileBody {
  name: string;
  language: "en" | "as" | "hi";
  trades: string[];
  district_ids: number[];
  states: string[];
  radius_km: number;
  value_band: string | null;
  turnover_band: string | null;
  registration_class: string | null;
  years_band: string | null;
  msme?: boolean;
  keywords: string[];
  instant_alerts: boolean;
}

// POST /api/me/pause
// POST /api/me/resume
// POST /api/me/delete ({ confirm: "DELETE" })
```

### 8.3 Admin Auth APIs
```typescript
// POST /api/admin/auth/request
interface AdminAuthRequestBody {
  email: string;
}
interface AdminAuthRequestResponse {
  ok: boolean;
  devMode?: boolean;
}

// GET /api/admin/auth/dev-link
interface AdminDevLinkResponse {
  link: string; // e.g. "http://localhost:3000/admin/verify?token=..."
}

// POST /api/admin/auth/verify
interface AdminVerifyBody {
  token: string;
}
interface AdminVerifyResponse {
  ok: boolean;
  admin_id: string;
}
```

---

## 9. Replication Invariants & Cloning Directives

When cloning ThikBid 1:1, replicate the following invariants:
1. **Never build a traditional web signup form on `/start`:**
   `/start` must construct the URL-encoded WhatsApp deep-link payload `[go:${lang}~${trades.join(",")}~${district_slug}]` and launch `wa.me`. Account creation and opt-in consent occur in WhatsApp.
2. **Strict Indian Mobile Number Normalization:**
   Normalize all entered phone numbers by removing leading `91` or `0`, verifying `/^[6-9]\d{9}$/`, and formatting as `XXXXX XXXXX`.
3. **Magic Link Token Expirations:**
   - User WhatsApp link: **30 minutes**, single-use.
   - Admin email link: **15 minutes**, single-use.
4. **Conditional Routing on Verification:**
   Upon successful token verification, inspect `me.profileComplete`. If `true`, route to `/me` (or sanitized `next`); if `false`, route to `/me/setup`.
5. **Plan-Based Feature Restrictions in `/me/setup` & `/me/profile`:**
   - Free users cannot select "Whole State" (`plan !== "free"`).
   - District selection cap enforced by `limits.districts`.
   - Trade selection cap enforced by `limits.trades`.
   - Proximity radius slider disabled/hidden if `limits.radiusKm <= 0`.
   - Instant alerts toggle locked unless `limits.instant === true`.
6. **No Storing Physical Qualification Documents:**
   Never ask for or store contractor registration PDF documents or certificates. Store only enum bands (`registration_class`, `turnover_band`, `years_band`, `msme`).
