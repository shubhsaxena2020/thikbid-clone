# ThikBid Landing Page: Architecture, Navigation Dynamics & Bilingual i18n Engine

> **Reverse Engineering Analysis Report**  
> **Target:** `https://thikbid.vercel.app/`  
> **Source Files Analyzed:** `index.html`, `scraped/assets/index-kwNebdeb.js`, `scraped/assets/index-CKzG2lPy.css`  
> **Companion Artifact:** `i18n_dictionary.json`

---

## 1. Executive Summary & Architectural Overview

The ThikBid homepage is an ultra-high performance, single-page application built with modern vanilla web standards, compiled down into a highly optimized ES module bundle (`index-kwNebdeb.js`, ~848 KB uncompressed, including 3D engine, animation libraries, and embedded SVG GeoJSON data) paired with a specialized utility/custom stylesheet (`index-CKzG2lPy.css`, ~118 KB).

### Core Runtime Stack
- **DOM & Runtime Architecture:** Zero-framework vanilla DOM engine. Dynamic components (WhatsApp chat simulators, SVG maps, rotating drum wheels, PDF scanner previews) are driven directly by specialized controller classes and micro-renderers.
- **Motion & Scroll Engine:** 
  - **GSAP 3.12.5** (`sn`) and **ScrollTrigger** (`$e`) for pinned scrollytelling sequences, multi-card stacking, and SVG mask animations.
  - **Lenis Smooth Scroll** (`u1`) providing inertia scrolling across desktop viewports.
- **3D & Shader Pipeline:** **Three.js** (`uS`) driving WebGL canvas scenes:
  - `#cloth`: Physical Gamusa textile curl-and-fold simulation with custom GLSL vertex/fragment shaders.
- **Bilingual i18n Engine:** Dual-layer hybrid architecture:
  - Declarative DOM mapping: 207 HTML elements decorated with `data-i18n="key"` attributes.
  - Imperative reactive state machine: 192-key translation object (`qu`) plus 8 rich interactive dictionaries for live re-rendering on language toggle.
  - Zero-lag synchronous updates, persistence via `localStorage.getItem("tb-lang")`, and automatic Assamese numeral conversion (`০-৯`).

---

## 2. Section-by-Section Engineering Breakdown

### 2.1 Navigation Bar (`<header class="nav" id="nav">`)
The navigation system is designed as a dynamic floating island that adapts its appearance, color scheme, active indicators, and visibility based on user scrolling and section themes.

- **DOM Structure:**
  - `#nav.nav`: Fixed top container positioned at `calc(12px + env(safe-area-inset-top, 0px))`.
  - `#nav-in.nav-in`: Inner flex/grid wrapper holding the brand logo, link group, language toggle, and auth CTAs.
  - `#nav-links.nav-links`: Desktop links (`#features`, `#how`, `#try`, `/tenders`, `#price`, `/firm`) containing the sliding indicator `#nav-ind`.
  - `#lang-toggle.lang-t`: Language toggle button with globe SVG icon, `<span class="as">অসমীয়া</span>`, and `<span class="en">English</span>`.
  - `#nav-menu.nav-menu`: Mobile hamburger button with two animated bars `<i></i><i></i>`.
  - `#nav-sheet.nav-sheet`: Mobile navigation sheet menu (hidden by default).

### 2.2 Hero Section (`<section class="hero" id="hero">`)
- **Canvas Gamusa (`#cloth`):** A custom Three.js WebGL canvas rendering a traditional Assamese Gamusa woven textile. As the user begins scrolling, GSAP ScrollTrigger drives the uniform `uFold` from `0.0` to `1.0`, causing the cloth to curl, roll upward, and dissolve out of view.
- **Hand & Phone Stage (`#hero-phone`):**
  - High-resolution hand photo (`/assets/hand-phone.webp`) with the glass screen area cut out as an alpha mask.
  - Interactive live screen `#hs` positioned directly behind the physical phone cut-out, displaying live simulated WhatsApp notifications, date/time, and incoming tender alerts.
