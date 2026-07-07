import { test, describe } from "node:test";
import assert from "node:assert";
import { renderMap, inferGroup } from "../src/map.js";

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
    assert.match(md, /SeamStressDev\/seamstress@daf0297/);
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
