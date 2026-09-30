---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-013-theorem-fault-tolerance-of-gauging-measurement
section_title: "Theorem: Fault Tolerance of Gauging Measurement"
section_number: null
pages: 9-10
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
Theorem 2 of Williamson & Yoder (2024) (adapted): The fault-tolerant implementation of Algorithm 1
with a suitable graph G has spacetime fault-distance dST = d, where d is the distance of the original
code. Specifically, if (1) the Cheeger constant satisfies h(G) ≥1, and (2) the number of measurement
rounds satisfies to −ti ≥d, then any spacetime logical fault has weight at least d.
/-- Main Theorem (Fault Tolerance): The spacetime fault-distance
equals d. Under the conditions:
1. h(G) >= 1 (Cheeger constant at least 1)
2. (t_o - t_i) >= d (sufficient measurement rounds)
The spacetime fault-distance d_ST equals exactly d. -/
theorem FaultToleranceTheorem
[Fintype V] [Fintype E] [Fintype M] [Nonempty M]
(DC : DetectorCollection V E M)
(baseOutcomes : OutcomeAssignment M)
(logicalEffect : SpacetimeFault V E M -> Prop)
(cfg : FaultToleranceConfig)
(h_all_decompose : forall F,
IsSpacetimeLogicalFault DC baseOutcomes logicalEffect F ->
LowerBoundCase DC baseOutcomes logicalEffect cfg F)
(h_exists_d : exists F,
IsSpacetimeLogicalFault DC baseOutcomes logicalEffect F
/\ F.weight (intervalRounds cfg) = cfg.d) :
spacetimeFaultDistance DC baseOutcomes logicalEffect
(intervalRounds cfg) = cfg.d := by
9
-- Get the weight-d logical fault for existence
obtain <F_d, hF_d_log, hF_d_weight> := h_exists_d
-- Upper bound: d_ST <= d
have h_le : spacetimeFaultDistance DC baseOutcomes
logicalEffect (intervalRounds cfg) <= cfg.d := by
calc spacetimeFaultDistance DC baseOutcomes
logicalEffect (intervalRounds cfg)
<= F_d.weight (intervalRounds cfg) :=
spacetimeFaultDistance_le_weight DC baseOutcomes
logicalEffect (intervalRounds cfg) F_d hF_d_log
_ = cfg.d := hF_d_weight
-- Lower bound: d_ST >= d
have h_ge : spacetimeFaultDistance DC baseOutcomes
logicalEffect (intervalRounds cfg) >= cfg.d := by
-- Get the minimum-achieving fault
have h_has : hasLogicalFault DC baseOutcomes
logicalEffect := <F_d, hF_d_log>
obtain <F_min, hF_min_log, hF_min_weight> :=
spacetimeFaultDistance_is_min DC baseOutcomes
logicalEffect (intervalRounds cfg) h_has
-- Apply lower bound to F_min
have h_min_ge := spacetimeFaultDistance_ge_d DC
baseOutcomes logicalEffect cfg F_min hF_min_log
(h_all_decompose F_min hF_min_log)
calc cfg.d
<= F_min.weight (intervalRounds cfg) := h_min_ge
_ = spacetimeFaultDistance DC baseOutcomes
logicalEffect (intervalRounds cfg) := hF_min_weight
-- Combine
omega
A.2