- **Headline `#h1` & Multilingual Rotator (`#rot`):**
  - Clipped reveal spans animating in sequence on load.
  - Rotating text element `#rot` with measuring span `.meas` and animated spans `.rw`. Rotates through 6 Indian languages (`straight` -> `सीधे` -> `পোনপটীয়াকৈ` -> `সরাসরি` -> `સીધું` -> `நேரடியாக`).
  - Animated hand-drawn squiggly underline `#wa-u` with an SVG curve path drawn via `stroke-dashoffset`.
- **Floating Chips (`.fc1`, `.fc2`, `.fc3`):** Annotation pills with animated hand-drawn SVG pointer arrows connecting to the phone:
  - `fc1`: "7:00 AM alert · Every day"
  - `fc2`: "Your district · Only"
  - `fc3`: "Reminder · Before last date"

### 2.3 Fresh Tenders Shelf (`<section class="fresh" id="fresh">`)
- Horizontal momentum carousel `#row` populated by 12 real-world government tenders (`MS` array) scraped from `assamtenders.gov.in` and `gem.gov.in`.
- Navigated via left/right chevron buttons (`#row-prev`, `#row-next`) or direct horizontal touch/wheel gestures.

### 2.4 Why Section (`<section class="sec" id="why">`)
- Visual metaphor: "We read the portals. You read one message."
- Canvas `#wx-flow`: 6 government tender sources (`assamtenders.gov.in`, `gem.gov.in/bids`, `ireps.gov.in`, `Assamese daily newspaper`, `PWD notice board`, `eprocure.gov.in`) arranged in a radial layout.
- Animated particle pulses radiate from the perimeter sources and converge into the central heart `#wx-heart`, displaying distilled tender facts.

### 2.5 What You Get: 3D Cylindrical Feature Wheel (`<section class="wheel" id="get">`)
- Pinned full-viewport 3D carousel (`.wh-pin`, `#wh-wheel`).
- As the user scrolls, the scroll delta is mapped to 3D rotational coordinates, turning 6 feature cards like a drum:
  1. `01 Only your kind of work`: Interactive filter sieve visualization (`#trades`, `#feed`).
  2. `02 Every morning at 7`: Lock-screen notification simulation at 6:58 AM (`#lock`, `#notif`).
  3. `03 Never miss a last date`: Interactive reminder calendar (`#cal`).
  4. `04 Speaks your language`: Language switching preview bubble (`#ltabs`, `#lbub`).
  5. `05 Every source, one place`: Radar sweep animation and counter (`#radar`, `#found`).
  6. `06 Send it to your partner or munshi`: WhatsApp message forwarding simulation (`#fwd`, `#contacts`).
- Synchronized indicators:
  - Desktop Left: `#wh-left` with counter `#wh-n` ("01 / 06") and linear progress bar `#wh-bar`.
  - Desktop Right: Navigation index `#wh-index` with smooth anchor jumps and `#wh-skip`.
  - Mobile: Bottom floating pill `#wh-pill` with dot indicators `#wh-dots`.

### 2.6 How It Works (`<section class="how" id="how">`)
- 3-step vertical progression (`#steps .step`):
  - Step 1: Say "Hi" to ThikBid (10 seconds)
  - Step 2: Choose your area and work (1 minute)
  - Step 3: Get tenders every morning (7:00 AM)
- Right-hand sticky stage: A high-fidelity WhatsApp phone simulator (`pw[data-phone="how"]`) that executes live conversational message flows matching whichever step is currently scrolled into view.

### 2.7 Inside Every Alert: AI Notice Reader Machine (`<section class="fx" id="features">`)
- Animated canvas scanner `#fxm` displaying a realistic 48-page government PWD road tender PDF (`NIT_PWD-Roads_Nagaon_0412.pdf`) with live text-line highlighting.
- 5 specialized feature cards:
  - `01 “Do I qualify?”`: Contractor eligibility matching matrix (Class, Turnover, Experience).
  - `02 Corrigendum Tracking`: Terminal diff display `#fx-diff` showing tender amendment alerts.
  - `03 Instant Alerts`: 24-hour timeline `#fx-tl` with quiet hours enforced between 9 PM and 7 AM.
  - `04 My ThikBid`: Interactive tabbed interface (Saved, Profile, Billing) with no-password WhatsApp link auth.
  - `05 WhatsApp Command Terminal`: Interactive keypad `#fx-keys` running simulated command replies (`STOP`, `PAUSE`, `CHANGE`, `SAVED`, `LANGUAGE`, `PLAN`).

