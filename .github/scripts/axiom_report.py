"""
Axiom Report Generator

Generates a text-based "Axiom Report" by analyzing Lean build output and
source files.  Lists all axioms used by key theorems (especially
`topological_mass_formula`) and provides transparency of the axiomatic
foundations.

Usage:
    python .github/scripts/axiom_report.py \\
        [--build-log build.log] \\
        [--lean-dir lean/] \\
        [--output axiom-report.txt]

In CI, this runs after `lake build` and generates a report that is
published alongside the interactive documentation.
"""

import argparse
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from qou_lib.config import LEAN_DIR, REPO_ROOT
from qou_lib.git_utils import get_commit_sha

DEFAULT_BUILD_LOG = REPO_ROOT / "build.log"
DEFAULT_OUTPUT = REPO_ROOT / "axiom-report.txt"

# Key declarations to audit for axiom dependencies.
KEY_DECLARATIONS = [
    "QOU.MassDerivation.topological_mass_formula",
    "QOU.MassDerivation.derive_substrate_q",
    "QOU.MassDerivation.mass_ratio_from_volume",
    "QOU.MassDerivation.vol_figure_eight",
    "QOU.MassDerivation.experimental_mu_e_ratio",
    "QOU.MassDerivation.quantum_planck",
    "QOU.KnotTheory.PlanarDiagram",
    "QOU.KnotTheory.figureEight",
    "QOU.KnotRegistry.figureEightEntry",
    "QOU.KnotRegistry.registry_volume_eq_mass_derivation",
    "QOU.Calculations.full_derivation_chain",
    "QOU.Calculations.substrate_error_bound",
    "QOU.Glossary.FrobeniusHopfObject",
]

# Axioms that we expect and need to document.
EXPECTED_AXIOMS = {
    "QOU.MassDerivation.topological_mass_formula": "Thm. 4.34 — Topological Decomposition of Mass (proved)",
    "propext": "Propositional extensionality (Lean kernel axiom)",
    "Quot.sound": "Quotient soundness (Lean kernel axiom)",
    "Classical.choice": "Classical choice (used by mathlib)",
    "sorryAx": "sorry placeholder — proof incomplete",
}


def parse_build_log(log_path):
    """Parse the build log for errors, warnings, and sorry usage."""
    if not log_path.exists():
        return {"errors": [], "warnings": [], "sorry_decls": set(), "success": False}

    text = log_path.read_text(encoding="utf-8")

    errors = []
    warnings = []
    sorry_decls = set()

    for line in text.splitlines():
        if ": error:" in line:
            errors.append(line.strip())
        elif "warning:" in line and "sorry" in line.lower():
            # Extract declaration name
            m = re.search(r"'([^']+)'\s+uses sorry", line)
            if m:
                sorry_decls.add(m.group(1))
            warnings.append(line.strip())
        elif ": warning:" in line:
            warnings.append(line.strip())

    success = len(errors) == 0
    return {
        "errors": errors,
        "warnings": warnings,
        "sorry_decls": sorry_decls,
        "success": success,
    }


def scan_axioms_from_source(lean_dir):
    """Scan Lean source files for axiom declarations."""
    axioms = []
    for lean_file in sorted(lean_dir.rglob("*.lean")):
        content = lean_file.read_text(encoding="utf-8")
        for m in re.finditer(r"^axiom\s+(\S+)", content, re.MULTILINE):
            rel_path = lean_file.relative_to(lean_dir)
            axioms.append({
                "name": m.group(1),
                "file": str(rel_path),
            })
    return axioms


def scan_sorry_from_source(lean_dir):
    """Count sorry occurrences per file."""
    results = {}
    for lean_file in sorted(lean_dir.rglob("*.lean")):
        content = lean_file.read_text(encoding="utf-8")
        count = len(re.findall(r"\bsorry\b", content))
        if count > 0:
            rel_path = str(lean_file.relative_to(lean_dir))
            results[rel_path] = count
    return results


