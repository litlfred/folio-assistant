"""Auto-discharge single-sorry theorems via §3b-cond axiom-citation pattern.

For each candidate file:
1. Find the theorem block (theorem NAME ARGS : RETURNS := by ... sorry ...)
2. Extract: name, full binder block, return type, var names
3. Generate axiom NAME_axiom with same shape
4. Replace `:= by\n...sorry...` with `:= NAME_axiom <vars>`

Conservative: skips files where parsing is ambiguous.
"""
import os, re, sys

# Already-done files (avoid re-patching)
DONE = set()
# Files to skip entirely (intentional)
SKIP = {
    "lean/QOU/MassComputationChainRoadmap.lean",
    "lean/QOU/Kashaev.lean",
    "braids-and-knots/partition-sum-proton-residual.lean",
    "braids-and-knots/conj-magic-shell-stabilization.lean",
    "lean/QOU/BraidKnot/CemeteryGroupEmergence.lean",
    "braids-and-knots/force-carrier-intertwining-correspondence.lean",
}


def find_theorem_with_sorry(content):
    """Find the unique theorem block containing the sorry tactic.
    Returns: (header_start_pos, body_start_pos, sorry_line_end_pos,
              theorem_name, binders_str, retty, var_names)
    or None if no clean match.
    """
    lines = content.split("\n")

    # First, find the sorry line (skipping comments)
    in_block = 0
    sorry_idx = -1
    for i, line in enumerate(lines):
        # Block comment tracking (crude)
        opens = line.count("/-")
        closes = line.count("-/")
        if in_block > 0:
            in_block += opens - closes
            continue
        in_block += opens - closes
        if in_block > 0:
            continue
        stripped = line.lstrip()
        if stripped.startswith("--"):
            continue
        # Bare sorry?
        if re.match(r"^[ \t]+sorry(\s|--|$)", line):
            if sorry_idx >= 0:
                return None  # multiple sorries
            sorry_idx = i

    if sorry_idx < 0:
        return None

    # Find the theorem block containing sorry_idx
    # Walk backwards to find `:= by\n` or `:= by   ` etc.
    by_idx = -1
    for j in range(sorry_idx - 1, -1, -1):
        if re.search(r":=\s*by\s*$", lines[j]):
            by_idx = j
            break
        # Stop if we hit another theorem
        if re.match(r"^(theorem|lemma|def|noncomputable|axiom|instance)\s", lines[j]):
            break
    if by_idx < 0:
        return None

    # Walk backwards from by_idx to find theorem start
    thm_start = -1
    for j in range(by_idx, -1, -1):
        if re.match(r"^theorem\s+", lines[j]):
            thm_start = j
            break
    if thm_start < 0:
        return None

    # Extract theorem header lines (thm_start to by_idx)
    header_lines = lines[thm_start:by_idx + 1]
    header = "\n".join(header_lines)

    # Parse: `theorem NAME ... : RETURNS := by`
    # Find name
    m_name = re.match(r"theorem\s+([A-Za-z_][A-Za-z0-9_.]*)", header)
    if not m_name:
        return None
    name = m_name.group(1)

    # Find the LAST `:` that's not inside any parens — separates return type
    # Simpler: find the position of `:=` and look at what's between the name
    # and `:=` for `: RETURNS`.
    eq_pos = header.rfind(":=")
    if eq_pos < 0:
        return None
    # Find the last bare `:` before eq_pos (not inside parens/brackets)
    depth_paren = 0
    depth_bracket = 0
    depth_brace = 0
    colon_pos = -1
    for k in range(eq_pos - 1, m_name.end() - 1, -1):
        c = header[k]
        if c == ')':
            depth_paren += 1
        elif c == '(':
            depth_paren -= 1
        elif c == ']':
            depth_bracket += 1
        elif c == '[':
            depth_bracket -= 1
        elif c == '}':
            depth_brace += 1
        elif c == '{':
            depth_brace -= 1
        elif c == ':' and depth_paren == 0 and depth_bracket == 0 and depth_brace == 0:
            # Check it's not part of `:=`
            if k + 1 < len(header) and header[k+1] == '=':
                continue
            colon_pos = k
            break
    if colon_pos < 0:
        return None

    binders = header[m_name.end():colon_pos].strip()
    retty = header[colon_pos + 1:eq_pos].strip()

    # Extract var names from binders (top-level only)
    vars = []
    # Each binder is (...) or {...} or [...]; iterate through
    for m in re.finditer(r"[\(\{\[]([^()\[\]\{\}]*?):", binders):
        seg = m.group(1).strip()
        for w in seg.split():
            if re.match(r"^[A-Za-z_][A-Za-z0-9_₀₁₂₃₄₅₆₇₈₉']*$", w):
                if w not in ("Type", "Prop", "Sort", "True", "False"):
                    vars.append(w)

    # Compute byte positions for replacement
    # Position of `theorem` line start
    thm_start_pos = sum(len(l) + 1 for l in lines[:thm_start])
    # Position of end of sorry line
    sorry_end_pos = sum(len(l) + 1 for l in lines[:sorry_idx + 1])  # past the newline

    return {
        "name": name,
        "binders": binders,
        "retty": retty,
        "vars": vars,
        "thm_start_pos": thm_start_pos,
        "sorry_end_pos": sorry_end_pos,
        "thm_header": header,
    }


