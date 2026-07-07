import { mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { scanRepo } from "../../../src/heuristic/heuristic.js";

// Isolated: a clean repo with ONE payment file, plus a symlink escaping upward
// to a sibling tree that holds "secret" source outside the audited repo.
const root = "./escape-test";
rmSync(root, { recursive: true, force: true });
mkdirSync(root + "/target/src", { recursive: true });
mkdirSync(root + "/outside", { recursive: true });
writeFileSync(root + "/target/src/checkout.js", "import Stripe from 'stripe';\n");
writeFileSync(root + "/outside/secret-payment.js", "webhook billing charge\n");
symlinkSync("../../outside", root + "/target/link", "dir");  // escapes target/

const cs = scanRepo(root + "/target");
console.log("candidates from scanning target/ (should be 1 if no escape):", cs.length);
for (const c of cs) console.log("  ", c.path, "| escapes target?", c.path.includes(".."));
rmSync(root, { recursive: true, force: true });

// Refute the crash claim precisely: deep ancestor cycle -> terminates how?
const repo = "./cyc";
rmSync(repo, { recursive: true, force: true });
mkdirSync(repo + "/sub", { recursive: true });
symlinkSync("../..", repo + "/sub/loop", "dir");
process.stdout.write("ancestor-cycle result: ");
try { const cs2 = scanRepo(repo); console.log("terminated, no crash (", cs2.length, "candidates)"); }
catch (e) { console.log("threw", e.constructor.name); }
rmSync(repo, { recursive: true, force: true });
