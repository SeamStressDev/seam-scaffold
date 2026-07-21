# Field notes: the five protocols on a production host project

The five Scaffold protocols were installed into a real production project — a
consumer Android app with a web backend, referred to here only as the host
project — and self-applied through roughly ten days of daily engineering work in
July 2026. The host project keeps a findings ledger written by the working
sessions themselves, at session grain: what was claimed, what was verified, what
was deferred, and who authorized what. This document extracts what that ledger
evidences about the protocols, sanitized of anything that identifies the host.

Two ground rules for reading it. First, every count and anecdote below traces to
a specific ledger entry; nothing is reconstructed from memory. Second, the
counts are conservative: an incident is tallied only where the ledger shows the
protocol demonstrably governing behavior — a stop that fired, a gate that held,
a label that changed what the next session did — not where the protocol was
merely mentioned.

## Scope

The analyzed span is the final six days of the dogfood (roughly twenty-five
ledger entries), a continuous arc in which one feature family went from design
review to production: new ingestion endpoints on a tenant-data boundary, a
credential-model rework, native device code verified on real hardware, a merge
to main, production database migrations, and a series of privacy and
release-hygiene sessions. This arc was chosen because it is where the ledger
records protocol behavior at session grain; earlier scaffolded sessions exist
and are drawn on only where noted.

## Per-protocol invocation tally

Counts are distinct incidents, not mentions. One incident is tallied under the
protocol that primarily governed it, even where two protocols composed.

| Protocol | Incidents | Shape of the evidence |
| --- | --- | --- |
| Verification Discipline | 9 | claims labeled, misreads corrected, premises disproven before building |
| Irreversible Gate | 6 | production writes held for explicit authorization; two proposed writes refused outright |
| Seam Change Protocol | 6 | independent review before every seam merge; minimal diffs on seam files |
| Session Continuity | 4 | checkpoints with exact remaining work; carried gate lists; boundary re-verified per session |
| Fixture Immutability | 3 | red tests kept red as signal; frozen corpus restored, not rewritten |

**Verification Discipline (9).** The staged-claim and log-silence incidents
(both below); three native modules carried an explicit COMPILE-UNTESTED label
across sessions until a build compiled and exercised them, at which point the
ledger closed the label rather than letting it lapse; a production security fix
was not called done while a one-minute timing ambiguity remained — a deliberate
live test against a revoked credential settled it, and only then did the status
change to live-verified; a merge conflict on the security-critical route was
resolved by running the superseded fix's own regression test against the merged
result, and a protected work-in-progress was verified byte-identical by hash at
three points around the merge; a ten-day-old assumption that uncommitted work
was an unfinished feature was overturned by byte-level diff evidence (the
"feature" was line-ending noise on identical content); a public privacy claim
was checked against the code, found affirmatively false, and flagged to the
human rather than silently rewritten; a hardware verification pass recorded two
of seven runs as NOT REPRODUCIBLE on that device, with the mechanism explained,
instead of marking them passed or omitting them; and a task brief's central
premise ("this change is display-only") was disproven against the code before
any edit, which stopped the task for a redesign with the human.

**Irreversible Gate (6).** Production database migrations accumulated across
five sessions of feature work as one ordered needs-human item and were executed
once, in order, with a read-only preflight, explicit per-task authorization in
the human's own words, and post-verification; branch pushes and deploys
happened only on an explicit go, and multiple sessions ended with work
committed locally and the ledger line "NOT PUSHED (awaiting authorization)"; a
follow-up migration was applied as exactly one file's statements, nothing more;
a proposed backfill of a production bookkeeping table was refused because most
of its rows could not be honestly verified as applied — the ledger's phrasing
is that inserting them would be "assumption dressed as record" — and guard code
plus documentation were added instead; bulk deletion of ~163 accumulated
untracked files was declined as irreversible and not the agent's call to make;
and release-submission tooling was wired fail-closed after a near-miss — a
"latest build" heuristic nearly selected a defective artifact, so the
attestation script now requires an explicit build id, and the defective
artifact is recorded as never-ship.

**Seam Change Protocol (6).** A new ingestion endpoint on the tenant-data
boundary got a blind two-critic review plus verification adjudication before
merge — the review confirmed the tenant logic sound, fixed one endpoint-local
hardening gap, and filed one real production bug in a sibling route; a
production security fix on the attribution seam was shipped as a minimal
two-clause diff accompanied by a whole-repo inventory of every same-shape
lookup, with keep/fix judgment recorded per site; the credential-model rework
was trio-reviewed and the review killed part of the decided design (a status
gate that would have deadlocked enrollment), with the deviation ratified by the
human and the reasoning recorded; two further feature phases on the
pairing/credential boundary were trio-gated and the review found a
high-severity revocation-scoping bug plus three silent-failure gaps, all fixed
before merge; the merge to main itself got an adversarial four-reviewer pass
(the deploy-order catch below); and a user-facing accuracy claim was wired into
the seam map so that any future capability falsifying it trips the protocol.

