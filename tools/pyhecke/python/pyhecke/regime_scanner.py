"""RegimeScanner: API for sweeping q to find algebraic rank drops.

This module implements the dynamic Substrate Engine for scanning phase
boundaries (the Cosmological Melt). It dynamically recalculates Wedderburn
weights and trace elements as the Hecke deformation parameter q varies,
allowing downstream research into exotic hadronic and molecular regime changes.
"""

from __future__ import annotations
import math
from typing import Callable, Tuple, List, Optional
try:
    import mpmath as mp
except ImportError:
    mp = None

class RegimeScanner:
    """Sweeps the Hecke parameter q to locate topological regime changes.
    
    Identifies:
      1. Absolute observability rank drops (v_full = 0).
      2. Relative binding stability thresholds.
    """
    
    def __init__(self, precision: int = 50):
        if mp is None:
            raise ImportError("mpmath is required for RegimeScanner.")
        self.dps = precision
        
    def _compute_h3_wedderburn_weights(self, q: mp.mpf) -> Tuple[mp.mpf, mp.mpf, mp.mpf]:
        """Dynamically computes the Wedderburn weights for H_3(q) at parameter q.
        
        Args:
            q: The continuous Hecke deformation parameter.
            
        Returns:
            Tuple of (w_s, w_d, w_a) representing the symmetric, standard, and
            antisymmetric channel weights.
        """
        q2 = q**2
        denom_w = q2**2 + 4*q2 + 1
        w_s = q2 / denom_w
        w_a = q2 / denom_w
        w_d = (q2 + 1)**2 / denom_w
        return w_s, w_d, w_a

    def find_rank_drop(
        self,
        q_start: float,
        q_end: float,
        channel_trace_func: Callable[[mp.mpf], mp.mpf],
        steps: int = 1000
    ) -> List[float]:
        """Sweeps q and finds coordinates where the trace function crosses zero.
        
        Args:
            q_start: The start of the continuous q-regime to scan.
            q_end: The end of the continuous q-regime to scan.
            channel_trace_func: A callable that returns the numeric trace for a given q.
            steps: Resolution of the sweep.
            
        Returns:
            List of q-values where the rank drop occurs (zero crossings).
        """
        with mp.workdps(self.dps):
            dq = (q_end - q_start) / steps
            q_vals = [mp.mpf(q_start) + i * mp.mpf(dq) for i in range(steps + 1)]
            crossings = []
            
            prev_sign = None
            for q in q_vals:
                val = channel_trace_func(q)
                if val == 0:
                    crossings.append(float(q))
                    prev_sign = 0
                    continue
                sign = 1 if val > 0 else -1
                if prev_sign is not None and prev_sign != 0 and sign != prev_sign:
                    try:
                        root = mp.findroot(channel_trace_func, q)
                        crossings.append(float(root))
                    except ValueError:
                        crossings.append(float(q))
                prev_sign = sign
                
            return sorted(list(set(crossings)))

    def scan_h2_molecule(self) -> dict:
        """Specific sweep for the H_2 covalent bond stability boundary."""
        with mp.workdps(self.dps):
            def v_std(q: mp.mpf) -> mp.mpf:
                qi = mp.mpf(1.0) / q
                h = q - qi
                z = mp.mpf(1.0) / (mp.sqrt(q) + mp.sqrt(qi))
                ai, bi = mp.mpf(0.0), mp.mpf(1.0)
                for _ in range(7):
                    ai, bi = bi, ai - bi * h
                return z * ai + bi
                
            def v_full(q: mp.mpf) -> mp.mpf:
                w_s, w_d, w_a = self._compute_h3_wedderburn_weights(q)
                qi = mp.mpf(1.0) / q
                lam_s = qi**7
                lam_a = (-q)**7
                return w_s * lam_s + w_d * v_std(q) + w_a * lam_a

            std_drops = self.find_rank_drop(1.01, 1.2, v_std, steps=100)
            full_drops = self.find_rank_drop(1.01, 1.2, v_full, steps=100)
            
            return {
                "standard_channel_drop": std_drops[0] if std_drops else None,
                "full_observable_drop": full_drops[0] if full_drops else None
            }
