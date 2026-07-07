// Extracted from SeamStressDev/seamstress src/engine/heuristic.ts at commit 25fef80
// (trio-audit security fixes: readdirSync robustness, directory-symlink
// containment, and scored-file count) and
// ported from TypeScript to JSDoc typed JavaScript. Relicensed MIT by the
// copyright holder for this scaffold copy; the engine's AGPL copy remains
// authoritative for the engine. Copyright (c) 2026 SeamStress contributors.
// If this copy and the engine's start needing parallel changes often, the escape
// hatch is a shared package both consume; until then the parity fixtures in
// test/fixtures/ keep the copies honest.

/**
 * The cheap heuristic pre-filter (free, no LLM, no network).
 *
 * Scans a repo's source files for candidate seam signals and emits a ranked
 * candidate list. It does not decide what IS a seam; it bounds where a careful
 * reader should look. Two refinements carried in from the engine's Phase 2
 * validation:
 *
 * 1. SERVER SCOPE: real seams live in server code (actions/api/lib/middleware/
 *    auth); the false positives were UI surfaces that merely trigger a server
 *    operation. Server paths get a bonus and pure UI files a penalty.
 *
 * 2. CONTENT SAFETY NET: the heuristic is itself a pattern matcher, so a
 *    signal light seam (real money/auth/deletion logic with none of the obvious
 *    keywords or imports) would slip a keyword filter. A separate risk shape
 *    pass (DB writes/deletes, permission branches, money arithmetic, payment
 *    calls) rescues such files even with a zero keyword score.
 */

import { readFileSync, readdirSync, statSync, lstatSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";

/** Source extensions we scan, broad enough for non JS stacks. */
const SOURCE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rb", ".go", ".php", ".java", ".cs", ".rs", ".ex", ".exs",
]);

/** Directories never worth scanning. */
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "out", "coverage",
  "vendor", "venv", ".venv", "__pycache__", ".turbo", "tmp", "public", "assets",
  "migrations", // generated schema diffs, never a seam, pure noise
]);

/**
 * Backend language extensions. Files in these languages are inherently server
 * side (the "UI surface that only triggers a server op" false positive class is
 * a JS/TSX phenomenon), so they earn the server bonus directly.
 */
const BACKEND_EXTENSIONS = new Set([
  ".py", ".rb", ".go", ".php", ".java", ".cs", ".rs", ".ex", ".exs",
]);

/**
 * A scored candidate file.
 * @typedef {Object} Candidate
 * @property {string} path Repo relative path.
 * @property {number} score Total heuristic score.
 * @property {string[]} hits The signals that fired, for transparency.
 * @property {number} lines Line count.
 * @property {boolean} viaSafetyNet True when the file only cleared the bar via the content safety net.
 */

/** @typedef {[RegExp, number, string]} Signal pattern, weight, label */

/** Keyword/name signals matched against the repo relative path. @type {Signal[]} */
const PATH_SIGNALS = [
  [/webhook/i, 3, "path:webhook"],
  [/payment|checkout|charge|invoice/i, 3, "path:payment"],
  [/stripe|paypal|braintree/i, 2, "path:payment-sdk"],
  [/billing|subscription/i, 2, "path:billing"],
  [/portal/i, 1, "path:portal"],
  [/\bauth|login|session|oauth|jwt/i, 2, "path:auth"],
  [/middleware/i, 2, "path:middleware"],
  [/admin/i, 2, "path:admin"],
  [/delete|destroy|remove/i, 1, "path:delete"],
  [/password|token|secret|credential/i, 1, "path:secret"],
  [/role|permission|policy|guard/i, 2, "path:role"],
];

