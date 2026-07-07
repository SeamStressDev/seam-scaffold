# SeamStress protocols for Cursor

This file carries the same five protocols as the `skills/` directory, packaged as a
single rules file Cursor can load. The protocol content is identical to the Claude Code
skills; only the packaging differs.

To install: save everything below the horizontal rule as
`.cursor/rules/seamstress.mdc` in your repository, or append it to a legacy
`.cursorrules` file. Each protocol opens with an "Apply when" line stating its trigger;
the agent should apply the matching protocol before acting, not after.

---

## Seam Change Protocol

Apply when: an edit will touch a file listed in `.seamstress/seam-map.md`, or, if no
seam map exists, whenever an edit touches code that moves money, decides authorization,
crosses tenant or user data boundaries, or deletes data. Apply BEFORE writing any change
to such a file.

### What this is

A seam is a boundary where money, authorization, tenant isolation, or deletion cross
between parts of a codebase. Seam bugs are coherence failures: each piece looks correct,
the combination is not. They do not crash. They double charge, they skip one auth check,
they serve one tenant's data to another, and they render as success.

This protocol slows you down at exactly those boundaries and nowhere else. Routine code
gets no friction. Seam code gets four questions.

### Trigger

Before writing ANY change to a seam file:
- A file listed in `.seamstress/seam-map.md`, or
- If no map exists: code that charges, refunds, or transfers money; grants, checks, or
  skips authorization; reads or writes data that belongs to a specific user or tenant;
  or deletes anything.

The trigger is the file, not the size of the edit. One changed line in a webhook handler
is a seam change. A renamed variable in a payment path is a seam change.

