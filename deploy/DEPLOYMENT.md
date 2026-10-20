# Latest local policy correction (2026-10-20)
New poll creators must Google sign-in so their server-derived name/email can be shown to authorized admin. Choosing guest voting does not remove creator authentication. Existing anonymous guest records cannot gain an email retroactively. Legacy guest ownership cookies remain supported. Tagline is centered under JANPOLL, social strip is icons only, and daily ranking remains based on IST vote timestamps. Apply locally and test before any EC2 release; do not rebuild a running release directory.

# JanPoll EC2/RDS deployment candidate

This package is based on GitHub branch `india-local-redesign`, commit `23c53f0`, plus the reviewed release changes. No production server or RDS database has been accessed. Do not replace the live directory or run SQL before staging validation.

## What changed

- Homepage poll cards do not show candidate totals, percentages or result bars. Detailed results remain on the poll page after voting/closure.
- Advertise and editorial policy pages, explicit public canonical URLs/keywords, sitemap updates and private-page noindex.
- Homepage articles/updates remain admin-managed.
- Admin analytics separates recorded votes, cached historical totals, blocked attempts and opt-in traffic. It never claims votes are visitors or ad impressions.
- Production voting defaults to sign-in for every poll. Guest creation still works. One account is not proof of one human; multiple accounts remain a risk. Guest voting can be enabled explicitly but cannot be made incognito-proof.
- Database-backed request counters and full-lifetime guest network/device repeat checks. Missing guest protections require sign-in.
- Location-upload API now requires admin authorization and validates the hierarchy. Web-triggered Prisma commands are disabled.
- Next.js 15.5.28, async route/cookie compatibility and the patched PostCSS override. Locked dependency versions must be installed with `npm ci`.
- Legacy global Infolinks and ad-network scripts removed. Native publisher placements are restored in the latest revision; AdSense defaults OFF. Reviewed AdSense slots can be enabled explicitly, with applicable consent/CMP configuration. The optional analytics banner is NOT a Google-certified advertising CMP.

## 1. Local acceptance tests before any upload

1. Apply the local SQL updater and run `npm ci`, `npx prisma generate`, `npm run check`, `npm run test:guards`, `npm run build`.
2. Test guest and signed-in creation in Rajasthan and one other state. Receipt/reference must only open for its owner; another browser must not acquire management rights by knowing the reference.
3. Check old Rajasthan district, samiti, gram-panchayat and zila URLs against the live site. Restore an authorized RDS snapshot into an isolated test database if real old data is needed. Website pages do not contain a full database export.
4. Record option IDs/counts and poll counts before/after migration on the restored test copy. They must not change. Account-vote repeats, incognito with the same account, expiry, option mismatch and simultaneous requests must be tested against real PostgreSQL.
5. Check mobile widths 360/390/768 and desktop; open menu, create form, share link, WhatsApp, articles, support and admin tables. These visual/browser tests have not been performed against the user's machine.
6. The test scripts use mocked auth/database transactions; they are not RDS integration tests.

## 2. Database preparation (review gate)

- Take an RDS snapshot and verify a restore before changing production.
- Compare the ACTUAL restored RDS schema with `main`'s recorded Prisma schema. The review SQL assumes the recorded schema, not an unknown live state.
- `deploy/rds-upgrade-review.sql` is a generated, transactional review candidate. It adds fields/tables/indices; it does not reset or delete polls/votes. It is NOT an automatic or rerunnable migration. Never run it alongside the local incremental scripts.
- If live migration history exists, create a reviewed migration based on that history instead. If it is unmanaged, baseline the real schema first. Do not blindly run `prisma migrate dev`, `db push`, `reset`, `seed` or `--accept-data-loss` on RDS.
- Run `deploy/rds-location-audit.sql` on the restored copy. Old records may lack state/location IDs. No blanket state backfill is included. Legacy NULL-state district data remains treated as Rajasthan for compatibility; audit it before importing other-state district data.
- Old creator references are not fabricated, and old anonymous votes cannot reliably be assigned to Google accounts retroactively.

## 3. Server preparation

- Use a fresh release directory, e.g. `/var/www/janpoll/releases/<release-id>`, and a separate `current` link. Keep the old release for rollback.
- Use a supported Node.js 22/24 LTS and a non-root service account. Adjust `/usr/bin/node` in the service file to the actual Node path.
- Keep production secrets outside the repository, e.g. `/etc/janpoll/production.env`, readable only by the service account. Rotate any secrets previously shared or published. Use distinct random admin/session secrets and a stable vote salt.
- Configure the real Google OAuth client and `https://janpoll.in/api/auth/callback/google`. Set `ENABLE_DEV_LOGIN=false` and `REQUIRE_LOGIN_FOR_ALL_VOTES=true`.
- Configure RDS TLS and review the RDS CA/certificate verification settings. Do not disable certificate validation to make a connection work.
- The provided Nginx example is ONLY for direct Nginx -> Next.js. If ALB/CloudFront is in front, review the trusted client-IP chain separately. Never trust client-supplied IP headers directly. Bind Next to 127.0.0.1; expose HTTPS via the proxy, not port 3000.
- Preserve `Host`/forwarded protocol for NextAuth/Server Actions. Do not cache authenticated responses or Server Actions. The example disables proxy caching and strips middleware-control headers.

## 4. Build and preflight in the new release

Use the reviewed environment file without printing or executing its contents as shell commands. The commands below use Node's --env-file support; adjust the file path and permissions to the server. Public `NEXT_PUBLIC_*` ad flags must be set at BUILD time as well as runtime.

