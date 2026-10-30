#!/usr/bin/env bash
# See action.yml beside this file (issue #2744).
set -euo pipefail

shopt -s nullglob
decls=(cat-harness/tool-releases/plantuml-*.json)
if [ "${#decls[@]}" -ne 1 ]; then
  echo "::error::plantuml-java: expected exactly one cat-harness/tool-releases/plantuml-*.json, found ${#decls[@]} (is cat-harness mounted?)"
  exit 1
fi

major=$(bun -e '
  const rel = JSON.parse(await Bun.file(process.argv[1]).text());
  const rt = (rel.runtimes ?? []).map((r) => /^temurin-jre@(\d+)\./.exec(r.release)).filter(Boolean);
  if (rt.length !== 1) { console.error(`${process.argv[1]} declares ${rt.length} temurin-jre runtimes, expected 1`); process.exit(1); }
  console.log(rt[0][1]);
' "${decls[0]}")

var="JAVA_HOME_${major}_X64"
home="${!var:-}"
if [ -z "$home" ] || [ ! -x "$home/bin/java" ]; then
  echo "::error::plantuml-java: ${decls[0]} runs on Java ${major}, and this runner has no ${var}"
  exit 1
fi

echo "JAVA_HOME=$home" >> "$GITHUB_ENV"
echo "$home/bin" >> "$GITHUB_PATH"
echo "plantuml-java: Java ${major} from ${var} (${home}), as ${decls[0]} declares"
"$home/bin/java" -version
