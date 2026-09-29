"""Shared configuration for a paper folio's LaTeX-to-Lean pipeline scripts.

Written into a paper folio's `.github/scripts/folio_lean/` by `folio_init`.
It began as one folio's own copy of this module, which named its paper,
its chapter files, its Lean files and its GitHub Pages site as constants.
Nothing here names a paper: every path is derived from the environment the
Lean workflows set, or discovered from what the build wrote.

Environment (all optional; relative paths are relative to the folio root):

  FOLIO_PAPER         the paper slug — the directory under the content root.
                      Only needed when the folio holds more than one paper
                      with a Lean package.
  FOLIO_CONTENT_ROOT  the folio's content root (default: folio).
  FOLIO_LEAN_DIR      the paper's Lake package (default: <root>/<paper>/lean).
  FOLIO_BUILD_DIR     where the platform's build.ts wrote chapters/ and
                      main.tex for this paper (default: build/<paper>).
  FOLIO_MANIFEST      the paper's proof-objects.json
                      (default: <build dir>/proof-objects.json).
  GITHUB_REPOSITORY   owner/repo, set by GitHub Actions; read from the
                      `origin` remote when absent.
"""

import os
import re
import subprocess
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# .github/scripts/folio_lean/config.py -> the folio root is three levels up.
REPO_ROOT = Path(__file__).resolve().parents[3]


def _from_root(value):
    p = Path(value)
    return p if p.is_absolute() else REPO_ROOT / p


CONTENT_ROOT = _from_root(os.environ.get("FOLIO_CONTENT_ROOT", "folio"))


def _discover_papers():
    """Every <content-root>/<paper>/ whose lean/ holds a Lake package."""
    if not CONTENT_ROOT.is_dir():
        return []
    out = []
    for d in sorted(CONTENT_ROOT.iterdir()):
        lean = d / "lean"
        if (lean / "lakefile.toml").exists() or (lean / "lakefile.lean").exists():
            out.append(d.name)
    return out


def _paper():
    explicit = os.environ.get("FOLIO_PAPER", "").strip()
    if explicit:
        return explicit
    papers = _discover_papers()
    # One paper is unambiguous. Several need FOLIO_PAPER; guessing the first
    # would report one paper's status against another's manifest.
    return papers[0] if len(papers) == 1 else ""


PAPER = _paper()

LEAN_DIR = _from_root(
    os.environ.get("FOLIO_LEAN_DIR") or (CONTENT_ROOT / PAPER / "lean" if PAPER else CONTENT_ROOT)
)
BUILD_DIR = _from_root(
    os.environ.get("FOLIO_BUILD_DIR") or (Path("build") / PAPER if PAPER else Path("build"))
)
CHAPTERS_DIR = BUILD_DIR / "chapters"
MAIN_TEX = BUILD_DIR / "main.tex"
# The manifest is committed, so it may live apart from the (ignored) build
# output; the Lean workflows point it at build-logs/<paper>/.
DEFAULT_MANIFEST = _from_root(os.environ.get("FOLIO_MANIFEST") or (BUILD_DIR / "proof-objects.json"))

# ---------------------------------------------------------------------------
# GitHub / publishing
# ---------------------------------------------------------------------------


def _github_repo():
    env = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if env:
        return env
    try:
        url = subprocess.check_output(
            ["git", "remote", "get-url", "origin"], cwd=REPO_ROOT, stderr=subprocess.DEVNULL
        ).decode().strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""
    m = re.search(r"github\.com[:/]([^/]+/[^/.]+?)(?:\.git)?$", url)
    return m.group(1) if m else ""


GITHUB_REPO = _github_repo()
if "/" in GITHUB_REPO:
    _owner, _name = GITHUB_REPO.split("/", 1)
    GH_PAGES_BASE = f"https://{_owner}.github.io/{_name}"
else:
    GH_PAGES_BASE = ""
DEFAULT_PDF_URL = f"{GH_PAGES_BASE}/{PAPER}.pdf" if GH_PAGES_BASE and PAPER else ""

# ---------------------------------------------------------------------------
# Chapter metadata — DISCOVERED from what build.ts wrote, never listed here
# ---------------------------------------------------------------------------

_INPUT_RE = re.compile(r"\\(?:input|include)\{([^}]+)\}")
_CHAPTER_RE = re.compile(r"\\chapter\*?(?:\[[^\]]*\])?\{([^}]*)\}")


def _chapter_files():
    """Chapter file names in reading order.

    The order main.tex inputs them in when main.tex exists (that IS the
    reading order), otherwise the chapters directory sorted by name.
    """
    if MAIN_TEX.exists():
        names = []
        for m in _INPUT_RE.finditer(MAIN_TEX.read_text(encoding="utf-8")):
            name = Path(m.group(1)).name
            if not name.endswith(".tex"):
                name += ".tex"
            if (CHAPTERS_DIR / name).exists() and name not in names:
                names.append(name)
        if names:
            return names
    if CHAPTERS_DIR.is_dir():
        return sorted(p.name for p in CHAPTERS_DIR.glob("*.tex"))
    return []


