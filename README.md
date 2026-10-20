# ThikBid — 1:1 Local Clone (Reverse Engineering Reconstruction)

A fully local, reverse-engineered reconstruction of **ThikBid** ([thikbid.vercel.app](https://thikbid.vercel.app)) — an Assam-focused government tender procurement platform with WhatsApp-based contractor alerts.

Built with the reverse-engineering skill (REA) using a 9-agent swarm.

---

## Quick Start

```bash
npm start           # Node server (zero dependencies)
# or
npm run server:py   # Python fallback server
```

Then open: [http://localhost:3000](http://localhost:3000)

Set a different port with `PORT=3001 node server.js`.

---

## What's Included

| Path | Description |
|---|---|
| `server.js` | Zero-dependency Node HTTP server — SPA routing, static assets, HTTP Range requests for video, API mock fallbacks |
| `server.py` | Python fallback server (same route surface) |
| `scraped/` | 1:1 mirror of the original site: HTML pages, CSS/JS bundles, images, video |
| `preview.html` | Standalone interactive showcase preview |
| `tenders_data.json` | Tender dataset (43 KB) |
| `i18n_dictionary.json` | Full English/Assamese i18n dictionary |
| `test-routes.js` | Integration QA suite — 26 route/asset/API assertions |

## Routes

`/` · `/tenders` · `/tenders/:district` · `/tenders/:district/:trade` · `/t/:slug` · `/firm` · `/me` · `/checkout` · `/login` · `/start` · `/partners` · `/pricing` · `/consent` · `/privacy` · `/terms` · `/preview`

## Analysis Documents

`LANDING_PAGE_ANALYSIS.md` · `FIRM_PORTAL_ANALYSIS.md` · `AUTH_ONBOARDING_ANALYSIS.md` · `TENDERS_APP_ANALYSIS.md` · `PARTNERS_PROGRAM_ANALYSIS.md` · `INTERACTIVE_WIDGETS.md` · `LEGAL_COMPLIANCE_ANALYSIS.md` · `REA_ASSET_AUDIT.md` · `INTEGRATION_QA_REPORT.md`

## Verification

```bash
npm test
```

Expected: **26 PASSED, 0 FAILED** — covers every page route, SPA deep link, static asset bundle, JSON API endpoint, and an HTTP Range request returning `206 Partial Content` for video streaming.

---

## Notes

- No runtime dependencies. No network calls. Everything runs locally.
- Third-party assets under `scraped/` are the original site's public resources, included for faithful local reproduction and study.
- This is an educational reconstruction, not an official ThikBid product.
