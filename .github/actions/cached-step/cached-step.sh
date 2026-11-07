#!/usr/bin/env bash
#
# The logic of the `cached-step` composite action (action.yml); README.md has
# the policy. One subcommand per action step:
#
#   key        validate the inputs, namespace the key, say whether it is determined
#   fetch-ref  restore a committer-published entry from refs/cache/<key> (exact only)
#   decide     hit / warm / miss, and why; runs `verify` on an exact restore
#   policy     may this run save? (main, or the PR's/branch's own scope, by trust)
#
# Could-not-determine is never a hit, and never saved.
#
# Exit: 0, except 2 on an input the action must not run with (a bad step id,
# an unknown trust, an `exact` step with no verify).

set -uo pipefail

NS=cs1   # bump to orphan every entry when the format of an entry changes

out() { [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1=$2" >> "$GITHUB_OUTPUT"; echo "$1=$2"; }
out_multi() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    local d="EOF_$RANDOM$RANDOM"
    { echo "$1<<$d"; printf '%s\n' "$2"; echo "$d"; } >> "$GITHUB_OUTPUT"
  fi
  printf '%s:\n%s\n' "$1" "$2"
}
summary() { [ -n "${GITHUB_STEP_SUMMARY:-}" ] && printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; printf '%s\n' "$@" >&2; }
die() { echo "::error::cached-step: $1" >&2; exit 2; }

verdict_dir() { echo "${RUNNER_TEMP:-/tmp}/cached-step-verdict/$STEP"; }

case "${1:-}" in
  key)
    [[ "${STEP:-}" =~ ^[a-z0-9][a-z0-9-]{0,62}$ ]] || die "step '${STEP:-}' is not [a-z0-9-]+"
    case "${TRUST:-}" in exact|verdict|main-only) ;; *) die "trust '${TRUST:-}' is not exact, verdict or main-only" ;; esac
    case "${PHASE:-}" in restore|save|report) ;; *) die "phase '${PHASE:-}' is not restore, save or report" ;; esac
    if [ "$PHASE" = report ]; then
      # A decision made elsewhere: no paths, no verify; only the key is namespaced.
      out_multi paths ""
      out prefix "$NS-$STEP-"
      if [ -z "${KEY:-}" ] || [[ "$KEY" == undetermined* ]]; then out determined false; out why "the key could not be determined"; out key ""; exit 0; fi
      if [[ "$KEY" =~ ^[A-Za-z0-9._-]{1,200}$ ]]; then k="$KEY"; else k=$(printf '%s' "$KEY" | sha256sum | cut -d' ' -f1); fi
      out determined true; out key "$NS-$STEP-$k"; exit 0
    fi
    if [ "${WARM:-false}" = true ] && [ "$TRUST" != main-only ]; then
      die "warm is for main-only steps: exact warms already, and a verdict matches its exact key only"
    fi
    if [ "$TRUST" = exact ] && [ "$PHASE" = restore ] && [ -z "${VERIFY:-}" ]; then
      die "an exact step needs a verify command: a restore nothing checks is not exact"
    fi
    if [ "$TRUST" = verdict ]; then
      [ -z "${PATHS:-}" ] || die "a verdict step caches no paths (its record is the output)"
      paths=$(verdict_dir)
      mkdir -p "$paths"
    else
      [ -n "${PATHS:-}" ] || die "an $TRUST step needs paths"
      paths="$PATHS"
    fi
    out_multi paths "$paths"
    out prefix "$NS-$STEP-"
    if [ -z "${KEY:-}" ] || [[ "$KEY" == undetermined* ]]; then
      out determined false
      out why "the key could not be determined${KEY:+: ${KEY#undetermined}}"
      out key ""
      exit 0
    fi
    # A key is a digest, not a sentence: anything else is hashed, never trimmed.
    if [[ "$KEY" =~ ^[A-Za-z0-9._-]{1,200}$ ]]; then k="$KEY"; else k=$(printf '%s' "$KEY" | sha256sum | cut -d' ' -f1); fi
    out determined true
    out key "$NS-$STEP-$k"
    ;;

  fetch-ref)
    # An entry `bun run cat cache:publish` pushed: a commit whose tree holds
    # the step's output under ws/ (a checkout path) and home/ (a path under
    # $HOME). Restored here, and accepted only if `verify` passes in `decide`.
    ref="refs/cache/$KEY"
    t="${RUNNER_TEMP:-/tmp}/cached-step-ref"; rm -rf "$t"; mkdir -p "$t"
    if git fetch --quiet --no-tags --depth=1 origin "+$ref:refs/cached-step/entry" 2>/dev/null \
       && git archive refs/cached-step/entry | tar -x -C "$t"; then
      ok=true
      if [ -d "$t/ws" ]; then cp -a "$t/ws/." "${GITHUB_WORKSPACE:-.}/" || ok=false; fi
      if [ -d "$t/home" ]; then cp -a "$t/home/." "${HOME:?}/" || ok=false; fi
      out hit "$ok"
    else
      out hit false
    fi
    rm -rf "$t"
    ;;

  decide)
    result=miss
    matched=""
    if [ "${DETERMINED:-}" != true ]; then
      why="${UNDETERMINED_WHY:-the key could not be determined}; the step runs, and nothing is saved"
    elif [ "${EXACT_HIT:-}" = true ] || [ "${REF_HIT:-}" = true ]; then
      src="the Actions cache"; [ "${REF_HIT:-}" = true ] && src="refs/cache/$KEY (committer-published)"
      matched="$KEY"
      if [ "$TRUST" = exact ]; then
        if (bash -c "$VERIFY") >&2; then
          result=hit; why="restored from $src and verified (\`$VERIFY\`)"
        else
          while IFS= read -r p; do [ -n "$p" ] && rm -rf -- "${p/#\~/${HOME:?}}"; done <<< "$PATHS"
          why="an entry from $src FAILED \`$VERIFY\`: removed, the step runs"
          matched=""
        fi
      else
        rec="$(verdict_dir)/record.txt"
        if [ -s "$rec" ]; then
          result=hit
          why="SKIPPED, not passed: $(sed -n 's/^summary: //p' "$rec" | head -1)"
        else
          why="the entry restored carries no record: the step runs"
          matched=""
        fi
      fi
    elif [ -n "${MATCHED:-}" ]; then
      result=warm; matched="$MATCHED"
      why="no entry under this key; warm start from \`$MATCHED\` (prefix), the step runs over it"
    else
      why="no entry under this key; the step runs"
    fi
    out hit "$([ "$result" = hit ] && echo true || echo false)"
    out result "$result"
    out why "$why"
    out matched "$matched"
    record="cached-step--$STEP--$result--${GITHUB_RUN_ID:-0}-${GITHUB_RUN_ATTEMPT:-0}-${GITHUB_JOB:-job}-$RANDOM$RANDOM"
    mkdir -p "${RUNNER_TEMP:-/tmp}/cached-step"
    printf 'step: %s\nresult: %s\ntrust: %s\nkey: %s\nwhy: %s\n' "$STEP" "$result" "$TRUST" "${KEY:-}" "$why" \
      > "${RUNNER_TEMP:-/tmp}/cached-step/$record.txt"
    out record "$record"
    summary "**cached-step \`$STEP\`: $result** ($TRUST) — $why. Key \`${KEY:-undetermined}\`."
    ;;

  policy)
    save=false
    ev="${GITHUB_EVENT_NAME:-}"; ref="${GITHUB_REF:-}"
    if [ "${DETERMINED:-}" != true ]; then
      why="${UNDETERMINED_WHY:-the key could not be determined}: never saved"
    elif [ "$ref" = refs/heads/main ] && [ "$ev" != pull_request ] && [ "$ev" != pull_request_target ]; then
      save=true; why="a run on main: readable by every branch"
    elif [ "$TRUST" = main-only ]; then
      why="main-only: saved from main alone, this is $ev on $ref"
    elif [ "$ev" = pull_request_target ]; then
      why="pull_request_target runs base code with a PR's inputs: never saved"
    else
      save=true; why="$TRUST entry from $ev on $ref: GitHub scopes it to that ref, so only its own re-runs read it"
    fi
    if [ "$save" = true ] && [ "$TRUST" = verdict ]; then
      d=$(verdict_dir); mkdir -p "$d"
      printf 'summary: verdict recorded green by run %s (%s, commit %s) for this key\nrun: %s\ncommit: %s\nref: %s\n' \
        "${GITHUB_RUN_ID:-?}" "$ref" "${GITHUB_SHA:-?}" "${GITHUB_RUN_ID:-}" "${GITHUB_SHA:-}" "$ref" > "$d/record.txt"
    fi
    out save "$save"
    out why "$why"
    summary "cached-step \`$STEP\` save: $save — $why."
    ;;

  report)
    case "${RESULT:-}" in hit|warm|miss) ;; *) die "report: result '${RESULT:-}' is not hit, warm or miss" ;; esac
    [ -n "${WHY:-}" ] || die "report: a result needs a why"
    record="cached-step--$STEP--$RESULT--${GITHUB_RUN_ID:-0}-${GITHUB_RUN_ATTEMPT:-0}-${GITHUB_JOB:-job}-$RANDOM$RANDOM"
    mkdir -p "${RUNNER_TEMP:-/tmp}/cached-step"
    printf 'step: %s\nresult: %s\ntrust: %s\nkey: %s\nwhy: %s\nreported: elsewhere\n' "$STEP" "$RESULT" "$TRUST" "${KEY:-}" "$WHY" \
      > "${RUNNER_TEMP:-/tmp}/cached-step/$record.txt"
    out record "$record"
    summary "**cached-step \`$STEP\`: $RESULT** ($TRUST) — $WHY. Key \`${KEY:-undetermined}\`."
    ;;

  *)
    echo "usage: $0 key|fetch-ref|decide|policy|report  (inputs by environment; see action.yml)" >&2
    exit 2
    ;;
esac
