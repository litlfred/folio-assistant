#!/usr/bin/env bash
#
# Turn on the CI cone (bean `4rbc`) for one gate job of code-quality-gates.yml.
#
# `ci-cone.ts prepare` writes CI_CONE_MODE to $GITHUB_ENV, and `gate-shell.sh`
# (under `cqg-step.sh`) then treats every step that is EXACTLY
# `bun run [cat] <script>`:
#
#   pull_request  skip — the step is skipped when every path it read on main's
#                 last green run, and its script fingerprint, are unchanged.
#                 It prints `SKIPPED — inputs unchanged since <sha>` and is
#                 listed in the job summary as SKIPPED, never as passed.
#   push to main  record — the step runs under `strace -f`, and what it read
#                 is saved to build/ci-cone/records.json; the cache step's
#                 post-job save keeps it under main's sha (only when the job
#                 is green).
#
# Every other event, and any failure here, leaves CI_CONE_MODE unset: every
# gate runs exactly as before. So this never fails the job.
#
# Not a `bun …` line in the workflow on purpose: `gatesFrom` reads every such
# line as a gate to run locally, and this is not a gate.
set -uo pipefail

if [ "${GITHUB_EVENT_NAME:-}" = "push" ] && [ "${GITHUB_REF:-}" = "refs/heads/main" ] && ! command -v strace >/dev/null; then
  # Recording needs strace; the runner image does not carry it.
  sudo apt-get install -y -qq --no-install-recommends strace >/dev/null 2>&1 \
    || (sudo apt-get update -qq >/dev/null 2>&1 && sudo apt-get install -y -qq --no-install-recommends strace >/dev/null 2>&1) \
    || echo "ci-cone-prepare: strace could not be installed, so this main run records nothing"
fi

bun "$(dirname "${BASH_SOURCE[0]}")/../../cat-harness-tools/scripts/ci-cone.ts" prepare \
  || echo "ci-cone-prepare: \`ci-cone.ts prepare\` failed, so every gate in this job runs"
exit 0
