#!/usr/bin/env node
// seam-scaffold CLI: init writes .seamstress/seam-map.md for a repo, map
// regenerates it. Local, free, no network, no API keys.

import { parseArgs } from "node:util";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { scanRepo, sourceFileStats } from "./heuristic/heuristic.js";
import { renderMap, extractHandAdditions } from "./map.js";

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
  const handAdditions = existsSync(mapPath)
    ? extractHandAdditions(readFileSync(mapPath, "utf8"))
    : "";
  const markdown = renderMap(candidates, {
    date,
    scannedFiles: stats.total,
    capHit: stats.total > 5000,
    handAdditions,
  });
  return { candidates, stats, markdown };
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
  if (content.includes(GITIGNORE_LINE)) {
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
    process.stderr.write(
      `seam-scaffold: ${mapPath} already exists; a map may carry hand written\n` +
        `entries the generator cannot reproduce. Rerun with --force to overwrite,\n` +
        `or use "seam-scaffold map" if the map is generated output.\n`,
    );
    process.exit(1);
  }

  const { candidates, stats, markdown } = generate(repoPath);
  writeMap(repoPath, markdown);

  const summary = [
    `scanned ${stats.total} source files`,
    `${candidates.length} candidate${candidates.length === 1 ? "" : "s"}`,
    `wrote ${mapPath}`,
  ];
  if (command === "init") summary.push(tendGitignore(repoPath));
  process.stdout.write(summary.join("; ") + "\n");
}

main();
