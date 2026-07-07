# Seam map accuracy against real repos

Two measurements, kept separate because they answer different questions: recall
against documented ground truth (checkable), and noise rate on live repos
(judgment, labeled as such). n is small everywhere and this document says so at
every point where a number might be mistaken for a rate.

Run date 2026-07-07. Generator: seam-scaffold at commit `97a49f7` (heuristic
extracted from SeamStressDev/seamstress@daf0297). All external repos were
read-only clones at the pinned commits recorded below; nothing was filed,
reported, or contacted anywhere. The heuristic was not modified during or after
measurement; improvement candidates go to the list at the bottom for engine
first adjudication.

**Who judged, and how to disagree.** Candidate judgments were made by the
working AI session applying the stated rule, with the maintainer reviewing the
results; they are judgments, not measurements. Every candidate judged noise has
its generated reason line quoted so a reader can re-derive the judgment and
disagree. The random sample is reproducible: a linear congruential generator
(multiplier 1664525, increment 1013904223, modulus 2^32), seed 42, sampling
without replacement from the score-sorted non-rescue remainder after the top 20.

**Judgment rule.** Plausible: a reviewer preparing a seam review would want to
open this file, because it decides or directly implements a money, auth, tenant,
or deletion outcome server side. Noise: test, seed, or e2e files; type-only or
constants files; client side components and hooks; email templates;
infrastructure config; or pure vocabulary coincidence. Judged on the file, not
the signal: a right file flagged for a wrong reason counts as plausible, with
the wrong reason recorded separately under coincidence classes.

## Measurement 1: recall against documented ground truth

