// Renders a candidate list into .seamstress/seam-map.md. Pure: all inputs are
// arguments, so rendering is testable without a filesystem or a clock.

/** Plain language phrase for each heuristic signal label. */
const SIGNAL_PHRASES = {
  "path:webhook": "a webhook path",
  "path:payment": "payment vocabulary in the path",
  "path:payment-sdk": "a payment provider name in the path",
  "path:billing": "billing vocabulary in the path",
  "path:portal": "a portal path",
  "path:auth": "auth vocabulary in the path",
  "path:middleware": "a middleware path",
  "path:admin": "an admin path",
  "path:delete": "deletion vocabulary in the path",
  "path:secret": "credential vocabulary in the path",
  "path:role": "role or permission vocabulary in the path",
  "import:payment": "a payment SDK import",
  "api:payment": "payment API calls",
  "import:auth": "auth library usage",
  "server-action": "a server action directive",
  "kw:authorize/refund": "authorization or refund vocabulary",
  "kw:credential": "credential handling vocabulary",
  "kw:sql-destruct": "destructive SQL",
  "shape:db-delete": "a database delete",
  "shape:db-write": "a database write",
  "shape:access-branch": "permission branching",
  "shape:money-math": "money arithmetic",
  "shape:value-move": "a value moving call",
  "bonus:server": "server side location",
  "penalty:ui": "a user interface surface (penalized)",
};

/** Signal families for grouping. Grouping is signal derived, not judgment. */
const FAMILY = {
  "path:webhook": "money",
  "path:payment": "money",
  "path:payment-sdk": "money",
  "path:billing": "money",
  "path:portal": "money",
  "import:payment": "money",
  "api:payment": "money",
  "kw:authorize/refund": "money",
  "shape:money-math": "money",
  "shape:value-move": "money",
  "path:auth": "auth",
  "path:middleware": "auth",
  "path:admin": "auth",
  "path:secret": "auth",
  "path:role": "auth",
  "import:auth": "auth",
  "kw:credential": "auth",
  "shape:access-branch": "auth",
  "path:delete": "deletion",
  "kw:sql-destruct": "deletion",
  "shape:db-delete": "deletion",
  "shape:db-write": "data-write",
};

const GROUP_TITLES = {
  money: "Money path signals",
  auth: "Authorization signals",
  deletion: "Deletion signals",
  mixed: "Mixed signals",
};

/**
 * Dominant signal family for a candidate, from its fired signals.
 * @param {import("./heuristic/heuristic.js").Candidate} candidate
 * @returns {"money"|"auth"|"deletion"|"mixed"}
 */
export function inferGroup(candidate) {
  const tally = {};
  for (const hit of candidate.hits) {
    const family = FAMILY[hit];
    if (!family || family === "data-write") continue;
    tally[family] = (tally[family] ?? 0) + 1;
  }
  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "mixed";
  if (entries.length > 1 && entries[0][1] === entries[1][1]) return "mixed";
  return entries[0][0];
}

function phrase(label) {
  return SIGNAL_PHRASES[label] ?? label;
}

function joinPhrases(labels, joiner) {
  const phrases = labels.map(phrase);
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0];
  return phrases.slice(0, -1).join(", ") + ` ${joiner} ` + phrases[phrases.length - 1];
}

/** Reason line for a normal candidate: plain language, raw tags in parens. */
function reasonLine(candidate) {
  const labels = candidate.hits.filter((h) => h !== "bonus:server" && h !== "penalty:ui");
  const words = joinPhrases(labels, "and");
  const tags = [...candidate.hits, `score ${candidate.score}`].join(", ");
  return `- ${candidate.path}: ${words} (${tags})`;
}

/** Reason line for a safety net rescue: the rescue reasoning spelled out. */
function rescueLine(candidate) {
  const shapeLabels = candidate.hits.filter((h) => h.startsWith("shape:"));
  const keywordLabels = candidate.hits.filter(
    (h) => !h.startsWith("shape:") && h !== "bonus:server" && h !== "penalty:ui",
  );
  const lead =
    keywordLabels.length === 0
      ? "no keyword signals"
      : `keyword signals alone fell short (${joinPhrases(keywordLabels, "and")})`;
  const shapes = shapeLabels.map(phrase).join(" plus ");
  const tags = [...candidate.hits, `score ${candidate.score}`].join(", ");
  return `- ${candidate.path}: ${lead}, rescued by risk shape: ${shapes} (${tags})`;
}

