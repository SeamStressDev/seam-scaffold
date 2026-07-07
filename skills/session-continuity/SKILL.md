---
name: session-continuity
description: Use this protocol at the start of every session in a scaffolded repository, before making any change, and again at the end of the session or before context is lost. Applies to resumed work, handoffs between sessions, and any moment where the agent is acting on a codebase it did not just finish reading.
---

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
[catalog 003](https://github.com/SeamStressDev/seam-bug-catalog#3-idempotency-key-covers-only-one-of-two-charge-paths)
was two files, each fine, written apart. Continuity notes do
not make sessions share a brain; they make each session start where the last one actually
stopped, instead of where it plausibly stopped.

## What this protocol cannot do

It cannot summarize what a session did not understand. A note written by a session that
missed the seam bug will hand the next session the same miss, with added confidence. The
note transfers attention, not correctness; the
[verification protocol](../verification-discipline/SKILL.md) is what keeps the contents
honest, and the map is what keeps attention pointed at the right files.
