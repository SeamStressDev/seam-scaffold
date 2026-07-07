import { mkdirSync, writeFileSync, rmSync, symlinkSync, realpathSync } from "node:fs";
import { scanRepo } from "../../../src/heuristic/heuristic.js";

const root = realpathSync(".") + "/escape2";
rmSync(root, { recursive: true, force: true });
mkdirSync(root + "/target/src", { recursive: true });
mkdirSync(root + "/secrets", { recursive: true });
writeFileSync(root + "/target/src/checkout.js", "import Stripe from 'stripe';\n");
writeFileSync(root + "/secrets/private-auth.js", "webhook payment billing charge admin\n");
// absolute symlink target so there is no ambiguity: target/leak -> <root>/secrets
symlinkSync(root + "/secrets", root + "/target/leak", "dir");

const cs = scanRepo(root + "/target");
console.log("candidates scanning target/:");
for (const c of cs) console.log("  ", JSON.stringify(c.path));
console.log("escaped-and-read the out-of-tree secret?",
  cs.some(c => c.path.includes("private-auth")));
rmSync(root, { recursive: true, force: true });
