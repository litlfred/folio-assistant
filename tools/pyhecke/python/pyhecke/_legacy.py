"""Bridge to folio-assistant/computations/hecke_core.py.

Adds the legacy computations directory to sys.path so `hecke_core` and
its siblings (q_parameter, experimental_constants, crt_markov, etc.)
can be imported. This is the scaffolding that lets pyhecke.* delegate
to the legacy module without duplicating 3425 lines.

M2 will extract the code outright; M1 keeps the delegation.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional


def _find_computations_dir() -> Optional[Path]:
    env = os.environ.get("FOLIO_COMPUTATIONS_DIR")
    if env and Path(env).is_dir():
        return Path(env)

    here = Path(__file__).resolve()
    for anc in here.parents:
        cand = anc / "folio-assistant" / "computations"
        if cand.is_dir() and (cand / "hecke_core.py").is_file():
            return cand

    d = Path.cwd().resolve()
    while d != d.parent:
        cand = d / "folio-assistant" / "computations"
        if cand.is_dir() and (cand / "hecke_core.py").is_file():
            return cand
        d = d.parent

    return None


_LEGACY_DIR = _find_computations_dir()
if _LEGACY_DIR is not None and str(_LEGACY_DIR) not in sys.path:
    sys.path.insert(0, str(_LEGACY_DIR))


def legacy_dir() -> Optional[Path]:
    return _LEGACY_DIR
