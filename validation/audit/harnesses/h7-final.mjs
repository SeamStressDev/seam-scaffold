import { mkdirSync, writeFileSync, rmSync, symlinkSync, chmodSync, realpathSync } from "node:fs";
import { scanRepo } from "../../../src/heuristic/heuristic.js";

// --- 3b: unreadable directory (EACCES) crashes the scan? ---
const r1 = realpathSync(".") + "/eacces";
rmSync(r1, { recursive: true, force: true });
mkdirSync(r1 + "/locked", { recursive: true });
writeFileSync(r1 + "/locked/x.js", "payment\n");
chmodSync(r1 + "/locked", 0o000);  // no read/traverse
process.stdout.write("3b EACCES dir: ");
try { const cs = scanRepo(r1); console.log("no crash,", cs.length, "candidates"); }
catch (e) { console.log("CRASH ->", e.code || e.constructor.name, "(uncaught out of scanRepo)"); }
chmodSync(r1 + "/locked", 0o755); rmSync(r1, { recursive: true, force: true });

// --- symlink escape, fully instrumented ---
const r2 = realpathSync(".") + "/esc3";
rmSync(r2, { recursive: true, force: true });
mkdirSync(r2 + "/target/src", { recursive: true });
mkdirSync(r2 + "/outside", { recursive: true });
writeFileSync(r2 + "/target/src/ok.js", "hello\n");
writeFileSync(r2 + "/outside/leak-auth-payment.js", "webhook payment admin\n");
symlinkSync(r2 + "/outside", r2 + "/target/portal", "dir");
const cs = scanRepo(r2 + "/target");
console.log("escape: candidates =", JSON.stringify(cs.map(c => c.path)));
console.log("escape: read the out-of-tree file?", cs.some(c => c.path.includes("leak-auth")));
rmSync(r2, { recursive: true, force: true });
