# ThikBid Interactive Demo Components & Qualification Logic
**Reverse-Engineering Specification & Architecture Reference**  
**Target:** [https://thikbid.vercel.app](https://thikbid.vercel.app) / [thikbid.in](https://thikbid.in)  
**Artifacts Analyzed:**
- `scraped/index.html` (Homepage DOM tree, `#features`, `#try`, `#problem`, `#faq`, `#hs`)
- `scraped/assets/index-kwNebdeb.js` (Canvas simulation engines, ASCII renderers, timeline ticker, interactive cards)
- `scraped/assets/config-DAcj3xRs.js` (WhatsApp phone number configuration, base link factory)
- `scraped/assets/app-VGjPtK0-.js` (Global state, i18n dictionaries, UTM resolver, plan tier definitions)
- `scraped/assets/QualifyDialog-DvcFyUET.js` (Tender qualification modal, feedback loop, paywall checks)
- `scraped/assets/tender-DJVszLhY.js` (Tender card qualification badges, clause citations, verdicts)
- `scraped/assets/ProfileFields-C6YjE4mv.js` (Contractor profile schema, classes, turnover & experience bands)
- `scraped/assets/Review-CW5rCQ3W.js` (Tender parsing field schemas, criteria validation)
- `scraped/assets/Start-DC6j42Ew.js` (Onboarding deep link generator, WhatsApp message payloads)

---

## 1. Executive Summary & Component Map

The ThikBid homepage features a rich set of custom interactive demos designed to visually prove how the service ingests unstructured government tender PDFs, matches them against a contractor's specific profile, and delivers actionable alerts via WhatsApp at 7:00 AM.

### Interactive Components Map

| Component / Section | DOM Mount IDs / Selectors | Underlying Engine | Key Interaction / Animation |
| :--- | :--- | :--- | :--- |
| **PDF Reader Simulation** | `#fxm`, `#fxm-stat`, `.fxm-file` | HTML5 Canvas 2D + ASCII Terminal Grid Buffer | 11-second continuous loop: scans 48 PDF pages, extracts 6 clauses with flying particles, renders live WhatsApp bubble, supports cursor magnetic field |
| **01. "Do I qualify?" Card** | `.fx-q`, `#fx-print`, `#fx-qc` | DOM Stagger + Typewriter Scramble | Sequentially audits 4 qualification criteria (`350ms + i * 420ms`), reveals "Likely yes" badge, decrypts Clause 4.2 citation |
| **02. Corrigendum Diff Card** | `.fx-c`, `#fx-diff`, `.fx-wa1` | Terminal Stream Simulation | Line-by-line typing diff (`16ms/char`), highlights changed date and EMD, triggers simulated WhatsApp push banner |
| **03. Instant Alerts Timeline** | `.fx-i`, `#fx-tl`, `#fx-ping` | Real-time Bar Timeline Observer | 24-hr histogram with 9 PM–7 AM quiet hours, scanning playhead moves every `420ms`, fires ping popups at 2 PM and 6 PM |
| **04. My ThikBid Preview Tabs** | `.fx-m`, `.fx-tabs`, `.fx-pane` | ARIA Tablist Auto-Rotator | Auto-rotates tabs (Saved / Profile / Billing) every `1800ms`, pauses on user click or arrow key navigation |
| **05. WhatsApp Command Console**| `.fx-k`, `#fx-word`, `#fx-chat` | 49×7 ASCII Character Matrix Canvas | Interactive buttons (`STOP`, `PAUSE`, `CHANGE`, `SAVED`, `LANGUAGE`, `PLAN`), matrix glyph morphing with particle scramble, 350ms typing reply |
| **Hero Phone Lockscreen** | `#hs`, `#hs-wrap` | State Machine Sequencer | Simulates 7:00 AM notification arrival, tap gesture, brief unlock with animated counter, and reminder action confirmation |
| **Interactive Try-It Simulator** | `#try`, `#atlas`, `#work`, `.try-phone`| SVG Vector Map + Dynamic Chat Mock | Interactive map of Assam districts + trade chips + language toggle. Auto-demo runs every `4600ms`, pauses for 15s on manual tap |
| **Interactive FAQ Chat** | `#faq`, `#qs`, `#faq-chat` | Stateful WhatsApp Chat Engine (`Xh`) | Clicking questions simulates user message dispatch and WhatsApp response with real typing delay (`520ms * speed`) |
| **Tender Qualification Dialog** | `QualifyDialog`, `tender.jsx` | React Dialog + REST API (`/api/me/check/:id`)| Queries eligibility rules, enforces Starter plan paywall (HTTP 402), renders verdict badges and clause blockquotes with user feedback |

---

## 2. PDF Reader Simulation (`#fxm` & `#fxm-stat`)

The centerpiece simulation on the homepage sits inside `<figure class="fx-machine">`. It reproduces a high-speed OCR scanner reading a 48-page Notice Inviting Tender (NIT) PDF and dispatching an alert to WhatsApp.

### 2.1 Display Architecture & Coordinate Canvas
- **Element:** `<canvas id="fxm">` inside `.fxm-screen`.
- **Status Element:** `<span id="fxm-stat">` displaying dynamic ticker text.
- **Header File Tab:** `<span class="fxm-file">NIT_PWD-Roads_Nagaon_0412.pdf</span>`.
- **Font & Metrics:**
  - Font: `500 ${c}px "Geist Mono", ui-monospace, monospace`
  - Breakpoint sizes:
    - Container width `a < 560px` $\rightarrow$ `c = 10.5px`
    - Container width `560px <= a < 900px` $\rightarrow$ `c = 11.5px`
    - Container width `a >= 900px` $\rightarrow$ `c = 13.0px`
  - Character line height: `h = Math.round(c * 1.42)`
  - Monospace character width: `l = ctx.measureText("M").width`
  - Columns count: `u = Math.floor(a / l)`
  - DPI Scaling: `devicePixelRatio` clamped to `Math.min(2, window.devicePixelRatio || 1)`
  - Transform: `ctx.setTransform(V, 0, 0, V, 0, 0)`

### 2.2 Layout Modes (Desktop vs. Mobile)
The layout dynamically toggles based on the horizontal column count `u`:
1. **Horizontal Mode (`u >= 96` columns - Desktop/Tablet Landscape):**
   - Total rows: `d = 26`
   - Page width: `ie = Math.min(62, Math.floor(u * 0.42))`
   - Page Box: `{ x: 2, y: 2, w: ie, h: d - 5 }` (height: 21 rows)
   - WhatsApp Bubble Box: `{ x: u - 40 - 3, y: Math.floor((d - 11) / 2), w: 40, h: 11 }`
   - Data flows horizontally from left (PDF) to right (WhatsApp bubble) through a Bézier curve bridge with pipeline stages (`01 read`, `02 match`, `03 check`).
2. **Vertical Mode (`u < 96` columns - Mobile):**
   - Page height: `pe = 17`
   - Total rows: `d = pe + 11 + 9 = 37`
   - Page width: `ie = Math.min(u - 6, 48)`
   - Page Box: `{ x: Math.floor((u - ie)/2) - 1, y: 1, w: ie, h: 17 }`
   - WhatsApp Bubble Box: `{ x: Math.floor((u - Math.min(40, u - 4))/2), y: 17 + 7, w: Math.min(40, u - 4), h: 11 }`
   - Data flows vertically downward from PDF into the WhatsApp bubble.

### 2.3 Color Palette
```javascript
const colors = {
  dim:   "rgba(246, 239, 228, 0.16)", // Inactive document filler squiggles
  txt:   "rgba(246, 239, 228, 0.62)", // Normal document text and metadata
  hi:    "#F6EFE4",                   // High-contrast titles and headings
  red:   "#FF5A64",                   // Active scanner laser, extracted particles
  blush: "#F5D5D7",                   // Highlighted text accents, bubble border
  green: "#3ED598",                   // Successful match checks, WhatsApp brand
  amber: "#F5B942",                   // Clause checks needing manual review
  ink:   "rgba(236, 186, 192, 0.45)"  // Cursor halo and background matrix grid
};
```

### 2.4 Document Clauses & Message Mapping
The simulated PDF notice contains 6 extracted clauses mapped directly to 6 destination lines in the WhatsApp message:

```javascript
// Source clauses in PDF: [text, target_message_line_index]
const clauses = [
  ["Name of work: Construction of RCC culvert on Kampur-Nagaon road, Ch. 12.4 km", 0],
  ["Estimated cost: Rs 48,60,000 (Rupees forty eight lakh sixty thousand)",         1],
  ["Eligibility: Class II and above, registered with PWD Assam, 3 years experience", 2],
  ["Average annual turnover of Rs 25 lakh in the last three financial years",        2],
  ["4.2 Similar work: at least one similar work of Rs 20 lakh in the last 5 years",  3],
  ["Earnest money: Rs 97,200. Last date of submission: 04.11.2026, 15:00 hrs",      4]
];

// Target lines in WhatsApp bubble: { t: string, c: color_key }
const messageLines = [
  { t: "RCC culvert, Kampur–Nagaon",      c: "hi"    }, // Line 0: Work Title
  { t: "PWD Roads · ₹48.6 lakh",          c: "txt"   }, // Line 1: Dept & Value
  { t: "✓ Class II  ✓ ₹25L+  ✓ 3 yrs",   c: "green" }, // Line 2: Profile Match
  { t: "? Similar work · see cl. 4.2",    c: "amber" }, // Line 3: Clause Warning
  { t: "⏳ Last date 4 Nov · EMD ₹97,200", c: "txt"   }, // Line 4: Dates & Money
  { t: "→ LIKELY YES",                   c: "green" }  // Line 5: Final Verdict
];
```

### 2.5 State Machine, Intervals, and Timing Constants

```
+-----------------------------------------------------------------------------------------+
|                                11.0s Total Loop Period (P = 11)                         |
+--------------------------+-----------------------+--------------------------------------+
| 0.0s - 0.4s              | 0.4s - 6.4s           | 6.4s - 7.3s     | 7.3s - 11.0s       |
| Initial Idle / Reset     | PDF Scanning Phase    | Profile Match   | WhatsApp Delivered |
| Page 01                  | Pages 01 -> 48        | Profile Audit   | Double Tick (✓✓)   |
+--------------------------+-----------------------+--------------------------------------+
```

- **Loop Period:** $P = 11.0\text{ seconds}$
- **Scan Window Start:** $B = 0.4\text{ seconds}$
- **Scan Window End:** $R = 6.4\text{ seconds}$
- **Scan Window Duration:** $R - B = 6.0\text{ seconds}$
- **Particle Transit Duration:** $H = 1.1\text{ seconds}$
- **Elapsed Local Loop Time:**
  $$ne = \frac{\text{currentTime} - \text{startTime}}{1000} \pmod P$$

#### Page Counter Formula
The page number increments non-linearly across the 6-second scan window:
$$\text{progress} = \text{clamp}\left(0, 1, \frac{ne - B}{R - B}\right)$$
$$\text{pageNumber} = 1 + \left\lfloor \text{progress} \times 47 \right\rfloor$$
$$\text{pageString} = \text{String}(\text{pageNumber}).\text{padStart}(2, \text{"0"})$$
Result: cycles continuously from `"01"` to `"48"`.

#### Status Ticker String State Machine
The `#fxm-stat` DOM element text transitions through 3 discrete states:
1. When $ne < 6.4\text{s}$:
   `reading page ${pageString} / 48`
2. When $6.4\text{s} \le ne < 7.3\text{s}$ ($R \le ne < R + 0.9$):
   `checking your profile…`
3. When $ne \ge 7.3\text{s}$ ($ne \ge R + 0.9$):
   `sent to WhatsApp · 07:00 ✓✓`

### 2.6 Flying Particle Trajectory Mathematics
When the scanner line $W$ reaches clause index $L$ at timestamp:
$$Q = B + \frac{T}{m.\text{length}} \times (R - B)$$
A burst of $N = 9$ particles is launched, staggered by $45\text{ms}$:
$$D = \frac{ne - Q - we \times 0.045}{H} \quad (we \in [0, 8])$$

If $0 \le D \le 1$, the normalized quadratic ease-in-out progress $ee$ is evaluated:
$$ee = \begin{cases} 2 D^2 & \text{if } D < 0.5 \\ 1 - \frac{(-2D + 2)^2}{2} & \text{if } D \ge 0.5 \end{cases}$$

Coordinates are computed via a **Cubic Bézier Curve**:
$$B(t; P_0, P_1, P_2, P_3) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$$

- **Horizontal Trajectory:**
  - $P_{0x} = \text{page.x} + \text{page.w} + 1$, $P_{1x} = P_{0x} + 14$
  - $P_{2x} = \text{bubble.x} + 2 - 16$, $P_{3x} = \text{bubble.x} + 2$
  - $P_y(t) = B(ee; \text{line}_y, \text{line}_y, \text{bubbleLine}_y, \text{bubbleLine}_y) + 1.2 \sin(ee \cdot \pi + we)$
- **Particle Character Selection:**
  Particles borrow real characters from the clause text:
  $$\text{charIndex} = (we \times 5 + \lfloor ne \times 20 \rfloor) \pmod{\text{text.length}}$$
  Rendered in alternating `red` and `blush` colors.

### 2.7 WhatsApp Bubble Typing Animation
- The bubble outline (`╭─╮╰─╯`) fades in at $ne > B + 0.3 = 0.7\text{s}$.
- Header: `ThikBid` (green) at `(bubble.x + 2, bubble.y + 1)` and `07:00` (dim) at `(bubble.x + bubble.w - 9, bubble.y + 1)`.
- Line arrival trigger:
  $$Ie = Q + (L < 5 \,?\, H \times 0.8 : 0)$$
  Line 5 (Verdict) triggers at $R + 0.2 = 6.6\text{s}$.
- Typing Reveal Formula:
  For each character $se$ at index $0 \dots \text{len}-1$ in message line:
  - If $ne - Ie > 0.1 + se \times 0.018$: Character is revealed in target color.
  - Else if $ne - Ie > se \times 0.012$: Scrambled character picked randomly from `!<>-_/[]{}=+*^?#%&@$`.
  - Else: Blank space `" "`.
- Message confirmation:
  At $ne > R + 0.9 = 7.3\text{s}$, the string `"07:00 ✓✓"` is stamped at `(bubble.x + bubble.w - 10, bubble.y + bubble.h - 2)`.

### 2.8 Interactive Magnetic Cursor Field
When a pointer enters the canvas (`pointermove`), character grid positions $w, x$ track the mouse:
$$w = \frac{\text{clientX} - \text{rect.left}}{l}, \quad x = \frac{\text{clientY} - \text{rect.top}}{h}$$
- **Proximity Halo ($r < 5.5$ cells):**
  Distance: $T = \sqrt{(L - w)^2 \times 0.55^2 + (Y - x)^2}$
  Characters illuminate into density glyphs: `" .:+*"[4 - \lfloor T \rfloor]`.
- **Character Scramble ($r < 2.6$ cells):**
  Existing text cells near the cursor have a 55% chance per frame of scrambling into random matrix glyphs from `!<>-_/[]{}=+*^?#%&@$` in `red`.

---

## 3. Other Homepage Interactive Demo Widgets

### 3.1 Interactive Card 01: "Do I qualify?" Checklist (`_S()`)
Located at `#features .fx-q`:
- **Background PDF Printout (`#fx-print`):** Repeated 5 times with a `<mark>` tag highlighting:
  `4.2 Similar work: at least one similar work of Rs 20 lakh in the last 5 years.`
- **Inspection Checklist (`#fx-qc`):**
  - Contains 4 criteria items:
    1. `Contractor class`: Class II or above (`ok`)
    2. `Avg. turnover`: ₹25 lakh+ (`ok`)
    3. `Experience`: 3 years (`ok`)
    4. `Similar work`: 1 × ₹20 lakh (`chk`)
  - **Staggered Animation Sequence:**
    - Items animate in at interval: `delay = 350ms + index * 420ms`.
    - At `delay`: Item adds `.on` class (slide-in).
    - At `delay + 380ms`: Item adds `.done` class (checkmark stamp).
    - When all items finish (`350ms + 4 * 420ms + 150ms = 2180ms`):
      - Card adds `.v` class (reveals "Likely yes" green badge).
      - Executes decryption text typewriter `dS(quoteElem, quoteText, 1100ms)`.

### 3.2 Interactive Card 02: Corrigendum Diff Runner (`yS()`)
Located at `#features .fx-c`:
- **Terminal Element (`#fx-diff`):**
  Simulates a terminal CLI comparing tender revision 1 vs revision 2:
  ```diff
  $ thikbid diff v1 v2
  @@ corrigendum 2 · 28 Oct @@
  - last date    04 Nov 2026
  + last date    11 Nov 2026
  - emd          ₹97,200
  + emd          ₹48,600
  → 1 message sent
  ```
- **Typewriter Timing:**
  - Characters stream in steps of 2 chars every `16ms`.
  - Pause after header: `260ms`.
  - Pause after each diff line: `120ms`.
  - On diff completion: WhatsApp popup banner `.fx-wa1` slides down (`.on`).

### 3.3 Interactive Card 03: Instant Alerts Timeline (`vS()`)
Located at `#features .fx-i`:
- **Histogram Data (`#fx-tl`):**
  24 hourly slots: `[0,0,0,0,0,0,0,0,0,0, 7,2,1,3,5,1,2,1,6,2,1, 0,0,0]`
  - Slots 0–9 (9 PM to 7 AM): Flagged as quiet hours (`.qt`), rendered as dots `·`.
  - Slots 10–20 (7 AM to 9 PM): Active hours, rendered as vertical bars `<i style="--h: ${(count+1)/8}">`.
  - Pinned alert matches: Hour 14 (2 PM) and Hour 18 (6 PM).
- **Clock Playhead Loop:**
  - Playhead iterates hourly index `o` from `10` to `23` every `420ms`.
  - When `o === 14` or `o === 18`: Alert pill `#fx-ping` triggers (`.on`), holding for 4 cycles before fading out.

### 3.4 Interactive Card 04: My ThikBid Preview Tabs (`xS()`)
Located at `#features .fx-m`:
- **Tabs (`.fx-tabs`):** `Saved` (0), `Profile` (1), `Billing` (2).
- **Rotation Interval:** Automatically steps `(active + 1) % 3` every `1800ms` when visible.
- **Keyboard Navigation:** Left/Right arrow keys navigate `(active ± 1) % 3` and cancel auto-rotation.

### 3.5 Interactive Card 05: WhatsApp Interactive Commands (`wS()`)
Located at `#features .fx-k`:
- **Command Buttons (`.fx-key`):** `STOP`, `PAUSE`, `CHANGE`, `SAVED`, `LANGUAGE`, `PLAN`.
- **49×7 ASCII Matrix Canvas (`#fx-word`):**
  - Renders 5×5 bitmapped letterforms in a 49-column by 7-row canvas grid.
  - Supported alphabet maps: `A, C, D, E, G, H, L, N, O, P, S, T, U, V`.
  - When switching commands, matrix cells morph via delayed particle transitions:
    $$\text{cellDelay} = (\text{col} \times 6 + \text{random}(0, 180))\text{ms}$$
    Cells transition through random symbols `%&@*+=` in `#F5D5D7` before settling into `#` (red) or `·` (dim).
- **Simulated Chat Response (`#fx-chat`):**
  - Shows typing bubbles (`.fx-typing`) for `350ms`.
  - Renders localized WhatsApp reply with timestamp `07:02` and smooth translateY entrance.
  - Auto-cycles through all 6 commands every `2000ms`.

---

## 4. Tender Qualification Checker ("Do I Qualify?")

The "Do I qualify?" engine operates both as an interactive preview on the homepage and as a functional evaluation dialog across open tenders.

### 4.1 Client-Server Contract

#### Check Endpoint
- **Request:** `GET /api/me/check/:tenderId` (with session credentials)
- **Response Schema:**
```json
{
  "checkId": "chk_8f92a10c",
  "verdict": "likely" | "likely_not" | "check",
  "reasons": [
    {
      "status": "pass" | "fail" | "info" | "warn",
      "text": "Registration class: Class II or above",
      "quote": "3.1 Eligibility: Class II contractors and above."
    },
    {
      "status": "pass",
      "text": "Average turnover: Rs 25 lakh+ required (your profile: Rs 25–50 lakh)",
      "quote": "3.2 Average annual turnover not less than Rs 25 lakh..."
    },
    {
      "status": "warn",
      "text": "Similar work: 1 work of Rs 20 lakh in last 5 years",
      "quote": "4.2 Similar work: at least one similar work of Rs 20 lakh in the last 5 years"
    }
  ],
  "disclaimer": "This is an automated guide. The official tender document always decides."
}
```

#### Feedback Endpoint
- **Request:** `POST /api/me/check/:checkId/feedback`
- **Body:** `{ "right": true | false }`

#### Paywall / Gating
- If contractor is on the `Free` plan or unauthenticated, `/api/me/check/:tenderId` returns `HTTP 402 Payment Required`.
- The dialog intercepts `402` and renders:
  - Header: `Starter and above` (`me.qualify_locked_h`)
  - Description: `Upgrade to Starter or Pro to check qualification against your profile.`
  - CTA Button: `See plans` $\rightarrow$ `/pricing`

---

## 5. Contractor Profile Criteria & Evaluation Logic

### 5.1 Contractor Profile Schema
The contractor profile (`ProfileFields-C6YjE4mv.js`) defines the following matching dimensions:

```typescript
interface ContractorProfile {
  registration_class: "class_1" | "class_2" | "class_3" | "class_4" | "class_5" | null;
  turnover_band: "under_10l" | "10l_25l" | "25l_50l" | "50l_1cr" | "1cr_5cr" | "above_5cr" | null;
  years_band: "under_1" | "1_3" | "3_5" | "5_10" | "above_10" | null;
  msme: boolean | null;
  trades: string[];            // e.g. ["road", "bridge", "building"]
  district_ids: number[];      // e.g. [1, 14, 28]
  states: string[];            // e.g. ["AS"]
  radius_km: number;           // e.g. 50
  value_band: string | null;   // e.g. "under_50l", "50l_2cr"
}
```

### 5.2 Contractor Class Hierarchy
Assam PWD and Indian civil contracting registries use a strict class ladder where a higher class holds bidding rights for all lower class works:

$$\text{Class I} > \text{Class II} > \text{Class III} > \text{Class IV} > \text{Class V}$$

```javascript
const CLASS_HIERARCHY = {
  class_1: { rank: 1, label: "Class I",   limitInr: Infinity },
  class_2: { rank: 2, label: "Class II",  limitInr: 10000000 }, // Up to ₹1.0 Cr
  class_3: { rank: 3, label: "Class III", limitInr: 5000000  }, // Up to ₹50 Lakh
  class_4: { rank: 4, label: "Class IV",  limitInr: 2000000  }, // Up to ₹20 Lakh
  class_5: { rank: 5, label: "Class V",   limitInr: 500000   }  // Up to ₹5 Lakh
};

function evaluateClass(contractorClass, tenderMinClass) {
  if (!tenderMinClass) return { status: "info", text: "No registration class specified in notice" };
  if (!contractorClass) return { status: "warn", text: `Notice requires ${tenderMinClass.label}; update your profile to verify` };
  
  // Lower numeric rank = Higher contractor privilege
  if (CLASS_HIERARCHY[contractorClass].rank <= CLASS_HIERARCHY[tenderMinClass].rank) {
    return { status: "pass", text: `Your registration (${CLASS_HIERARCHY[contractorClass].label}) meets or exceeds ${CLASS_HIERARCHY[tenderMinClass].label}` };
  } else {
    return { status: "fail", text: `Requires ${CLASS_HIERARCHY[tenderMinClass].label} or above; you are registered as ${CLASS_HIERARCHY[contractorClass].label}` };
  }
}
```

### 5.3 Turnover Bands & Evaluation
```javascript
const TURNOVER_BANDS = {
  under_10l: { min: 0,        max: 1000000,  label: "Under ₹10 lakh" },
  "10l_25l": { min: 1000000,  max: 2500000,  label: "₹10–25 lakh"    },
  "25l_50l": { min: 2500000,  max: 5000000,  label: "₹25–50 lakh"    },
  "50l_1cr": { min: 5000000,  max: 10000000, label: "₹50 lakh–1 cr"  },
  "1cr_5cr": { min: 10000000, max: 50000000, label: "₹1–5 crore"     },
  above_5cr: { min: 50000000, max: Infinity, label: "Above ₹5 crore" }
};

function evaluateTurnover(contractorBand, tenderMinTurnoverInr) {
  if (!tenderMinTurnoverInr || tenderMinTurnoverInr <= 0) {
    return { status: "info", text: "No minimum annual turnover stated" };
  }
  if (!contractorBand) {
    return { status: "warn", text: `Requires average turnover of ₹${(tenderMinTurnoverInr/1e5).toFixed(1)}L+` };
  }
  const band = TURNOVER_BANDS[contractorBand];
  if (band.max >= tenderMinTurnoverInr) {
    return { status: "pass", text: `Average turnover ₹${(tenderMinTurnoverInr/1e5).toFixed(1)}L+ met (profile: ${band.label})` };
  } else {
    return { status: "fail", text: `Turnover shortfall: notice requires ₹${(tenderMinTurnoverInr/1e5).toFixed(1)}L+, your profile is ${band.label}` };
  }
}
```

### 5.4 Years of Experience Bands & Evaluation
```javascript
const YEARS_BANDS = {
  under_1:  { minYears: 0,  label: "< 1 year"    },
  "1_3":    { minYears: 1,  label: "1–3 years"   },
  "3_5":    { minYears: 3,  label: "3–5 years"   },
  "5_10":   { minYears: 5,  label: "5–10 years"  },
  above_10: { minYears: 10, label: "10+ years"   }
};

function evaluateExperience(contractorYearsBand, tenderMinYears) {
  if (!tenderMinYears || tenderMinYears <= 0) {
    return { status: "info", text: "No minimum experience duration specified" };
  }
  if (!contractorYearsBand) {
    return { status: "warn", text: `Notice requires ${tenderMinYears} years of experience` };
  }
  const band = YEARS_BANDS[contractorYearsBand];
  if (band.minYears >= tenderMinYears) {
    return { status: "pass", text: `Experience requirement (${tenderMinYears} yrs) met (profile: ${band.label})` };
  } else {
    return { status: "fail", text: `Requires ${tenderMinYears} years of experience; your profile indicates ${band.label}` };
  }
}
```

### 5.5 MSME & Similar Work Rules
1. **MSME Exemption (`msme_exemption`):**
   - If `tender.msme_exemption === true` and `profile.msme === true`:
     `status: "pass"`, `text: "MSME exemption applicable: EMD and tender fee waived"`
2. **Similar Past Work (`similar_work` / `similar_work_value_inr`):**
   - Because contractor past work portfolios are document-heavy and unverified, specific clause conditions (e.g. Clause 4.2: *one similar work of ₹20 lakh in last 5 years*) evaluate to:
     `status: "warn"` (amber warning icon)
     `text: "Similar work: requires at least 1 work of ₹20 lakh"`
     `quote: "cl. 4.2 › “one similar work of ₹20 lakh in the last 5 years”"`

### 5.6 Verdict Decision Matrix
$$\text{Verdict} = \begin{cases} 
\mathbf{likely\_not} & \text{if any } \text{status} = \text{fail} \\ 
\mathbf{check} & \text{if any critical rule is missing data or } \text{status} = \text{warn} \text{ on core requirements} \\ 
\mathbf{likely} & \text{if Class, Turnover, and Experience } = \text{pass} 
\end{cases}$$

---

## 6. WhatsApp Link Generation & Attribution Engine

All CTA buttons with the `[data-wa]` attribute dynamically generate compliant WhatsApp click-to-chat links with deep-linked intent codes and source attribution tags.

### 6.1 Configuration Constants
- **Official WhatsApp Bot Number:** `919387854327` (`+91 93878 54327`)
- **Domain:** `thikbid.in`
- **Source Storage Key:** `tb-src`
- **Attribution TTL:** 30 days ($30 \times 86400 \times 1000 = 2,592,000,000\text{ ms}$)

### 6.2 Source Tag & UTM Resolution Algorithm
```javascript
const Pg = "tb-src";
const Dg = s => String(s || "")
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, "")
  .slice(0, 24);

function resolveSourceTag() {
  const params = new URLSearchParams(window.location.search);
  const ref = Dg(params.get("ref"));
  const src = Dg(params.get("src") || params.get("utm_source"));
  
  // Partner referral tags take precedence
  const currentTag = ref ? ("ref:" + ref.toUpperCase()) : src;
  
  // 1. Check local storage cache
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(Pg) || "null");
  } catch {}
  
  if (cached && (Date.now() - cached.t < 30 * 864e5)) {
    return cached.v;
  }
  
  // 2. Cache new attribution if present
  if (currentTag) {
    try {
      localStorage.setItem(Pg, JSON.stringify({ v: currentTag, t: Date.now() }));
    } catch {}
    return currentTag;
  }
  
  // 3. Fallback default
  return "web";
}
```

### 6.3 Link Generation Implementations
1. **General Homepage CTA (`config-DAcj3xRs.js` & `index-kwNebdeb.js`):**
   ```javascript
   function generateWhatsAppLink(sourceTag = "web") {
     const phone = "919387854327";
     const text = `Hi ThikBid [${sourceTag}]`;
     return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
   }
   // Resulting URL:
   // https://wa.me/919387854327?text=Hi%20ThikBid%20%5Bweb%5D
   ```

2. **Onboarding Funnel Deep Link (`Start-DC6j42Ew.js`):**
   When a user selects their work categories and district on `/start`, choices are encoded directly into the launch message:
   ```javascript
   function generateOnboardingLink({ trades, district, lang, sourceTag = "web" }) {
     const phone = "919387854327";
     const tradeNames = trades.map(t => t.name).join(", ");
     const districtName = district ? district.name : "";
     const districtSlug = district ? district.slug : "";
     const tradeSlugs = trades.map(t => t.slug).join(",");
     
     const message = 
   `Hi ThikBid [${sourceTag}]
   Work: ${tradeNames}
   District: ${districtName}
   [go:${lang}~${tradeSlugs}~${districtSlug}]`;
   
     return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
   }
   ```
   **Example Output:**
   ```text
   Hi ThikBid [web]
   Work: Road, Bridge
   District: Jorhat
   [go:en~road,bridge~jorhat]
   ```
   When sent, the WhatsApp bot parses `[go:...]` and instantly initializes the subscriber's alerts without asking for district or trades again.

3. **Tender Detail Page Link (`Tender-DFIBhd2-.js`):**
   ```javascript
   function generateTenderShareLink(tenderSlug) {
     const phone = "919387854327";
     const tag = `t-${tenderSlug.slice(0, 20)}`;
     return `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ThikBid [${tag}]`)}`;
   }
   ```

---

## 7. Verification & Implementation Blueprint

To verify or recreate the interactive widgets 1:1 in the clone:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VERIFICATION CHECKLIST                          │
├────────────────────────────────────────────────────────────────────────┤
│ [✓] 1. Canvas #fxm initialized with Geist Mono font and DPI scale      │
│ [✓] 2. Horizontal layout triggers at cols >= 96, Vertical at < 96      │
│ [✓] 3. 11.0s loop correctly phases: scan(0.4-6.4s) -> match -> sent   │
│ [✓] 4. Page counter cycles 01 to 48: 1 + floor(progress * 47)          │
│ [✓] 5. Particles follow cubic Bézier with sinusoidal oscillation       │
│ [✓] 6. WhatsApp bubble renders typing scramble from charset qd         │
│ [✓] 7. Status text transitions reading -> checking -> sent 07:00 ✓✓   │
│ [✓] 8. Checklist Card 01 animates in at 350 + i * 420ms with quote     │
│ [✓] 9. Corrigendum Card 02 streams diff text at 16ms/2chars            │
│ [✓] 10. Timeline Card 03 respects 9 PM - 7 AM quiet hours              │
│ [✓] 11. Matrix Word Card 05 renders 49x7 glyphs with morph scramble    │
│ [✓] 12. Qualification Dialog enforces 402 Starter paywall              │
│ [✓] 13. Decision matrix correctly classifies likely / check / not      │
│ [✓] 14. WhatsApp links persist 30-day tb-src and encode [go:...] tags  │
└────────────────────────────────────────────────────────────────────────┘
```
