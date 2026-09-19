#!/usr/bin/env bash
# session-start-coord-sweep.sh — the shared, agent-generic session-start primer.
#
# Emits a markdown block to stdout that each agent CLI injects into context at
# session start. It is wired from the native SessionStart command hook of every
# CLI that supports one (Claude Code via .claude/settings.json; Gemini CLI and
# Antigravity via their hooks.json) — all invoking THIS one script, so there is a
# single source of priming logic. It is also CLI-independent: it works whether or
# not the `beans` CLI is on PATH.
#
# What it surfaces:
#   1. The beans work-plan (`beans prime` + `beans list`, or a beans/ fallback).
#   2. How far the default branch has moved since this branch diverged.
#   3. Recent sibling agent branches.
#   4. A generic recommended action.
#
# Heavy triage (reading every new commit / sibling PR) belongs in a background
# subagent, not here. Keep this fast and read-only.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Repo-scoped lock so parallel workspaces of the *same* repo don't all fetch at
# once, without serialising unrelated repos that share this generic script.
lock_id="$(printf '%s' "$REPO_ROOT" | cksum | cut -d' ' -f1)"
exec 200>"/tmp/folio-coord-sweep-${lock_id}.lock"
flock 200 2>/dev/null || true

# ── 0. How to talk to the person here ───────────────────────────────────────
# Printed FIRST and before the work-plan, because it changes the form of every
# question that follows. A preference re-learned each session is a question
# asked twice, which is WCAG 2.2 SC 3.3.7 (Redundant Entry) — and for a user
# who types with difficulty, "just ask again" is not a small cost.
# See skills/folio-core/interaction-modality.md.
INTERACTION="$REPO_ROOT/.harness/interaction.json"
if [ -f "$INTERACTION" ]; then
  echo "## Interaction preferences"
  echo
  if command -v jq >/dev/null 2>&1; then
    jq -r '
      (.users // {}) | to_entries[] |
      "- **\(.key)** — profiles: \(.value.profiles | join(", ") | if . == "" then "(none)" else . end)  \n  \(.value.note // "")  \n  _source: \(.value.source // "unrecorded")_"
    ' "$INTERACTION" 2>/dev/null || echo "- (could not parse $INTERACTION — read it by hand)"
  else
    echo "- jq not installed; read \`.harness/interaction.json\` by hand."
  fi
  echo
fi

# ── 1. Work-plan (beans) ────────────────────────────────────────────────────
BEANS_DIR="$REPO_ROOT/beans"
echo "## Work-plan (beans) — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo
# Get the CLI in hand rather than reporting its absence — in two steps, cheap
# first.
#
# 1. `install-beans.sh` installs to ~/.local/bin, which a fresh container's PATH
#    often does not carry, so LOOK THERE before concluding the CLI is absent.
#    Reporting "not on PATH" when the binary is sitting in the standard install
#    location is how a session ends up parsing beans/ by hand all day.
# 2. Still missing? Install it. A fresh cloud container ships no `beans` at all,
#    and the fallback below — `beans/*.md` parsed by hand — is a flat list with
#    no priming, no milestone nesting and no `beans check`. That degraded view
#    was what every such session actually got, which is not the same as having
#    the work plan.
#
# Bounded and quiet: one `go install` over the module proxy, 180 s. A sandbox
# with no Go or no egress falls through to the reader below rather than failing
# the sweep — a session-start hook that exits non-zero takes the whole session's
# priming with it.
if ! command -v beans >/dev/null 2>&1 && [ -x "$HOME/.local/bin/beans" ]; then
  PATH="$HOME/.local/bin:$PATH"
  export PATH
fi

if ! command -v beans >/dev/null 2>&1 && [ -x "$REPO_ROOT/scripts/install-beans.sh" ]; then
  timeout 180 "$REPO_ROOT/scripts/install-beans.sh" >/dev/null 2>&1 || true
  # `go install` picks its bin dir from GOBIN/GOPATH, which may not be on this
  # shell's PATH, so look where it actually went before giving up on it.
  for candidate in "${GOBIN:-}" "${GOPATH:+$GOPATH/bin}" "$HOME/go/bin" "$HOME/.local/bin"; do
    [ -n "$candidate" ] || continue
    if [ -x "$candidate/beans" ]; then PATH="$candidate:$PATH"; export PATH; break; fi
  done
fi

if command -v beans >/dev/null 2>&1; then
  beans prime 2>/dev/null || true
  beans list 2>/dev/null || echo "_(beans list returned nothing)_"

  # The roadmap, not just the list. `beans list` is flat: on this repo it is
  # 100+ ids in creation order, which is data rather than a plan. `beans roadmap`
  # renders the milestone/epic structure an agent needs to say what is NEXT and
  # why — the judgement AGENTS.md asks for in every end-of-turn report.
  echo
  echo "### Roadmap (milestones and epics)"
  echo
  roadmap="$(timeout 20 beans roadmap 2>/dev/null || true)"
  if [ -n "$roadmap" ]; then
    printf '%s\n' "$roadmap"
  else
    echo "_(no milestones or epics yet — \`beans create \"…\" -t milestone\` opens one)_"
  fi
  echo

  # Commands for the PERSON, not the agent. An agent cannot run an interactive
  # TUI on someone's behalf, so the only useful thing to do with `beans tui` is
  # print it where they will see it. Paths follow the author's convention.
  cat <<'BEANCMDS'
### Beans — commands you can run yourself

| what you want | command |
|---|---|
| the interactive board | `beans tui` |
| the milestone roadmap | `beans roadmap` |
| everything open | `beans list -s todo -s in-progress` |
| one bean in full | `beans show <id>` |
| claim one | `beans update <id> -s in-progress` |
| open one | `beans create "title" -t task` |
| sanity-check the store | `beans check` |

BEANCMDS
  # Copy-paste line. Both the checkout path and the branch are COMPUTED, never
  # written in: a literal path or a session's branch name baked into a generic
  # platform script is the genericity failure this repo has paid for repeatedly
  # (see AGENTS.md on generate-readme.sh). BEANS_CHECKOUT_ROOT lets an author
  # whose clones live somewhere predictable get a line they can paste from any
  # directory; unset, it uses this checkout's real path.
  _repo_name="$(basename "$REPO_ROOT")"
  _checkout_dir="$REPO_ROOT"
  if [ -n "${BEANS_CHECKOUT_ROOT:-}" ]; then
    _checkout_dir="${BEANS_CHECKOUT_ROOT%/}/$_repo_name"
  fi
  _branch="$(git -C "$REPO_ROOT" symbolic-ref --short HEAD 2>/dev/null || true)"
  echo "Copy-paste, from a fresh shell:"
  echo
  echo '```sh'
  if [ -n "$_branch" ]; then
    echo "reset; cd $_checkout_dir && git fetch && git switch $_branch && git pull && beans tui"
  else
    # Detached HEAD: a `git switch` line here would name a branch that is not
    # what is checked out, which is worse than omitting it.
    echo "reset; cd $_checkout_dir && git fetch && git pull && beans tui"
  fi
  echo '```'
  echo
elif [ -d "$BEANS_DIR" ]; then
  # An IMPERATIVE, not a parenthetical. The old wording tucked the remedy
  # inside an aside, and a session on 2026-09-18 read it, carried on parsing
  # beans/ by hand, and did an entire session's durable work unclaimed —
  # which is the exact failure the work-plan exists to prevent.
  echo "> 🫘 **BEANS CLI IS NOT INSTALLED. Install it before doing durable work:**"
  echo ">"
  echo "> \`\`\`sh"
  echo "> scripts/install-beans.sh && export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo "> \`\`\`"
  echo ">"
  echo "> Until then the list below is parsed from \`beans/\` directly: titles and"
  echo "> statuses only, with no bodies, no priorities and no blocking relations —"
  echo "> so it cannot tell you what an item actually is or what it waits on."
  echo ">"
  echo "> **But you are NOT read-only.** \`scripts/beans-fallback.ts\` writes the same"
  echo "> store in the same layout, so work done here is claimed, not unclaimed:"
  echo ">"
  echo "> \`\`\`sh"
  echo "> bun run beans:fallback list --status todo"
  echo "> bun run beans:fallback show <id>"
  echo "> bun run beans:fallback claim <id>"
  echo "> bun run beans:fallback create \"<title>\" --status in-progress"
  echo "> bun run beans:fallback note <id> \"<what you found>\""
  echo "> \`\`\`"
  echo ">"
  echo "> There is no excuse for unclaimed durable work when the CLI is missing."
  echo
  found=0
  for f in "$BEANS_DIR"/*.md; do
    [ -f "$f" ] || continue
    found=1
    title=$(sed -n 's/^# //p' "$f" 2>/dev/null | head -1)
    status=$(grep -m1 -iE '^(status|state):' "$f" 2>/dev/null | sed 's/^[^:]*:[[:space:]]*//')
    printf -- '- %s%s\n' "${title:-$(basename "$f" .md)}" "${status:+ [$status]}"
  done
  if [ "$found" -eq 0 ]; then echo "_(no beans found in beans/)_"; fi
else
  echo "_(no beans/ store and no beans CLI — nothing to prime; see AGENTS.md)_"
fi
echo

# ── 2. Branch / default-branch delta ────────────────────────────────────────
CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo DETACHED)"

# Resolve the default branch generically (origin/HEAD), fall back to main.
DEFAULT_BRANCH="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')"
[ -n "$DEFAULT_BRANCH" ] || DEFAULT_BRANCH=main

# Fetch with an EXPLICIT refspec. `git fetch origin <branch>` writes FETCH_HEAD
# and updates refs/remotes/origin/<branch> only opportunistically — it does so
# when the configured remote.origin.fetch covers that branch, and silently does
# not when it doesn't. A clone whose refspec has been narrowed (this container
# had a qou clone pinned to one sibling branch) then answers every question
# below from a tracking ref that has not moved for days, while the fetch itself
# exits 0. See bean 9giz.
if ! git fetch origin "+refs/heads/$DEFAULT_BRANCH:refs/remotes/origin/$DEFAULT_BRANCH" >/dev/null 2>&1; then
  echo "## Coord sweep"
  echo
  echo "_origin/$DEFAULT_BRANCH fetch failed (offline?). Branch: \`$CURRENT_BRANCH\`._"
  exit 0
fi

NEW_ON_DEFAULT="$(git rev-list --count "HEAD..origin/$DEFAULT_BRANCH" 2>/dev/null || echo 0)"

echo "## Coord sweep"
echo
echo "**Branch:** \`$CURRENT_BRANCH\` · **origin/$DEFAULT_BRANCH ahead by:** $NEW_ON_DEFAULT commit(s) since divergence."
echo

if [ "${NEW_ON_DEFAULT:-0}" -gt 0 ] 2>/dev/null; then
  echo "**Recent landings on \`$DEFAULT_BRANCH\` (last 10):**"
  git log --oneline "HEAD..origin/$DEFAULT_BRANCH" 2>/dev/null | head -10 | sed 's/^/- /'
  echo
fi

# ── 3. Recent sibling agent branches ────────────────────────────────────────
# This reads the remote-tracking tree directly, so unlike §2 it cannot be
# repaired by fetching one branch harder: if the clone's refspec does not cover
# refs/heads/*, that tree is empty and "no siblings" means "never fetched any".
# An empty section is the same shape as a quiet repo, so say which one it is.
if git config --get-all remote.origin.fetch 2>/dev/null | grep -q 'refs/heads/\*'; then
  RECENT_SIBLINGS="$(git for-each-ref --sort=-committerdate \
    --format='%(refname:short) %(committerdate:relative) %(subject)' \
    refs/remotes/origin/claude 2>/dev/null \
    | grep -v "$CURRENT_BRANCH" \
    | head -8 || true)"

  if [ -n "$RECENT_SIBLINGS" ]; then
    echo "**Recent sibling \`claude/*\` branches:**"
    echo "$RECENT_SIBLINGS" | sed 's/^/- /'
    echo
  fi
else
  echo "**Sibling branches: not visible from this clone.**"
  echo
  echo "\`remote.origin.fetch\` does not cover \`refs/heads/*\`, so"
  echo "\`refs/remotes/origin/claude/*\` is whatever was fetched by name — not the"
  echo "set of sibling branches. Treat this section as unread, not as empty."
  echo
  echo "Restore it with:"
  echo '```sh'
  echo "git config --replace-all remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'"
  echo "git fetch origin --prune"
  echo '```'
  echo
fi

# ── 3-bis. CI health ────────────────────────────────────────────────────────
#
# docs-site.yml fired on every push to main and failed all 30 times over two
# months; the published site sat stale and nothing in the repo said so (bean
# xom7). A red workflow and a green one look identical from in here, so the
# outcome has to be printed where attention already goes — which is this file.
#
# Best-effort and bounded: one API call, short timeout, and a failure to reach
# the API prints as UNKNOWN rather than being omitted. An absent section reads
# as "fine", which is the defect this is here to fix.
if command -v bun >/dev/null 2>&1 && [ -f "$REPO_ROOT/scripts/check-ci-health.ts" ]; then
  if ! timeout 25 bun run "$REPO_ROOT/scripts/check-ci-health.ts" --markdown 2>/dev/null; then
    echo "## CI health"
    echo
    echo "**Not checked — treat as unknown, not as green.** The health check did not"
    echo "complete (no network, no bun, or the API refused). Run it by hand:"
    echo
    echo '```sh'
    echo "bun run check:ci-health"
    echo '```'
    echo
  fi
fi

# ── 3b. Declared directories exist ──────────────────────────────────────────
# A declared-but-absent directory is the bean `dh4f` defect: absent and empty
# are indistinguishable to a consumer, so the declaration turns a real gap into
# a clean run. The sharp case is ingestion — the corpus checklist greps
# `library/` and not `uploads/`, so a missing `library/` reads as "nobody has
# ingested anything". Cheap, quiet, and idempotent: it creates only what is
# missing and writes a keep-marker only into a directory that would otherwise
# be empty.
if command -v bun >/dev/null 2>&1 && [ -f "$REPO_ROOT/scripts/harness-dirs.ts" ]; then
  dirs_out=$(timeout 20 bun run "$REPO_ROOT/scripts/harness-dirs.ts" 2>/dev/null || true)
  # Print only when it actually did something — a clean run is not news, and
  # the sweep is already long. "Could not check" is not silence either: an
  # empty result means bun or the declaration failed, and that is said.
  if [ -z "$dirs_out" ]; then
    echo "## Declared directories"
    echo
    echo "Could not check (bun present but \`scripts/harness-dirs.ts\` produced nothing)."
    echo "Run it by hand: \`bun run harness:dirs\`."
    echo
  elif ! printf '%s' "$dirs_out" | grep -q '0 created\.'; then
    echo "## Declared directories — created what was missing"
    echo
    echo '```'
    printf '%s\n' "$dirs_out"
    echo '```'
    echo
  fi
fi

# ── 4. Recommended action (generic) ─────────────────────────────────────────
cat <<'EOF'
**Recommended action:**

1. **Install the beans CLI if the section above says it is missing** —
   `scripts/install-beans.sh && export PATH="$HOME/.local/bin:$PATH"`. Do this
   FIRST: claiming and creating beans is not possible without it, and a
   session that skips it does its work unclaimed.
2. If you'll do durable work, claim a bean
   (`beans update <id> --status in-progress`) or open one
   (`beans create "<title>"`, after the exact-title existence check in
   AGENTS.md) — see also `.claude/skills/local/bean-coordination.md`.
3. If the default branch moved, dispatch a **background** subagent to triage the
   new landings + sibling activity above — don't do it in the foreground.
   Escalate only if it surfaces something actionable against the work-plan.
EOF
