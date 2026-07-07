# SeamStress Scaffold

Training wheels for AI assisted coding.

The mission: make the seam discipline free and installable, so that anyone shipping AI
assisted code gets the judgment habits before they get the incident.

A seam is a boundary where money, authorization, tenant isolation, or deletion cross
between parts of a codebase. Seam bugs are coherence failures: each piece looks correct,
the combination is not. They do not crash. They double charge, they skip one auth check,
they serve one tenant's data to another, and they render as success. AI assisted
development manufactures the exact condition they need: many fast sessions, each locally
correct, none holding the whole. The class is documented, with real public incidents, in
the [Seam Bug Catalog](https://github.com/SeamStressDev/seam-bug-catalog).

This repository installs five behavior protocols into a coding agent. Routine code gets
no friction. Seam code gets questions.

## The five protocols

Each protocol is a Claude Code skill in [`skills/`](skills/), with translations for
other tools in [`adapters/`](adapters/).

- [Seam Change Protocol](skills/seam-change-protocol/SKILL.md): before touching seam
  code, read the neighbors, state the invariant in words, state the specific way this
  edit could break it, and bring the pinning test with the change.
- [Irreversible Gate](skills/irreversible-gate/SKILL.md): actions that cannot be cheaply
  undone stop and wait for the human, every time, with the blast radius and the undo
  named first.
- [Verification Discipline](skills/verification-discipline/SKILL.md): claims about code
  quote the code, claims about behavior show the run, and unproven claims wear a label.
- [Fixture Immutability](skills/fixture-immutability/SKILL.md): tests are evidence, and
  a red test is never edited to green unless the human says in words that the promise
  changed.
- [Session Continuity](skills/session-continuity/SKILL.md): every session starts by
  reading the seam map and the last session's note, and ends by leaving the note it
  would want to find.

When protocols overlap, they compose by a fixed rule: run all, Irreversible Gate wins.
See [skills/README.md](skills/README.md).

## What this is not

Not a scanner, not a linter, not a guarantee. The protocols force the questions a
careful reviewer would ask at a dangerous boundary; they cannot supply the judgment that
answers them. Judgment cannot be automated, and this project says so instead of
pretending otherwise. Every protocol ends with a section called What this protocol
cannot do. Those sections are load bearing; read them.

## What ships in v1

Stated openly: this release is the seam map (Layer 1, coming) and the protocols
(Layer 2, in this repository now). Mechanical gates and graduation are roadmapped, not
shipped.

## Install

One step: copy the skills into the project where your agent works.

```bash
mkdir -p /path/to/your/repo/.claude/skills
cp -r skills/* /path/to/your/repo/.claude/skills/
```

Claude Code discovers each protocol from `.claude/skills/<name>/SKILL.md` and loads it
when its trigger matches. Skills are discovered at session start, so a session already
running when you copy them in will not see them until the next session. To install for
every project on your machine, copy into `~/.claude/skills/` instead.

Using Cursor: see [adapters/CURSOR-RULES.md](adapters/CURSOR-RULES.md). Using another
agent that reads a root AGENTS.md: see [adapters/AGENTS.md](adapters/AGENTS.md).

## Measured accuracy

The seam map generator (`seam-scaffold init`) was measured against real public
code, with the method, the raw tables, and every noise judgment quoted in
[validation/map-accuracy/](validation/map-accuracy/). What the measurement
supports at its small n: all 6 ground truth files from the two testable catalog
incidents landed on the generated maps (recall n=2, and eleven of thirteen
catalog cases are not testable because the code was never public); the top of
the map is strong (40 of 40 top scored candidates across two live SaaS repos
were files a seam reviewer would open, and 0 of 13 sampled candidates at score
6 and up were noise); the flood lives in the low score band (25% and 43%
sampled noise at scores 3 to 5, which holds most candidates); and the risk
shape safety net rescued 64 of 72 real seam adjacent files that keyword
signals missed. These are characterizations of this generator on four pinned
inputs, not reliability rates, and the map header says the same thing the
measurement does: advisory, never authoritative.

The generator reads arbitrary, possibly hostile repositories, so its
untrusted-input surface was audited by a blind cross-model trio and the findings
fixed; the method, the findings, and the reproduction harnesses are in
[validation/audit/](validation/audit/). One residual is recorded there as a
future item: the marker that preserves hand-curated map entries is not a secret,
so treat a map you did not write yourself as advisory like the rest of it.

## Honest limits

These protocols are text an agent reads, not code that runs. An agent can follow them
faithfully, follow them mechanically, or drift from them late in a long session, and a
markdown file cannot prevent the last two. They have now been probed against live
headless sessions, one probe per protocol: four governed their sessions cleanly, and
one (fixture immutability) was followed in substance but violated in order, the test
edited before the required wait. The transcripts and the scoreboard, misses included,
are in [validation/](validation/). One run per protocol is a demonstration, not a
reliability rate, so the claim stays modest: these encode lessons from documented
failures, not a measurable guarantee of prevention. The
judgment they demand stays yours: a protocol can make an agent ask whether a tradeoff
was deliberate, but only you know the answer.

## Related

- [SeamStress engine](https://github.com/SeamStressDev/seamstress): the analysis tool
  this discipline comes from. It reads a repo's seams and reports only what it can
  prove, quoting the exact lines.
- [Seam Bug Catalog](https://github.com/SeamStressDev/seam-bug-catalog): the documented
  incidents that the protocols' required steps trace to.
- [Why seams](docs/why-seams.md): the short version of what a seam is and why AI
  assisted code concentrates bugs there.
- [The verification gate self audit](https://dev.to/seamstress/i-pointed-my-code-reviewer-at-its-own-verifier-it-found-two-ways-to-lie-57bc):
  the write up of the engine auditing its own proof discipline before launch.

## License

MIT. See [LICENSE](LICENSE).
