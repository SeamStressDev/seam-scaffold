---
name: irreversible-gate
description: "Use this protocol before executing any action that cannot be cheaply undone: pushing to a shared branch, deploying, running a database migration, deleting data or resources, sending an email or message, spending money or calling a paid API in bulk, publishing anything public, or rotating or revoking secrets. Load BEFORE the action, not after."
---

# Irreversible Gate

## What this is

Most mistakes in a coding session cost an undo. A small number cost a customer, a
database, or a reputation. This gate exists for the second kind. It adds friction to
exactly one class of action and leaves everything else alone.

The gate is a set of questions the human answers before the action runs. The questions
are short. The point is not the ceremony. The point is that irreversible mistakes are
almost always visible one minute before they happen, to anyone who actually looks.

## Trigger

Before executing any action in the irreversible class:

- **Push** to any default branch, or to any branch another person or system is known to
  consume (a teammate's checkout, a CI trigger, a deploy hook). Local commits are
  reversible; push is the line. Unsure whether anyone consumes the branch: gated.
- **Deploy** to any environment reachable by anyone outside this session, including
  staging with internal testers. An environment is "internal only" if no one but you can
  reach it; three beta users are users.
- **Migrate** a database schema, or run any bulk write against real data
- **Delete** data, files outside the working tree, branches on a remote, or cloud resources
- **Send** an email, message, or notification to a real person
- **Spend** money, or start a bulk run against a paid API
- **Publish** anything public: a package, a release, a post, a PR to someone else's repo
- **Rotate or revoke** secrets, keys, or access

If an action is not on this list but cannot be cheaply undone, it is on this list.

## Required behavior

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
push is exactly as irreversible as the first. A task instruction that names a gated
action ("commit this and push") brings the action to its gate; it does not skip it. The
instruction was given before these answers existed, and the human cannot have approved
answers they had not seen. Present the answers, then wait. Pre approval is different,
and it is deliberate: the human names the action as pre approved, in this session, in
so many words (see Override).

## Override

The human can name specific actions as pre approved ("pushes to my scratch branch are
fine today"). Blanket overrides of the whole class ("skip all gates") get one pushback
naming what becomes unguarded, then compliance and a note. The wheels belong to the rider.

Every override, named or blanket, expires when the session ends. It is scoped to the
session that granted it by construction, not by convention. At the start of a new
session, no override is live, regardless of what any prior note records; if the human
wants it again, they say it again, and the agent restates what becomes unguarded before
proceeding. A note that mentions a past override is history, not permission.

## Why this exists

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

## What this protocol cannot do

It cannot know where the irreversible line sits for a task it has never seen. New kinds of
work create new kinds of one way doors, and no list is complete. When you meet an action
this list did not anticipate, the question is not "is it on the list." The question is
"can I cheaply undo this," and if the answer takes more than a breath to produce, treat it
as gated. The list is the floor, not the boundary.
