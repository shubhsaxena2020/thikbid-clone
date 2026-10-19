# ThikBid for Firms: Reverse Engineering Analysis & Architectural Specification

> **Target Platform:** [ThikBid](https://thikbid.vercel.app/)  
> **Module Focus:** `/firm` Route, Multi-Seat WhatsApp Coordination Architecture, Pricing Component (`/pricing`), Checkout Engine (`/checkout`), and Firm Dashboard (`/me/team`, `/me/insights`, `/me/billing`).  
> **Source Files Reverse Engineered:**
> - `scraped/assets/Firm-BGRUilLX.js` (`/firm` landing page)
> - `scraped/assets/Team-DIkRW21h.js` (`/me/team` dashboard view)
> - `scraped/assets/Pricing-CCRFwN09.js` (`/pricing` interactive pricing calculator)
> - `scraped/assets/Checkout-CsbxnWqh.js` (`/checkout` Razorpay payment engine)
> - `scraped/assets/CheckoutSuccess-DlcdZ2KB.js` (`/checkout/success` state & confetti)
> - `scraped/assets/Billing-B9Tw9TB4.js` (`/me/billing` subscription management)
> - `scraped/assets/Insights-C2gGe0w8.js` (`/me/insights` firm award analytics)
> - `scraped/assets/Layout-BcCEJrGz.js` (`/me` portal layout & conditional navigation)
> - `scraped/assets/ApplyForm-6XxEx1X-.js` (`ApplyForm` partner/enterprise application)
> - `scraped/assets/index-kwNebdeb.js` & `app-VGjPtK0-.js` (Router, config, and i18n dictionaries)

---

## 1. Executive Summary & Enterprise Value Proposition

ThikBid addresses the acute operational pain points of government civil, electrical, and supply contractors across India (starting with Assam and the Northeast). In high-stakes public procurement (PWD, CPWD, NHAI, GeM, Water Resources, APDCL), contractor firms typically suffer from three structural handicaps:
1. **Bidding Blind:** Contractors lack reliable historical intelligence on competitor winning margins and bidder density per district and work trade, often under-bidding into razor-thin/negative margins or losing bids by bidding too close to the estimated cost.
2. **Fragmented Team Coordination:** Tenders are monitored on desktop computers by a single clerk or owner. Crucial corrigenda (deadline postponements, BoQ revisions, EMD updates) are missed while engineers are in the field and accountants are at the bank.
3. **Software Friction:** Site engineers and proprietors resist downloading clunky desktop software, logging into complicated ERP portals, or managing corporate passwords.

### The Firm Plan Enterprise Proposition
ThikBid solves this through a **Zero-App, WhatsApp-Native Enterprise Hub**:
- **5 Synchronized WhatsApp Seats:** Extends real-time tender intelligence directly onto the personal WhatsApp chats of five key firm personnel (e.g., Managing Partner, Senior Project Engineer, Estimation Engineer, Site Supervisor, and Chief Accountant).
- **Award-Price vs. Estimate Analytics:** Unlocks empirical intelligence showing average winning bid percentages relative to government estimated cost (e.g., 91.4% in Roads & Bridges, 94.1% in Buildings, 88.7% in Water Supply) along with competing bidder density per trade.
- **Automated Eligibility Engine ("Do I Qualify?"):** Pre-evaluates complex tender notices against the firm's contractor registration class (Class I/II/III), annual turnover band, and experience criteria.
- **Partner & Joint-Venture Directory:** Enrolls the firm into ThikBid's verified contractor network for joint ventures and sub-contracting on mega-tenders exceeding individual capacity.

---

## 2. Reverse Engineering the `/firm` Route (`Firm-BGRUilLX.js`)

The `/firm` route is ThikBid's dedicated enterprise B2B sales and onboarding funnel.

### 2.1 Hero Section
- **Badge/Kicker:** `span.label-mono` displaying `"firm.label"` (*"Firm plan"*).
- **Headline:** `h1.text-[clamp(36px,6vw,72px)].font-bold`
  - Text: `s("firm.h_a")` (*"One team."*) + `em.serif-em.text-red` `s("firm.h_b")` (*"Every tender."*).
- **Sub-headline (Lede):** `p.text-[17px].text-ink-2`
  - *"Your engineers, accountant and partners get the same tender alerts on their own WhatsApp — plus award-price history to price your bids better."*
- **Call-to-Action Group:**
  - **Primary Button:** Links to `/pricing` (`Button` with `asChild`, size `lg`), dynamically interpolating the monthly plan fee from the loaded configuration:
    ```tsx
    s("firm.see_price", { price: firmPlan ? `₹${firmPlan.monthly.toLocaleString("en-IN")}` : "" })
    // Output: "Firm plan · ₹9,999/month"
    ```
    Accompanied by an `ArrowRight` icon (`j`).
  - **Secondary Anchor:** Smooth-scroll link `<a href="#talk">` with text `"firm.talk"` (*"Talk to us →"*).

### 2.2 Interactive Award-Price Analytics Preview Card
Mounted inside a responsive 2-column layout (`md:grid-cols-[1.1fr_1fr] md:items-center`), the hero card serves as high-converting visual proof of ThikBid's empirical data advantage:
- **Card Styling:** Deep maroon background (`bg-maroon p-6 text-cotton rounded-[26px] overflow-hidden relative`).
- **Border Beam Animation:** Rendered via `BorderBeam` (`border-beam-cw-PDHoW.js`):
  ```tsx
  <BorderBeam size={140} duration={8} colorFrom="#ECBAC0" colorTo="#B91F2B" />
  ```
- **Top Bar:** 
  - Monospace label: `"firm.preview"` (*"Award price vs estimate"* in `cotton/60`).
  - Badge: Uppercase pill `"firm.sample"` (*"SAMPLE"* in `bg-white/10 px-2.5 py-1 text-[10px]`).
- **Primary KPI (Animated Metric):**
  - Large display typography: `font-display text-[56px] font-bold leading-none`.
  - Driven by `NumberTicker` (`number-ticker-DGmSGdrm.js`): `value={92.6}`, `decimalPlaces={1}`, formatted as `92.6%`.
  - Subtitle: `"firm.of_estimate"` (*"average winning bid, of estimate"*).
- **Trade-by-Trade Winning Price Bars:**
  Enclosed in a nested paper container (`bg-cotton p-4 rounded-2xl text-maroon grid gap-3`):
  ```typescript
  const sampleData = [
    ["firm.sample_roads", 91.4, 6.2],       // Roads & bridges: 91.4% win price, 6.2 bidders
    ["firm.sample_buildings", 94.1, 4.8],   // Buildings: 94.1% win price, 4.8 bidders
    ["firm.sample_water", 88.7, 7.5],       // Water supply: 88.7% win price, 7.5 bidders
    ["firm.sample_power", 96.2, 3.1],       // Electrical: 96.2% win price, 3.1 bidders
  ];
  ```
  Rendered using the `Bar` component (`index-CV0BFnfs.js`):
  - `label`: Trade title.
  - `value`: `pct - 80` (normalized to an 80%–100% display window).
  - `max`: `20`.
  - `right`: `"{pct}% · {bidders} bidders"`.

### 2.3 Feature Pillars (3-Column Grid)
Mounted via `BlurFade` with staggered delays (`delay={n * 0.06}`):
1. **Pillar 1: Team Seats on WhatsApp**
   - Icon: `UsersRound` (`_`) in `text-red size-7`.
   - Title: `firm.f1_h` (*"Team seats on WhatsApp"*).
   - Description: `firm.f1_p` (*"{seats} people in your firm get alerts, details and reminders on their own phones. Add or remove seats any time."* where seats default to 5).
2. **Pillar 2: Award-Price Analytics**
   - Icon: `ChartColumn` (`B`) in `text-red size-7`.
   - Title: `firm.f2_h` (*"Award-price analytics"*).
   - Description: `firm.f2_p` (*"See how far below estimate work is won in your districts and trades, and how many firms usually bid."*).
3. **Pillar 3: Partner Listing**
   - Icon: `BadgeCheck` (`N`) in `text-red size-7`.
   - Title: `firm.f3_h` (*"Partner listing"*).
   - Description: `firm.f3_p` (*"Be listed for joint ventures and sub-contracts when other ThikBid firms look for partners."*).

### 2.4 Enterprise Inbound Form ("Talk to Us")
Enclosed in section `#talk` with cultural Assamese branding:
- **Header:** Message icon + `s("firm.form_h")` (*"Talk to us"* / *"আমাৰ সৈতে কথা পাতক"* / *"हमसे बात करें"*).
- **Gamusa Accent:** `<div className="gamusa-thin" />` (traditional Assamese red-and-white woven geometric pattern).
- **Form Component:** Rendered by `ApplyForm` (`ApplyForm-6XxEx1X-.js`) with properties:
  ```tsx
  <ApplyForm defaultKind="firm" lockKind={true} />
  ```
  - Fields: Full Name (`name`), Firm/Organization (`org`), WhatsApp Phone (`phone`), Email (`email`), Primary District (`district`), Message/Requirements (`message`).
  - Submission Endpoint: `POST /api/public/partners` with payload:
    ```json
    {
      "name": "Pranab Barua",
      "org": "Barua Infra Projects Pvt Ltd",
      "phone": "9864012345",
      "email": "pbarua@baruainfra.in",
      "district": "Kamrup Metropolitan",
      "kind": "firm",
      "message": "Looking for 5 seats for our engineering and bidding team in Guwahati."
    }
    ```
  - Success State: Shows `CircleCheck` with `apply.done_h` (*"Thank you"*) and `apply.done_p`.

---

## 3. Multi-Seat WhatsApp Coordination Architecture (`Team-DIkRW21h.js`)

The firm team management interface is hosted at `/me/team`.

```
                    ┌──────────────────────────────────────────────┐
                    │               Firm Owner / Admin              │
                    │         (Dashboard: /me/team & Billing)      │
                    └──────────────────────┬───────────────────────┘
                                           │
                        Generates WhatsApp Join Deep-Link
                     (e.g., https://wa.me/919387854327?text=JOIN-XYZ)
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│ Managing Partner │             │  Site Engineer   │             │ Chief Accountant │
│  (WhatsApp App)  │             │  (WhatsApp App)  │             │  (WhatsApp App)  │
└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘
         │                                 │                                 │
         │ Receives Daily                  │ Receives Daily                  │ Receives Daily
         │ Digests, Instant                │ Technical Summaries,            │ EMD/Tender Fees,
         │ High-Value Alerts               │ BoQ, Corrigenda                 │ Deadlines, Reminders
         │                                 │                                 │
         └─────────────────────────────────┴─────────────────────────────────┘
                                           │
                                 WhatsApp Business API
                              (ThikBid Cloud Engine / Webhook)
```

### 3.1 Data Model: `/api/me/team`
When `/me/team` mounts, it invokes `R("/api/me/team")`. The returned JSON contract:
```typescript
interface TeamResponse {
  firm: {
    id: string;
    name: string;
    gstin?: string;
    seats: number;         // Fixed to 5 on Firm plan
    isOwner: boolean;      // Whether active session belongs to firm creator
    joinLink: string;      // WhatsApp deep-link URL containing token
  } | null;
  members: Array<{
    id: string;
    name: string | null;
    phone_last4: string;   // Masked phone for privacy
    firm_role: "owner" | "member";
    status: "active" | "invited" | "paused";
    last_digest: string | null; // ISO timestamp
  }>;
  recent?: Array<{         // Outbound message log for auditing (Owner only)
    name: string | null;
    phone_last4: string;
    sent_at: string;
    body: string;
  }>;
}
```

### 3.2 State & Gatekeeping
1. **Unsubscribed / Non-Firm State:**
   If `!(data?.firm)`, the route renders `EmptyState` (`z`):
   - Icon: `UsersRound`
   - Title: `s("me.team_none_h")` (*"You're not part of a firm yet"*)
   - Description: `s("me.team_none_p")` (*"The Firm plan gives 5 people in your firm their own WhatsApp alerts."*)
   - Action: Button linking to `/firm` (`s("me.team_learn")`).
2. **Subscribed Firm State:**
   Renders a 3-part or 4-part management grid:
   - Firm Metadata Card
   - Seats Allocation & WhatsApp Invite Card
   - Members List Card
   - Team Digest Activity Log (Owner-only)

### 3.3 The WhatsApp Invite Flow
Instead of sending email invitations requiring passwords, ThikBid leverages zero-friction WhatsApp deep-linking:
1. **Deep Link Construction:**
   The backend generates a secure token-bound join link:
   ```
   https://wa.me/919387854327?text=Hi%20ThikBid%20[join-barua-7f39b1]
   ```
2. **Owner Sharing Actions:**
   - **Copy Link Component (`G`):** One-click clipboard copy of `n.joinLink`.
   - **Native WhatsApp Share (`q`):** Triggers `whatsapp://send?text=...` with preformatted invite text:
     ```
     Join Barua Infra on ThikBid to get our tender alerts on WhatsApp: https://wa.me/919387854327?text=Hi%20ThikBid%20[join-barua-7f39b1]
     ```
3. **Teammate Onboarding (1-Tap):**
   - The recipient taps the link on WhatsApp, opening a direct chat with ThikBid.
   - Sending the pre-filled message triggers the backend WhatsApp webhook router:
     1. Verifies the join token against active firm records.
     2. Checks seat capacity (`members.length < firm.seats`).
     3. Binds the sender's phone number as a `member` of the firm.
     4. Synchronizes tender alert delivery to their phone number.
4. **Seat Utilization Display:**
   - Monitored by Radix Progress bar (`te`):
     ```tsx
     <Progress value={(members.length / firm.seats) * 100} className="h-2.5 [&>*]:bg-red" />
     ```
   - Title reads: `s("me.seats_h", { used: members.length, total: firm.seats })` (e.g., *"3 of 5 seats used"*).

### 3.4 Member Governance & Role-Based Access Control (RBAC)
- **Firm Owner:**
  - Can modify Firm Name and GSTIN (with auto-uppercase formatting, e.g. `18ABCDE1234F1Z5`), saved via `PUT /api/me/team`.
  - Can view the invite link and share it.
  - Can remove members via `DELETE /api/me/team/:memberId` (calling `UserMinus` button).
  - Can inspect the outbound WhatsApp digest log for all members.
  - Distinguishable by a golden `Crown` icon (`Z`) next to their name.
- **Teammates (`member` role):**
  - Read-only dashboard view: *"You get your firm's tender alerts on your own WhatsApp."*
  - Cannot modify firm metadata or delete other team members.

### 3.5 Outbound Audit Log ("Recent Team Digests")
When `n.isOwner` and `recent.length > 0`, the dashboard surfaces an activity audit trail:
- Displays recipient identifier (`r.name || "••••" + r.phone_last4`).
- Shows exact time sent (`B(r.sent_at, true)`).
- Truncated message body preview (`r.body.slice(0, 400)`), verifying what tenders each engineer was alerted to.

---

## 4. Interactive Pricing Component & Fee Tiers (`Pricing-CCRFwN09.js`)

The `/pricing` route hosts ThikBid's pricing engine.

### 4.1 Billing Cycle Logic & Discount Engine
A segmented controller toggles between `"monthly"` and `"yearly"`:
```typescript
const cyclePrice = (plan) => cycle === "yearly" ? plan.yearly : plan.monthly;
const discountPct = (plan) =>
  plan.monthly && plan.yearly
    ? Math.round((1 - plan.yearly / (plan.monthly * 12)) * 100)
    : 0;
```
For yearly billing:
- Calculates up to **33% savings** (`pricing.save_upto`).
- Displays monthly amortized price: `Math.round(plan.yearly / 12).toLocaleString("en-IN")`.
- Highlights badge: `"Save {pct}% · ₹{m} a month"`.

### 4.2 Comprehensive 4-Tier Breakdown

| Parameter | Free (`free`) | Starter (`starter`) | Pro (`pro`) *(Most Picked)* | Firm (`firm`) |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly Fee** | **₹0** | **₹999** | **₹2,499** | **₹9,999** |
| **Yearly Fee** | **₹0** | **₹7,999** *(₹667/mo)* | **₹23,999** *(₹2,000/mo)* | **₹95,999** *(₹8,000/mo)* |
| **Effective Discount** | None | 33% | 20% | 20% |
| **Free Trial** | None (Permanent) | 14 Days Free (No Card) | None | None |
| **WhatsApp Seats** | **1 seat** | **1 seat** | **1 seat** | **5 seats** |
| **Digest Cadence** | Weekly | Daily at 7:00 AM | Daily at 7:00 AM | Daily at 7:00 AM |
| **Trade Coverage** | 1 Trade | Up to 3 Trades | Up to 8 Trades | Up to 12 Trades |
| **District Coverage**| 1 District | Up to 3 Districts | Up to 12 Districts | All Districts (Statewide) |
| **Nearby Radius** | None (0 km) | 50 km | 150 km | 400 km |
| **"Do I Qualify?"** | ❌ Disabled | ✅ Enabled | ✅ Enabled | ✅ Enabled (All Seats) |
| **Deadline Reminders**| ❌ Disabled | ✅ (3 days & 1 day) | ✅ (3 days & 1 day) | ✅ (All 5 Seats) |
| **Instant Alerts** | ❌ Disabled | ❌ Disabled | ✅ Instant Delivery | ✅ Instant Delivery |
| **Corrigenda Tracking**| ❌ Disabled | ❌ Disabled | ✅ Immediate Alerts | ✅ Immediate Alerts |
| **Saved Tenders** | ❌ Disabled | ✅ Enabled | ✅ Enabled | ✅ Firm Shared Shortlist|
| **Award Analytics**| ❌ Disabled | ❌ Disabled | ❌ Disabled | ✅ Full Intelligence |
| **Partner Directory**| ❌ Disabled | ❌ Disabled | ❌ Disabled | ✅ Listed for JVs |
| **Target User** | Entry-level bidder | Owner-run contractor | Expanding contractor | Engineering firm / JV |

### 4.3 Feature Comparison Table Matrix
Generated programmatically from configuration metadata:
```typescript
const rows = [
  ["pricing.r_cadence", (p) => p.cadence === "daily" ? "Daily 7 AM" : "Weekly"],
  ["pricing.r_trades", (p) => p.trades],
  ["pricing.r_districts", (p) => p.districts > 100 ? "All in state" : p.districts],
  ["pricing.r_radius", (p) => p.radiusKm ? `${p.radiusKm} km` : false],
  ["pricing.r_elig", (p) => p.eligibility],
  ["pricing.r_reminders", (p) => p.reminders],
  ["pricing.r_instant", (p) => p.instant],
  ["pricing.r_corr", (p) => p.corrigendum],
  ["pricing.r_saved", (p) => p.saved],
  ["pricing.r_analytics", (p) => p.analytics],
  ["pricing.r_seats", (p) => p.seats],
];
```
- Boolean values render as a green checkmark (`Check` in `text-ok`) or subtle dash (`Minus` in `text-ink-3`).
- Numeric and text values render cleanly in tabular cells.

### 4.4 WhatsApp Payment Alternative ("How to Pay")
For contractors uncomfortable checking out on the web, ThikBid offers a conversational payment alternative:
> *"How to pay: open WhatsApp and send PLAN to ThikBid — we'll reply with your secure payment link. No form, no password."*

---

## 5. Checkout & Payment Engine (`Checkout-CsbxnWqh.js`, `CheckoutSuccess-DlcdZ2KB.js`, `Billing-B9Tw9TB4.js`)

ThikBid features a resilient dual-mode payment pipeline supporting both live Razorpay transactions and a built-in test-mode simulator for QA and offline evaluations.

```
                    ┌────────────────────────────┐
                    │  User navigates to         │
                    │  /checkout?plan=firm       │
                    └─────────────┬──────────────┘
                                  │
                       Is user authenticated?
                        (Check GET /api/me)
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
                 [ YES ]                      [ NO ]
                    │                           │
          Display Plan & Order          Display SignInPanel
          Summary (with GST)            with OTP Step Guide
                    │                           │
         User clicks "Pay ₹9,999"               ▼
                    │                  User enters phone &
                    ▼                  verifies WhatsApp link
           POST /api/pay/order                  │
                    │                           │
       Is test mode active?                     │
       (modes.payments != 'live')               │
          ┌─────────┴─────────┐                 │
          ▼                   ▼                 │
       [ YES ]             [ NO ]               │
          │                   │                 │
    Render In-App      Load Razorpay SDK        │
   Payment Simulator  (checkout.razorpay.com)   │
   (Simulate Pass/Fail)       │                 │
          │             User completes UPI/Card │
          │                   │                 │
          │           POST /api/pay/verify      │
          └─────────┬─────────┘                 │
                    ▼                           │
       Navigate to /checkout/success            │
                    │                           │
         Poll payment status (2.5s)             │
                    │                           │
         Status === 'paid'                      │
                    │                           │
        - Confetti Animation                    │
        - WhatsApp Link Button                  │
        - Download GST Tax Invoice PDF          │
        - Update /me/billing & /me/team ◄───────┘
```

### 5.1 Checkout State Machine
- **Route Query Params:** `plan` (`"starter" | "pro" | "firm"`), `cycle` (`"monthly" | "yearly"`), `pid` (payment ID to resume).
- **Authentication Check:**
  - Invokes `c("/api/me")`. If 401 Unauthenticated, embeds `SignInPanel` (`Login-BeO6zsgn.js`) with 3 instructions:
    1. *"Open your ThikBid chat on WhatsApp"*
    2. *"Send the word PROFILE"*
    3. *"Tap the new link — it works once, for 30 minutes"*
- **Order Creation:**
  Calls `POST /api/pay/order` with payload:
  ```json
  { "plan": "firm", "cycle": "monthly" }
  ```
  Returns:
  ```json
  {
    "keyId": "rzp_live_xxxxxxxxxxxx",
    "order": {
      "id": "order_OD91k2Jaks8",
      "amount": 999900,
      "currency": "INR"
    },
    "payment": { "id": "pay_rec_838291" },
    "test": false
  }
  ```

### 5.2 Razorpay Integration & Verification
- **Dynamic Script Injection (`ie`):** Injects `https://checkout.razorpay.com/v1/checkout.js` on demand.
- **Prefill Configuration:** Automatically loads the user's phone from `/api/me/phone`.
- **Payment Verification:**
  On Razorpay success handler:
  ```typescript
  await c("/api/pay/verify", {
    body: {
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature,
    },
  });
  navigate(`/checkout/success?pid=${payment.id}`);
  ```
- **Failure Logging:**
  Listens to `payment.failed` event and reports to `POST /api/pay/failed` with `orderId` and error `description`.

### 5.3 Test Mode Simulator
When running in staging or development (`modes.payments !== "live"`), the checkout UI presents sandbox buttons:
- Button: `"Simulate Success"` (`co.sim_ok`) -> Calls `POST /api/pay/test-complete` with `{ paymentId, fail: false }`.
- Button: `"Simulate Failure"` (`co.sim_fail`) -> Calls `POST /api/pay/test-complete` with `{ paymentId, fail: true }`.

### 5.4 Checkout Success State (`CheckoutSuccess-DlcdZ2KB.js`)
1. **Status Polling:** Polls `GET /api/pay/payment/:pid` (or `/api/pay/latest`) every 2,500ms until status transitions to `paid` or reaches a 60-second timeout.
2. **Confetti Burst:** Launches multi-stage canvas confetti using ThikBid's brand palette:
   ```typescript
   const colors = ["#B91F2B", "#F5D5D7", "#34111A", "#F6EFE4", "#00A884"];
   confetti({ particleCount: 120, spread: 80, origin: { y: 0.35 }, colors });
   ```
3. **Actions:**
   - WhatsApp Return Button: `<Button variant="wa" tag="paid">` opening WhatsApp.
   - GST Invoice PDF Download: `<a href="/api/me/invoices/${payment.id}">` displaying formal invoice number (e.g., `TB-2026-0492`).
   - Portal Access Link: Navigate to `/me`.

### 5.5 Subscription Lifecycle Management (`Billing-B9Tw9TB4.js`)
Hosted at `/me/billing`, managing ongoing memberships:
- **Current Plan Status Banner:**
  - Displays plan title (`Firm`, `Pro`, `Starter`) and trial badge if applicable.
  - Expiry/Renewal date calculation: `me.renews_on` or `me.ends_on` if scheduled to cancel.
  - "Pay Ahead" button linking to `/checkout?plan=${plan}&cycle=${cycle}`.
- **Invoice Table:**
  - Columns: Date, Plan & Cycle, Amount INR, Status (`paid`, `failed`, `created`, `refunded`), Invoice Action (PDF link or "Pay now" link for pending invoices).
- **Cancellation Flow:**
  - Uses `AlertDialog` (`alert-dialog-CWqEdwd0.js`).
  - Calls `POST /api/me/billing/cancel`. Subscriptions remain active until the end of the paid period (`cancel_at_period_end: true`).

---

## 6. Firm Dashboard Structure & Component Hierarchy

### 6.1 Routing & Layout Hierarchy (`Layout-BcCEJrGz.js`)

```
App Router
└── Route /me (Layout-BcCEJrGz.js)
    ├── [Tab 1] /me               -> Overview-581tIcTw.js (Tender matches & counts)
    ├── [Tab 2] /me/profile       -> Profile-CqJpSF4d.js (Work trades, districts, limits)
    ├── [Tab 3] /me/saved         -> Saved-8l-MLHwl.js (Saved tenders & notes)
    ├── [Tab 4] /me/billing       -> Billing-B9Tw9TB4.js (Invoices & subscription)
    │
    │   ── Gated Firm Tabs (Unlocks when user.plan === 'firm' or user.firm exists) ──
    ├── [Tab 5] /me/team          -> Team-DIkRW21h.js (5-Seat WhatsApp Hub)
    └── [Tab 6] /me/insights      -> Insights-C2gGe0w8.js (Award-Price Analytics)
```

In `Layout-BcCEJrGz.js`, navigation tabs are dynamically computed based on `data.me`:
```typescript
const navTabs = useMemo(() => {
  const tabs = [
    ["/me", "me.tab_home", HouseIcon],
    ["/me/profile", "me.tab_profile", UserIcon],
    ["/me/saved", "me.tab_saved", BookmarkIcon],
    ["/me/billing", "me.tab_billing", ReceiptIcon],
  ];
  if (me?.firm || me?.plan === "firm") {
    tabs.push(["/me/team", "me.tab_team", UsersRoundIcon]);
  }
  if (me?.plan === "firm") {
    tabs.push(["/me/insights", "me.tab_insights", ChartColumnIcon]);
  }
  return tabs;
}, [me]);
```
Tabs feature a spring-animated active indicator pill (`layoutId="me-tab"`) via Framer Motion.

---

### 6.2 Firm Analytics Portal (`Insights-C2gGe0w8.js`)

When a Firm user navigates to `/me/insights`, the frontend calls `GET /api/me/insights`.

#### Access Gating
If a non-firm user requests `/api/me/insights`, the backend returns HTTP 402 Payment Required:
- Renders an empty state with a `Lock` icon:
  - Title: `me.insights_locked_h` (*"Award analytics is part of the Firm plan"*)
  - Description: `me.insights_locked_p` (*"See how far below estimate tenders are won in your districts, and how many firms bid."*)
  - CTA Button: Links to `/firm`.

#### Dashboard Widgets
When authenticated as a Firm subscriber:
1. **Top KPI Summary Strip (4 Cards):**
   - **Total Awards Analyzed (`i_awards`):** e.g., `1,428`
   - **Average Win % (`i_avg`):** e.g., `92.4%` (of estimate)
   - **Median Win % (`i_median`):** e.g., `93.1%` (of estimate)
   - **Average Bidders (`i_bidders`):** e.g., `5.4` competing contractors per tender
2. **Trade Benchmark Breakdown (`i_by_trade`):**
   Horizontal comparative progress bars showing average win percentage and bidder density per trade (Roads, Buildings, Bridges, Embankment, Water Supply, Electrical).
3. **District Benchmark Breakdown (`i_by_district`):**
   Maroon progress bars illustrating geographic margin variations across districts (Kamrup, Nagaon, Dibrugarh, Cachar, Sonitpur, Jorhat).
4. **Win Margin Distribution Histogram (`i_spread`):**
   Interactive CSS bar chart distributing awards into 5% increment buckets:
   `<70%`, `70–75%`, `75–80%`, `80–85%`, `85–90%`, `90–95%`, `95–100%`, `100–105%`, `105–110%`, `>110%`.
5. **Recent Award Disclosures Table (`i_recent`):**
   - Columns: Work Title, District, Estimate (INR), Awarded Amount (INR), Winning Ratio (`Awarded / Estimate * 100`), Award Date.

---

## 7. Data Models & API Contracts

### 7.1 Database Schema (PostgreSQL / Supabase Migration)

```sql
-- 1. Subscription Plans Table
CREATE TABLE plans (
  id VARCHAR(32) PRIMARY KEY, -- 'free', 'starter', 'pro', 'firm'
  name VARCHAR(64) NOT NULL,
  monthly_inr INTEGER NOT NULL,
  yearly_inr INTEGER NOT NULL,
  seats INTEGER NOT NULL DEFAULT 1,
  trades_limit INTEGER NOT NULL,
  districts_limit INTEGER NOT NULL,
  radius_km INTEGER NOT NULL DEFAULT 0,
  cadence VARCHAR(16) NOT NULL, -- 'weekly', 'daily'
  eligibility BOOLEAN NOT NULL DEFAULT FALSE,
  reminders BOOLEAN NOT NULL DEFAULT FALSE,
  instant_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  corrigendum_alerts BOOLEAN NOT NULL DEFAULT FALSE,
  saved_tenders BOOLEAN NOT NULL DEFAULT FALSE,
  analytics BOOLEAN NOT NULL DEFAULT FALSE,
  blurb TEXT,
  features JSONB NOT NULL DEFAULT '[]'
);

-- 2. Contractor Firms Table
CREATE TABLE firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  gstin VARCHAR(15),
  seats INTEGER NOT NULL DEFAULT 5,
  join_token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Firm Team Members Table
CREATE TABLE firm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'member', -- 'owner', 'member'
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'invited', 'paused'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_digest_at TIMESTAMPTZ,
  CONSTRAINT unique_firm_user UNIQUE (firm_id, user_id)
);

-- 4. Payments & Invoices Table
CREATE TABLE payments (
  id VARCHAR(64) PRIMARY KEY, -- 'pay_xxxx' or UUID
  user_id UUID NOT NULL REFERENCES users(id),
  firm_id UUID REFERENCES firms(id),
  plan_id VARCHAR(32) NOT NULL REFERENCES plans(id),
  cycle VARCHAR(16) NOT NULL, -- 'monthly', 'yearly'
  amount_inr NUMERIC(10, 2) NOT NULL,
  gst_inr NUMERIC(10, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'created', -- 'created', 'paid', 'failed', 'refunded'
  invoice_no VARCHAR(64) UNIQUE,
  razorpay_order_id VARCHAR(128),
  razorpay_payment_id VARCHAR(128),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Outbound Team Message Audit Log
CREATE TABLE firm_digests_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_type VARCHAR(32) NOT NULL, -- 'daily_digest', 'instant_alert', 'corrigendum'
  body TEXT NOT NULL
);

-- 6. Award Price Analytics Disclosures
CREATE TABLE tender_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id),
  title TEXT NOT NULL,
  district VARCHAR(64) NOT NULL,
  trade VARCHAR(64) NOT NULL,
  estimate_inr NUMERIC(14, 2) NOT NULL,
  awarded_inr NUMERIC(14, 2) NOT NULL,
  winning_ratio NUMERIC(5, 2) GENERATED ALWAYS AS (ROUND((awarded_inr / estimate_inr) * 100, 2)) STORED,
  bidders_count INTEGER NOT NULL DEFAULT 1,
  winner_name TEXT,
  awarded_at DATE NOT NULL
);
```

---

## 8. 1:1 Clone Implementation Plan for Agent Swarm

To replicate this functionality with complete fidelity:

### Component Construction Matrix
1. **`/firm` Landing Route:**
   - Scaffold `src/routes/Firm.tsx` replicating `Firm-BGRUilLX.js`.
   - Incorporate `BorderBeam`, `NumberTicker`, and `BlurFade` from UI primitives.
   - Embed `ApplyForm` locking `defaultKind="firm"`.
2. **Multi-Seat Team Dashboard (`/me/team`):**
   - Scaffold `src/routes/me/Team.tsx` replicating `Team-DIkRW21h.js`.
   - Implement WhatsApp deep-link generation logic (`https://wa.me/{phone}?text=...`).
   - Implement seat allocation progress indicator and delete/removal actions.
3. **Interactive Pricing Engine (`/pricing`):**
   - Scaffold `src/routes/Pricing.tsx` replicating `Pricing-CCRFwN09.js`.
   - Populate static plan structures (`free`, `starter`, `pro`, `firm`) matching reverse-engineered values.
   - Implement monthly/yearly discount calculation with 18% GST notices.
4. **Payment & Checkout Flow (`/checkout`, `/checkout/success`):**
   - Scaffold `src/routes/Checkout.tsx` and `src/routes/CheckoutSuccess.tsx`.
   - Mount Razorpay Checkout JS script with fallback to `PaymentSimulator`.
   - Integrate Canvas Confetti on payment completion.
5. **Firm Analytics Engine (`/me/insights`):**
   - Scaffold `src/routes/me/Insights.tsx` replicating `Insights-C2gGe0w8.js`.
   - Implement 402 HTTP gating for non-firm users.
   - Build histogram distribution buckets and trade/district comparison bars.
6. **Backend WhatsApp Webhook Integration:**
   - Wire WhatsApp Bot command parser to recognize team join tokens (`Hi ThikBid [join-token]`), auto-enrolling the sender into the corresponding contractor firm.