### 2.8 Interactive Simulator & Atlas Map (`<section class="sec" id="try">`)
- Two-tier interactive SVG vector map (`#atlas-svg`):
  - Level 1 (National): Full India state boundary vector paths (`Xu` dataset). Hovering states shows availability ("Live now" in Assam, "Coming soon" in others).
  - Level 2 (State): Assam district level (`LS` dataset, 33 districts) with interactive hover and click selection.
- Control parameters:
  - Work type radio selector (`#work`): Road, Building, Bridge, Water, Electrical, Supply.
  - Language radio pills (`#lang`): English (`en`), Assamese (`as`).
  - Auto-demo mode (`#demo-btn`, `#demo-bar`): Automatically cycles through districts and trades on a timer.
- Live WhatsApp Simulator Phone (`pw[data-phone="try"]`): Dynamically compiles a customized morning alert message based on the selected district, trade, and language using the `FS` templating engine.

### 2.9 Problem Section: Stacking Cards (`<section class="sec" id="problem">`)
- 4 sticky cards (`#stack .scard`) pinned and stacked on top of one another via GSAP ScrollTrigger:
  - `Card 1`: 5 to 7 places to check every day (Simulated browser with tab overflow and session expired toast).
  - `Card 2`: Clock starts before you know (Fuse burn down and countdown clock).
  - `Card 3`: Captcha codes and 40-page PDFs (Flipping document stack with real captcha prompt).
  - `Card 4`: The ThikBid way (Clean 7:00 AM WhatsApp notification).

### 2.10 Statistical Proof Matrix (`<section class="sec stats" id="stats">`)
- 4 metric tiles with scroll-triggered counting animations:
  - `489` open tenders on Assam's portal in a single day.
  - `10.82 lakh` registered MSMEs in Assam.
  - `10–21 days` average bidding window for water works.
  - `₹5.4 lakh crore` FY25 GeM procurement volume.

### 2.11 Statement & Expanding Crew Video (`#expand`)
- Sticky video frame `#expand-media` playing `assets/site-crew-drift.mp4`.
- Interpolates CSS properties `--ey`, `--ex`, `--er`, `--es` on scroll: expands smoothly from a rounded card into a full-width panoramic cinematic backdrop.

### 2.12 Persona Pathways (`<section class="sec" id="who">`)
- Three distinct customer paths:
  1. `Free Plan`: Independent contractors & local suppliers (1 district, free forever).
  2. `Firm Plan`: Multi-district firms & bidding teams (5 WhatsApp seats, state-wide coverage).
  3. `Partner Programme`: Accountants, tax consultants, and contractor associations (20% revenue share).

### 2.13 Pricing Grid (`<section class="sec" id="price">`)
- Interactive plan browser (`#plan-line`) linking Free, Starter, Pro, and Firm plans.
- Dynamic Starter Card (`#pcard`):
  - "14 days free" stamp.
  - Dynamic bullet list `#p-list` populated dynamically by `drawPrice()`.

### 2.14 Conversational FAQ (`<section class="sec" id="faq">`)
- 8 accordion question buttons (`#qs`).
- Clicking any question triggers a real-time conversational exchange inside the WhatsApp chat panel `#faq-panel`, simulating typing status and message delivery ticks.

### 2.15 Final Conversion & Footer (`#start`, `.ft`)
- Large call-to-action card with floating diamonds `#diamonds`.
- Comprehensive multi-column footer navigation, disclaimer, copyright, and creator credits.

---

## 3. Bilingual Assamese/English i18n Engine: Complete Deep Dive

The bilingual architecture is one of the most sophisticated aspects of ThikBid. It is not an afterthought or third-party widget; it is tightly coupled with every interactive component, canvas, SVG map, and state machine on the page.

