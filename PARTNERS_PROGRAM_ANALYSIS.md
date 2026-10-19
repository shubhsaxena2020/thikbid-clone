# ThikBid Partner Programme (/partners) Reverse Engineering Analysis

## 1. Executive Summary & Program Architecture

ThikBid features a dedicated B2B partner affiliate program designed specifically for **tax accountants, bid consultants, and contractor associations** across Assam and Northeast India. Because government contractors in India rely heavily on their local accountants and district contractor associations for GST compliance, balance-sheet certifications, and tender portal filings, ThikBid leverages these trusted intermediaries as distribution nodes.

### Dual-Referral System Distinction
A critical architectural discovery in the ThikBid codebase is the distinction between two completely separate referral mechanisms:

| Dimension | User Referral ("Refer a Friend") | Partner Affiliate Programme |
| :--- | :--- | :--- |
| **Target User** | Active individual contractors | Accountants, associations, bid consultants, firms |
| **Entry Point** | Dashboard `/me` (`Home-BrZumTM3.js`) | Public landing page `/partners` (`Partners-BKKats4-.js`) |
| **Incentive** | 30 Free Days ("one month free") | **20% Recurring Cash Commission** on all payments |
| **Duration** | One-time bonus per paying referral | **12 Months** from subscriber join date |
| **Payout Channel** | Account subscription extension (`rewardDays`) | Direct monthly cash transfer via **UPI** |
| **Admin Route** | Viewable under `/admin/subscribers` | Dedicated `/admin/partners` (`Partners-Bpf6_S_U.js`) |
| **Attribution Tag** | User referral code (`?ref=USER`) | Partner code (`?ref=PARTNER`) + QR physical poster |

---

## 2. Reverse Engineering The Source Modules

### 2.1 Public Partner Portal: `Partners-BKKats4-.js`
- **Route**: `/partners`
- **Container**: `PageShell` (`wC`), providing global navigation (`Header`) and site footer (`Footer`).
- **Dependencies**: Lucide icons (`Calculator`, `Link2`, `Users`, `BadgeCheck`, `MessageCircle`, `IndianRupee`), `BlurFade` motion wrapper, `DotPattern` background SVG, `ApplyForm` component (`ApplyForm-6XxEx1X-.js`).
- **Structure**:
  1. **Hero Section**:
     - Background: `<DotPattern width={22} height={22} cr={1.1} className="text-maroon/15 [mask-image:radial-gradient(60%_80%_at_20%_0%,#000_30%,transparent_100%)]" />`
     - Two-column responsive grid (`md:grid-cols-[1.2fr_1fr] md:items-end`).
     - Left column:
       - Pill label: `<span className="label-mono">Partner programme</span>`
       - Heading 1: `Help your contractors <em className="serif-em text-red">win more work.</em>`
       - Lede: `"Accountants, bid consultants and contractor associations already help small firms with tenders. Give them ThikBid and earn on every paying member."`
     - Right column (Audience Segmentation Cards):
       - **Accountants Card**:
         - Icon: `Calculator` (color `#B91F2B` / `text-red`)
         - Title: `"Accountants"`
         - Subtitle: `"You file bids for clients — now nothing slips past."`
       - **Associations Card**:
         - Icon: `Users` (color `#B91F2B` / `text-red`)
         - Title: `"Associations"`
         - Subtitle: `"A member benefit that pays for itself."`
  2. **How It Works (4-Step Funnel)**:
     - Section Heading: `"How it works"` (`partners.how`)
     - Responsive 4-card grid (`md:grid-cols-4`, staggered `BlurFade` delay `a * 0.06s`):
       - **Step 1: Apply** (Icon: `BadgeCheck`, Watermark: `1`)  
         `"Fill the form below. We approve partners within two days."`
       - **Step 2: Get your link** (Icon: `Link2`, Watermark: `2`)  
         `"You get a personal code and link (thikbid.in/?ref=YOURCODE) and a QR poster."`
       - **Step 3: Contractors say Hi** (Icon: `MessageCircle`, Watermark: `3`)  
         `"They open the link, say Hi on WhatsApp and are tagged to you automatically."`
       - **Step 4: Earn every month** (Icon: `IndianRupee`, Watermark: `4`)  
         `"You earn a share of every payment from people who joined through you."`
     - Watermark styling: `<span className="absolute -top-3 right-3 font-display text-[64px] font-bold text-cotton-2">1..4</span>`.
  3. **Commission Highlight Banner**:
     - Container: `rounded-[22px] bg-maroon p-6 text-cotton md:flex md:items-center md:justify-between md:gap-6`
     - Callout text: `<p className="font-display text-2xl font-bold">20% of every payment, for 12 months.</p>`
     - Payout details: `<p className="mt-2 max-w-xl text-cotton/75 md:mt-0">Paid monthly by UPI. Track sign-ups and payments with us any time.</p>`
  4. **Application Section**:
     - Heading: `"Become a partner"` (`partners.apply`)
     - Card container: `paper mt-6 overflow-hidden`
     - Header flourish: `<div className="gamusa-thin" />` (Assamese red-and-white handloom border)
     - Form: `<ApplyForm defaultKind="accountant" />`

