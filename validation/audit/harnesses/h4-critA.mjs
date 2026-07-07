import { mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { scanRepo } from "../../../src/heuristic/heuristic.js";
import { renderMap, extractHandAdditions } from "../../../src/map.js";

// --- Finding C: ancestor-pointing directory symlink, no source files in subtree ---
const repo = "./symrepo";
rmSync(repo, { recursive: true, force: true });
mkdirSync(repo + "/sub", { recursive: true });
symlinkSync("../..", repo + "/sub/loop", "dir");  // resolves to a real ancestor dir
process.stdout.write("Finding C (symlink cycle): ");
try { const cs = scanRepo(repo); console.log("no crash, candidates:", cs.length); }
catch (e) { console.log("CRASH ->", e.constructor.name + ":", e.message.slice(0, 50)); }
rmSync(repo, { recursive: true, force: true });

// --- Finding B: legit hand additions containing a "## " subheading, truncated ---
const md =
  "## Hand additions (preserved across regeneration)\n" +
  "Notes about billing.\n" +
  "## Tenant boundaries\n" +
  "lib/tenant.ts is a seam.\n" +
  "## Not on this map\n";
const carried = extractHandAdditions(md);
console.log("Finding B (subheading truncation): carried =", JSON.stringify(carried));
console.log("  -> lost 'lib/tenant.ts is a seam'?", !carried.includes("tenant.ts"));

// --- Finding D1: penalty:non-runtime leaks into prose ---
const cand = { path: "payment/webhook.test.js", score: 3,
  hits: ["path:payment", "path:webhook", "penalty:non-runtime"], viaSafetyNet: false };
const out = renderMap([cand], { date: "d", scannedFiles: 1 });
const line = out.split("\n").find(l => l.includes("webhook.test.js"));
console.log("Finding D1 (non-runtime leak): ", JSON.stringify(line));
console.log("  -> raw tag in prose?", /and penalty:non-runtime \(/.test(line));
