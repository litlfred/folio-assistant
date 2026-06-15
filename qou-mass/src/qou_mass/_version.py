"""Single source of truth for the qou-mass package version.

The version is also read by pyproject.toml's dynamic-version mechanism
when the package is built via setuptools/hatch. Bumping requires:

  1. Update __version__ here.
  2. Run `python -m build` to produce sdist + wheel under dist/.
  3. Tag v$(__version__) on the qou-mass repo (or paper repo until extracted).
  4. CHANGELOG.md gets a new section describing the bump.

SemVer convention (see qou-mass-architecture-plan §6):
  - MAJOR: any witness JSON byte-for-byte change (modulo timestamps),
    any removed/renamed public symbol, any default change.
  - MINOR: new public symbols, new optional kwargs, new observables.
  - PATCH: bug fixes, perf, docs.
"""

__version__ = "0.1.0a1"
