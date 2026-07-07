# How the protocols compose

When one action triggers more than one protocol, run all of them. Satisfying one never
discharges another. When their instructions conflict, the order of authority is:

1. **Irreversible Gate wins.** If an action is in the irreversible class, it stops and
   waits for the human, no matter what any other protocol permits. Seam Change Protocol's
   "apply" language never authorizes an action the Irreversible Gate names. A schema
   migration touching a seam file is gated by BOTH: seam questions first, then the gate's
   stop.
2. **Verification Discipline applies to everything,** including statements made while
   satisfying the other protocols. An invariant stated for the Seam Change Protocol is a
   claim; the honesty rules cover it.
3. **Overrides are per protocol and per session.** Overriding one protocol leaves the
   others fully armed. No override survives the session that granted it (see each
   protocol's Override section).
