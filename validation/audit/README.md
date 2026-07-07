# Blind trio audit: the seam map CLI untrusted-input surface

The seam map CLI (shipped this week) reads arbitrary, possibly hostile repositories and
writes `.seamstress/seam-map.md`, which the session-continuity protocol then instructs
every agent to read first, as trusted orientation. That is untrusted repository content
crossing into agent-trusted context: an injection boundary that did not exist before the
CLI. This audit reviewed that surface with a blind cross-model trio, the methodology used
on the engine's verification gate before launch.

Audited at scaffold commit `fa01190`. Surface: `src/heuristic/heuristic.js`
(scanRepo/listSourceFiles path and content handling), `src/map.js` (renderMap
interpolation, extractHandAdditions index arithmetic), `src/cli.js` (writes, gitignore
append, force path). Roughly 500 lines.

## Method

Three critics, fresh context, no shared state, different models:

- **Critic A (cold), opus:** given only "review this code for correctness and safety",
  no injection framing. Tests whether the surface is findable cold, the honest measure of
  how a real reviewer meets it.
- **Critic B (seam-framed), sonnet:** given the full threat model (untrusted repo content
  reaching agent-trusted orientation).
- **Critic C (adversarial), opus:** asked to craft hostile inputs and trace the code.

Synthesis merged and deduped. Verification applied the verification-discipline standard to
the audit itself: every surviving finding was re-run against the real functions in a
scratch harness, exact lines quoted, a concrete input demonstrated; a claim that did not
reproduce is labeled refuted, not reported as fact. The harnesses are committed under
[`harnesses/`](harnesses/) and the raw critic outputs under
[`raw-critic-outputs/`](raw-critic-outputs/), so every finding is reproducible.

