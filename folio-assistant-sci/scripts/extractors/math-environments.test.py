#!/usr/bin/env python3
"""
Exercise the `math` extractor, `math-environments.py` beside this file.

It moved here from cat-harness-tools' `scripts/extract-candidates.py`
(bean saqd, row 6), which had no test of its own for this class. Run
directly it needs no other layer; when cat-harness-tools is mounted
(`<repo>/cat-harness-tools`, a sibling clone, or `$CAT_HARNESS_TOOLS_ROOT`)
it also runs the shared CLI with this layer as the only extractor root, and
otherwise says SKIP for that half.

Run: python3 scripts/extractors/math-environments.test.py
"""

from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
LAYER_ROOT = os.path.dirname(os.path.dirname(HERE))

_spec = importlib.util.spec_from_file_location("math_extractor", os.path.join(HERE, "math-environments.py"))
MATH = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(MATH)

SECTIONS = [
    ("s1.md", {"section_title": "2 Main results", "pages": "3-5"},
     "Theorem 2.1 (Bound). For every compact operator T the spectrum is countable.\n\n"
     "Claim 2.2. Every bounded monotone sequence of reals converges to its supremum.\n\n"
     "Remark 2.3. This remark is long enough to be kept by the extractor.\n\n"
     "Lemma 2.4. see 3.1\n"),
    ("s9.md", {"section_title": "References"},
     "Theorem 1.1. A cited theorem in a bibliography is not a claim of this paper.\n"),
]


def tools_extract() -> str | None:
    cands = [os.environ.get("CAT_HARNESS_TOOLS_ROOT", ""),
             os.path.join(LAYER_ROOT, "cat-harness-tools"),
             os.path.join(os.path.dirname(LAYER_ROOT), "cat-harness-tools")]
    for c in cands:
        p = os.path.join(c, "scripts", "extract-candidates.py")
        if c and os.path.exists(p):
            return p
    return None


def main() -> int:
    failures: list[str] = []
    c = MATH.extract(SECTIONS, {})
    kinds = [(x["kind"], x["source_kind"], x["number"]) for x in c]
    if kinds != [("theorem", "theorem", "2.1"), ("proposition", "claim", "2.2"), ("remark", "remark", "2.3")]:
        failures.append(f"candidates: {kinds}")
    if c and (c[0]["name"] != "Bound" or c[0]["route_to"] != "formalizer" or not c[0]["formalization_candidate"]):
        failures.append(f"theorem routing: {c[0]}")
    if len(c) > 2 and (c[2]["formalization_candidate"] or c[2]["route_to"] is not None):
        failures.append("a remark is not a formalization candidate")
    if not MATH.detect({"arxiv": "2101.00001"}, []) or MATH.detect({}, []):
        failures.append("detect() claims exactly the documents with an arXiv id")
    if not (MATH.FALLBACK and MATH.VALIDATED and MATH.CLASS == "math"):
        failures.append("math is the validated fallback class")

    note = "SKIP through the CLI: cat-harness-tools is not mounted"
    extract = tools_extract()
    if extract:
        with tempfile.TemporaryDirectory() as tmp:
            d = os.path.join(tmp, "paper")
            os.makedirs(os.path.join(d, "sections"))
            with open(os.path.join(d, "structure.json"), "w") as fh:
                json.dump({"doc_id": "paper", "source": {"file": "p.pdf", "sha256": "0"},
                           "metadata": {"title": "t", "arxiv": None}}, fh)
            with open(os.path.join(d, "sections", "s1.md"), "w") as fh:
                fh.write('---\nsection_title: "2 Main results"\n---\n' + SECTIONS[0][2])
            r = subprocess.run([sys.executable, extract, d, "--json"], capture_output=True, text=True,
                               env=dict(os.environ, CAT_HARNESS_EXTRACTOR_ROOTS=LAYER_ROOT))
            if r.returncode != 0:
                failures.append(f"[cli] {r.stderr.strip()}")
            else:
                res = json.loads(r.stdout)
                if res["document_class"] != "math" or res["validated"] is not True:
                    failures.append(f"[cli] class/validated: {res['document_class']} {res['validated']}")
                if res["summary"]["formalization_candidates"] != 2:
                    failures.append(f"[cli] summary: {res['summary']}")
                note = f"ok through the CLI ({extract})"

    if failures:
        print("FAIL")
        for f in failures:
            print("  -", f)
        return 1
    print(f"ok — {len(c)} candidates")
    print(note)
    return 0


if __name__ == "__main__":
    sys.exit(main())