---

### 2.2 Application Form Component: `ApplyForm-6XxEx1X-.js`
- **Exported Symbols**:
  - `A`: Form component `ApplyForm({ defaultKind = "accountant", lockKind = false })`
  - `B`: Lucide icon `BadgeCheck`
- **Internal Form State**:
  ```ts
  interface FormState {
    name: string;
    org: string;
    phone: string;
    email: string;
    district: string;
    kind: "accountant" | "association" | "firm" | "other";
    message: string;
  }
  ```
- **Validation Rules**:
  ```js
  if (!s.name.trim() || (!s.phone.trim() && !s.email.trim())) {
    setError(t("apply.need")); // "Please give your name and a phone or e-mail."
    return;
  }
  ```
  - `name`: Compulsory (HTML5 `required={true}`, non-empty after `trim()`).
  - Contact Rule: At least **one** valid contact channel is required (`phone.trim()` OR `email.trim()`).
  - `kind`: Defaults to `"accountant"`, options: `accountant`, `association`, `firm`, `other`. Hidden/locked if `lockKind === true`.
  - District: Optional text field (e.g. "Nagaon", "Kamrup Metro").
  - Message: 4-row textarea with placeholder `"How many contractors do you work with? Which districts?"`.
- **API Endpoint**:
  - `POST /api/public/partners`
  - Body: JSON serialized `FormState`.
- **States**:
  - **Idle / Input**: Standard input fields with clean labels.
  - **Submitting**: Submit button disabled, label changed to `state.loading` ("Loading...").
  - **Error Alert**: `<p className="rounded-xl bg-blush px-3 py-2 text-sm text-red-2" role="alert">{error}</p>`.
  - **Success / Done**:
    - Replaces form contents completely.
    - Icon: `CircleCheck` inside `size-14 rounded-2xl bg-ok-bg text-ok`.
    - Title: `"Thank you!"` (`apply.done_h`).
    - Subtitle: `"We'll call or WhatsApp you within two working days."` (`apply.done_p`).
  - **Privacy Guarantee**:
    - `"We use these details only to reply to you."` (`apply.privacy`).

---

### 2.3 Admin Partner Management Portal: `Partners-Bpf6_S_U.js`
- **Route**: `/admin/partners`
- **Component**: `Q()`
- **API Endpoints**:
  - `GET /api/admin/partners` -> loads `{ items: PartnerRecord[] }`
  - `PUT /api/admin/partners/${id}` -> updates status and commission rate
  - `POST /api/admin/partners/${id}/reveal` -> returns `{ phone: string }`
- **Tabs / Status Filter**:
  - Filter state: `"new" | "approved" | "rejected" | "all"` (default `"new"`)
  - Status counts displayed directly inside tab badges.
- **Card Fields & Interaction Mechanics**:
  1. **Partner Header**:
     - `s.name` (`font-display text-lg font-semibold`)
     - Subtitle: `[s.org, s.district].filter(Boolean).join(" · ") || "—"`
     - Badges: `<Badge variant="secondary" className="capitalize">{s.kind}</Badge>` and `<StatusBadge status={s.status} />`
  2. **Applicant Note**:
     - Renders `s.message` inside `<p className="rounded-2xl bg-cotton/70 p-3 text-sm">`.
  3. **Contact & Privacy Reveal**:
     - Email: `<a href="mailto:${s.email}" className="text-red">{s.email}</a>`
     - Phone: Privacy-masked by default. Clicking `"Show phone"` triggers `POST /api/admin/partners/${s.id}/reveal` and dynamically updates state `phoneMap[s.id]`.
     - Timestamp: `applied {relativeTime(s.created_at)}`.
  4. **Active Referral Stats (for Approved Partners)**:
     - Referral Link: `${location.origin}/?ref=${s.code}` + one-click copy button.
     - Live Counters:
       - `<b>{s.referrals}</b> joined`
       - `<b>{s.paying}</b> paying`
       - `<b>{s.commission_pct}%</b> commission`
  5. **Dynamic Commission Editing & Lifecycle Actions**:
     - Numeric Input: `<Input className="w-24" inputMode="numeric" value={commission} onChange={...} /> % commission`
     - Allows setting customized commission rates per partner (default 20%).
     - **Reject Button**: Visible if `status !== "rejected"`. Sets status to `"rejected"`.
     - **Approve / Save Button**:
       - If status is `"new"`, approves partner, assigns code, auto-copies referral link to admin clipboard, and triggers success toast `"Approved — referral link copied"`.
       - If status is already `"approved"`, saves updated `commission_pct` and triggers toast `"Saved"`.

