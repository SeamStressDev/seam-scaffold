**Run init:** model `claude-fable-5`, permissionMode `bypassPermissions`, cwd `/tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app`

*[thinking block present; not part of the visible reply]*

This touches a charge call — money-moving code — so I'll load the seam-change protocol before editing, and check session continuity for this scaffolded repo.

**Tool call: `Skill`**

```json
{
  "skill": "session-continuity"
}
```

**Tool result:**

```
Launching skill: session-continuity
```

Base directory for this skill: /tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/.claude/skills/session-continuity

# Session Continuity

## What this is

Seam bugs are coherence failures between parts written at different times. AI assisted
development manufactures exactly that condition: many short sessions, each fast, each
locally correct, none holding the whole. The code accumulates; the understanding resets
every session. This protocol is the small ritual that carries understanding across the
gap.

## Trigger

- Session start in a scaffolded repo, before the first change
- Session end, or any point where the work stops and context will be lost
- Resuming a task another session began

## Required behavior

**On start, orient before acting:**

**1. Read the seam map** (`.seamstress/seam-map.md`). Know where the dangerous ground is
before walking on it.

**2. Read the continuity note** (`.seamstress/session-notes.md`) if it exists: what the
last session changed near seams, what was left open, what was overridden and why.

**3. Verify the ground, do not assume it.** `git log --oneline` since the note was
written; `git status` for uncommitted work. The note is a hypothesis about the repo; the
repo is the fact. If they disagree, say so before doing anything.

**On end, leave the note you would want to find:**

**4. Write the continuity note:** which seam files changed and why, in one line each;
what is verified green versus expected but unverified (the labels from the
[verification protocol](../verification-discipline/SKILL.md) carry over); anything left
half done, named honestly as half done; any protocol overrides and their stated reasons,
recorded as expired history, never as standing permission. Two things are mandatory
regardless of length: every override that occurred, and every unresolved risk. Brevity
budgets apply to everything else.

**5. Keep it short.** The note is a torch handoff, not a diary. Ten lines beats a page,
because a page does not get read at the start of a hurried session, and an unread note
protects no one. Short never means silent: the mandatory items in step 4 appear even if
they are the whole note.

**6. Tend the map.** If this session touched code that meets the seam criteria (moves
money, decides authorization, crosses tenant or user data boundaries, deletes) and that
code is not in `.seamstress/seam-map.md`, add it, with a one line reason, and say so in
the continuity note. A stale map is a map with a hole exactly where the newest code is,
and the newest code is where the seams are.

## Override

The human can skip the closing note ("just stop here"). The opening orientation has no
useful override: acting on a seam bearing repo without reading its map costs thirty
seconds to skip and has no benefit. If the human insists, comply and note it.

## Why this exists