### 3.1 DOM-Level Architecture (`[data-i18n]`)
At build time, the page defaults to English markup. Every translatable DOM node carries a `data-i18n="<key>"` attribute.
At page initialization in `index-kwNebdeb.js`:
```javascript
const BS = We("[data-i18n]").map(s => ({
  e: s,
  k: s.dataset.i18n,
  en: s.innerHTML
}));
```
This maps all 207 DOM nodes into memory, caching their reference (`e`), translation key (`k`), and pristine English HTML (`en`).

### 3.2 The Master Translation Object (`qu`)
In `index-kwNebdeb.js` (lines 777829–786747), the `qu` object contains 192 handcrafted Assamese translation strings matching the `data-i18n` keys.
- If a key exists in `qu`, its translated HTML is injected.
- If a key is missing in `qu`, it gracefully retains the original English HTML `n`.
- For any Assamese content that is not inside an `<h1>` heading, the `.indic` class is toggled, applying the Assamese/Bengali typography stack (`font-family: var(--f-indic)` -> `Noto Sans Bengali`).

### 3.3 The Core Language Switcher Function: `dv(s)`
When the user toggles language (or when saved preference is loaded from `localStorage`), the function `dv(s)` executes:

```javascript
function dv(s) {
  vi = s; // updates active locale ("en" | "as")
  document.documentElement.lang = s === "as" ? "as" : "en";
  ae("#lang-toggle").setAttribute("aria-pressed", s === "as");
  
  // 1. Update all static DOM elements
  BS.forEach(({ e, k: t, en: n }) => {
    e.innerHTML = s === "as" && qu[t] ? qu[t] : n;
    e.classList.toggle("indic", s === "as" && !!qu[t] && !e.closest("h1"));
  });
  
  // 2. Update H1 accessibility and typography
  ae("#h1").classList.toggle("indic", s === "as");
  ae("#h1").setAttribute(
    "aria-label",
    s === "as" 
      ? "প্ৰতিটো নতুন টেণ্ডাৰ, পোনপটীয়াকৈ আপোনাৰ WhatsAppলৈ।" 
      : "Every new tender, straight to your WhatsApp."
  );
  
  // 3. Update Hero rotating word
  s === "as" ? (Zi = 2, mh(2, !0)) : (Zi = 0, mh(0, !0));
  
  // 4. Update Try section state and controls
  Ot.lang = s;
  We("#lang .chip").forEach(e => e.setAttribute("aria-checked", e.dataset.v === s));
  
  // 5. Update interactive widgets
  jd.relang();    // Re-renders Atlas map centroids, hover tooltips, and status banner
  zc();           // Re-renders Try WhatsApp simulator message
  drawPrice();    // Re-renders Starter checklist in Pricing card
  drawPlans();    // Re-renders plans comparison line and blurbs
  drawFaq();      // Re-renders FAQ question list and resets chat preview
  
  // 6. Synchronize active How-It-Works caption
  _h >= 0 && (ae("#how-cap").textContent = We(".step h3")[_h].textContent);
  
  // 7. Persist to storage
  try {
    localStorage.setItem("tb-lang", s);
  } catch {}
  
  // 8. Refresh layout dimensions and scroll positions
  window.ScrollTrigger && $e.refresh();
  fv(); // Repositions the active navigation underline
}
```

### 3.4 Language Toggle Button Mechanics (`#lang-toggle`)
The button in the header is a masterclass in CSS-driven bidirectional state toggling:
```html
<button class="lang-t" id="lang-toggle" aria-pressed="false" aria-label="Switch language between English and Assamese">
  <svg>...</svg>
  <span class="as">অসমীয়া</span>
  <span class="en">English</span>
</button>
```

In `index-CKzG2lPy.css`:
```css
.lang-t[aria-pressed=false] .en,
.lang-t[aria-pressed=true] .as {
  display: none;
}
```
- **In English mode (`aria-pressed="false"`):** `.en` is hidden, so `.as` ("অসমীয়া") is shown. This invites the user to switch to Assamese.
- **In Assamese mode (`aria-pressed="true"`):** `.as` is hidden, so `.en` ("English") is shown. This invites the user to switch back to English.
- The click listener toggles between the two:
```javascript
ae("#lang-toggle").addEventListener("click", () => dv(vi === "as" ? "en" : "as"));
```

