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

### Engine-first note on F1

The rendering-side fix for F1 (escape newlines and markdown metacharacters on
interpolation) and the `extractHandAdditions` anchoring (F1, F2, F4) are scaffold-local in
`map.js`. But the enabling condition is that the SHARED heuristic hands out an unsanitized
`candidate.path`. The engine's own report renderer consumes the same `candidate.path` from
the same `scanRepo`; it was not in this audit's scope, and it needs checking in the
engine-fix session for the same interpolation exposure.

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

## Distribution gate

Wider distribution of the seam map CLI (Show HN, newsletters, install pushes) is gated on
**F1, F2, F3, F5, F6, and F7 landing.** The protocols and the map's own advisory framing do
not cover this surface: a document an agent is told to trust first can currently be authored
by the repository under audit. Until the gate clears, the CLI is validated for local use on
repositories you trust, and the record above says why.

## Cost

Trio: 119,496 subagent tokens (A 24,989 opus, B 57,312 sonnet, C 37,195 opus), 22 tool
uses, about five and a half minutes wall. The verification harness ran locally in Node:
zero Anthropic paid-pipeline calls and zero engine runs. The map CLI is free and local by
design, and the audit added no paid usage.