### Required behavior, in order

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
words. (See [Fixture Immutability](#fixture-immutability).)

### Override

The human can skip this protocol for a specific change by saying so. When they do, record
one line in the session notes: what was skipped and their stated reason. The override is
theirs to use; the record is what makes graduation honest later.

### Why this exists

Every step above traces to a real failure, documented publicly in the Seam Bug Catalog:

- **Step 2 and 3 exist because of catalog 003:** a checkout retry loop and a charge
  function, each individually correct. The charge call had no idempotency key. Customers
  were billed two and three times for one order. Stating "a retry can never double charge"
  before editing either file makes the missing key visible.
- **Step 1 exists because of catalog 004:** an application with authorization on every
  route except one. Inside the unprotected file, nothing looked wrong. Only reading the
  callers, the route table, showed the gap.
- **Step 4 exists because of catalog 005:** a cache key built without the identity in it,
  serving one tenant's data to another. The one line fix was trivial. The test that pins
  it is what keeps the next refactor from reintroducing it.

### What this protocol cannot do

It cannot decide where the seams are in a design it has never seen, and it cannot know
what you already decided on purpose. A finding can be code accurate and still be your
deliberate tradeoff. The questions force the thinking; they cannot do the thinking. If you
find yourself answering them with boilerplate, turn the protocol off and read your code
instead. That instinct is the goal.

## Irreversible Gate

Apply when: about to execute any action that cannot be cheaply undone: pushing to a
shared branch, deploying, running a database migration, deleting data or resources,
sending an email or message, spending money or calling a paid API in bulk, publishing
anything public, or rotating or revoking secrets. Apply BEFORE the action, not after.

### What this is

Most mistakes in a coding session cost an undo. A small number cost a customer, a
database, or a reputation. This gate exists for the second kind. It adds friction to
exactly one class of action and leaves everything else alone.

The gate is a set of questions the human answers before the action runs. The questions
are short. The point is not the ceremony. The point is that irreversible mistakes are
almost always visible one minute before they happen, to anyone who actually looks.

### Trigger

Before executing any action in the irreversible class:

- **Push** to a shared or default branch (local commits are reversible; push is the line)
- **Deploy** to any environment users touch
- **Migrate** a database schema, or run any bulk write against real data
- **Delete** data, files outside the working tree, branches on a remote, or cloud resources
- **Send** an email, message, or notification to a real person
- **Spend** money, or start a bulk run against a paid API
- **Publish** anything public: a package, a release, a post, a PR to someone else's repo
- **Rotate or revoke** secrets, keys, or access

If an action is not on this list but cannot be cheaply undone, it is on this list.

### Required behavior

**1. Name the action and its blast radius before running it.** One sentence, concrete:
what exactly will happen, and who or what can observe it. "This pushes 3 commits to
origin/main on the public repo" is concrete. "This syncs changes" is not.

**2. Answer the reversal question honestly.** Can this be undone, how, and how expensive
is the undo? "Force push can rewrite it but anyone who pulled has it" is an honest answer.
If the honest answer is "it cannot be undone," say those words. Do not soften them.

**3. State what was checked, this session.** The verification that makes this action safe
must have happened in the current session, not be remembered from a previous one. Tests
run and green: name the run. Diff reviewed: say when. Target confirmed: quote it. Stale
verification is not verification.

**4. Name the stop point.** What is the last moment this can be halted, and what is the
first check after it runs? "After the push, verify the ref on origin matches local HEAD"
gives the action a landing, not just a launch.

**5. Then STOP and wait for the human.** The gate never executes the action itself. The
human runs it, or explicitly tells the agent to run it after reading the answers. Every
time. There is no streak of good answers that earns an exception, because the hundredth
push is exactly as irreversible as the first.

### Override

The human can name specific actions as pre approved for a session ("pushes to my scratch
branch are fine today"). Record the pre approval in the session notes. Blanket overrides
of the whole class ("skip all gates") get one pushback naming what becomes unguarded, then
compliance and a note. The wheels belong to the rider.

### Why this exists

- **Step 3 exists because verification decays.** A test suite that was green yesterday
  says nothing about the commit made this morning. Sessions with AI agents move fast and
  span many changes; the gap between "I verified" and "I verified THIS" is where confident
  mistakes live.
- **Step 5 exists because execution and judgment are different jobs.** The agent can
  stage everything perfectly and still be wrong about intent. Keeping the final click
  human is not distrust of the agent; it is the only structure in which the human's
  knowledge of intent gets applied at the moment it matters.
- **The class list exists because "be careful" does not work.** Care is not a state you
  can hold continuously for a whole session. A named list turns care from vigilance into
  a checkpoint, which is the only form of care that survives hour three.

### What this protocol cannot do

It cannot know where the irreversible line sits for a task it has never seen. New kinds of
work create new kinds of one way doors, and no list is complete. When you meet an action
this list did not anticipate, the question is not "is it on the list." The question is
"can I cheaply undo this," and if the answer takes more than a breath to produce, treat it
as gated. The list is the floor, not the boundary.

## Verification Discipline

Apply when: making a claim about what code does, did, or will do: describing behavior,
confirming a fix, reporting test results, or asserting that something is safe, handled,
or working. Applies to the agent's own statements throughout a session.

### What this is

The engine this scaffold comes from has one rule: report only what you can prove against
the actual code, quoting the exact lines. This protocol applies that rule to the agent's
own mouth. An assistant that says "this is handled" without looking is manufacturing the
exact confidence problem that seam bugs exploit.

### Trigger

Any statement of the forms: "this code does X," "the fix works," "tests pass," "that case
is handled," "this is safe," "X is already implemented," "the error was caused by Y."

### Required behavior

**1. Claims about code quote the code.** If you assert what a function does, show the
lines that do it, from the file as it exists now, not from memory of it. Memory of a file
is a hypothesis about a file.

**2. Claims about behavior run the check.** "Tests pass" means tests were run this
session and the output is shown. "The fix works" means the failing case was reproduced,
the fix applied, and the case re run. If the check was not run, the claim is "I expect
this to work, unverified."

**3. Unproven claims wear a label.** "Probably," "I expect," "unverified" are honest
words. Use them. A labeled guess is useful; an unlabeled guess is a defect. The failure
mode this prevents is not lying, it is drift: expectation stated as fact, repeated until
everyone believes it.

**4. Causes are demonstrated, not narrated.** "The bug was caused by Y" requires showing
Y producing the bug, or at minimum showing that removing Y removes the bug. A plausible
story about a cause is a hypothesis, and hypotheses wear labels (see 3).

### Override

None. This protocol has no legitimate override, because its only demand is honesty about
certainty, and there is no task that goes better with less of that. The human can accept
unverified claims and proceed; they cannot make an unverified claim verified by accepting
it.

### Why this exists

The engine's own verification gate was audited before launch and two critical paths were
found where a finding could be labeled proven without evidence behind it. The fixes are
public. The lesson generalizes: the label "verified" is only as good as the check behind
it, whether the claimant is a tool or an assistant. Confidence is cheap to emit and
expensive to audit; quoted lines and shown output make the audit free.

### What this protocol cannot do

It cannot make the human read the quoted lines. Proof that is shown but not looked at
protects no one. The protocol guarantees the evidence is on the table; looking remains
the rider's job.

## Fixture Immutability

Apply when: a test fails after a change, when editing test files, test fixtures,
expected outputs, snapshots, or scoring criteria, and whenever the temptation exists to
make a red check green by touching the check instead of the code.

### What this is

Tests, fixtures, snapshots, and expected outputs are evidence. They are the recorded
promises the code has made. Editing evidence to match new behavior is sometimes correct,
because promises legitimately change. But the decision that a promise has changed belongs
to the human, in words, every time. An agent that quietly adjusts a test to pass has not
fixed anything; it has destroyed the witness.

### Trigger

- A test fails after your change
- You are about to edit any test, fixture, snapshot, expected output, or scoring rule
- You notice that changing an assertion would be easier than changing the code

### Required behavior

**1. A red test is information first.** Before touching anything, state what the test is
protecting and why it went red: the code broke the promise, or the promise changed. These
are the only two options and they have opposite fixes.

**2. If the code broke the promise, fix the code.** The test does not move.

**3. If the promise changed, the human says so in words.** Present it plainly: this test
pins behavior X, the change makes behavior Y, updating the test means the promise is now
Y. Wait for explicit agreement before editing the test. "The test was outdated" is a
conclusion only the human can reach.

**4. New tests get the same scrutiny in reverse.** A test written to pass against the
current code proves nothing unless it would fail against the broken version. When
pinning a fix, state what the test fails on. If it cannot fail, it is not a witness, it
is decoration. (The engine's own pinning tests are reversion proven: revert the fix, watch
them go red. That is the standard.)

**5. Never delete a failing test to unblock work.** Skipping with a linked reason and a
human sign off is honest; deletion is evidence tampering.

### Override

The human can rule "the spec changed, update the test" at any time; that ruling IS the
protocol working, not an exception to it. What has no override is silence: the one
forbidden move is a test edited to green without the promise change being said out loud.

### Why this exists

During the design review of the engine's own benchmark, an adversarial preflight found a
loophole: fixture code could be modified by the thing being scored, which would let a
grader pass by moving the goalposts. The loophole was closed by rule, not by trust. The
same failure shape appears in everyday AI assisted sessions constantly, and it is rarely
malicious: an agent optimizing for a green suite will find the shortest path to green,
and sometimes the shortest path is through the referee.

### What this protocol cannot do

It cannot tell which promises deserve to survive. Codebases carry outdated tests pinning
behavior nobody wants, and keeping those green is preservation of error. The protocol
only guarantees the change of promise is a decision someone made on purpose, visibly.
Which promises to keep is the product; that judgment stays human.

## Session Continuity

Apply when: at the start of every session in a scaffolded repository, before making any
change, and again at the end of the session or before context is lost. Applies to
resumed work, handoffs between sessions, and any moment where the agent is acting on a
codebase it did not just finish reading.

### What this is

Seam bugs are coherence failures between parts written at different times. AI assisted
development manufactures exactly that condition: many short sessions, each fast, each
locally correct, none holding the whole. The code accumulates; the understanding resets
every session. This protocol is the small ritual that carries understanding across the
gap.

### Trigger

- Session start in a scaffolded repo, before the first change
- Session end, or any point where the work stops and context will be lost
- Resuming a task another session began

### Required behavior

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
[Verification Discipline](#verification-discipline) protocol carry over); anything left
half done, named honestly as half done; any protocol overrides and their stated reasons.

**5. Keep it short.** The note is a torch handoff, not a diary. Ten lines beats a page,
because a page does not get read at the start of a hurried session, and an unread note
protects no one.

### Override

The human can skip the closing note ("just stop here"). The opening orientation has no
useful override: acting on a seam bearing repo without reading its map costs thirty
seconds to skip and has no benefit. If the human insists, comply and note it.

### Why this exists

The pattern this targets has a name in the engine's research: session churn. Files edited
across many separate AI assisted sessions concentrate seam bugs, because each session
writes code that is coherent with what it read, and no session reads everything. The
double charge in catalog 003 was two files, each fine, written apart. Continuity notes do
not make sessions share a brain; they make each session start where the last one actually
stopped, instead of where it plausibly stopped.

### What this protocol cannot do

It cannot summarize what a session did not understand. A note written by a session that
missed the seam bug will hand the next session the same miss, with added confidence. The
note transfers attention, not correctness; the
[Verification Discipline](#verification-discipline) protocol is what keeps the contents
honest, and the map is what keeps attention pointed at the right files.
