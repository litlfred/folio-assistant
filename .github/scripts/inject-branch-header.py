#!/usr/bin/env python3
"""inject-branch-header.py — add a fancyhdr header with the source branch URL.

Usage
-----
    python inject-branch-header.py main.tex BRANCH_URL

Inserts \\usepackage{fancyhdr} and header configuration right before
\\begin{document} so that every page of the compiled PDF shows the
source branch URL in the header.
"""

import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} TEXFILE BRANCH_URL", file=sys.stderr)
        sys.exit(1)

    tex_path = Path(sys.argv[1])
    branch_url = sys.argv[2]

    tex = tex_path.read_text(encoding="utf-8")

    header_block = (
        "\\usepackage{fancyhdr}\n"
        "\\pagestyle{fancy}\n"
        "\\fancyhf{}\n"
        "\\fancyhead[L]{\\footnotesize Source: \\url{" + branch_url + "}}\n"
        "\\fancyhead[R]{\\footnotesize\\thepage}\n"
        "\\renewcommand{\\headrulewidth}{0.4pt}\n"
    )

    marker = "\\begin{document}"
    if marker not in tex:
        print(f"ERROR: could not find {marker!r} in {tex_path}", file=sys.stderr)
        sys.exit(1)

    tex = tex.replace(marker, header_block + "\n" + marker)
    tex_path.write_text(tex, encoding="utf-8")
    print(f"Injected fancyhdr header with branch URL into {tex_path}")


if __name__ == "__main__":
    main()