/** The marker heading for the hand curated section preserved across regeneration. */
export const HAND_ADDITIONS_HEADING = "## Hand additions (preserved across regeneration)";

/** Placeholder shown when the hand additions section is empty. */
const HAND_ADDITIONS_HINT =
  "(none yet; entries you add under this heading survive regeneration verbatim)";

/**
 * Extract the hand additions section content from an existing map, so a
 * regeneration can carry it forward verbatim. Returns the section body
 * (without the heading) or an empty string when the marker is absent or the
 * section holds only the placeholder hint.
 * @param {string} markdown
 * @returns {string}
 */
export function extractHandAdditions(markdown) {
  const start = markdown.indexOf(HAND_ADDITIONS_HEADING);
  if (start === -1) return "";
  const afterHeading = start + HAND_ADDITIONS_HEADING.length;
  const nextSection = markdown.indexOf("\n## ", afterHeading);
  const body = markdown.slice(afterHeading, nextSection === -1 ? undefined : nextSection).trim();
  return body === HAND_ADDITIONS_HINT ? "" : body;
}

/**
 * Render the seam map markdown.
 * @param {import("./heuristic/heuristic.js").Candidate[]} candidates
 * @param {{ date: string, scannedFiles: number, capHit?: boolean, regenerateCommand?: string, handAdditions?: string }} options
 * @returns {string}
 */
export function renderMap(candidates, options) {
  const regen = options.regenerateCommand ?? "npx seam-scaffold map";
  const lines = [
    "# Seam map",
    "",
    `Generated by seam-scaffold on ${options.date} (heuristic extracted from`,
    "SeamStressDev/seamstress@643141f). This map is advisory, never authoritative:",
    "it marks where the heuristic sees seam signals. It cannot see design intent,",
    "and a file it missed can still be a seam. Groupings are heuristic signal",
    "families, not judgment. The Hand additions section survives regeneration",
    "verbatim; curate it freely.",
    `Regenerate with: ${regen}`,
    "",
    `Scanned ${options.scannedFiles} source files.` +
      (options.capHit ? " The scan file cap was hit; this map may be incomplete." : ""),
    "",
  ];

  const handAdditions = (options.handAdditions ?? "").trim();
  const handSection = [
    HAND_ADDITIONS_HEADING,
    "",
    handAdditions === "" ? HAND_ADDITIONS_HINT : handAdditions,
    "",
  ];

  if (candidates.length === 0) {
    lines.push(
      "No files met the seam criteria. This means the heuristic found none, not",
      "that none exist: a seam hidden in a generically named file with no signals",
      "can slip a pattern filter. If you know where your money, auth, tenant, or",
      "deletion boundaries are, add them under Hand additions below.",
      "",
    );
    lines.push(...handSection);
    return lines.join("\n");
  }

  const rescued = candidates.filter((c) => c.viaSafetyNet);
  const normal = candidates.filter((c) => !c.viaSafetyNet);

  const groups = { money: [], auth: [], deletion: [], mixed: [] };
  for (const c of normal) groups[inferGroup(c)].push(c);

  for (const key of ["money", "auth", "deletion", "mixed"]) {
    if (groups[key].length === 0) continue;
    lines.push(`## ${GROUP_TITLES[key]}`, "");
    for (const c of groups[key]) lines.push(reasonLine(c));
    lines.push("");
  }

  if (rescued.length > 0) {
    lines.push("## Rescued by risk shape (signal light, structurally risky)", "");
    for (const c of rescued) lines.push(rescueLine(c));
    lines.push("");
  }

  lines.push(...handSection);

  lines.push(
    "## Not on this map",
    "",
    "Files below the signal threshold are not listed. That means the heuristic",
    "found no signals, not that no seams exist. UI surfaces are penalized by",
    "design, and a seam in a generically named file with no signals can slip a",
    "pattern filter. Add known seams under Hand additions above; the map is",
    "yours, the generator only drafts it.",
    "",
  );

  return lines.join("\n");
}
