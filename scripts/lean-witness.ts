#!/usr/bin/env bun
/**
 * Lean hash witness utility.
 *
 * Computes SHA-256 hashes of .lean files and manages witness files
 * for build-cache invalidation. A witness file at
 *   `<block>.lean.<hash>.witness`
 * records that the .lean file with that exact content hash was
 * successfully built by Lean. On subsequent builds, if the hash
 * matches, Lean validation can be skipped.
 *
 * Usage:
 *   bun run scripts/lean-witness.ts check <lean-file>   # check if witnessed
 *   bun run scripts/lean-witness.ts stamp <lean-file>    # create witness after build
 *   bun run scripts/lean-witness.ts dump                 # delete all witness files
 *   bun run scripts/lean-witness.ts status               # show witness status for all .lean files
 *   bun run scripts/lean-witness.ts hash <lean-file>     # print hash of .lean file
 *
 * @module scripts/lean-witness
 */

import { createHash } from "crypto";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve, basename } from "path";
import { globSync } from "glob";
import { execSync } from "child_process";

const REPO_ROOT = resolve(import.meta.dir, "..");
const HASH_LENGTH = 12;

// ── Core functions (exported for use by other scripts) ───────────

/** Compute 12-char SHA-256 hex prefix of a file's content. */
export function leanFileHash(filePath: string): string {
  const content = readFileSync(filePath, "utf-8");
  return createHash("sha256").update(content).digest("hex").slice(0, HASH_LENGTH);
}

/** Build the witness file path for a given .lean file and hash. */
export function witnessPath(leanFile: string, hash: string): string {
  return `${leanFile}.${hash}.witness`;
}

/** Check if a valid witness exists for the current content of a .lean file. */
export function isWitnessed(leanFile: string): { witnessed: boolean; hash: string } {
  if (!existsSync(leanFile)) return { witnessed: false, hash: "" };
  const hash = leanFileHash(leanFile);
  const wp = witnessPath(leanFile, hash);
  return { witnessed: existsSync(wp), hash };
}

/** Get the current git HEAD commit SHA. */
function getCurrentCommitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: REPO_ROOT })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

