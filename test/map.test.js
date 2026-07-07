import { test, describe } from "node:test";
import assert from "node:assert";
import { renderMap, inferGroup, extractHandAdditions, HAND_ADDITIONS_HEADING } from "../src/map.js";

const OPTS = { date: "2026-07-07", scannedFiles: 42 };

function candidate(overrides) {
  return {
    path: "src/x.js",
    score: 5,
    hits: [],
    lines: 10,
    viaSafetyNet: false,
    ...overrides,
  };
}

describe("map: grouping", () => {
  test("payment signals group under money", () => {
    const c = candidate({ hits: ["path:payment", "bonus:server"] });
    assert.strictEqual(inferGroup(c), "money");
  });

  test("auth signals group under auth", () => {
    const c = candidate({ hits: ["path:auth", "import:auth", "bonus:server"] });
    assert.strictEqual(inferGroup(c), "auth");
  });

  test("a family tie is mixed, not a coin flip", () => {
    const c = candidate({ hits: ["path:payment", "path:auth"] });
    assert.strictEqual(inferGroup(c), "mixed");
  });

  test("bonus and penalty labels never decide a group", () => {
    const c = candidate({ hits: ["bonus:server"] });
    assert.strictEqual(inferGroup(c), "mixed");
  });
});

describe("map: reason lines", () => {
  test("renders plain language with raw tags in parentheses", () => {
    const md = renderMap(
      [candidate({ path: "src/billing/charge.js", score: 7, hits: ["path:payment", "bonus:server", "shape:money-math"] })],
      OPTS,
    );
    assert.match(
      md,
      /- src\/billing\/charge\.js: payment vocabulary in the path and money arithmetic \(path:payment, bonus:server, shape:money-math, score 7\)/,
    );
  });

  test("a rescue line spells out the rescue in words", () => {
    const md = renderMap(
      [
        candidate({
          path: "lib/ledger.js",
          score: 5,
          viaSafetyNet: true,
          hits: ["bonus:server", "shape:access-branch", "shape:money-math", "shape:db-delete"],
        }),
      ],
      OPTS,
    );
    assert.match(md, /## Rescued by risk shape/);
    assert.match(
      md,
      /- lib\/ledger\.js: no keyword signals, rescued by risk shape: permission branching plus money arithmetic plus a database delete \(/,
    );
  });

  test("a rescue with some keyword hits says the keywords fell short", () => {
    const md = renderMap(
      [
        candidate({
          path: "lib/quota.js",
          score: 4,
          viaSafetyNet: true,
          hits: ["kw:credential", "shape:db-write", "shape:money-math"],
        }),
      ],
      OPTS,
    );
    assert.match(md, /keyword signals alone fell short \(credential handling vocabulary\), rescued by risk shape:/);
  });
});

describe("map: document shape", () => {
  test("carries the advisory header, provenance, and scan count", () => {
    const md = renderMap([], OPTS);
    assert.match(md, /advisory, never authoritative/);
    assert.match(md, /SeamStressDev\/seamstress@643141f/);
    assert.match(md, /Scanned 42 source files\./);
  });

  test("an empty result is an honest map, not an empty file", () => {
    const md = renderMap([], OPTS);
    assert.match(md, /No files met the seam criteria\./);
    assert.match(md, /the heuristic found none, not/);
  });

  test("a populated map ends with the Not on this map section", () => {
    const md = renderMap([candidate({ hits: ["path:payment"] })], OPTS);
    assert.match(md, /## Not on this map/);
    assert.match(md, /found no signals, not that no seams exist/);
  });

  test("the cap warning renders only when the cap was hit", () => {
    assert.doesNotMatch(renderMap([], OPTS), /cap was hit/);
    assert.match(renderMap([], { ...OPTS, capHit: true }), /cap was hit/);
  });
});

describe("map: score band tiering", () => {
  const strong = candidate({ path: "src/pay.js", score: 8, hits: ["path:payment", "api:payment"] });
  const low = candidate({ path: "src/note.js", score: 4, hits: ["path:auth"] });
  const lowRescue = candidate({
    path: "lib/ledger.js",
    score: 4,
    viaSafetyNet: true,
    hits: ["shape:db-write", "shape:money-math"],
  });

  test("6+ renders prominently, outside the collapsed block", () => {
    const md = renderMap([strong, low], OPTS);
    const detailsStart = md.indexOf("<details>");
    assert.ok(md.indexOf("src/pay.js") < detailsStart, "strong candidate rendered before the collapsed block");
    assert.ok(md.indexOf("src/note.js") > detailsStart, "low candidate rendered inside the collapsed block");
  });

  test("the low band heading carries the count without expanding", () => {
    const md = renderMap([strong, low], OPTS);
    assert.match(md, /<summary>Low signal band: 1 file at scores 3 to 5/);
  });

  test("a rescued file renders in the prominent tier regardless of score", () => {
    const md = renderMap([strong, lowRescue, low], OPTS);
    const detailsStart = md.indexOf("<details>");
    assert.ok(md.indexOf("lib/ledger.js") < detailsStart, "rescue rendered before the collapsed block");
    assert.match(md, /## Rescued by risk shape/);
  });

  test("an all low band map says so plainly instead of an empty prominent section", () => {
    const md = renderMap([low, candidate({ path: "src/other.js", score: 3, hits: ["path:delete"] })], OPTS);
    assert.match(md, /No candidates reached the strong signal band \(score 6 and up\)\./);
    assert.match(md, /All 2 scored candidates sit in the low band below\./);
    assert.doesNotMatch(md.slice(0, md.indexOf("<details>")), /## (Money path|Authorization|Deletion|Mixed) signals/);
  });

  test("hand additions and Not on this map render outside the collapsed block", () => {
    const md = renderMap([strong, low], { ...OPTS, handAdditions: "- src/curated.js: judgment entry" });
    const detailsEnd = md.indexOf("</details>");
    assert.ok(md.indexOf(HAND_ADDITIONS_HEADING) > detailsEnd);
    assert.ok(md.indexOf("## Not on this map") > detailsEnd);
    assert.ok(md.includes("- src/curated.js: judgment entry"));
  });

  test("no collapsed block renders when every candidate is strong", () => {
    const md = renderMap([strong], OPTS);
    assert.ok(!md.includes("<details>"));
  });
});

describe("map: hand additions survive regeneration", () => {
  const CURATED = "- src/review.ts: starts paid API runs, judgment entry\n- src/db.ts: tenant scoping";

  test("the section is emitted empty by default, with the contract in the header", () => {
    const md = renderMap([], OPTS);
    assert.ok(md.includes(HAND_ADDITIONS_HEADING));
    assert.match(md, /none yet; entries you add under this heading survive regeneration/);
    assert.match(md, /Hand additions section survives regeneration/);
  });

  test("curated additions round trip through extract and render verbatim", () => {
    const first = renderMap([candidate({ hits: ["path:payment"] })], { ...OPTS, handAdditions: CURATED });
    const carried = extractHandAdditions(first);
    assert.strictEqual(carried, CURATED);
    const second = renderMap([], { ...OPTS, handAdditions: carried });
    assert.ok(second.includes(CURATED));
  });

  test("a file with no marker regenerates cleanly (empty additions)", () => {
    assert.strictEqual(extractHandAdditions("# Seam map\n\n- old style map\n"), "");
  });

  test("the placeholder hint is not treated as a curated addition", () => {
    const empty = renderMap([], OPTS);
    assert.strictEqual(extractHandAdditions(empty), "");
  });

  test("extraction stops at the next section heading", () => {
    const md = renderMap([candidate({ hits: ["path:payment"] })], { ...OPTS, handAdditions: CURATED });
    const carried = extractHandAdditions(md);
    assert.ok(!carried.includes("Not on this map"));
  });
});