/** Import/keyword signals matched against file content. @type {Signal[]} */
const CONTENT_SIGNALS = [
  [/from ["']stripe["']|new Stripe\(|import stripe|require\(["']stripe["']\)/i, 3, "import:payment"],
  [/stripe\.(checkout|billingPortal|subscriptions|paymentIntents|charges|refunds)/i, 3, "api:payment"],
  // Auth idioms across stacks, JS libs AND Python/Ruby/DRF/Go conventions, so
  // the content signal is not blind to non JS auth.
  [/next-auth|getServerSession|passport|devise|omniauth|from ["']@?\/?auth["']|authlib|jsonwebtoken|import jwt|jwt\.(decode|encode)|authenticate\(|set_password|check_password|permission_classes|IsAuthenticated|@login_required|before_action|current_user|request\.user/i, 2, "import:auth"],
  [/"use server"|'use server'/, 1, "server-action"],
  // "authoriz" not preceded by "un" (so "unauthorized" in error handling does not
  // fire), and RLS on word boundaries only (so the letters inside "URLs" do not).
  [/(?<!un)authoriz|refund|chargeback|\bRLS\b|row.level.security/i, 2, "kw:authorize/refund"],
  [/password|bcrypt|argon2|hashpw|set_password/i, 1, "kw:credential"],
  // TRUNCATE only in statement shape (TRUNCATE TABLE / TRUNCATE ONLY), so the
  // bare word (e.g. a CSS utility class) does not fire.
  [/DELETE FROM|DROP TABLE|TRUNCATE\s+(TABLE|ONLY)\b/i, 2, "kw:sql-destruct"],
];

/**
 * Risk SHAPE signals for the content safety net: structural patterns that
 * indicate a high risk operation even with no obvious keyword. Each firing is
 * one "risk shape"; a non UI file matching >= 2 is rescued as a candidate.
 * @type {Signal[]}
 */
const RISK_SHAPES = [
  [/\b(DELETE FROM|\.delete\(|\.deleteMany\(|\.destroy\b|\.remove\(|\.drop\()/i, 1, "shape:db-delete"],
  [/\b(INSERT INTO|UPDATE \w+ SET|\.create\(|\.update\(|\.save\(|\.insert\()/i, 1, "shape:db-write"],
  [/\bif\b[^\n]{0,80}\b(role|permission|owner|is_?admin|is_?staff|can_|allowed|authorize|access|current_?user)\b|permission_classes\s*=|before_action|@login_required|check_object_permissions|IsAuthenticated/i, 1, "shape:access-branch"],
  [/\b(balance|amount|price|total|cost|credits?|quota|wallet)\b[^\n]{0,40}[-+*/]=?/i, 1, "shape:money-math"],
  [/\b(charge|capture|payout|transfer|debit|credit)\b[^\n]{0,40}\(/i, 1, "shape:value-move"],
];

/** Server side path markers. */
const SERVER_PATH = /(^|\/)(actions?|api|routes?|controllers?|services?|handlers?|lib|server|middleware|auth|webhooks?|jobs?|tasks?|workers?|models?|db|database|repositories|resolvers|graphql|usecases?|domain)(\/|\.|$)/i;

/**
 * Pure UI markers: front end surfaces that only TRIGGER server operations,
 * the main false positive source. Restricted so it does not catch server files
 * that happen to contain "view" (e.g. Django views.py).
 */
const UI_PATH = /(^|\/)(components?|ui|widgets?)\//i;
const UI_FILE = /(^|\/)(page|layout|loading|error|not-found|template|index)\.(t|j)sx$/i;
const UI_EXT = new Set([".html", ".erb", ".vue", ".svelte", ".hbs", ".ejs", ".haml"]);

/**
 * Non runtime paths: tests, type only files, seeds, stories, and email
 * templates. They carry domain vocabulary without deciding runtime outcomes,
 * so they take the same score penalty as UI surfaces in keyword/path scoring.
 * The penalty applies to keyword/path scoring only: the risk shape safety net
 * evaluates these files unpenalized, so a genuinely risk shaped test file
 * remains rescuable (see scoreSource).
 */
const NON_RUNTIME_PATH = /(^|\/)(tests?|__tests__|e2e|specs?|stories|storybook|seeds?|templates)\//i;
const NON_RUNTIME_FILE = /\.(test|spec|stories)\.[a-z]+$|\.types\.[a-z]+$/i;

/**
 * Is this file test, type only, seed, story, or template material?
 * @param {string} path
 * @returns {boolean}
 */
function isNonRuntimeFile(path) {
  return NON_RUNTIME_PATH.test(path) || NON_RUNTIME_FILE.test(path);
}

/** Default score a file must reach to become a candidate. */
export const DEFAULT_CANDIDATE_THRESHOLD = 3;
/** Default cap on files scored, as a runaway guard on huge repos. */
export const DEFAULT_MAX_FILES = 5000;
/** Risk shapes a non UI file must hit to be rescued by the safety net alone. */
export const SAFETY_NET_MIN_SHAPES = 2;

/**
 * Is this file a pure UI surface (penalized, never server bonused)?
 * @param {string} path
 * @returns {boolean}
 */
function isUiFile(path) {
  return UI_PATH.test(path) || UI_FILE.test(path) || UI_EXT.has(extname(path));
}

/**
 * Score one file's source. PURE and exported so scoring is unit testable
 * without touching the filesystem.
 * @param {string} path
 * @param {string} content
 * @returns {Candidate}
 */
export function scoreSource(path, content) {
  const hits = [];
  let score = 0;

  for (const [re, w, label] of PATH_SIGNALS) if (re.test(path)) { score += w; hits.push(label); }
  for (const [re, w, label] of CONTENT_SIGNALS) if (re.test(content)) { score += w; hits.push(label); }

  const ui = isUiFile(path);
  const nonRuntime = !ui && isNonRuntimeFile(path);
  if (ui) {
    score -= 3; // push UI trigger surfaces below threshold
    hits.push("penalty:ui");
  } else if (nonRuntime) {
    score -= 3; // tests/types/seeds/stories/templates score like UI in the keyword pass
    hits.push("penalty:non-runtime");
  } else if (SERVER_PATH.test(path) || BACKEND_EXTENSIONS.has(extname(path))) {
    // server code is where real seams live, by JS path convention OR by being
    // written in a backend language (generalizes off the JS stack)
    score += 2;
    hits.push("bonus:server");
  }

  // Content safety net: count risk shapes; rescue signal light non UI files.
  let shapes = 0;
  for (const [re, , label] of RISK_SHAPES) {
    if (re.test(content)) { shapes += 1; hits.push(label); }
  }
  const rescued = !ui && shapes >= SAFETY_NET_MIN_SHAPES;
  if (rescued) {
    score += shapes; // lift to candidacy on structural risk alone
    // The safety net evaluates non runtime files unpenalized: a rescued
    // test/seed/template gets the keyword pass penalty returned, so rescue
    // behaves the same with or without the non runtime classification.
    if (nonRuntime) score += 3;
  }

  return {
    path,
    score,
    hits,
    lines: content.split("\n").length,
    viaSafetyNet: rescued && score - shapes < DEFAULT_CANDIDATE_THRESHOLD,
  };
}

/**
 * Options for {@link scanRepo}.
 * @typedef {Object} ScanOptions
 * @property {number} [threshold] Candidate threshold (default DEFAULT_CANDIDATE_THRESHOLD).
 * @property {number} [maxFiles] Cap on files scanned, as a runaway guard on huge repos.
 */

/**
 * Recursively list scannable source files under a directory.
 * @param {string} root
 * @param {string} dir
 * @param {string[]} acc
 * @param {number} cap
 */
function listSourceFiles(root, dir, acc, cap) {
  if (acc.length >= cap) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // unreadable directory (EACCES, ENAMETOOLONG, ...): skip, never abort
  }
  for (const entry of entries) {
    if (acc.length >= cap) return;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue; // broken symlink etc.: skip, never abort the scan
    }
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
      // Do not follow directory symlinks: they can resolve outside the scan
      // root (reading files the caller never pointed at) or form cycles.
      // statSync above follows the link; lstatSync sees the link itself.
      let lst;
      try {
        lst = lstatSync(full);
      } catch {
        continue;
      }
      if (lst.isSymbolicLink()) continue;
      listSourceFiles(root, full, acc, cap);
    } else if (SOURCE_EXTENSIONS.has(extname(entry)) && !entry.endsWith(".d.ts")) {
      acc.push(full);
    }
  }
}

/**
 * Scan a repo directory and return the candidate seam files, ranked by score
 * (highest first). The free, LLM free first stage of detection.
 * @param {string} repoPath
 * @param {ScanOptions} [options]
 * @returns {Candidate[]}
 */
export function scanRepo(repoPath, options = {}) {
  const threshold = options.threshold ?? DEFAULT_CANDIDATE_THRESHOLD;
  const cap = options.maxFiles ?? DEFAULT_MAX_FILES;

  const files = [];
  listSourceFiles(repoPath, repoPath, files, cap);

  const scored = [];
  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue; // unreadable: skip, never abort
    }
    const candidate = scoreSource(relative(repoPath, file), content);
    if (candidate.score >= threshold) scored.push(candidate);
  }

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Read a candidate's real source.
 * @param {string} repoPath
 * @param {Candidate} candidate
 * @returns {string}
 */
export function readCandidateSource(repoPath, candidate) {
  return readFileSync(join(repoPath, candidate.path), "utf8");
}

/**
 * Count scannable source files and tally them by extension. Drives the map
 * headline. `scanned` is how many files scanRepo would actually score under
 * `maxFiles`; `total` is how many exist. They differ only past the cap, and the
 * headline reports `scanned` so it never claims to have scored files the cap
 * skipped.
 * @param {string} repoPath
 * @param {number} [maxFiles]
 * @returns {{ total: number, byExt: Record<string, number>, scanned: number }}
 */
export function sourceFileStats(repoPath, maxFiles = DEFAULT_MAX_FILES) {
  const files = [];
  listSourceFiles(repoPath, repoPath, files, 100_000);
  const byExt = {};
  for (const f of files) {
    const ext = extname(f);
    byExt[ext] = (byExt[ext] ?? 0) + 1;
  }
  return { total: files.length, byExt, scanned: Math.min(files.length, maxFiles) };
}

/**
 * Human friendly label for a candidate.
 * @param {Candidate} candidate
 * @returns {string}
 */
export function candidateLabel(candidate) {
  return basename(candidate.path);
}