/** Get the last commit SHA that touched a specific file. */
export function getFileCommitSha(filePath: string): string {
  try {
    return execSync(`git log -1 --format=%H -- "${filePath}"`, {
      cwd: REPO_ROOT,
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

/** Read witness metadata from an existing witness file. */
export function readWitnessMeta(
  leanFile: string
): {
  hash: string;
  commitSha?: string;
  stampedAt?: string;
} | null {
  const result = isWitnessed(leanFile);
  if (!result.witnessed) return null;
  const wp = witnessPath(leanFile, result.hash);
  try {
    return JSON.parse(readFileSync(wp, "utf-8"));
  } catch {
    return null;
  }
}

/** Check whether a witness is stale (file changed since witnessing). */
export function isStale(leanFile: string): {
  stale: boolean;
  reason?: string;
  currentHash: string;
  witnessHash?: string;
  fileCommitSha: string;
  witnessCommitSha?: string;
} {
  if (!existsSync(leanFile)) {
    return { stale: false, currentHash: "", fileCommitSha: "unknown" };
  }
  const currentHash = leanFileHash(leanFile);
  const fileCommitSha = getFileCommitSha(leanFile);

  // Check for a witness matching the current content hash
  const wp = witnessPath(leanFile, currentHash);
  if (existsSync(wp)) {
    try {
      const meta = JSON.parse(readFileSync(wp, "utf-8"));
      // Compare fileCommitSha (not commitSha which is HEAD at stamp time)
      const witnessFileCommitSha = meta.fileCommitSha;

      if (witnessFileCommitSha && witnessFileCommitSha !== fileCommitSha) {
        return {
          stale: true,
          reason: "file commit SHA mismatch (file modified since witness)",
          currentHash,
          witnessHash: currentHash,
          fileCommitSha,
          witnessCommitSha: witnessFileCommitSha,
        };
      }

      return {
        stale: false,
        currentHash,
        witnessHash: currentHash,
        fileCommitSha,
        witnessCommitSha: witnessFileCommitSha,
      };
    } catch {
      return {
        stale: true,
        reason: "malformed witness file",
        currentHash,
        fileCommitSha,
      };
    }
  }

  // No witness for current hash — check if stale witnesses exist for older hashes
  const otherWitnesses = globSync(`${leanFile}.*.witness`);
  if (otherWitnesses.length > 0) {
    return {
      stale: true,
      reason: "content hash mismatch (witness exists for older content)",
      currentHash,
      fileCommitSha,
    };
  }

  return {
    stale: false,
    reason: "no witness exists",
    currentHash,
    fileCommitSha,
  };
}

/** Create a witness file for the current content of a .lean file.
 *  Now includes commitSha for staleness tracking. */
export function stampWitness(leanFile: string): {
  hash: string;
  witnessFile: string;
  commitSha: string;
} {
  const hash = leanFileHash(leanFile);
  const wp = witnessPath(leanFile, hash);
  const commitSha = getCurrentCommitSha();
  const fileCommitSha = getFileCommitSha(leanFile);
  const meta = JSON.stringify({
    leanFile: basename(leanFile),
    hash,
    commitSha,
    fileCommitSha,
    stampedAt: new Date().toISOString(),
  });
  writeFileSync(wp, meta + "\n");
  return { hash, witnessFile: wp, commitSha };
}

/** Remove all witness files for a given .lean file (any hash). */
export function clearWitnesses(leanFile: string): number {
  const witnessFiles = globSync(`${leanFile}.*.witness`);
  for (const f of witnessFiles) {
    unlinkSync(f);
  }
  return witnessFiles.length;
}

/** Find all .lean files in content directories. */
export function findContentLeanFiles(): string[] {
  return globSync("content/**/*.lean", { cwd: REPO_ROOT, absolute: true });
}

/** Find all witness files in the repo. */
export function findAllWitnesses(): string[] {
  return globSync("content/**/*.witness", { cwd: REPO_ROOT, absolute: true });
}

// ── CLI ──────────────────────────────────────────────────────────

if (import.meta.main) {
  const [cmd, ...rest] = process.argv.slice(2);

  switch (cmd) {
    case "hash": {
      const file = resolve(rest[0]);
      console.log(leanFileHash(file));
      break;
    }
    case "check": {
      const file = resolve(rest[0]);
      const { witnessed, hash } = isWitnessed(file);
      console.log(JSON.stringify({ file: basename(file), hash, witnessed }));
      process.exit(witnessed ? 0 : 1);
    }
    case "stamp": {
      const file = resolve(rest[0]);
      // Clear stale witnesses first
      clearWitnesses(file);
      const { hash, witnessFile } = stampWitness(file);
      console.log(`✓ Stamped ${basename(file)} → ${basename(witnessFile)}`);
      break;
    }
    case "dump": {
      const witnesses = findAllWitnesses();
      for (const w of witnesses) {
        unlinkSync(w);
      }
      console.log(`🗑 Removed ${witnesses.length} witness file(s)`);
      break;
    }
    case "status": {
      const leanFiles = findContentLeanFiles();
      let witnessed = 0;
      let staleFiles = 0;
      let pending = 0;
      for (const f of leanFiles) {
        const result = isWitnessed(f);
        const staleResult = isStale(f);
        const rel = f.replace(REPO_ROOT + "/", "");
        let tag: string;
        if (result.witnessed && !staleResult.stale) {
          tag = "✓ witnessed";
          witnessed++;
        } else if (result.witnessed && staleResult.stale) {
          tag = `🔄 stale (${staleResult.reason})`;
          staleFiles++;
        } else {
          tag = "· not witnessed";
          pending++;
        }
        console.log(`  ${tag}  ${rel}  (${result.hash})`);
      }
      console.log(
        `\n${witnessed} witnessed, ${staleFiles} stale, ${pending} pending — ${leanFiles.length} total`
      );
      break;
    }
    default:
      console.error("Usage: lean-witness.ts <check|stamp|dump|status|hash> [file]");
      process.exit(1);
  }
}
