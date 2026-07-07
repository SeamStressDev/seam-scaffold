---
name: seam-change-protocol
description: Use this protocol whenever an edit will touch a file listed in .seamstress/seam-map.md, or, if no seam map exists, whenever an edit touches code that moves money, decides authorization, crosses tenant or user data boundaries, or deletes data. Load BEFORE writing any change to such a file.
---

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
  [catalog 003](https://github.com/SeamStressDev/seam-bug-catalog#3-idempotency-key-covers-only-one-of-two-charge-paths):** a checkout retry loop and a charge
  function, each individually correct. The charge call had no idempotency key. Customers
  were billed two and three times for one order. Stating "a retry can never double charge"
  before editing either file makes the missing key visible.
- **Step 1 exists because of
  [catalog 004](https://github.com/SeamStressDev/seam-bug-catalog#5-enumerable-document-ids):** an application with authorization on every
  route except one. Inside the unprotected file, nothing looked wrong. Only reading the
  callers, the route table, showed the gap.
- **Step 4 exists because of
  [catalog 005](https://github.com/SeamStressDev/seam-bug-catalog#13-shared-cache-cross-user-bleed):** a cache key built without the identity in it,
  serving one tenant's data to another. The one line fix was trivial. The test that pins
  it is what keeps the next refactor from reintroducing it.

## What this protocol cannot do

It cannot decide where the seams are in a design it has never seen, and it cannot know
what you already decided on purpose. A finding can be code accurate and still be your
deliberate tradeoff. The questions force the thinking; they cannot do the thinking. If you
find yourself answering them with boilerplate, turn the protocol off and read your code
instead. That instinct is the goal.