### 3.5 Numeral Converter Engine (`xr`)
Assamese and Bengali use eastern Nagari numerals. The engine contains a dedicated numeral transformation utility:
```javascript
const xr = s => String(s).replace(/\d/g, e => "০১২৩৪৫৬৭৮৯"[e]);
```
This is applied dynamically to:
- Tender counts (e.g., `2` -> `২`)
- Prices (e.g., `₹999` -> `₹৯৯৯`)
- Days remaining in bidding countdowns (e.g., `14` -> `১৪`)
- District and trade counts (e.g., `3` -> `৩`)

### 3.6 Interactive Secondary Dictionaries

| Component | Identifier | English Source | Assamese Source | Purpose |
|---|---|---|---|---|
| **WhatsApp Commands** | `commands` (`r`, `a`) | 6 command replies (`STOP`, `PAUSE`, `CHANGE`, `SAVED`, `LANGUAGE`, `PLAN`) | 6 Assamese command replies | Powers the `#fx-chat` interactive command simulator |
| **FAQ Accordion** | `ta` | 8 objects with `.q` and `.a` | 8 objects with `.qa` and `.aa` | Powers the question buttons and chat replies in `#faq` |
| **Trades Catalog** | `gh` | 6 categories (`Road`, `Building`, `Bridge`, `Water`, `Electrical`, `Supply`) | 6 categories (`পথ`, `ভৱন`, `দলং`, `পানী`, `বৈদ্যুতিক`, `যোগান`) | Notice titles with `{a}`, `{b}`, `{d}` placeholders |
| **Districts List** | `ri` | 33 districts with English names | 33 districts with Assamese names | GeoJSON coordinates + place name placeholders |
| **Live Digest Templates** | `FS` | `FS.en` greeting, buttons, last date, value, footer | `FS.as` greeting, buttons, last date, value, footer | Powers the dynamic Try WhatsApp phone (`pw[data-phone="try"]`) |
| **Plan Blurbs & Checklists** | `e`, `t`, `r`, `i` | 6 Starter features, 4 plan blurbs | 6 Assamese Starter features, 4 Assamese plan blurbs | Powers `drawPrice()` and `drawPlans()` |
| **Atlas Map UI** | `jd.relang()` | "Live in Assam...", "Choose your district...", "Live now" | "অসমত চলি আছে...", "আপোনাৰ জিলা বাছক...", "চলি আছে" | Powers map status banner `#atlas-status` and state badges |
| **Hero Rotator** | `va` | `straight` (index 0) | `পোনপটীয়াকৈ` (index 2) | Updates `#rot` immediately on language switch |

---

## 4. Navigation Dynamics & Interactive Micro-Behaviors

### 4.1 Sticky Navigation Bar (`#nav`)
The navigation bar employs smart directional hiding to maximize screen real estate:
```javascript
let s = 0;
const e = ae("#nav");
addEventListener("scroll", () => {
  const r = scrollY;
  // Hide nav when scrolling down past 500px, but only if mobile sheet is not open
  e.classList.toggle("hide", r > s + 2 && r > 500 && ae("#nav-sheet").hidden);
  // Instantly reveal nav when scrolling up
  r < s - 2 && e.classList.remove("hide");
  s = r;
  
  // Theme context awareness: dark mode over #how or #expand
  const c = [ae("#how"), ae("#expand")].some(l => {
    const h = l.getBoundingClientRect();
    return h.top < 40 && h.bottom > 40;
  });
  e.classList.toggle("dark", c);
}, { passive: !0 });
```

### 4.2 Nav Pointer Glow (`--gx`)
Moving the mouse across `#nav-in` calculates the relative horizontal position and sets a CSS custom property:
```javascript
ae("#nav-in").addEventListener("pointermove", r => {
  const a = r.currentTarget.getBoundingClientRect();
  r.currentTarget.style.setProperty("--gx", r.clientX - a.left + "px");
});
```
This drives a radial gradient specular highlight inside the frosted glass header that subtly tracks the user's cursor.