The harness set is eight files but not eight exploit oracles. Five demonstrate exploits
and are the fix gates: h1 (F1), h2 (F2), h4 (F4 and F8), h7 (F5 and F6), h8 (F3 and F7).
h3 is a negative oracle: it shows the ruled-out crashes stay ruled out, and it must keep
passing after any fix. h5 and h6 are superseded investigation files: they were early,
mis-pathed attempts to demonstrate the symlink escape that returned false, and h7 is the
clean, deterministic escape oracle that replaced them. They are kept, not deleted, because
they record how F6 was nailed down: the escape was not obvious, the first two attempts did
not reproduce it, and the path from a refuted crash claim (Critic A's finding C) to the
real escape (F6) runs through them. That provenance is worth more committed than tidy.

## The blind-gradient result: found cold

The core injection was found by **Critic A cold**, with no threat model supplied, then
independently reproduced by B and C. A surface a real reviewer meets without being told the
threat model is present is not a hypothetical: it is findable, and it was found. The
enabling fact, verified on the filesystem: a Linux filename may contain newlines and every
markdown metacharacter (only `/` and NUL are forbidden), and the walker imposes no
character policy on entry names.

## Findings

All verified against the real functions. Demonstrated inputs and the harness that shows
each are named.

| # | Finding | Severity | Lines | Harness | Fix locus |
|---|---|---|---|---|---|
| F1 | A filename with newlines injects markdown structure (a fake `## Hand additions` heading, instruction-shaped lines) into the map body; `extractHandAdditions` first-`indexOf` then promotes it into the curated section, persisting after the file is deleted | Critical | map.js:103,118,137; heuristic.js:238,266 | h1, h2 | scaffold map.js render escape + marker anchoring; enabling unsanitized path is SHARED heuristic |
| F2 | A planted `.seamstress/seam-map.md` is carried forward verbatim by `map` / `init --force`; a marker with no following `## ` slices to end of file | Critical | cli.js:27-29; map.js:137-142,169-175 | h2 | scaffold cli.js + map.js |
| F3 | `init` without `--force` leaves a planted map byte for byte untouched; the first agent read is entirely attacker content wearing a forged provenance line | High | cli.js:80-87 | h8 | scaffold cli.js |
| F4 | Legitimate hand additions containing a `## ` line are truncated on regeneration, breaking the "survives regeneration verbatim" promise for honest users | Medium | map.js:140-141 | h4 | scaffold map.js |
| F5 | An unreadable directory (EACCES) throws uncaught out of `scanRepo` and aborts the CLI; `readdirSync` is not wrapped the way `statSync` and `readFileSync` are | Medium | heuristic.js:226 | h7 | SHARED heuristic |
| F6 | `scanRepo` follows directory symlinks out of the target tree and reads files outside `repoPath` (deterministic across reruns); given the audit-a-strangers-repo use case this is a hostile-repo exfiltration surface (a planted symlink pulls out-of-tree file paths into a document the auditor's agent then reads) | Medium-High | heuristic.js:231,235-237 | h7 | SHARED heuristic |
| F7 | The `.gitignore` check is fooled by a negation (`!...`) or comment (`#...`) line: it reports "already ignores" and skips the real append, so session notes can stay trackable while the tool asserts protection | Low-Medium | cli.js:53 | h8 | scaffold cli.js |
| F8 | `penalty:non-runtime` leaks into the human-readable reason prose as a raw tag (no `SIGNAL_PHRASES` entry, not filtered out) | Low | map.js:100,109-111,5-31 | h4 | scaffold map.js; label originates in SHARED heuristic |
| F9 | The headline "Scanned N files" counts up to 100000 (sourceFileStats) while scanRepo scores only the first 5000; the capHit warning fires but the count overstates scored coverage | Low | heuristic.js:253,291; cli.js:32-33 | (read) | SHARED heuristic |

### Resolution status (2026-07-07)

All nine findings fixed, engine first where the shared heuristic was implicated, in two
engine commits and two scaffold commits. Each fix flips its audit harness from
exploit-demonstrated to refuted, or is pinned by a reversion-proven regression test.

| # | Status | Fixing commit(s) | Proof |
|---|---|---|---|
| F1 | Fixed | engine `25fef80` (report renderer), scaffold `be1d216` (map render escape + sentinel anchoring) | h1 flips (extract returns empty, no injected structure); engine `report-security.test.ts`; scaffold map sentinel/escape tests |
| F2 | Fixed | scaffold `be1d216` (sentinel-bounded extraction) | h2 flips (planted not carried); scaffold `extractHandAdditions` sentinel tests |
| F3 | Fixed | scaffold `be1d216` (unsigned map distrusted, Option 2) | h8 flips (planted overwritten, forged-safe gone); `F3: a planted unsigned map...` regression |
| F4 | Fixed | scaffold `be1d216` (falls out of sentinel anchoring) | `F4: ## subheading not truncated` and `F2/F4: ... survive regeneration` regressions |
| F5 | Fixed | engine `25fef80`, re-ported scaffold `be1d216` | h7 flips (EACCES no crash); `heuristic-security.test.ts` |
| F6 | Fixed | engine `25fef80`, re-ported scaffold `be1d216` | h7 flips (no out-of-tree read); `heuristic-security.test.ts` |
| F7 | Fixed | scaffold `be1d216` (exact-line gitignore semantics) | h8 flips (negation and comment lines now append correctly) |
| F8 | Fixed | scaffold `be1d216` (rendered as prose, filtered from reason) | h4 flips (tag no longer in prose) |
| F9 | Fixed | engine `25fef80` (scored-file count), re-ported scaffold `be1d216` | `heuristic-security.test.ts` (scanned versus total, reversion proven) |

All fixes held the engine gates: recall floor 6/6 unchanged, every benchmark entry
candidate set byte-identical to baseline (detection-neutral), full engine suite 210 and
full scaffold suite 49. The four new engine regressions and six new scaffold regressions
are reversion proven: they fail against pre-fix `643141f` / `9a8cadd` and pass on the fix.

Two implementation notes recorded during the fix. F4 is fixed by the same sentinel
anchoring as F2: extraction reads to the `end` sentinel, not the next `## `, so a user
note with its own `##` subheading survives. And an incidental catch surfaced while
fixing F7: the exact-line gitignore check also corrects the older newline-termination
edge, since it now normalizes on line boundaries.

### Engine-first note on F1 (checked and resolved)

The rendering-side fix for F1 (control-character neutralization on interpolation) and the
`extractHandAdditions` anchoring (F1, F2, F4) are scaffold-local in `map.js`. The enabling
condition was that the SHARED heuristic hands out an unsanitized `candidate.path`. Per the
adjudication, the engine's own report renderer was checked in the engine-fix session: its
**markdown** renderer (`renderSeamMap`) interpolated the same `candidate.path` raw and was
implicated (fixed in `25fef80` via `mdSafePath`); its **HTML** renderer was already safe,
passing every path through `escapeHtml` from the verification-gate self-audit, and was left
unchanged. The heuristic itself keeps returning the true path (a path is data); every
consumer that renders a path into a trusted document is responsible for neutralizing it.

### Honesty ceiling and residual (future item)

The hand-additions sentinels are a fixed public string, not a secret. They fix the parsing
hijack (F2), make a foreign or planted map visible and distrusted (F3), and guarantee the
generated sections an agent reads are always freshly rendered (a forged provenance line
never survives). What they do not do is cryptographically prove the tool wrote the map: an
attacker who reads the source can copy the sentinels into a planted map and have its
hand-additions block preserved. Closing that residual needs out-of-repo provenance state
(a record on the user's machine, keyed by repo and content, that a scanned repo cannot
write). That is recorded as a future item, out of scope for this fix session; the current
guarantee is stated so no reader over-trusts the sentinel.

## Refuted honestly (traced, did not reproduce)

- **Symlink-cycle stack-overflow crash** (Critic A's finding C, claimed as a RangeError):
  refuted. An ancestor or self cycle terminates via ELOOP / ENAMETOOLONG caught by the
  existing `statSync` try/catch; no crash. The real residue is F6 (escape), not a crash.
- **ReDoS on file content:** ruled out; bounded quantifiers, no nesting.
- **File content injecting markdown:** ruled out; only `candidate.path`, the fixed label
  set, and the numeric score reach the renderer, so a hostile file body cannot inject.
- **extractHandAdditions crashing:** ruled out; missing marker, missing next-section
  boundary, oversized body, and placeholder-equal body all degrade gracefully.
- **Arbitrary-line `.gitignore` injection:** ruled out; the append writes a fixed constant.
  Only the F7 false-negative stands.

## Recommendation per finding

The fixes are the next session, engine-first where the shared heuristic is implicated.
This audit finds and records; it does not fix.

- **F1, F2, F3:** fix before any wider distribution. These defeat the exact trust the
  session-continuity protocol places in the map.
- **F4:** fix (correctness bug hurting honest users; cheap, scaffold-local).
- **F5, F6, F7:** fix before wider distribution; F5 and F6 engine-first.
- **F8, F9:** accept or batch with the next heuristic pass; cosmetic and coverage, not
  security.

## Distribution gate: LIFTED (2026-07-07)

Wider distribution of the seam map CLI (Show HN, newsletters, install pushes) was gated on
**F1, F2, F3, F5, F6, and F7 landing.** All six landed with tests (engine `25fef80`,
scaffold `be1d216`), each proven by its audit harness flipping to refuted and by a
reversion-proven regression, so the gate is lifted. Two caveats survive the gate and belong
in any distribution copy: the sentinel is not a secret, so the residual above (an attacker
forging the sentinel to seed hand-additions) remains a future item; and the map's standing
advisory framing holds, since even a clean generation is signals, not verdicts.

## Cost

Trio: 119,496 subagent tokens (A 24,989 opus, B 57,312 sonnet, C 37,195 opus), 22 tool
uses, about five and a half minutes wall. The verification harness ran locally in Node:
zero Anthropic paid-pipeline calls and zero engine runs. The map CLI is free and local by
design, and the audit added no paid usage.