```sh
npm ci
node --env-file=/etc/janpoll/production.env node_modules/prisma/build/index.js generate
node --env-file=/etc/janpoll/production.env node_modules/typescript/bin/tsc --noEmit
npm run test:guards
node --env-file=/etc/janpoll/production.env node_modules/next/dist/bin/next build
node --env-file=/etc/janpoll/production.env deploy/preflight.cjs
```

Preflight checks critical environment settings, database connectivity and required fields. It refuses development login/guest-voting rollout settings and checks advertising configuration when enabled. It does NOT certify OAuth, ad approval or historical data/link integrity.

Run the reviewed schema upgrade only after snapshot/restore and staging approval. Then run preflight again. No scripts here perform production migrations automatically.

## 5. Smoke tests before traffic switch

- `/api/health` returns 200 with an accessible database, 503 otherwise, without connection details.
- Anonymous `/admin`, `/admin/analytics`, `/api/admin/upload-location` and protected exports do not reveal or mutate data.
- Homepage renders question cards without candidate-wise results.
- Same Google account cannot vote twice, including in incognito. Compare actual stored votes and counters after concurrent requests.
- Verify all original Rajasthan routes and several real poll IDs/slug URLs. Verify `/s/<code>` links.
- Verify articles, canonical URLs, robots, sitemap, support and deletion request ownership.
- Inspect HTTPS cookies, redirect URLs, proxy headers, error logs, memory and response times.
- Keep ads disabled while testing. Confirm publisher/client IDs and `ads.txt` ownership before enabling any ad network. Never test by clicking live ads or buy unverified traffic.

## 6. Rollout / rollback / retention

After all gates pass, point `current` at the tested release and restart the configured service. Validate `nginx -t` before reloading Nginx. Do not run these steps against an unknown server layout.

Rollback the application to the previous release if a smoke test fails. Additive schema fields normally remain in place; do not drop them to roll back. Keep the RDS snapshot for a separately reviewed data recovery plan.

Install and enable the supplied cleanup service/timer only after reviewing its environment and path. It removes expired rate buckets and traffic/vote-attempt logs older than 90 days, never poll records or vote counts. Metrics are opt-in estimates, not certified audience or valid ad traffic.

## Election-calendar content

The old `/rajasthan-election-2026` URL remains accessible, but its hardcoded dates and unsourced citation markers were not verified against a current official order. It is marked as archived/reference content and noindex, with a prominent official-source link. Do not describe it as the latest official schedule until it is checked and updated. Election-specific publication restrictions and applicable orders need a separate current review before a live rollout.

## Not included / not verified

No production deployment, RDS access, OAuth-provider end-to-end test, certified advertising CMP, payment gateway, automatic paid deletion or private-group ACLs. AdSense approval and fraud-free voting are not guaranteed. A clean dependency audit is one check, not a complete security certification.

## Updated ads, Google login and branding
- Public placements now load the existing native publisher tag from NativeBanner (bicea.org/21, existing key). Set NEXT_PUBLIC_NETWORK_ADS_ENABLED=false at build time to disable it. AdSense remains independently disabled unless configured. No Monetag-specific tag was identified: obtain the exact publisher dashboard tag before adding one. Do not invent publisher IDs.
- Verify actual network fill, mobile rendering, provider ownership and consent requirements on staging before release; source inclusion does not prove impressions or revenue.
- Google buttons call signIn('google'). Keep real credentials only in the server environment. Authorized origin: https://janpoll.in; authorized redirect URI: https://janpoll.in/api/auth/callback/google. For localhost, configure the exact local origin/callback separately. ENABLE_DEV_LOGIN=false for real Google tests and production.
- Public copy uses Voice of People and जनमत. Existing election-related route paths and database values are retained for link/data compatibility. This wording change does not determine legal classification.

## Visual content revision
Apply prisma/updates/visual-content.sql once on the reviewed database, after the earlier content schema exists. It only adds nullable image columns and default-disabled ticker settings. Local installer updater now includes it. Never run local updater against RDS.
Admin /admin/content manages article cover image (HTTPS URL or JPEG/PNG/WebP upload <=750 KB), alt text and announcement ticker on/off, link, order and duration. The first ticker item controls strip duration. Active + scrolling checkbox required for the top strip.
Uploaded images are stored in public/uploads/articles. Preserve this directory outside versioned releases and symlink/mount it into each release, grant only the nonroot app user write access, and back it up. For multiple EC2 instances use shared persistent storage or HTTPS image URLs from your managed object storage; local uploads alone are not replicated. No uploaded image is deleted when an article is removed.
Pointer hover/focus pauses scrolling; click holds pause; resume button restarts when hover/focus leaves. Reduced-motion users see a stationary horizontally scrollable strip. No ticker row is shown until an admin enables an item.
Rajasthan routes, queries, poll options and location IDs are unchanged in this visual revision.

## Actual production audit 2026-10-19
User-provided read-only results: 9,091 polls, 9,086 active flags (not equivalent to unexpired polls), 586 duplicate slug groups covering 1,744 polls; 6,702 polls have audited location fields, 2,389 do not. 41 districts / 430 tehsils / 428 samitis / 11,117 gram panchayats. Referenced GP IDs all resolve. Vote rows and stored counters both 2,473,547; aggregate equality alone is not a ballot-level integrity certification.
The revised release SQL creates a NON-UNIQUE Poll.slug index. Do not run older candidate SQL that creates Poll_slug_key. Article.slug remains unique. Existing poll URLs resolve using their ID, so no slug rewriting or deletion is required.
Snapshot is reported Available. Next gate: restore to a separate staging DB and verify schema migration, counts, legacy URLs and real Google login. Do not automatically label all locationless legacy polls as national or invent state assignments. Live application listens on *:3000 in the supplied output; bind the new PM2 process to 127.0.0.1 and restrict EC2 security group port 3000 before trusting forwarded client-IP headers.