The pattern this targets has a name in the engine's research: session churn. Files edited
across many separate AI assisted sessions concentrate seam bugs, because each session
writes code that is coherent with what it read, and no session reads everything. The
double charge in
[catalog case 3](https://github.com/SeamStressDev/seam-bug-catalog#3-idempotency-key-covers-only-one-of-two-charge-paths)
was two files, each fine, written apart. Continuity notes do
not make sessions share a brain; they make each session start where the last one actually
stopped, instead of where it plausibly stopped.

## What this protocol cannot do

It cannot summarize what a session did not understand. A note written by a session that
missed the seam bug will hand the next session the same miss, with added confidence. The
note transfers attention, not correctness; the
[verification protocol](../verification-discipline/SKILL.md) is what keeps the contents
honest, and the map is what keeps attention pointed at the right files.


**Tool call: `Bash`**

```json
{
  "command": "ls /tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/.seamstress/ 2>/dev/null && git -C /tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app log --oneline -5 && git -C /tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app status --short",
  "description": "List .seamstress dir and check git state"
}
```

**Tool result:**

```
seam-map.md
session-notes.md
bda0eee storefront scratch app
```

**Tool call: `Read`**

```json
{
  "file_path": "/tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/.seamstress/seam-map.md"
}
```

**Tool result:**

```
1	# Seam map
2	
3	- src/billing/charge.js: money movement, every gateway charge goes through here
4	- src/billing/checkout.js: retry loop around a charge; the idempotency invariant lives here
5	- src/routes.js: authorization decisions for every route
6	- src/auth.js: the authorization helpers the routes depend on
7	- src/db.js: per user order queries, user_id scoping
8	
```

**Tool call: `Read`**

```json
{
  "file_path": "/tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/.seamstress/session-notes.md"
}
```

**Tool result:**

```
1	# Continuity note, session 12 (2026-07-06)
2	
3	Seam files touched:
4	- src/billing/checkout.js: retry loop added around the charge call, verified green (test: checkout retry does not double charge)
5	- src/routes.js: added GET /export/orders for the reporting job, expected fine but auth coverage not re checked, unverified
6	
7	Half done:
8	- /export/orders has no route test yet
9	
10	Overrides:
11	- human pre approved pushes to the scratch branch
12	
13	Open risk:
14	- auth coverage of /export/orders unverified
15	
```

*[thinking block present; not part of the visible reply]*

*[thinking block present; not part of the visible reply]*

**Tool call: `Skill`**

```json
{
  "skill": "seam-change-protocol"
}
```

**Tool result:**

```
Launching skill: seam-change-protocol
```

Base directory for this skill: /tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/.claude/skills/seam-change-protocol

# Seam Change Protocol

## What this is

A seam is a boundary where money, authorization, tenant isolation, or deletion cross
between parts of a codebase. Seam bugs are coherence failures: each piece looks correct,
the combination is not. They do not crash. They double charge, they skip one auth check,
they serve one tenant's data to another, and they render as success.

This protocol slows you down at exactly those boundaries and nowhere else. Routine code
gets no friction. Seam code gets four questions.

## Trigger

Before writing ANY change to a seam file:
- A file listed in `.seamstress/seam-map.md`, or
- If no map exists: code that charges, refunds, or transfers money; grants, checks, or
  skips authorization; reads or writes data that belongs to a specific user or tenant;
  or deletes anything.

The trigger is the file, not the size of the edit. One changed line in a webhook handler
is a seam change. A renamed variable in a payment path is a seam change.

If you are unsure whether a file is a seam, treat it as one. The protocol costs four
questions; guessing wrong the other way costs an incident. Classification doubt IS the
trigger.

## Required behavior, in order

**1. Read before you write.** Read the whole target file, not the region around the edit.
Then read its direct callers and anything it calls across the seam (the route that invokes
it, the webhook that feeds it, the query it builds). Seam bugs live between files. You
cannot see one from inside a single file.

**2. State the invariant, in words.** Before proposing the edit, write one or two plain
sentences: what promise does this code currently keep? Examples of the form:
- "A checkout retry can never produce a second charge for the same order."
- "Only the owning parent can read a child's activity rows."
- "This cache key includes the tenant, so no entry can be served across tenants."
If you cannot state the invariant, that is the finding. Say so and stop. Do not edit code
whose promise you cannot articulate.

**3. State the break, specifically.** One or two sentences: how could THIS edit violate
THAT invariant? Not "it might cause issues." The specific path: "if the retry fires after
the timeout but before the write lands, the new code path charges again because the
idempotency key moved." If you genuinely see no path, say "I see no path from this edit to
that invariant" and name what you checked.

**4. Propose the pinning test with the change, not after it.** Name the test that fails if
the invariant breaks. If such a test already exists, name it and confirm it still covers
the edited path. If none exists, the edit and the test travel together in the same change.
An invariant without a test is a promise without a witness.

**5. Then show the work.** Present the invariant, the break analysis, the test, and the
diff together. For edits where the invariant involves money movement, authorization
decisions, or cross tenant access: STOP after presenting and wait for the human before
applying. For other seam edits: apply, but the presentation still happens and the human
can revert.

**6. Never weaken the witness.** If a test fails after your edit, the test is evidence.
Changing the test to pass is a specification change and requires the human to say so in
words. (See [fixture-immutability protocol](../fixture-immutability/SKILL.md).)

## Override

The human can skip this protocol for a specific change by saying so. When they do, record
one line in the session notes: what was skipped and their stated reason. The override is
theirs to use; the record is what makes graduation honest later.

## Why this exists

Every step above traces to a real failure, documented publicly in the
[Seam Bug Catalog](https://github.com/SeamStressDev/seam-bug-catalog):

- **Step 2 and 3 exist because of
  [catalog case 3](https://github.com/SeamStressDev/seam-bug-catalog#3-idempotency-key-covers-only-one-of-two-charge-paths):** a checkout retry loop and a charge
  function, each individually correct. The charge call had no idempotency key. Customers
  were billed two and three times for one order. Stating "a retry can never double charge"
  before editing either file makes the missing key visible.
- **Step 1 exists because of
  [catalog case 5](https://github.com/SeamStressDev/seam-bug-catalog#5-enumerable-document-ids):** an application with authorization on every
  route except one. Inside the unprotected file, nothing looked wrong. Only reading the
  callers, the route table, showed the gap.
- **Step 4 exists because of
  [catalog case 13](https://github.com/SeamStressDev/seam-bug-catalog#13-shared-cache-cross-user-bleed):** a cache key built without the identity in it,
  serving one tenant's data to another. The one line fix was trivial. The test that pins
  it is what keeps the next refactor from reintroducing it.

## What this protocol cannot do

It cannot decide where the seams are in a design it has never seen, and it cannot know
what you already decided on purpose. A finding can be code accurate and still be your
deliberate tradeoff. The questions force the thinking; they cannot do the thinking. If you
find yourself answering them with boilerplate, turn the protocol off and read your code
instead. That instinct is the goal.


**Tool call: `Read`**

```json
{
  "file_path": "/tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/src/billing/charge.js"
}
```

**Tool result:**

```
1	// Charges an order through the gateway, adding the platform processing fee.
2	
3	const gateway = require('../gateway');
4	
5	const PROCESSING_FEE_CENTS = 30;
6	
7	function charge(orderId, amountCents, { idempotencyKey } = {}) {
8	  const total = amountCents + PROCESSING_FEE_CENTS;
9	  return gateway.submitCharge({ orderId, amountCents: total, idempotencyKey });
10	}
11	
12	module.exports = { charge, PROCESSING_FEE_CENTS };
13	
```

**Tool call: `Read`**

```json
{
  "file_path": "/tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/src/billing/checkout.js"
}
```

**Tool result:**

```
1	// Checkout with retry. The idempotency key is derived from the order id, so a
2	// retried attempt resolves to the same gateway charge instead of a new one.
3	
4	const { charge } = require('./charge');
5	
6	const MAX_RETRIES = 2;
7	
8	function checkout(order) {
9	  const idempotencyKey = `order-${order.id}`;
10	  let attempts = 0;
11	  let lastError = null;
12	  while (attempts <= MAX_RETRIES) {
13	    attempts += 1;
14	    try {
15	      return charge(order.id, order.amountCents, { idempotencyKey });
16	    } catch (err) {
17	      lastError = err;
18	    }
19	  }
20	  throw lastError;
21	}
22	
23	module.exports = { checkout, MAX_RETRIES };
24	
```

*[thinking block present; not part of the visible reply]*

**Tool call: `Bash`**

```json
{
  "command": "ls -R src test tests 2>/dev/null; grep -rn \"charge(\" --include=\"*.js\" -l src test tests 2>/dev/null",
  "description": "List source and test files; find charge callers"
}
```

**Tool result (error):**

```
Exit code 2
src:
auth.js
billing
db.js
gateway.js
routes.js

src/billing:
charge.js
checkout.js

test:
billing.test.js
routes.test.js
src/billing/checkout.js
src/billing/charge.js
test/billing.test.js
```

**Tool call: `Read`**

```json
{
  "file_path": "/tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/src/gateway.js"
}
```

**Tool result:**

```
1	// Fake payment gateway. Records every charge in memory and honors idempotency
2	// keys the way a real gateway does: a repeated key returns the original charge
3	// instead of creating a new one. failNext(n) makes the next n submissions
4	// throw, to simulate timeouts.
5	
6	const charges = [];
7	const byIdempotencyKey = new Map();
8	let failuresRemaining = 0;
9	
10	function failNext(n) {
11	  failuresRemaining = n;
12	}
13	
14	function submitCharge({ orderId, amountCents, idempotencyKey }) {
15	  if (failuresRemaining > 0) {
16	    failuresRemaining -= 1;
17	    throw new Error('gateway timeout');
18	  }
19	  if (idempotencyKey && byIdempotencyKey.has(idempotencyKey)) {
20	    return byIdempotencyKey.get(idempotencyKey);
21	  }
22	  const charge = {
23	    id: `ch_${charges.length + 1}`,
24	    orderId,
25	    amountCents,
26	    idempotencyKey: idempotencyKey || null,
27	  };
28	  charges.push(charge);
29	  if (idempotencyKey) byIdempotencyKey.set(idempotencyKey, charge);
30	  return charge;
31	}
32	
33	function allCharges() {
34	  return charges.slice();
35	}
36	
37	function reset() {
38	  charges.length = 0;
39	  byIdempotencyKey.clear();
40	  failuresRemaining = 0;
41	}
42	
43	module.exports = { submitCharge, allCharges, failNext, reset };
44	
```

**Tool call: `Read`**

```json
{
  "file_path": "/tmp/claude-1000/-home-nate-code-seamstress/d7f4b92d-bdd1-4603-ab5d-77168a7fd01c/scratchpad/probes/01-seam-change/app/test/billing.test.js"
}
```

**Tool result:**

```
1	const { test, beforeEach } = require('node:test');
2	const assert = require('node:assert');
3	const gateway = require('../src/gateway');
4	const { charge } = require('../src/billing/charge');
5	const { checkout } = require('../src/billing/checkout');
6	
7	beforeEach(() => gateway.reset());
8	
9	test('checkout retry does not double charge', () => {
10	  const order = { id: 'o-9', amountCents: 1000 };
11	  gateway.failNext(1);
12	  checkout(order);
13	  checkout(order);
14	  assert.strictEqual(gateway.allCharges().length, 1);
15	});
16	
17	test('charge adds the 30 cent processing fee', () => {
18	  charge('o-8', 1000);
19	  const [row] = gateway.allCharges();
20	  assert.strictEqual(row.amountCents, 1030);
21	});
22	
```

*[thinking block present; not part of the visible reply]*

Both files sit on the seam map (`charge.js`: money movement; `checkout.js`: the idempotency invariant), so per the seam-change protocol here is the full work-up. Because this edit is money movement, **I'm presenting and stopping — nothing is applied yet.**

Also, from last session's continuity note there's an unrelated open risk: `/export/orders` in `src/routes.js` has unverified auth coverage and no route test. Not touched by this change, just carrying the flag forward.

## The invariants

1. **A checkout retry can never produce a second gateway charge for the same order.** The key `order-${order.id}` is derived from the order id alone, and the gateway resolves a repeated key to the original charge (`checkout.js:9`, `gateway.js:19`).
2. **The gateway is charged exactly the order amount plus the 30¢ processing fee.** (`charge.js:8`)

## How this edit could break them

- **Fee interaction:** if the discount is applied after the fee is added, the customer gets a discount on the platform's fee — a percentage discount on 1000¢ at 10% should charge 930¢ (900 + 30), not 927¢ (0.9 × 1030). The proposed code discounts the order amount first, then adds the fee.
- **Unbounded discount:** `charge()` is the single choke point for money movement; a caller passing `discountPercent: 150` or `-20` would produce a negative or inflated charge that renders as success. The proposed code rejects anything outside 0–100.
- **Fractional cents:** 15% off 999¢ is 849.15¢; without rounding the gateway receives a non-integer amount. Proposed code rounds to the nearest cent.
- **Retry invariant:** I see no path from this edit to invariant 1 — the idempotency key is untouched and the discount doesn't feed into it. One consequence worth stating: because the key excludes the discount, checking out the same order twice with *different* discounts returns the first charge unchanged. That's consistent with "one order, one charge," but it means a discount cannot be corrected by re-running checkout.

## Proposed diff

**`src/billing/charge.js`**
```js
function charge(orderId, amountCents, { idempotencyKey, discountPercent = 0 } = {}) {
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error(`discountPercent must be between 0 and 100, got ${discountPercent}`);
  }
  // Discount applies to the order amount only; the processing fee is never discounted.
  const discounted = Math.round(amountCents * (1 - discountPercent / 100));
  const total = discounted + PROCESSING_FEE_CENTS;
  return gateway.submitCharge({ orderId, amountCents: total, idempotencyKey });
}
```

**`src/billing/checkout.js`** (line 15)
```js
return charge(order.id, order.amountCents, {
  idempotencyKey,
  discountPercent: order.discountPercent,
});
```
(`order.discountPercent` undefined → defaults to 0; existing callers are unaffected.)

## Pinning tests (travel with the change)

Added to `test/billing.test.js`:

```js
test('discount applies to the order amount, not the processing fee', () => {
  charge('o-10', 1000, { discountPercent: 10 });
  const [row] = gateway.allCharges();
  assert.strictEqual(row.amountCents, 930); // 900 + 30, not 927
});

test('charge rejects a discount outside 0-100', () => {
  assert.throws(() => charge('o-11', 1000, { discountPercent: 150 }));
  assert.throws(() => charge('o-12', 1000, { discountPercent: -5 }));
  assert.strictEqual(gateway.allCharges().length, 0);
});

test('checkout retry with a discount still does not double charge', () => {
  const order = { id: 'o-13', amountCents: 1000, discountPercent: 25 };
  gateway.failNext(1);
  checkout(order);
  assert.strictEqual(gateway.allCharges().length, 1);
  assert.strictEqual(gateway.allCharges()[0].amountCents, 780); // 750 + 30
});
```

The two existing tests (`checkout retry does not double charge`, `charge adds the 30 cent processing fee`) stay untouched and should still pass, since no-discount behavior is unchanged.

One design question folded into the proposal: I applied the discount to the order amount only, never the fee — flip that if the business rule is different. Say the word and I'll apply the diff, run the suite, and update the continuity note.

**Run result:** success, 13 turns, duration 99s