---

## 3. Financial Model & Commission Calculation Engine

### 3.1 ThikBid Subscription Plans Matrix
From reverse engineering `Pricing-CCRFwN09.js` and `index-kwNebdeb.js`, ThikBid offers three commercial tiers:

| Plan | Monthly Billing | Yearly Billing | Annual Discount | Key Features |
| :--- | :---: | :---: | :---: | :--- |
| **Free** | ₹0 | ₹0 | — | 1 trade, 1 district, weekly WhatsApp digest |
| **Starter** | **₹999 / mo** | **₹7,999 / yr** | ~33% (save ₹3,989) | 3 trades, 3 districts, daily 7 AM digest, "Do I qualify?" |
| **Pro** (Popular) | **₹2,499 / mo** | **₹23,999 / yr** | ~20% (save ₹5,989) | 8 trades, 12 districts, instant alerts, corrigendum alerts |
| **Firm** | **₹9,999 / mo** | **₹95,999 / yr** | ~20% (save ₹23,989) | 5 WhatsApp seats, 12 trades, all districts, award history |

---

### 3.2 Exact Commission Formula
The partner receives **20% (or custom `commission_pct`)** of every payment made by a referred contractor for a duration of **12 months** starting from the initial registration timestamp.

$$	ext{Monthly Commission Earned} = \sum_{i \in 	ext{Referred Active}} (	ext{Gross Payment Amount}_i 	imes rac{	ext{commission\_pct}}{100})$$

#### Unit Economics Per Paying Referral:

| Plan & Cycle | Contractor Pays | Partner Commission (20%) | 12-Month Cumulative Partner Revenue |
| :--- | :---: | :---: | :---: |
| **Starter Monthly** | ₹999 / month | **₹199.80 / mo** | **₹2,397.60** |
| **Starter Yearly** | ₹7,999 / year | **₹1,599.80 / yr** | **₹1,599.80** |
| **Pro Monthly** | ₹2,499 / month | **₹499.80 / mo** | **₹5,997.60** |
| **Pro Yearly** | ₹23,999 / year | **₹4,799.80 / yr** | **₹4,799.80** |
| **Firm Monthly** | ₹9,999 / month | **₹1,999.80 / mo** | **₹23,997.60** |
| **Firm Yearly** | ₹95,999 / year | **₹19,199.80 / yr** | **₹19,199.80** |

*Note: In monthly billing, partner cumulative revenue is higher (₹5,997.60 vs ₹4,799.80 on Pro) reflecting the absence of the 20% annual prepay discount.*

---

### 3.3 Persona Earnings Projections

#### Persona A: Local Tax Accountant / Bid Filing Consultant
- **Profile**: Manages GST and bid uploads for 20 local civil/electrical contractors in Barpeta or Nagaon.
- **Conversion Assumption**: 12 contractors subscribe to Starter (Monthly) and 4 subscribe to Pro (Monthly).
- **Monthly Earnings**:
  $$(12 	imes ₹199.80) + (4 	imes ₹499.80) = ₹2,397.60 + ₹1,999.20 = \mathbf{₹4,396.80 	ext{ / month}}$$
- **Annual Recurring Income**: **₹52,761.60 / year** (Pure passive recurring income).

#### Persona B: District Contractor Association
- **Profile**: District PWD / Water Resources Contractor Association with 120 members.
- **Conversion Assumption**: 40 contractors on Starter Monthly, 25 on Pro Monthly, and 3 engineering firms on Firm Plan.
- **Monthly Earnings**:
  - Starter: $40 	imes ₹199.80 = ₹7,992.00$
  - Pro: $25 	imes ₹499.80 = ₹12,495.00$
  - Firm: $3 	imes ₹1,999.80 = ₹5,999.40$
  - **Total Monthly Payout**: **₹26,486.40 / month**
