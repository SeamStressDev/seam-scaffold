import { extractHandAdditions, renderMap } from "../../../src/map.js";
// crash attempts on extractHandAdditions
const cases = {
  "marker at very end": "x\n## Hand additions (preserved across regeneration)",
  "marker then immediate EOF no newline": "## Hand additions (preserved across regeneration)",
  "two markers": "## Hand additions (preserved across regeneration)\nA\n## Hand additions (preserved across regeneration)\nB",
  "marker inside code fence": "```\n## Hand additions (preserved across regeneration)\ninjected\n```\n## Not on this map\n",
  "huge": "## Hand additions (preserved across regeneration)\n" + "x".repeat(200000),
};
for (const [name, input] of Object.entries(cases)) {
  try { const r = extractHandAdditions(input); console.log("OK  ", name, "->", JSON.stringify(r.slice(0,60)) + (r.length>60?"...":"")); }
  catch (e) { console.log("THROW", name, "->", e.constructor.name, e.message); }
}
// renderMap with a candidate whose fields are hostile types
console.log("--- renderMap hostile candidate fields ---");
try {
  const md = renderMap([{ path: "a.js", score: NaN, hits: null, viaSafetyNet: false }], { date: "d", scannedFiles: 1 });
  console.log("OK renderMap with hits:null");
} catch (e) { console.log("THROW renderMap hits:null ->", e.constructor.name, e.message); }
