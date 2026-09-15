# Production audit — 3.6.5

## Scope and findings

Reviewed the active homepage script, chat flow, Worker handlers, deployment configuration, response headers and existing tests. This is a targeted source/release audit, not a guarantee of zero vulnerabilities or a full penetration test. Original content and image layout are unchanged.

### Fixed

- **P1 privacy:** project consultations previously posted to public `/messages`. The homepage now uses private `/api/contact`; full project text is retained within the existing form limit. Private contact does not write guestbook records.
- **P1 data integrity:** failed/corrupt KV reads no longer become an empty list. New guestbook records use immutable `guestbook:v2:` keys instead of replacing the shared legacy array. Concurrent independent writes cannot overwrite one another. Legacy `messages` data is not migrated or deleted.
- **P2 abuse/error handling:** form requests require same-origin JSON, bounded request bytes, typed fields, valid optional email and explicit length limits. Storage/rate-limit failures fail closed. Provider error details are not returned by contact forms. Guestbook throttling is per visitor IP rather than blocking everyone after any submission.
- **P2 reliability:** mail requests have a 10-second timeout; guestbook notification runs with `waitUntil` after durable save. Browser form/load requests have a 20-second timeout. Storage-denied browsers still display successful responses. Duplicate submit clicks are ignored; stale polls cannot overwrite a submission. Polling restarts after back-forward cache restoration.
- **UI/accessibility:** Escape closes the mobile menu and returns focus; menu label reflects open/closed state; back-to-top respects reduced motion; decorative video respects data-saver; reveal content remains visible without JavaScript.
- **Headers:** disallow framing, embedded objects, foreign base URLs and foreign form actions. This is a limited CSP, not a complete script allowlist policy.

## Verification

- 27 automated tests passed, including actual homepage form dispatch, private/public separation, malformed input, concurrent writes, storage corruption, public email exclusion, chat cancellation/reconnect and navigation.
- Wrangler 4.131.2 `deploy --dry-run` passed with the existing KV binding.
- Local Wrangler/workerd test: two synthetic guestbook submissions were stored and returned together; KV bulk-read API worked. No live guestbook or contact test messages were submitted.
- `npm audit --json`: zero reported advisories across the current dependency lockfile, including development dependencies.
- Mobile visual spot-check at 390px: 11 homepage sections and 13 image elements retained; no horizontal document overflow.

## Operational boundaries and follow-up

- KV is eventually consistent. Read-after-write is returned directly to the submitter; polling pauses briefly after success. Other visitors can see delayed updates. KV counters are **soft limits**, not atomic billing caps. Enforce provider budget limits; use Durable Objects/D1 and stronger anti-abuse controls before higher traffic or strict quotas.
- Per-entry KV listing/reads increase operations as the guestbook grows. Monitor KV usage/quotas; do not silently delete history to reduce storage. Latest 100 entries are exposed by the API, latest 50 rendered as before. Define archival/retention with the owner before changing it.
- Existing legacy records were not deleted or reclassified. Historical consultations may have been public before this fix; review with the owner before removal.
- Secret previously shared in conversation should be rotated by the owner. Do not put secrets in Git or frontend assets.
- Worker remains on legacy service-worker syntax. Production deploy is supported, but `wrangler versions upload` preview requires an ES Module migration. That architectural migration is not bundled with the privacy hotfix.
- `cloudflare:web-perf` requires Chrome DevTools MCP, which is unavailable in this session. No Lighthouse score, Core Web Vitals measurement or real iPhone Safari performance certification is claimed.
- Automated tests are runnable with `npm ci && npm test`; this audit does not claim an enforced GitHub/Cloudflare CI test gate.

## Release / rollback

Deploy Pages and Worker from the same reviewed GitHub main commit, then independently verify `/api/health` version, served `site.js`, security headers and `/messages` on both apex and www. A prior whole-site rollback would restore the private-contact bug: prefer a targeted forward fix. The previous Worker cannot see v2 records, though it does not delete them; retain the dual-read implementation when rolling back other changes.

Reference: https://developers.cloudflare.com/kv/api/read-key-value-pairs/
