---
$schema: folio-fsh-guts/v1
title: "fix_env_injection.py"
kind: script
movedOn: 2026-09-19
movedFrom: "fix_env_injection.py"
summary: >-
  A one-shot migration that rewrote GITHUB_OUTPUT/GITHUB_ENV writes in the workflows to use a random heredoc delimiter. Already run — the form it applies appears 34 times across .github/workflows/ — and referenced by nothing. Kept rather than deleted; it is also the clearest evidence of the `git add -A` hazard, having been swept into an unrelated commit itself.
---

# `fix_env_injection.py`

**Spent.** It was a one-shot migration, it was run, and its output is in the
tree: the random-delimiter form it writes appears **34 times** across
`.github/workflows/`.

Moved here rather than deleted, per
[`fsh-guts`](../../skills/folio-core/fsh-guts.md) — delete means relocate, and
actual deletion needs the owner's explicit word.

## What it did

GitHub Actions' `GITHUB_OUTPUT` and `GITHUB_ENV` are newline-delimited
`key=value` files. Writing `echo "var=$(cmd)" >> $GITHUB_OUTPUT` lets a value
containing a newline inject additional variables. The fix is the documented
heredoc form with a delimiter the value cannot contain:

```sh
EOF=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)
echo "var<<$EOF" >> $GITHUB_OUTPUT
echo "$value"    >> $GITHUB_OUTPUT
echo "$EOF"      >> $GITHUB_OUTPUT
```

## Why it could not simply be re-run

It hardcodes `/home/litlfred/folio-assistant/.github/workflows` — one
machine's absolute path, with no argument and no fallback. Re-running it
anywhere else is a no-op that reports nothing, which is the `dh4f` shape: a
tool that scans a directory that is not there and finishes cleanly.

## It is evidence of a hazard, which is the better reason to keep it

It was committed on 2026-09-16 inside `04092f37d`, *"docs: diagrams are
figures, so they are white in both schemes; stamp the build"* — a commit about
neither Python nor workflows. Nothing about that commit wanted this file; it
was swept in by a `git add -A` in the repo root.

That is the same hazard `.gitignore` is written to contain, and which the stub
inversion reopened on 2026-09-19 when the bundler's gem tree — **3,080 files,
53 MB** — stopped being ignored because the rules still named the old site
root. This file is what that hazard looks like when it is only 58 lines: small
enough that nobody noticed for three days.

## The source, verbatim

```python
import os
import re

workflows_dir = "/home/litlfred/folio-assistant/.github/workflows"

def fix_env_injection(content):
    # Fix direct github context variable injection in run blocks (e.g. VAR="${{ github.something }}")
    # This is tricky without AST, but we can look for specific bad patterns like we did earlier.
    # The user asked specifically about "env injection", which is GITHUB_ENV / GITHUB_OUTPUT newline injection.

    # Fix pattern: echo "var=value" >> $GITHUB_OUTPUT
    # Or echo "var=$(cmd)" >> $GITHUB_OUTPUT
    # Replace with:
    # EOF=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)
    # echo "var<<$EOF" >> $GITHUB_OUTPUT
    # echo "value" >> $GITHUB_OUTPUT
    # echo "$EOF" >> $GITHUB_OUTPUT
    
    lines = content.split('\n')
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Match: echo "key=value" >> "$GITHUB_OUTPUT" (or similar)
        m = re.match(r'^(\s*)echo\s+["\']?([a-zA-Z0-9_-]+)=([^"\']+)["\']?\s*>>\s*"?\$GITHUB_(OUTPUT|ENV)"?', line)
        if m:
            indent = m.group(1)
            key = m.group(2)
            value = m.group(3)
            target = m.group(4) # OUTPUT or ENV
            
            # Use random EOF
            out.append(f'{indent}EOF=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)')
            out.append(f'{indent}echo "{key}<<$EOF" >> "$GITHUB_{target}"')
            out.append(f'{indent}echo "{value}" >> "$GITHUB_{target}"')
            out.append(f'{indent}echo "$EOF" >> "$GITHUB_{target}"')
        else:
            out.append(line)
        i += 1
        
    return '\n'.join(out)

for f in os.listdir(workflows_dir):
    if not f.endswith(".yml"): continue
    p = os.path.join(workflows_dir, f)
    with open(p, "r") as fp:
        content = fp.read()
    
    new_content = fix_env_injection(content)
    
    # Also fix REPO_NAME="${{ github.event.repository.name }}"
    new_content = new_content.replace('REPO_NAME="${{ github.event.repository.name }}"', 'REPO_NAME="${GITHUB_REPOSITORY#*/}"')
    
    if content != new_content:
        with open(p, "w") as fp:
            fp.write(new_content)
        print(f"Fixed {f}")
```
