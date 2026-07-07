---
name: fixture-immutability
description: Use this protocol whenever a test fails after a change, whenever editing test files, test fixtures, expected outputs, snapshots, or scoring criteria, and whenever the temptation exists to make a red check green by touching the check instead of the code.
---

# Fixture Immutability

## What this is

Tests, fixtures, snapshots, and expected outputs are evidence. They are the recorded
promises the code has made. Editing evidence to match new behavior is sometimes correct,
because promises legitimately change. But the decision that a promise has changed belongs
to the human, in words, every time. An agent that quietly adjusts a test to pass has not
fixed anything; it has destroyed the witness.

## Trigger

- A test fails after your change
- You are about to edit any test, fixture, snapshot, expected output, or scoring rule
- You notice that changing an assertion would be easier than changing the code

## Required behavior

**1. A red test is information first.** Before touching anything, state what the test is
protecting and why it went red: the code broke the promise, or the promise changed. These
are the only two options and they have opposite fixes.

**2. If the code broke the promise, fix the code.** The test does not move.

**3. If the promise changed, the human says so in words, for this test, this session.**
Present it plainly: this test pins behavior X, the change makes behavior Y, updating the
test means the promise is now Y. Wait for explicit agreement before editing the test,
and quote the agreement when acting on it. A general remark from a past session ("just
update tests going forward") is policy, not agreement; each changed promise gets its own
yes. "The test was outdated" is a conclusion only the human can reach, and only about a
test they were shown.

**4. New tests get the same scrutiny in reverse.** A test written to pass against the
current code proves nothing unless it would fail against the broken version. When
pinning a fix, show what the test fails on: run it against the broken state and paste
the red output. A described failure is a hypothesis; a shown failure is a witness. If it
cannot fail, it is not a witness, it is decoration. (The engine's own pinning tests are
reversion proven: revert the fix, watch them go red. That is the standard.)

**5. Never delete a failing test to unblock work.** Skipping with a linked reason and a
human sign off is honest; deletion is evidence tampering.

## Override

The human can rule "the spec changed, update the test" at any time; that ruling IS the
protocol working, not an exception to it. What has no override is silence: the one
forbidden move is a test edited to green without the promise change being said out loud.

## Why this exists

The engine this scaffold comes from holds its own fixes to a
[reversion proof standard, documented publicly](https://github.com/SeamStressDev/seamstress/blob/main/examples/README.md):
revert the fix and the pinning test goes red. That standard encodes the rule this
protocol enforces: evidence only counts while the thing being scored cannot move it. The
same failure shape appears in everyday AI assisted sessions constantly, and it is rarely
malicious: an agent optimizing for a green suite will find the shortest path to green,
and sometimes the shortest path is through the referee.

## What this protocol cannot do

It cannot tell which promises deserve to survive. Codebases carry outdated tests pinning
behavior nobody wants, and keeping those green is preservation of error. The protocol
only guarantees the change of promise is a decision someone made on purpose, visibly.
Which promises to keep is the product; that judgment stays human.