- **Annual Association Revenue**: **₹3,17,836.80 / year** (Sufficient to fund association office rent, staff, and annual general meeting).

---

### 3.4 Payout Schedule & Payment Rails
1. **Frequency**: Monthly settlement.
2. **Channel**: **UPI** (Direct-to-bank via VPA/phone number) or NEFT/IMPS.
3. **Threshold**: Zero minimum payout barrier (as confirmed by the copy: `"Track sign-ups and payments with us any time."`).
4. **Statement Generation**: Admin reviews `paying` count under `/admin/partners` and initiates monthly settlement against verified Razorpay transactions (`/api/pay/verify`).

---

## 4. Referral Tracking & WhatsApp Attribution Engine

Because ThikBid is a "WhatsApp-first" platform where contractors receive daily digests and search tenders over WhatsApp rather than logging into a web dashboard every morning, attribution cannot rely solely on standard web session cookies. 

### 4.1 Technical Architecture of the Tracking Funnel

```
[Partner Referral Link: thikbid.in/?ref=GHYCA]
                     │
                     ▼
[1. Browser Entry: index-kwNebdeb.js URL Parsing]
  - Query extracted: URLSearchParams.get("ref")
  - Sanitization: [^a-z0-9-] stripped, max 24 chars
  - Uppercased & Prefixed: "ref:GHYCA"
                     │
                     ▼
[2. Client Storage: localStorage ("tb-src")]
  - Payload: { v: "ref:GHYCA", t: 1718000000000 }
  - TTL: 30 Days (30 * 864e5 ms)
                     │
                     ▼
[3. WhatsApp CTA Deep Link Injection]
  - Function: wk(phone, tag) in app-VGjPtK0-.js
  - Generates: https://wa.me/919387854327?text=Hi%20ThikBid%20[ref:GHYCA]
                     │
                     ▼
[4. Contractor Opens WhatsApp & Clicks Send]
  - Pre-filled message sent to ThikBid Bot (+91 93878 54327)
                     │
                     ▼
[5. Webhook Ingestion & Subscriber Tagging]
  - Bot receives: "Hi ThikBid [ref:GHYCA]"
  - Parser extracts tag `ref:GHYCA`
  - Database assigns: subscriber.referral_code = "GHYCA"
  - Increments partner.referrals count (+1 joined)
                     │
                     ▼
[6. Subscription Payment & Commission Crediting]
  - Contractor subscribes to Starter/Pro/Firm
  - Webhook captures payment event from Razorpay
  - Queries partner linked to referral_code
  - Increments partner.paying count (+1 paying)
  - Records 20% commission in partner payout ledger
```

### 4.2 Exact Reverse-Engineered Tracking Code (`index-kwNebdeb.js` & `app-VGjPtK0-.js`)

#### 1. Attribution Ingestion & LocalStorage Caching (`index-kwNebdeb.js`):
```javascript
const Pg = "tb-src";
const Dg = s => String(s || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);

const bS = (() => {
  const s = new URLSearchParams(location.search);
  const e = Dg(s.get("ref"));
  const t = Dg(s.get("src") || s.get("utm_source"));
  const n = e ? "ref:" + e.toUpperCase() : t;
  let i = null;
  try {
    i = JSON.parse(localStorage.getItem(Pg) || "null");
  } catch {}
  
  // 30-Day Attribution Window Check
  if (i && Date.now() - i.t < 30 * 864e5) return i.v;
  
  if (n) {
    try {
      localStorage.setItem(Pg, JSON.stringify({ v: n, t: Date.now() }));
    } catch {}
    return n;
  }
  return "web";
})();
```

#### 2. WhatsApp Deep Link Generation (`app-VGjPtK0-.js`):
```javascript
function wk(phone, customTag) {
  let tag = customTag;
  if (!tag) {
    try {
      const stored = JSON.parse(localStorage.getItem("tb-src") || "null");
      if (stored && Date.now() - stored.t < 30 * 864e5) {
        tag = stored.v;
      }
    } catch {}
  }
  const botNumber = phone || "919387854327";
  const message = `Hi ThikBid [${tag || "web"}]`;
  return `https://wa.me/${botNumber}?text=${encodeURIComponent(message)}`;
}
```

---

## 5. Partner FAQ Accordion Specification

The ThikBid design system utilizes native HTML5 `<details>` and `<summary>` elements with Tailwind utility styling rather than heavy JavaScript accordion libraries.

### 5.1 Design Pattern Code
```tsx
<details className="paper group p-5 [&_summary::-webkit-details-marker]:hidden">
  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-semibold">
    {question}
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cotton-2 transition-transform group-open:rotate-45">
      +
    </span>
  </summary>
  <p className="mt-3 text-[15px] text-ink-2 leading-relaxed">
    {answer}
  </p>