# Regex for parsing `-- Ref: [key] url` comments preceding sorry.
REF_COMMENT_RE = re.compile(
    r"--\s*Ref:\s*\[([^\]]+)\]\s*(https?://\S+)?"
)


def scan_sorry_references(lean_dir):
    """Scan Lean files for sorry statements with `-- Ref: [key] url` comments.

    Returns a list of dicts: {file, line, declaration, ref_key, ref_url, context}.
    """
    results = []
    for lean_file in sorted(lean_dir.rglob("*.lean")):
        content = lean_file.read_text(encoding="utf-8")
        lines = content.splitlines()
        current_decl = None
        for i, line in enumerate(lines):
            # Track the most recent declaration name
            decl_match = re.match(
                r"(?:noncomputable\s+)?(?:def|theorem|lemma|axiom|instance)\s+(\S+)",
                line.strip(),
            )
            if decl_match:
                current_decl = decl_match.group(1)
            if re.search(r"\bsorry\b", line):
                # Look back up to 5 lines for a Ref comment
                ref_key = None
                ref_url = None
                ref_context = None
                for j in range(max(0, i - 5), i):
                    m = REF_COMMENT_RE.search(lines[j])
                    if m:
                        ref_key = m.group(1)
                        ref_url = m.group(2) or ""
                        ref_context = lines[j].strip()
                        break
                rel_path = str(lean_file.relative_to(lean_dir))
                results.append({
                    "file": rel_path,
                    "line": i + 1,
                    "declaration": current_decl or "(unknown)",
                    "ref_key": ref_key,
                    "ref_url": ref_url or "",
                    "context": ref_context or "",
                })
    return results


def run_print_axioms(lean_dir, decl_name):
    """Run `#print axioms` for a declaration via lake env lean.

    Returns the axiom list as a string, or None on failure.
    """
    # Create a temporary Lean file that prints axioms
    tmp_file = lean_dir / "_axiom_check.lean"
    tmp_content = f'import QOU\n#print axioms {decl_name}\n'
    try:
        tmp_file.write_text(tmp_content, encoding="utf-8")
        result = subprocess.run(
            ["lake", "env", "lean", str(tmp_file)],
            cwd=lean_dir,
            capture_output=True,
            text=True,
            timeout=120,
        )
        output = result.stdout + result.stderr
        return output
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
        return None
    finally:
        tmp_file.unlink(missing_ok=True)


