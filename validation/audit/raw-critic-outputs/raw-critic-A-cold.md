# Critic A (cold, opus) — raw output

Framing given: "review this code for correctness and safety", no injection framing.

## A. Heading injection via crafted file path corrupts the map and hijacks the "preserved" Hand additions round-trip — HIGH
- heuristic.js:226-241 (listSourceFiles pushes raw readdirSync entry names), heuristic.js:201-207 (scoreSource stores path verbatim), map.js:103 (reasonLine) and map.js:118 (rescueLine) interpolate candidate.path with no escaping, map.js:136-143 (extractHandAdditions) parses with indexOf.
- Trigger: a file named `webhook\n## Hand additions (preserved across regeneration)\n\nFORGED\n.js` (POSIX filenames may contain any byte but / and NUL; extname -> .js; /webhook/i gives score 3).
- Embedded newline breaks the one-candidate-per-line format and injects a real `## Hand additions` heading before the genuine section. Next run, extractHandAdditions indexOf returns the first (injected) occurrence, slices to next `\n## ` (the real heading). User's real additions dropped; attacker text carried forward as "preserved verbatim".

## B. Legitimate Hand additions containing a `## ` line are silently truncated on regeneration — MEDIUM
- map.js:140-141: nextSection = indexOf("\n## ", afterHeading); body = slice(afterHeading, nextSection).
- Trigger: a user note under Hand additions that includes a level-2 heading (e.g. "## Tenant boundaries").
- Body is cut at the subheading; that line and everything after permanently lost on regeneration, contradicting the "survives regeneration verbatim" promise (map.js:122, 160-161).

## C. Directory-symlink cycle causes unbounded recursion / stack-overflow crash — MEDIUM
- heuristic.js:224-242 listSourceFiles: statSync follows symlinks; recursion; only guard is acc.length >= cap.
- Trigger: a directory symlink pointing at an ancestor, e.g. `sub/loop -> ../..`, in a subtree with no scannable files.
- Claim: statSync succeeds, recurses endlessly, cap never fires because acc never grows -> RangeError stack overflow.

## D1. penalty:non-runtime leaks into human-readable reason text as a raw tag — LOW
- map.js:100 reasonLine filters only bonus:server and penalty:ui; map.js:109-111 rescueLine filters shape:*, bonus:server, penalty:ui. Neither excludes penalty:non-runtime; SIGNAL_PHRASES has no entry so phrase() returns the raw label.
- Trigger: `payment/webhook.test.js` -> payment(3)+webhook(3)=6, -3 non-runtime = 3.
- Renders "... and penalty:non-runtime" inside the prose sentence.

## D2. File-cap headline overstates what was actually scored — LOW
- heuristic.js:253 scanRepo cap 5000 vs heuristic.js:291 sourceFileStats cap 100000; cli.js:31-33 headline from stats.total; map.js:164-165.
- Repo with >5000 scannable files: map says "Scanned N" while scanRepo scored only first 5000 in traversal order.

## Non-defects noted
- No ReDoS (bounded quantifiers, no nesting).
- readFileSync utf8 always string, split cannot throw.
- inferGroup only returns the four known keys.
- Self-referential ELOOP symlinks correctly caught.