CHAPTER_FILES = _chapter_files()


def _chapter_titles():
    """1-based chapter position -> the title its \\chapter{} gives."""
    titles = {}
    for i, name in enumerate(CHAPTER_FILES, start=1):
        m = _CHAPTER_RE.search((CHAPTERS_DIR / name).read_text(encoding="utf-8"))
        if m:
            titles[i] = m.group(1).strip()
    return titles


CHAPTER_TITLES = _chapter_titles()

# ---------------------------------------------------------------------------
# LaTeX environment <-> proof-object type mapping
# ---------------------------------------------------------------------------

# Map from LaTeX environment name to object_type in the schema.
ENV_TYPES = {
    "theorem": "theorem",
    "lemma": "lemma",
    "proposition": "proposition",
    "corollary": "corollary",
    "definition": "definition",
    "example": "example",
    "remark": "remark",
    "conjecture": "conjecture",
}

# Map object_type to Lean keyword.
LEAN_KEYWORDS = {
    "theorem": "theorem",
    "lemma": "lemma",
    "proposition": "theorem",  # Lean doesn't have proposition keyword
    "corollary": "theorem",
    "definition": "def",
    "conjecture": "theorem",  # conjectures become theorems with sorry
}

# Short prefixes for display labels.
TYPE_PREFIX = {
    "definition": "Def",
    "theorem": "Thm",
    "lemma": "Lem",
    "proposition": "Prop",
    "corollary": "Cor",
    "conjecture": "Conj",
    "example": "Ex",
    "remark": "Rem",
}

# ---------------------------------------------------------------------------
# LaTeX regex patterns
# ---------------------------------------------------------------------------

# Matches \begin{theorem}, \begin{lemma}[title], etc.
BEGIN_RE = re.compile(
    r"\\begin\{(" + "|".join(ENV_TYPES.keys()) + r")\}(?:\[([^\]]*)\])?"
)
LABEL_RE = re.compile(r"\\label\{([^}]+)\}")
LEAN_RE = re.compile(r"\\lean\{([^}]+)\}")
USES_RE = re.compile(r"\\uses\{([^}]+)\}")
LEANOK_RE = re.compile(r"\\leanok\b")

# Maximum lines to scan within a LaTeX environment body.
MAX_ENV_SCAN_LINES = 50

# Keys to preserve when merging Lean linkage data from existing records.
LEAN_MERGE_KEYS = ("url", "file", "sorry_free", "mathlib_links")

# ---------------------------------------------------------------------------
# Lean package metadata — read from the lakefile, never listed here
# ---------------------------------------------------------------------------

_LIB_TOML_RE = re.compile(r"\[\[lean_lib\]\]\s*\n\s*name\s*=\s*\"([^\"]+)\"")
_LIB_LEAN_RE = re.compile(r"^\s*(?:@\[default_target\]\s*)?lean_lib\s+[«\"]?([A-Za-z0-9_.']+)", re.M)


def lean_libraries(lean_dir=None):
    """The `lean_lib` names a Lake package declares, in declaration order."""
    d = Path(lean_dir) if lean_dir else LEAN_DIR
    toml = d / "lakefile.toml"
    if toml.exists():
        return _LIB_TOML_RE.findall(toml.read_text(encoding="utf-8"))
    lean = d / "lakefile.lean"
    if lean.exists():
        return _LIB_LEAN_RE.findall(lean.read_text(encoding="utf-8"))
    return []


_DECL_KW = r"(?:theorem|lemma|def|abbrev|structure|class|inductive|instance|axiom|opaque)"


def find_decl_file(decl, lean_dir=None):
    """The .lean file (relative to the package) that declares `decl`, or None.

    Searched rather than mapped: the file a declaration lives in is a fact
    about the Lean source, so the source is where it is read from.
    """
    d = Path(lean_dir) if lean_dir else LEAN_DIR
    if not d.is_dir():
        return None
    short = decl.split(".")[-1]
    pat = re.compile(r"^\s*(?:@\[[^\]]*\]\s*)?(?:noncomputable\s+|private\s+|protected\s+)*"
                     + _DECL_KW + r"\s+(?:[\w.']*\.)?" + re.escape(short) + r"\b", re.M)
    for f in sorted(d.rglob("*.lean")):
        if ".lake" in f.parts:
            continue
        if pat.search(f.read_text(encoding="utf-8", errors="replace")):
            return str(f.relative_to(d))
    return None
