# Why seams

A seam is a boundary where money, authorization, tenant isolation, or deletion cross
between parts of a codebase. Seam bugs are coherence failures: each piece looks correct,
the combination is not. They do not crash. They double charge, they skip one auth check,
they serve one tenant's data to another, and they render as success.

AI assisted development manufactures exactly the condition seam bugs need: many short
sessions, each fast, each locally correct, none holding the whole. The code accumulates;
the understanding resets every session.

Most mistakes in a coding session cost an undo. A small number cost a customer, a
database, or a reputation. The protocols in this repository add friction at exactly
those places and leave everything else alone.

The bug class is documented, with real public incidents, in the
[Seam Bug Catalog](https://github.com/SeamStressDev/seam-bug-catalog). The analysis
tool that reads a codebase's seams and reports only what it can prove, quoting the
exact lines, is the [SeamStress engine](https://github.com/SeamStressDev/seamstress).