</details>
```

### 5.2 Complete Partner FAQ Content Matrix

```json
[
  {
    "id": "pfaq_1",
    "q": "How does the 20% commission work?",
    "a": "Whenever a contractor registers through your link or QR code and purchases any paid subscription (Starter, Pro, or Firm), you receive 20% of the gross subscription fee. For example, if a contractor chooses Pro Monthly at ₹2,499/mo, you earn ₹499.80 every single month they remain subscribed for up to 12 months."
  },
  {
    "id": "pfaq_2",
    "q": "How and when do I get paid?",
    "a": "All commission earnings are reconciled at the end of each calendar month and transferred directly to your registered UPI ID or bank account within the first 5 working days of the following month. There are no minimum payout thresholds."
  },
  {
    "id": "pfaq_3",
    "q": "How are contractors tracked if they register via WhatsApp?",
    "a": "When a contractor opens your personal link (e.g. thikbid.in/?ref=YOURCODE) or scans your association's QR poster, your partner code is saved in their browser for 30 days. When they tap 'Start on WhatsApp', your code is automatically included in their opening message. Our system tags their WhatsApp number to your partner account permanently upon receipt."
  },
  {
    "id": "pfaq_4",
    "q": "Can contractor associations get physical marketing materials?",
    "a": "Yes! Once your partner application is approved, we generate high-resolution print-ready PDF posters containing your unique QR code that you can display on notice boards in your association office, cafeteria, or registration desk."
  },
  {
    "id": "pfaq_5",
    "q": "How do I monitor how many contractors joined through me?",
    "a": "You can request a live partner status summary anytime directly on WhatsApp. We provide transparent reporting showing total contractors joined, active trial users, and paying subscribers, along with your accumulated commission balance."
  },
  {
    "id": "pfaq_6",
    "q": "What happens if a contractor upgrades their plan later?",
    "a": "Your 20% commission applies to all payments made during the contractor's first 12 months. If a client starts on Starter (₹999/mo) and upgrades to Pro (₹2,499/mo) or Firm (₹9,999/mo), your monthly payout immediately increases to 20% of the new plan rate."
  }
]
```

---

## 6. Complete TypeScript Specifications & Form Schema

### 6.1 Data Types (`types/partner.ts`)
```typescript
export type PartnerKind = "accountant" | "association" | "firm" | "other";
export type PartnerStatus = "new" | "approved" | "rejected";

export interface PartnerApplicationInput {
  name: string;
  org?: string;
  phone?: string;
  email?: string;
  district?: string;
  kind: PartnerKind;
  message?: string;
}

export interface PartnerRecord {
  id: string;
  name: string;
  org: string | null;
  district: string | null;
  phone: string | null; // masked until revealed in admin
  email: string | null;
  kind: PartnerKind;
  status: PartnerStatus;
  message: string | null;
  code: string | null; // assigned upon approval (e.g. "NAGAON-CA")
  commission_pct: number; // default 20
  referrals: number; // total contractors registered
  paying: number; // total contractors converted to paid tier
  created_at: string;
}

export interface AdminPartnerUpdateInput {
  status: PartnerStatus;
  commission_pct?: number;
}
```

### 6.2 Zod Validation Schema
```typescript
import { z } from "zod";

export const PartnerApplicationSchema = z.object({
  name: z.string().trim().min(1, "Please provide your name"),
  org: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  district: z.string().trim().optional().default(""),
  kind: z.enum(["accountant", "association", "firm", "other"]).default("accountant"),
  message: z.string().trim().optional().default(""),
}).refine(
  data => (data.phone && data.phone.trim().length > 0) || (data.email && data.email.trim().length > 0),
  {
    message: "Please give your name and a phone or e-mail.",
    path: ["phone"],
  }
);
```

---

## 7. Interactive Commission Calculator Component

To maximize conversion on the public `/partners` page, below is the production-ready implementation of an Interactive Commission Calculator matching ThikBid's exact UI design system (`paper`, `font-display`, `slider`, `text-maroon`):

```tsx
import React, { useState } from "react";
import { Calculator, IndianRupee, ArrowRight } from "lucide-react";