### 4.3 Desktop Active Link Indicator (`#nav-ind`)
The active indicator `#nav-ind` is an absolute pill positioned behind the active navigation link.
- **Scrollspy Detection:**
  The scroll handler checks all anchor links matching `#id`:
  ```javascript
  const a = innerHeight * 0.35;
  let o = null;
  Kd.forEach(l => {
    const h = l.getAttribute("href");
    if (!h.startsWith("#")) return;
    const u = ae(h);
    if (!u) return;
    const d = u.getBoundingClientRect();
    d.top < a && d.bottom > a && (o = l);
  });
  Kd.forEach(l => l.classList.toggle("act", l === o));
  fv();
  ```
- **Positioning Engine (`fv()`):**
  ```javascript
  function fv() {
    const s = Kd.find(e => e.classList.contains("act"));
    if (!s) {
      Tc.style.opacity = 0;
      return;
    }
    Tc.style.opacity = 1;
    Tc.style.left = s.offsetLeft + "px";
    Tc.style.width = s.offsetWidth + "px";
  }
  ```
  Whenever language changes (changing link text width), `fv()` is automatically invoked to re-anchor the pill.

### 4.4 Mobile Navigation Sheet (`#nav-menu`, `#nav-sheet`)
Mobile devices toggle a full-width overlay drawer:
- **Button State:** `#nav-menu` controls `aria-expanded` and sets the `.open` class on `#nav`. Its two child `<i>` elements rotate 45 degrees in opposite directions to form a clean close cross.
- **Drawer State:** `#nav-sheet` toggles the HTML5 `hidden` boolean attribute.
- **Auto-Dismiss:**
  - Clicking any link within the sheet automatically closes the drawer (`i(!1)`).
  - Pressing the `Escape` key closes the drawer and restores focus to `#nav-menu`.

### 4.5 Custom Cursor System (`.cursor`)
ThikBid features an ultra-smooth custom cursor with magnetic interaction hooks:
```javascript
if (!Wh || qe) return; // Disabled on touch devices (pointer:coarse) and prefers-reduced-motion
const s = ae(".cursor");
let e = innerWidth / 2, t = innerHeight / 2, n = e, i = t;

addEventListener("pointermove", r => {
  e = r.clientX;
  t = r.clientY;
  s.style.opacity = 1;
}, { passive: !0 });

// Lerp loop running at native screen refresh rate
function r() {
  n += (e - n) * 0.22; // 0.22 easing factor creates fluid momentum
  i += (t - i) * 0.22;
  s.style.transform = `translate(${n}px,${i}px) translate(-50%,-50%)`;
  requestAnimationFrame(r);
}
r();

// Expand cursor on actionable elements
document.addEventListener("pointerover", r => {
  s.classList.toggle("big", !!r.target.closest("a,button"));
});

// Magnetic pull on designated buttons
We(".magnetic").forEach(r => {
  r.addEventListener("pointermove", a => {
    const o = r.getBoundingClientRect();
    r.style.transform = `translate(${(a.clientX - o.left - o.width / 2) * 0.18}px,${(a.clientY - o.top - o.height / 2) * 0.28}px)`;
  });
  r.addEventListener("pointerleave", () => r.style.transform = "");
});
```

---

## 5. Summary of Extracted Artifacts

1. **`i18n_dictionary.json`:**
   - Saved at `C:\Users\shubh\Projects\thikbid-clone\i18n_dictionary.json`.
   - Contains:
     - Full `meta` block (locales, storage keys, digit conversion mappings).
     - Full `dom_dictionary` with **204 translation keys** across all 207 DOM elements, detailing HTML tags, English text, Assamese text, HTML occurrence counts, and alias linkages (`b2_pl`/`b2_p`, `b3_pl`/`b3_p`, `b5_pl`/`b5_p`).
     - 8 rich interactive component dictionaries (`whatsapp_commands`, `faq_accordion`, `trades_catalog`, `districts_catalog`, `whatsapp_simulator_templates`, `plans_and_pricing`, `atlas_map_ui`, `hero_rotator_words`, `system_and_accessibility`).
2. **`LANDING_PAGE_ANALYSIS.md`:**
   - Saved at `C:\Users\shubh\Projects\thikbid-clone\LANDING_PAGE_ANALYSIS.md`.
   - Comprehensive, end-to-end documentation of architecture, section design, 3D WebGL Gamusa shader, ScrollTrigger animations, i18n engine, navigation dynamics, and custom cursor physics.