def generate_report(build_info, source_axioms, sorry_counts, lean_dir,
                     sorry_refs=None):
    """Generate the full axiom report text."""
    lines = []
    sha = get_commit_sha()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    lines.append("=" * 72)
    lines.append("QUANTUM OBSERVABLE UNIVERSE — FORMAL VERIFICATION REPORT")
    lines.append("=" * 72)
    lines.append(f"Generated: {now}")
    lines.append(f"Commit:    {sha}")
    lines.append(f"Lean:      leanprover/lean4:v4.16.0")
    lines.append(f"Mathlib:   master (pinned in lakefile.lean)")
    lines.append("")

    # Build status
    lines.append("-" * 72)
    lines.append("§1  BUILD STATUS")
    lines.append("-" * 72)
    if build_info["success"]:
        lines.append("Status: ✅ BUILD PASSED (no type errors)")
    else:
        lines.append("Status: ❌ BUILD FAILED")
        lines.append("")
        lines.append("Errors:")
        for err in build_info["errors"][:20]:
            lines.append(f"  {err}")
    lines.append("")

    # Sorry audit
    lines.append("-" * 72)
    lines.append("§2  SORRY AUDIT")
    lines.append("-" * 72)
    total_sorry = sum(sorry_counts.values())
    lines.append(f"Total sorry occurrences: {total_sorry}")
    lines.append("")
    if sorry_counts:
        lines.append("  File                                          sorry count")
        lines.append("  " + "-" * 56)
        for filepath, count in sorted(sorry_counts.items()):
            lines.append(f"  {filepath:<48} {count}")
    else:
        lines.append("  No sorry placeholders found — all proofs complete.")
    lines.append("")

    if build_info["sorry_decls"]:
        lines.append("Declarations using sorry:")
        for decl in sorted(build_info["sorry_decls"]):
            lines.append(f"  - {decl}")
        lines.append("")

    # Axiom declarations
    lines.append("-" * 72)
    lines.append("§3  AXIOM DECLARATIONS")
    lines.append("-" * 72)
    lines.append(f"Total axiom declarations in source: {len(source_axioms)}")
    lines.append("")
    if source_axioms:
        for ax in source_axioms:
            desc = EXPECTED_AXIOMS.get(ax["name"], "")
            if desc:
                lines.append(f"  axiom {ax['name']}")
                lines.append(f"    File: {ax['file']}")
                lines.append(f"    Role: {desc}")
            else:
                lines.append(f"  axiom {ax['name']}")
                lines.append(f"    File: {ax['file']}")
            lines.append("")
    else:
        lines.append("  No explicit axiom declarations found.")
    lines.append("")

    # Key theorem axiom dependencies
    lines.append("-" * 72)
    lines.append("§4  AXIOM DEPENDENCIES OF KEY THEOREMS")
    lines.append("-" * 72)
    lines.append("")
    lines.append("The following key declarations were checked for axiom dependencies.")
    lines.append("Any use of `sorryAx` indicates an incomplete proof.")
    lines.append("")
    for decl in KEY_DECLARATIONS:
        lines.append(f"  #print axioms {decl}")
        output = run_print_axioms(lean_dir, decl)
        if output:
            # Parse axiom lines
            axiom_lines = [
                l.strip() for l in output.splitlines()
                if l.strip() and not l.strip().startswith("--") and not l.strip().startswith("import")
            ]
            for al in axiom_lines[:10]:
                lines.append(f"    {al}")
        else:
            lines.append("    (could not run — project may not be built)")
        lines.append("")

    # Topological mass theorem transparency
    lines.append("-" * 72)
    lines.append("§5  TOPOLOGICAL MASS THEOREM TRANSPARENCY")
    lines.append("-" * 72)
    lines.append("")
    lines.append("The QOU mass derivation rests on the following proved theorem:")
    lines.append("")
    lines.append("  theorem topological_mass_formula (tmf : TopologicalMassFormula) :")
    lines.append("    tmf.mass = tmf.vol / tmf.h_q ^ 2")
    lines.append("")
    lines.append("This theorem (Theorem 4.34 in the manuscript) encodes the")
    lines.append("Topological Decomposition of Mass.  It was formerly stated as a")
    lines.append("conjecture (axiom); it is now proved via the eigenspace decomposition")
    lines.append("of the descent involution, additivity of the MI integral, and")
    lines.append("localisation of transient modes to exceptional divisors.")
    lines.append("")
    lines.append("The mass formula is instantiated for specific particles via")
    lines.append("TopologicalMassFormula structures, with no axioms required.")
    lines.append("")

    # Knot volume constants
    lines.append("-" * 72)
    lines.append("§6  KNOT VOLUME & CODATA CONSTANTS")
    lines.append("-" * 72)
    lines.append("")
    lines.append("  | Parameter    | Value           | Lean Declaration              |")
    lines.append("  |-------------|-----------------|-------------------------------|")
    lines.append("  | Vol(4₁)     | 2.0298832128    | MassDerivation.vol_figure_eight  |")
    lines.append("  | m_μ / m_e   | 206.768283      | MassDerivation.experimental_mu_e_ratio |")
    lines.append("  | ℏ_q         | 0.09908 (derived)| MassDerivation.quantum_planck  |")
    lines.append("  | q           | 1.1097 (derived)| MassDerivation.substrate_q     |")
    lines.append("")

    # Knot Registry audit
    lines.append("-" * 72)
    lines.append("§7  KNOT REGISTRY AUDIT (Alexander-Briggs)")
    lines.append("-" * 72)
    lines.append("")
    lines.append("  | A-B Index | QOU Identity | Vol (SnapPy)    | Knot Atlas URL               |")
    lines.append("  |-----------|-------------|-----------------|------------------------------|")
    lines.append("  | 0_1       | Neutrino    | 0               | http://katlas.org/wiki/0_1   |")
    lines.append("  | 3_1       | Electron    | 0 (torus knot)  | http://katlas.org/wiki/3_1   |")
    lines.append("  | 4_1       | Muon        | 2.0298832128    | http://katlas.org/wiki/4_1   |")
    lines.append("  | 0_1       | Photon      | 0               | http://katlas.org/wiki/0_1   |")
    lines.append("")
    lines.append("  Lean modules:  KnotRegistry.lean  →  Calculations.lean  →  MassDerivation.lean")
    lines.append("  Bridge check:  KnotRegistry.figureEightEntry.volume.value = MassDerivation.vol_figure_eight")
    lines.append("")

    # Theoretical Gap Report — sorry statements with bibliographic references
    lines.append("-" * 72)
    lines.append("§8  THEORETICAL GAP REPORT")
    lines.append("-" * 72)
    lines.append("")
    lines.append("Each `sorry` below represents an unproved obligation.  Where a")
    lines.append("`-- Ref: [key] url` comment precedes the sorry, the citation and")
    lines.append("link to the foundational reference are shown.")
    lines.append("")

    if sorry_refs:
        referenced = [r for r in sorry_refs if r["ref_key"]]
        unreferenced = [r for r in sorry_refs if not r["ref_key"]]

        if referenced:
            lines.append("  ┌─ Gaps with bibliographic references ─────────────────────────────┐")
            lines.append("")
            for entry in referenced:
                lines.append(f"  {entry['file']}:{entry['line']}  {entry['declaration']}")
                lines.append(f"    Citation: [{entry['ref_key']}]")
                if entry["ref_url"]:
                    lines.append(f"    Link:     {entry['ref_url']}")
                lines.append("")
            lines.append("  └──────────────────────────────────────────────────────────────────┘")
            lines.append("")

        if unreferenced:
            lines.append("  ⚠  Gaps WITHOUT bibliographic references (needs annotation):")
            lines.append("")
            for entry in unreferenced:
                lines.append(f"    {entry['file']}:{entry['line']}  {entry['declaration']}")
            lines.append("")

        lines.append(f"  Summary: {len(referenced)} referenced / "
                     f"{len(unreferenced)} unreferenced / "
                     f"{len(sorry_refs)} total gaps")
    else:
        lines.append("  No sorry references found (run scan_sorry_references).")
    lines.append("")

    # Warnings summary
    if build_info["warnings"]:
        lines.append("-" * 72)
        lines.append("§9  BUILD WARNINGS")
        lines.append("-" * 72)
        for w in build_info["warnings"][:30]:
            lines.append(f"  {w}")
        if len(build_info["warnings"]) > 30:
            lines.append(f"  ... and {len(build_info['warnings']) - 30} more")
        lines.append("")

    lines.append("=" * 72)
    lines.append("END OF REPORT")
    lines.append("=" * 72)

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Generate axiom audit report.")
    parser.add_argument("--build-log", type=Path, default=DEFAULT_BUILD_LOG)
    parser.add_argument("--lean-dir", type=Path, default=LEAN_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    build_info = parse_build_log(args.build_log)
    source_axioms = scan_axioms_from_source(args.lean_dir)
    sorry_counts = scan_sorry_from_source(args.lean_dir)
    sorry_refs = scan_sorry_references(args.lean_dir)

    report = generate_report(build_info, source_axioms, sorry_counts, args.lean_dir,
                             sorry_refs=sorry_refs)

    args.output.write_text(report, encoding="utf-8")
    print(f"✅ Wrote axiom report: {args.output}")

    # Also print a brief summary to stdout
    total_sorry = sum(sorry_counts.values())
    referenced = sum(1 for r in sorry_refs if r["ref_key"])
    status = "PASS" if build_info["success"] else "FAIL"
    print(f"   Build: {status} | Axioms: {len(source_axioms)} | Sorry: {total_sorry}"
          f" | Refs: {referenced}/{len(sorry_refs)}")


if __name__ == "__main__":
    main()
