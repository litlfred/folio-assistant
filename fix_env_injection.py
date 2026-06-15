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
