#!/usr/bin/env node
// seam-scaffold CLI: init writes .seamstress/seam-map.md for a repo, map
// regenerates it. Local, free, no network, no API keys.

import { parseArgs } from "node:util";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { scanRepo, sourceFileStats } from "./heuristic/heuristic.js";
import { renderMap, extractHandAdditions, hasHandAdditionsSentinel } from "./map.js";

const USAGE = `Usage: seam-scaffold <init|map> [path] [--force]

  init   Write .seamstress/seam-map.md for the repo at [path] (default: .).
         Refuses to overwrite an existing map without --force. Appends the
         session notes ignore line to .gitignore when a .gitignore exists.
  map    Regenerate .seamstress/seam-map.md (overwrites; the map is generated
         output, init is the guarded door).
`;

const GITIGNORE_LINE = ".seamstress/session-notes.md";

function generate(repoPath) {
  const candidates = scanRepo(repoPath);
  const stats = sourceFileStats(repoPath);
  const date = new Date().toISOString().slice(0, 10);
  const mapPath = join(repoPath, ".seamstress", "seam-map.md");

  // Only carry hand additions forward from a map this tool wrote (its sentinels
  // are present). An existing map without them is untrusted: it may have been
  // planted by the scanned repository, so nothing is carried forward and the
  // caller is told. Generated sections are always rendered fresh, so a forged
  // provenance line in a planted map never survives.
  let handAdditions = "";
  let untrustedExistingMap = false;
  if (existsSync(mapPath)) {
    const existing = readFileSync(mapPath, "utf8");
    if (hasHandAdditionsSentinel(existing)) {
      handAdditions = extractHandAdditions(existing);
    } else {
      untrustedExistingMap = true;
    }
  }

  const markdown = renderMap(candidates, {
    date,
    scannedFiles: stats.scanned,
    capHit: stats.total > stats.scanned,
    handAdditions,
  });
  return { candidates, stats, markdown, untrustedExistingMap };
}

function writeMap(repoPath, markdown) {
  const dir = join(repoPath, ".seamstress");
  mkdirSync(dir, { recursive: true });
  const mapPath = join(dir, "seam-map.md");
  writeFileSync(mapPath, markdown);
  return mapPath;
}

function tendGitignore(repoPath) {
  const gitignorePath = join(repoPath, ".gitignore");
  if (!existsSync(gitignorePath)) {
    return "no .gitignore found; nothing appended (session notes will be untracked only if you ignore them)";
  }
  const content = readFileSync(gitignorePath, "utf8");
  // Line semantics, not a substring: a negation (`!...`) or a comment (`#...`)
  // that merely contains the path does not ignore it, so it must not suppress
  // the append. Only an exact ignore line counts as already ignored.
  const alreadyIgnored = content.split(/\r?\n/).some((l) => l.trim() === GITIGNORE_LINE);
  if (alreadyIgnored) {
    return ".gitignore already ignores session notes; nothing appended";
  }
  const suffix = content.endsWith("\n") ? "" : "\n";
  appendFileSync(gitignorePath, `${suffix}${GITIGNORE_LINE}\n`);
  return `appended ${GITIGNORE_LINE} to .gitignore`;
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { force: { type: "boolean", default: false } },
  });

  const [command, pathArg] = positionals;
  if (command !== "init" && command !== "map") {
    process.stderr.write(USAGE);
    process.exit(command === undefined || command === "help" ? 0 : 1);
  }

  const repoPath = resolve(pathArg ?? ".");
  if (!existsSync(repoPath)) {
    process.stderr.write(`seam-scaffold: path not found: ${repoPath}\n`);
    process.exit(1);
  }

  const mapPath = join(repoPath, ".seamstress", "seam-map.md");
  if (command === "init" && existsSync(mapPath) && !values.force) {
    // Only refuse for a map this tool wrote: it may carry the user's real hand
    // additions, which --force preserves. An existing map WITHOUT the tool's
    // markers is untrusted (possibly planted by the scanned repo), so it is not
    // treated as curation worth protecting; the run proceeds and regenerates it
    // fresh, with the warning below.
    if (hasHandAdditionsSentinel(readFileSync(mapPath, "utf8"))) {
      process.stderr.write(
        `seam-scaffold: ${mapPath} already exists and carries this tool's markers;\n` +
          `it may hold hand curated entries. Rerun with --force to regenerate\n` +
          `(hand additions are preserved), or use "seam-scaffold map".\n`,
      );
      process.exit(1);
    }
  }

  const { candidates, stats, markdown, untrustedExistingMap } = generate(repoPath);
  writeMap(repoPath, markdown);

  if (untrustedExistingMap) {
    process.stderr.write(
      `seam-scaffold: an existing ${mapPath} without this tool's markers was found.\n` +
        `It was not trusted (a scanned repository can plant one) and was regenerated\n` +
        `fresh. Re-add any hand curated entries under the Hand additions section.\n`,
    );
  }

  const summary = [
    `scanned ${stats.scanned} source files`,
    `${candidates.length} candidate${candidates.length === 1 ? "" : "s"}`,
    `wrote ${mapPath}`,
  ];
  if (command === "init") summary.push(tendGitignore(repoPath));
  process.stdout.write(summary.join("; ") + "\n");
}

main();
