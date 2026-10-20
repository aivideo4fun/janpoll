# Latest branding / ads revision
Public tagline: Voice of People. Telegram: https://t.me/janpollindia in all three social groups. Public copy uses जनमत; legacy routes and stored election types remain compatible. Historical calendar URL now shows a neutral Rajasthan overview rather than altering archived dates. Existing publisher native placement is connected by default on public pages, controlled by NEXT_PUBLIC_NETWORK_ADS_ENABLED. AdSense is separate and still requires approval/valid slot. No separately identifiable Monetag tag was found. Provider fill, ownership, real OAuth and RDS verification remain pending on staging. Google login buttons explicitly use Google. Previous audit details below refer to the earlier ads-disabled candidate where indicated.

# JanPoll release review — 19 October 2026

Baseline compared: `origin/india-local-redesign`, commit `23c53f0` (user-pushed current code). The baseline exactly matched the previous delivered update before these release edits. Production `main`'s Prisma schema was also compared for the upgrade review SQL.

## Implemented in this candidate

- Homepage question cards no longer show candidate totals, percentages or result bars. Cards show question/location/open status/options count and a link. Overall site counters and detailed poll results are separate.
- Category links now select actual query filters rather than all linking to the same section. An empty category stays empty; no polls/votes are invented.
- Rajasthan district page is dynamic, so a missing build-time DB does not permanently bake an empty district list into that page. Legacy URLs remain. Admin location picker requests now specify their actual kinds; district-wide fallback into an unrelated samiti was removed.
- `/advertise`, `/editorial-policy`, metadata/keywords/canonicals, private-page noindex, deduplicated sitemap and unknown-route 404 handling.
- `/admin/analytics`: reporting period, votes/attempt outcomes, opt-in page events, estimated tab sessions, device/referrer/path counts, state inventory, daily votes, counter reconciliation and safe CSV export.
- Optional analytics consent and privacy settings; private pages, queries and vote choices are not sent as analytics events. These figures are not verified humans/ad impressions/ad revenue.
- Production defaults to authenticated voting for every poll; guest creation remains available. An account is not a verified unique human. Device/IP checks cannot guarantee incognito-proof anonymous voting.
- Rate buckets for voting/creation/admin login, vote-attempt outcomes, full-lifetime guest duplicate checks and retention cleanup.
- Unauthenticated admin location upload blocked; hierarchy and row validation added. Web-triggered Prisma mutation commands removed. Admin cookie signature validation rejects malformed inputs safely. Authorization is enforced server-side, not by a cookie-presence middleware check.
- Legacy globally injected ad scripts removed. Reviewed AdSense configuration is opt-in and off by default, with ads kept off private/admin pages. A Google-certified CMP, if applicable, is a separate setup; analytics consent is not advertising consent.
- Next.js 15.5.28, async params/cookies compatibility, native browser UUID generation and patched PostCSS override.
- Hardcoded election calendar remains at its old URL as clearly marked unverified/archived reference content and noindex. Unsourced citation markers were removed; current official dates/publication restrictions require verification before rollout.

## Checks actually executed

| Check | Result | Scope |
|---|---|---|
| Production Next.js build | PASS | Next.js 15.5.28, React 18, patched dependency tree |
| TypeScript | PASS | Current source and generated route types |
| Prisma schema validation | PASS | PostgreSQL schema syntax/relations |
| `npm audit --omit=dev` | 0 reported vulnerabilities | Time-of-check registry results; not a security certification |
| Location regression tests | PASS, 7 cases | String IDs; duplicate names in different districts/samitis; exact fallback |
| Creator-flow tests | PASS | Mock DB/auth: guest/account, terms, origin, idempotent retry and owner isolation |
| Voting guard tests | PASS | Mock transactions: auth, same-account incognito repeat, lifetime guest repeat, invalid option, closed poll, parallel calls, rollback/cache errors, strict mode/rate limit |
| Admin/security tests | PASS | Malformed cookies, unauthorized upload, disabled web schema mutations, middleware privacy headers |
| PostgreSQL-engine migration fixture | PASS | Embedded PostgreSQL via PGlite; old recorded schema to release SQL; poll/options/3 votes preserved; legacy inventory query; draft visibility; repeatable local additions; duplicate constraint |
| HTTP smoke on a started production server | PASS | Public metadata, no legacy scripts, admin write/export rejection, redirects, unknown route 404 |
| Database health in that HTTP smoke | 503 EXPECTED | No actual PostgreSQL server/RDS was connected; not a production-health pass |

## Not executed / deployment gates

- Actual RDS schema comparison, backup/restore validation and old live poll/option totals reconciliation.
- Real PostgreSQL multi-connection voting/load tests (mock concurrency is not a substitute).
- Real Google OAuth login/callbacks and multi-browser/device voting against the user's database.
- Visual browser checks at Android/mobile/desktop sizes on the user's installed project.
- AdSense approval, certified CMP, ad-network reporting/valid-traffic verification.
- Current official election-calendar and publication-rule verification.
- Payment gateway/paid deletion execution and private-group ACLs remain out of scope/unimplemented.

No production deployment, RDS mutation, live vote submission, external message or GitHub push was performed. See DEPLOYMENT.md for staging, preflight and rollback steps. Do not switch live traffic until the outstanding gates pass.