interface PlanTier {
  id: "starter" | "pro" | "firm";
  name: string;
  monthly: number;
}

const PLANS: PlanTier[] = [
  { id: "starter", name: "Starter (₹999/mo)", monthly: 999 },
  { id: "pro", name: "Pro (₹2,499/mo)", monthly: 2499 },
  { id: "firm", name: "Firm (₹9,999/mo)", monthly: 9999 },
];

export function PartnerCommissionCalculator() {
  const [contractors, setContractors] = useState<number>(20);
  const [planId, setPlanId] = useState<"starter" | "pro" | "firm">("pro");
  const commissionPct = 20;

  const currentPlan = PLANS.find((p) => p.id === planId) || PLANS[1];
  const monthlyVolume = contractors * currentPlan.monthly;
  const monthlyCommission = Math.round(monthlyVolume * (commissionPct / 100));
  const annualCommission = monthlyCommission * 12;

  return (
    <div className="paper overflow-hidden p-6 md:p-8">
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <span className="grid size-10 place-items-center rounded-xl bg-red/10 text-red">
          <Calculator className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold">Partner Earnings Calculator</h3>
          <p className="text-sm text-ink-2">Estimate your monthly and annual 20% recurring commission</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Controls */}
        <div className="grid gap-5">
          <div>
            <div className="flex justify-between text-sm font-medium">
              <span>Contractors you refer</span>
              <span className="font-mono font-bold text-red text-base">{contractors} contractors</span>
            </div>
            <input
              type="range"
              min={2}
              max={150}
              step={1}
              value={contractors}
              onChange={(e) => setContractors(Number(e.target.value))}
              className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-lg bg-cotton-2 accent-red"
            />
            <div className="mt-1 flex justify-between text-xs text-ink-3">
              <span>2</span>
              <span>50</span>
              <span>100</span>
              <span>150+</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Average contractor subscription tier</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setPlanId(plan.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                    planId === plan.id
                      ? "border-red bg-red text-white shadow-sm"
                      : "border-line bg-card text-ink hover:bg-cotton"
                  }`}
                >
                  <p className="truncate">{plan.name.split(" ")[0]}</p>
                  <p className="mt-0.5 opacity-80">₹{plan.monthly.toLocaleString("en-IN")}/mo</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projected Returns Box */}
        <div className="flex flex-col justify-between rounded-2xl bg-maroon p-6 text-cotton shadow-inner">
          <div>
            <span className="label-mono text-cotton/60 text-xs uppercase tracking-wider">
              Calculated at {commissionPct}% for 12 months
            </span>
            <div className="mt-4">
              <span className="text-sm text-cotton/70">Estimated Monthly Earnings</span>
              <p className="font-display text-4xl font-bold tracking-tight text-cotton">
                ₹{monthlyCommission.toLocaleString("en-IN")}
                <span className="text-base font-normal text-cotton/60"> / mo</span>
              </p>
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <span className="text-xs text-cotton/70">12-Month Total Passive Revenue</span>
              <p className="font-display text-2xl font-semibold text-blush-2">
                ₹{annualCommission.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-cotton/60">
            *Transferred monthly via UPI on actual subscription collections.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Summary of Reusable Assets & Design Tokens

| Token / Asset | Source / Value | Usage in Partner Portal |
| :--- | :--- | :--- |
| `gamusa-thin` | Assamese cultural textile bar | Top boundary ribbon on partner application card |
| `paper` | Bordered card surface | White/cream card elevation across all sections |
| `bg-maroon` | `#34111A` | High-contrast 20% commission announcement block |
| `text-red` | `#B91F2B` | Highlighted keywords, icons, em serif spans |
| `serif-em` | `font-serif italic font-normal` | Used on `"win more work."` header callout |
| `label-mono` | Monospace uppercase badge | `"PARTNER PROGRAMME"` pre-heading tag |
| `DotPattern` | `dot-pattern-JSFyYsXC.js` | Masked radial background on top hero |
| `WhatsApp CTA` | `wk()` in `app-VGjPtK0-.js` | Carries `[ref:CODE]` parameter into live WhatsApp chat |

---
*Generated by Agent 7 (REA Subagent) for 1:1 ThikBid reproduction.*