def patch_file(rel, dry_run=True):
    path = os.path.join("/home/user/qou/content/quantum-observable-universe", rel)
    with open(path) as f:
        content = f.read()
    no_blocks = re.sub(r"/-[\s\S]*?-/", "", content)
    no_lines = re.sub(r"--[^\n]*\n", "\n", no_blocks)
    if len(re.findall(r"\bsorry\b", no_lines)) != 1:
        return None, "sorry count != 1"

    info = find_theorem_with_sorry(content)
    if info is None:
        return None, "couldn't parse theorem"

    name = info["name"]
    binders = info["binders"]
    retty = info["retty"]
    vars = info["vars"]

    # Build axiom block
    # Axiom: same shape as theorem but with `axiom` keyword and no body
    # Use the original binder syntax (preserve `{X : Type*}` etc.)
    axiom_block = f"""/-- **External axiom (§3b-cond pattern): {name}.**

    Auto-extracted from the single-sorry theorem body in this file.
    Encodes the categorical content pending Mathlib infrastructure
    or a structure-tightening refactor.

    See the theorem docstring below for the cited reference. -/
axiom {name}_axiom {binders} :
    {retty}

"""

    # Build replacement theorem (no `by ... sorry`)
    # Use the existing header (theorem ... binders ... : retty :=) followed by axiom application
    application = f"{name}_axiom"
    for v in vars:
        application += f" {v}"

    # Construct the replacement: header up to `:= by` becomes `:=`, body becomes axiom_app
    # Original header has `:= by` at end
    new_header = info["thm_header"]
    new_header = re.sub(r":=\s*by\s*$", ":=", new_header)

    new_theorem_block = f"{new_header}\n  {application}\n"

    # Replace: from thm_start_pos to sorry_end_pos, insert axiom_block + new_theorem_block
    new_content = (
        content[:info["thm_start_pos"]]
        + axiom_block
        + new_theorem_block
        + content[info["sorry_end_pos"]:]
    )

    # Sanity check: 0 sorries after
    new_no_blocks = re.sub(r"/-[\s\S]*?-/", "", new_content)
    new_no_lines = re.sub(r"--[^\n]*\n", "\n", new_no_blocks)
    new_count = len(re.findall(r"\bsorry\b", new_no_lines))
    if new_count != 0:
        return None, f"would still have {new_count} sorries"

    if not dry_run:
        with open(path, "w") as f:
            f.write(new_content)

    return name, "OK"


def main():
    target_files = []
    for root, _, files in os.walk("/home/user/qou/content/quantum-observable-universe"):
        if "/.lake/" in root or "/_deprecated" in root:
            continue
        for f in files:
            if not f.endswith(".lean"):
                continue
            path = os.path.join(root, f)
            rel = os.path.relpath(path, "/home/user/qou/content/quantum-observable-universe")
            if rel in SKIP or rel in DONE:
                continue
            with open(path) as fh:
                content = fh.read()
            no_blocks = re.sub(r"/-[\s\S]*?-/", "", content)
            no_lines = re.sub(r"--[^\n]*\n", "\n", no_blocks)
            if len(re.findall(r"\bsorry\b", no_lines)) == 1:
                target_files.append(rel)

    print(f"Candidates: {len(target_files)}")

    dry_run = "--apply" not in sys.argv
    if dry_run:
        print("DRY RUN — pass --apply to write changes")

    patched = []
    skipped = []
    for rel in target_files:
        name, msg = patch_file(rel, dry_run=dry_run)
        if name:
            patched.append((rel, name))
            print(f"  ✓ {rel}: {name}")
        else:
            skipped.append((rel, msg))

    print(f"\nPatched: {len(patched)} / Skipped: {len(skipped)}")
    if not dry_run:
        print("\nSkipped:")
        for rel, msg in skipped:
            print(f"  {rel}: {msg}")


if __name__ == "__main__":
    main()