The [Seam Bug Catalog](https://github.com/SeamStressDev/seam-bug-catalog)
documents 13 incidents. Eleven are in proprietary systems documented via court
opinions, regulator filings, or press, with no public code to test against.
That leaves n=2, and this table says n=2.

| # | Catalog case | Testable? | Reason |
|---|---|---|---|
| 1 | Citibank / Flexcube | No | Proprietary Oracle banking product; court opinion, no public code |
| 2 | Knight Capital SMARS | No | Proprietary trading system; SEC order, no public code |
| 3 | WooCommerce Stripe Gateway | Yes | Public repo; incident era commit recoverable |
| 4 | Robinhood leverage | No | Proprietary; press documented |
| 5 | First American | No | Proprietary website; researcher disclosure |
| 6 | USPS Informed Visibility | No | Proprietary API; researcher disclosure |
| 7 | Optus | No | Proprietary API; regulator filing plus press |
| 8 | Peloton | No | Proprietary API; press documented |
| 9 | Experian partner API | No | Proprietary; researcher disclosure |
| 10 | Parler | No | Proprietary platform; research writeup |
| 11 | Venmo | No | Proprietary; press documented |
| 12 | redis-py (ChatGPT cross-user bleed) | Yes | Public library; fix PR identifies the files |
| 13 | Valve Steam cache | No | Proprietary caching configuration; first party news post |

**Case 3 pin:** woocommerce/woocommerce-gateway-stripe at `137b14f6`, the last
commit on the default branch before issue #2339 was filed (2022-04-19). Ground
truth: the API request layer that carried the idempotency key on one charge
path, and the two payment intent creators that formed the unprotected second
path.

**Case 12 pin:** redis/redis-py at `318b114` (tag v4.5.2, pre fix). Ground
truth: the files fix PR #2641 ("AsyncIO Race Condition Fix") touched, plus the
connection pool module. Pre registered caveat: redis-py is a library, not an
app, and the heuristic was tuned on application layouts, so a miss was expected
to be informative rather than surprising.

### Recall results: 6 of 6 ground truth files on map

| Case | Seam file | On map? | Reason line (verbatim) |
|---|---|---|---|
| 3 | includes/class-wc-stripe-api.php | Yes | a payment provider name in the path (path:payment-sdk, bonus:server, score 4) |
| 3 | includes/abstracts/abstract-wc-stripe-payment-gateway.php | Yes | payment vocabulary in the path, a payment provider name in the path, auth library usage, authorization or refund vocabulary, permission branching, money arithmetic and a value moving call (path:payment, path:payment-sdk, import:auth, kw:authorize/refund, bonus:server, shape:access-branch, shape:money-math, shape:value-move, score 14) |
| 3 | includes/class-wc-stripe-intent-controller.php | Yes | a payment provider name in the path, auth library usage, money arithmetic and a value moving call (path:payment-sdk, import:auth, bonus:server, shape:money-math, shape:value-move, score 8) |
| 12 | redis/asyncio/client.py | Yes | credential handling vocabulary, a database delete and a database write (kw:credential, bonus:server, shape:db-delete, shape:db-write, score 5) |
| 12 | redis/asyncio/cluster.py | Yes | credential handling vocabulary and a database write (kw:credential, bonus:server, shape:db-write, score 3) |
| 12 | redis/asyncio/connection.py | Yes | credential handling vocabulary, a database delete and a database write (kw:credential, bonus:server, shape:db-delete, shape:db-write, score 5) |

**Honesty note.** The redis-py hits are real but partly incidental: the pre
registered library caveat did not materialize, yet the reason lines show why it
did not. Generic signals (credential vocabulary from auth and password
handling, database write shapes) put the files on the map. The signals are not
race aware and could not be; on map presence is what recall measures, and the
reason lines are shown so readers can see the hit's character. Context for
case 3: the pinned plugin put 222 of its 365 files on the map (61%), so a hit
inside a payments plugin carries limited discriminative information; the three
ground truth files scored 4, 8, and 14 against a candidate floor of 3.

## Measurement 2: noise rate on live repos

Two active, well known open source applications with real money and auth
surfaces. Framing rule, stated up front: nothing here is a claim about bugs,
issues, or risk in either repo. The map marks where seam signals appear;
candidates are files a reviewer might open, and noise is a misfire of this
generator, not a statement about the code. cal.com was considered and rejected:
the repository now redirects to calcom/cal.diy and weighs 1.1GB, making it a
poor pinned citation.

| Repo | Pin | Files scanned | Candidates | Rate | 5000 file cap hit? |
|---|---|---|---|---|---|
| documenso/documenso | `50f272b` | 2046 | 595 | 29% | No |
| dubinc/dub | `1a8372b` | 4044 | 760 | 19% | No |

Exhaustive per candidate judgment at 1355 candidates is neither feasible nor
useful; the volume itself is the headline finding (see the summary). Judged per
repo: the top 20 by score exhaustively, every safety net rescue exhaustively,
and a seeded random sample of 30 from the remainder, reported stratified by
score band because the flood's location determines the fix class.

### documenso: judged 66 of 595

**Top 20 by score: 20 of 20 plausible.** Stripe billing mutations (subscription
quantity, checkout session, customer sync, portal session), session and auth
core (session.ts, get-session, email-password route, create-passkey,
authenticated middleware, is-recipient-authorized), admin billing and role
mutations, document deletion, and token gated document routes. Three of the
twenty carry a coincidental destructive SQL hit (Tailwind's truncate class) but
earn their place on other signals.

**Random sample (n=30): 24 plausible, 6 noise. Stratified: score band 3 to 5,
6 of 24 noise (25%); band 6 and up, 0 of 6 noise.**

Noise, reason lines verbatim:

| Candidate | Reason line | Judgment |
|---|---|---|
| packages/trpc/server/team-router/delete-team-group.types.ts | deletion vocabulary in the path (path:delete, bonus:server, score 3) | Type-only zod schema file, no behavior |
| packages/lib/jobs/client.ts | credential handling vocabulary (kw:credential, bonus:server, score 3) | Job queue infrastructure config; PASSWORD env vocabulary |
| packages/trpc/server/admin-router/find-unsealed-documents.types.ts | an admin path (path:admin, bonus:server, score 4) | Type-only file |
| packages/lib/jobs/definitions/emails/send-team-deleted-email.handler.ts | deletion vocabulary in the path (path:delete, bonus:server, score 3) | Describes a deletion, does not decide one |
| packages/trpc/server/document-router/delete-document.types.ts | deletion vocabulary in the path (path:delete, bonus:server, score 3) | Type-only file |
| packages/lib/constants/organisations.ts | authorization or refund vocabulary and credential handling vocabulary (kw:authorize/refund, kw:credential, bonus:server, score 5) | Constants file; vocabulary in string literals |

Plausible sample members (24): organisation-authentication-portal,
send-reset-password, authenticator util (borderline, kept as plausible: a
reviewer of 2FA would open it), disable-user (both server-only and
admin-router), org signin route, remove-signed-field-with-token, two-factor
route, find-subscription-claims, get-document-with-details-by-id (documents
carry access passwords), get-entire-document, create-envelope,
manage-subscription, deleted-account service, delete-template-field,
get-active-subscriptions-by-user-id, get-subscription-claim,
delete-organisation, api-token-router, security settings route (loader touches
prisma and passwords), sign.$token index route, organisation invite route,
oauth-callback, admin email-transports route.

**Safety net rescues (all 16): 11 plausible, 5 noise.** (The raw tables
checkpoint reported 12 and 4; recounting against the rescue list found a third
e2e spec file, and this document carries the corrected count.) The plausible
eleven include the core signing mutation (sign-envelope-field), send and
resend document (delivery of access bearing links), the signing reminder and
completed/cancelled email jobs (wrong recipient means a signing link leaks),
field mutation, PDF replacement, and email verification. Noise, quoted:

| Candidate | Reason line | Judgment |
|---|---|---|
| packages/app-tests/e2e/api/v1/organisation-rate-limits.spec.ts | no keyword signals, rescued by risk shape: a database delete plus a database write plus money arithmetic (shape:db-delete, shape:db-write, shape:money-math, score 5) | e2e test file |
| packages/app-tests/e2e/api/v2/organisation-rate-limits.spec.ts | same form as above | e2e test file |
| packages/app-tests/e2e/admin/email-transports/email-transport-claims.spec.ts | keyword signals alone fell short (an admin path), rescued by risk shape: a database delete plus a database write (path:admin, shape:db-delete, shape:db-write, score 4) | e2e test file |
| packages/lib/server-only/profile/set-avatar-image.ts | no keyword signals, rescued by risk shape: a database delete plus a database write (shape:db-delete, shape:db-write, score 4) | Low stakes profile mutation |
| packages/prisma/seed/users.ts | keyword signals alone fell short (credential handling vocabulary), rescued by risk shape: a database delete plus a database write (kw:credential, shape:db-delete, shape:db-write, score 3) | Seed data; test passwords |

### dub: judged 106 of 760

**Top 20 by score: 20 of 20 plausible.** The entire top of the list is Stripe
webhook and Connect handlers (checkout completed, charge succeeded/refunded/
failed, subscription created/deleted, payout and outbound payment events)
plus customer invoice code. This is exactly what a map should surface first.

**Random sample (n=30): 20 plausible, 10 noise. Stratified: band 3 to 5, 10 of
23 noise (43%); band 6 and up, 0 of 7 noise.**

Noise, reason lines verbatim:

| Candidate | Reason line | Judgment |
|---|---|---|
| apps/web/app/(ee)/partners.dub.co/(dashboard)/programs/[programSlug]/(enrolled)/auth.tsx | auth vocabulary in the path (path:auth, bonus:server, score 4) | "use client" redirect wrapper; the server is authoritative |
| apps/web/lib/auth/constants.ts | auth vocabulary in the path and credential handling vocabulary (path:auth, kw:credential, bonus:server, score 5) | Constants file |
| apps/web/lib/middleware/utils/is-top-level-settings-redirect.ts | a middleware path (path:middleware, bonus:server, score 4) | Pure path string util |
| apps/web/tests/redirects/index.test.ts | authorization or refund vocabulary and credential handling vocabulary (kw:authorize/refund, kw:credential, score 3) | Test file |
| apps/web/app/(ee)/admin.dub.co/(dashboard)/partners/network/identity-verification.tsx | an admin path and destructive SQL (path:admin, kw:sql-destruct, score 4) | Admin UI sheet; the destructive SQL is Tailwind's truncate class |
| apps/web/app/(ee)/admin.dub.co/(dashboard)/partners/fraud/review-fraud-alert-sheet.tsx | an admin path and destructive SQL (path:admin, kw:sql-destruct, score 4) | Same coincidence; UI sheet |
| apps/web/lib/swr/use-partner-profile.ts | auth library usage (import:auth, bonus:server, score 4) | Client side SWR hook |
| apps/web/lib/zod/schemas/images.ts | authorization or refund vocabulary (kw:authorize/refund, bonus:server, score 4) | Zod schema; the signal matched the substring rls inside URLs |
| apps/web/app/(ee)/api/intercom/webhook/health-check/route.ts | a webhook path (path:webhook, bonus:server, score 5) | Health check ping endpoint |
| apps/web/app/app.dub.co/(dashboard)/[slug]/auth.tsx | auth vocabulary in the path (path:auth, bonus:server, score 4) | "use client" workspace gate wrapper |

Plausible sample members (20): stripe connect payout-failed and
recipient-configuration webhooks, cron folder and workspace deletion routes,
get-default-partner (session to partner resolution), check-account-exists,
paypal get-pending-payouts, storage.ts (flagged by the URLs coincidence but a
reviewer of tenant scoped storage keys would open it: right file, wrong
reason), increment-link-leads, update-program-resource,
request-password-reset, safe-action.ts (the central server action
authorization wrapper), update-stripe-settings, create-bounty-submission,
shopify customers-data-request webhook (data subject request handling),
create-partner-comment, invite-partner, upload-message-attachment, send-otp,
bulk-ban-partners.

**Safety net rescues (all 56): 53 plausible, 3 noise.** This is the safety
net's first evidence base on real code and it performed strikingly well: it
rescued dub's payout, commission, and affiliate import machinery, files with
near zero keyword surface that are exactly the signal light seams it was built
for. Rescued and plausible: three cron payout routes (aggregate due
commissions, balance available, split payouts), trigger-withdrawal,
reconcile-payout-amounts, bulk-update-partner-commissions, four affiliate
platform commission importers (firstpromoter, partnerstack, rewardful,
tapfiliate), shopify create-sale, two referral commission creators,
create-stablecoin-payout, OTP send and verify routes, workspace and partner
invite accept routes, workspace users and SCIM routes, bounty, campaign,
customer, dashboard, folder, group, email domain, UTM, and postback CRUD
routes, link transfer, link retention cleanup, partner ban cron, sitemap
importer (bulk tenant data writes), campaign scheduling and downgrade
pausing, reject-partner, group move rules, and nine operational scripts that
mutate real commissions and payouts (a reviewer absolutely wants to know
manual payout scripts exist). Noise, quoted:

| Candidate | Reason line | Judgment |
|---|---|---|
| apps/web/app/(ee)/api/e2e/notification-emails/route.ts | no keyword signals, rescued by risk shape: a database delete plus a database write (shape:db-delete, shape:db-write, score 4) | e2e test support endpoint |
| apps/web/app/(ee)/partners.dub.co/(dashboard)/payouts/payout-table.tsx | keyword signals alone fell short (destructive SQL), rescued by risk shape: money arithmetic plus a value moving call (kw:sql-destruct, shape:money-math, shape:value-move, score 4) | UI table; truncate coincidence |
| packages/email/src/templates/partner-paypal-payout-failed.tsx | keyword signals alone fell short (a payment provider name in the path), rescued by risk shape: money arithmetic plus a value moving call (path:payment-sdk, shape:money-math, shape:value-move, score 4) | Email template, no behavior |

## Coincidence classes (quantified where possible)

1. **RLS matches the substring in URLs.** The row level security signal
   (kw:authorize/refund includes the pattern RLS) fires on the letters rls
   inside "URLs" and "urls". In dub, a link shortener, 117 of the 203
   candidates carrying kw:authorize/refund fire on nothing else. Largest
   single noise driver found.
2. **TRUNCATE matches Tailwind's truncate class.** The destructive SQL signal
   fires on UI files in both repos.
3. **"unauthorized" contains "authorize".** First observed in session 1
   against the scratch-app (test/routes.test.js on the map via its
   "unauthorized" assertions); formalized here as a class. Inflates auth
   vocabulary on tests and error handling files.
4. **No penalty class for tests, types, seeds, and templates.** Test files,
   .types.ts files, seed data, and email templates carry domain vocabulary
   and the server path bonus with no counterweight; they account for the
   majority of judged noise outside class 1.

## Summary: what these numbers do and do not support

Three headline shapes, in order. First, the top of the map is excellent: 40 of
40 top-20 candidates across both live repos are files a seam reviewer would
open, and the highest scored candidates are precisely the payment webhook
handlers a reviewer should start with. Second, the flood is confined to the
bottom band: 0 of 13 sampled candidates at score 6 and up were noise, while
the 3 to 5 band ran 25% (documenso) and 43% (dub) sample noise, and that band
holds over 80% of all candidates; the map's volume problem is a low band
problem. Third, the safety net earned its keep: 64 of 72 rescues across both
repos were plausible (a count corrected from the 65 reported at the raw tables
checkpoint; see the documenso rescue note), and on dub it surfaced the payout
and commission machinery that keyword signals entirely missed.

What the numbers do not support: any reliability rate (recall n=2; noise
sampled at 60 of 1355 plus exhaustive top and rescue sets), any claim about
either live repo's code quality, or any claim that on-map presence means a
seam exists (the redis-py hits show on-map for generic reasons). The
measurement characterizes this generator at this commit on these four inputs,
and nothing more.

## Proposed improvements (for adjudication; engine first per policy)

Recorded, not implemented. Policy: any heuristic change lands in the engine
first, is ported to the scaffold second, and the parity fixtures are
regenerated third.

1. Word bound the RLS pattern (match RLS as a word, not a substring), killing
   coincidence class 1 (117 files in dub alone).
2. Constrain the TRUNCATE pattern to SQL context (word bound, or require
   TRUNCATE TABLE), killing class 2.
3. Exclude "unauthorized" from the authorize match (class 3).
4. Add a penalty class for test, type only, seed, story, and email template
   paths, mirroring the existing UI penalty (class 4; of the 16 sampled noise
   verdicts it would have removed 5, and of the 8 rescue noise verdicts 6:
   the three documenso specs, the seed, the dub e2e endpoint, and the email
   template).
5. Rebalance the low band for app router era layouts: the server path bonus
   (+2) plus any single 1 or 2 weight vocabulary hit clears the threshold (3).
   Options: raise the default threshold to 4, reduce the server bonus to 1, or
   require at least one content signal for candidacy. Evidence: the flood is
   entirely in the 3 to 5 band and the 6 plus band sampled clean.
6. Scaffold side rendering option (no heuristic change, no parity impact):
   tier the map by score band, presenting 6 and up prominently and the low
   band collapsed, so the excellent top is not buried by the flood.