**Session Continuity (4).** A five-phase build checkpointed twice rather than
rushing its trio-gated and least-charted phases, each checkpoint recording the
exact remaining work, which the next session picked up verbatim; a consolidated
authoritative gate checklist superseded scattered checklist fragments and was
carried across roughly six sessions until executed, items checked off with
evidence; a needs-human pile was carried from session to session without silent
drops; and every session in the privacy arc re-verified a protected
work-in-progress boundary before writing — recorded in each entry — until one
session finally investigated the boundary itself and dissolved it with
evidence.

**Fixture Immutability (3).** A deletion-coverage invariant test was left red
across multiple sessions as the signal of pending coverage, explicitly not
skipped, with the ledger stating "the red IS the pending-coverage signal";
frozen test-corpus manifests found corrupted in the working tree were restored
to their committed frozen values rather than committed as-is, and in the same
pass a blanket line-endings configuration was aborted mid-step the moment it
staged content changes to committed fixture files; and pre-existing failing
suites were reproduced on the base branch and left untouched as a documented
excusable set, instead of being adjusted to green.

Three incidents for Fixture Immutability is a low count, and it is reported as
such. The ledger cannot distinguish "few temptations arose" from "temptations
arose and were not recorded"; absence data is honest data, not evidence of
strength.

## Anecdotes

**The staged claim.** A fix for background work resuming after device reboot
passed type checks and its unit pins, but the only environment it had ever run
in was a debug build — and on the debug build, the reboot path demonstrably did
nothing. The ledger entry recorded the fix as STAGED, with the explicit
sentence that the claim is not "fixed" until a release-variant build passes the
on-device reboot test, and named three specific risks to check there. The next
session built the release artifact and directly witnessed the post-reboot
heartbeat advance with the app never opened; only then did the finding close.
Without the label, "fixed" ships on the strength of an environment where the
feature was already known not to work.

**The silent log.** During that same release-build verification, the device log
was silent where the background task's output should have been, and the first
read was that the task had not run. The protocol's requirement to ground claims
in direct evidence forced a second look: release builds strip console output,
so the absence of logs was not absence of execution — and the server-side
check-in row, the actual ground truth, had advanced. The ledger records the
early misread and its correction in the same entry. Without it, the likely
outcome was hours spent debugging a working system, or a false "broken" verdict
on a passing feature.

**The deploy-order catch.** Before the feature arc merged to main, an
adversarial review traced that the new shared credential resolver selected a
column that would exist only after the pending migrations ran. Deploying code
before migrations would therefore not merely break the new features — it would
error the core ingestion route fleet-wide. Running migrations first was proven
safe (additive, and verified inert to the running code). The review recorded
migrations-first as non-negotiable, and the merge followed that order. Without
the review, both orderings looked plausible, and one of them was a production
outage of the product's core path.

**The frozen corpus.** A debt-clearing session found uncommitted edits to
frozen test-corpus manifests sitting in the working tree. Instead of committing
the tree as it stood, the session traced the edits to a corruption incident
from days earlier and restored the committed frozen values, un-corrupting the
regression corpus. In the same pass, a repo-wide line-endings configuration was
abandoned mid-step the moment a dry run showed it would stage content changes
to files committed in their original form. The evidence stayed evidence.

**The refused backfill.** After production migrations were applied by hand
under the gate, a cleanup task proposed backfilling the production
migration-bookkeeping table so it would read as contiguous. Preflight showed
the premise was off: most of the missing rows covered data-only migrations that
leave no schema trace, so they could not be honestly verified as applied. The
session refused the write — recording that inserting them would be "assumption
dressed as record, worse than a documented-stale table" — and instead added a
guard that hard-refuses the bulk runner against production, plus documentation
naming the real ground truth. The gate held against a write whose only benefit
was tidiness.

## What this dogfood does not show

**One project, one operator.** Every incident comes from a single host project
driven by a single human, who is also involved in the protocols' development.
This is evidence the protocols are livable and load-bearing under real
production pressure; it is not evidence about independent adoption.

**The protocols and the host evolved together.** Observations from the dogfood
fed back into protocol wording during the same period. The arc is therefore
partly a measurement of the thing being tuned, on the codebase it was tuned
against.

**The ledger is self-report.** The sessions that produced the evidence wrote
the record of the evidence. Many claims were independently checked — blind
critics, real hardware, direct database reads — but the selection of what got
written down was made by the sessions themselves.

**Invocation is the weak link, and the ledger says so.** Earlier in the same
dogfood, before the analyzed arc, two seam-path changes correctly identified
the seam context and cited the protocol but did not self-invoke the required
independent review; the human had to order it, both times, and both reviews
found real issues. That observation was recorded as protocol feedback at the
time. What this arc demonstrates is governance once a protocol engages — not
that engagement is reliable without a human noticing.

**No counterfactual.** "What would have happened without the protocol" in the
anecdotes is inference from the recorded near-miss, not a measured comparison.
There is no control arm; single-project dogfood cannot provide one.

**Attribution blurs at the edges.** A blind-critic review is Seam Change
Protocol process and Verification Discipline evidence at once; the tally
assigns each incident to one protocol, so protocol-level counts are an
undercount of composed behavior rather than an exact partition.
