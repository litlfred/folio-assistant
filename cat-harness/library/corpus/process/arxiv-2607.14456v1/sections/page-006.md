---
doc_id: arxiv-2607.14456v1
doc_title: "2607.14456v1"
section_id: page-006
section_title: "Page 6"
pages: 6-6
pdf_page: 6
source_pdf: 2607.14456v1.pdf
source_sha256: f3f81db565e60f7f
text_source: embedded
granularity: page
---
Published as a workshop paper at SCALE - ICML 2026
through the successful generation of a complete agent,
recording input, output, and total token counts. Our
system’s token usage was measured using Langfuse
tracing, while Roo and Cline reported their own token
consumption.
4.2.2. AGENT RUN EVALUATIONS
Each generated agent was evaluated on the following metrics
using GPT-4.1 for consistency.
1. Process Adherence: Assessed via an LLM-as-a-judge
evaluation. The judge received (i) the workflow speci-
fication defining the expected tool-call sequence, (ii)
the input request, and (iii) the agent’s execution trace.
Each tool call was categorised as correct, missed (re-
quired but not called), excess (called but not required),
or out-of-sequence. The judge returned a binary adher-
ence verdict (deviation:
true/false) with a
step-by-step reasoning trace.
2. Tool-Use Exactness (TUE) Score: TUE is a binary
per-run indicator equal to 1 when the agent invokes ex-
actly the prescribed tools with zero missed, excess, or
out-of-sequence calls, and 0 otherwise. The aggregate
TUE score is the percentage of runs achieving a perfect
score.
3. Penalty-Adjusted Latency: We define latency as the
time required per unit of net-correct workflow progress,
penalising runs that spend time on incorrect tool usage.
Let T denote total execution time, C the number of
correct tool calls, and M, E, O the counts of missed,
excess, and out-of-sequence calls. The effective steps
are
P = max(ε, C −(M + E + O)),
(1)
where ε = 1 avoids division by zero. The penalty-
adjusted latency is then:
Latency = T
P
(2)
Lower values indicate faster, more accurate execution.
4.3. Results
4.3.1. AGENT GENERATION RESULTS
1. Repair Iterations: As shown in Figure 2, the spe-
cialist system required zero repair iterations across all
successful generations, compared to averages of 2.08
for Roo and 1.89 for Cline, reflecting their reliance on
iterative refinement loops to achieve functional outputs.
2. Token Usage and Cost: The specialist system aver-
aged 49.24k input and 5.82k output tokens per agent,
versus 1,484.46k/17.40k for Roo and 1,029.27k/15.36k
for Cline (a 2,915%/199% and 1,990%/164% increase
respectively), as shown in Figure 2. Combined with
zero repair iterations, the specialist system produces
a correct agent in a single pass at ≈55k total tokens,
compared to over 1,500k for Roo and 1,044k for Cline
before accounting for additional tokens consumed in re-
pair cycles. This order-of-magnitude difference makes
specialist pipelines substantially more cost-effective at
scale.
4.3.2. AGENT RUN EVALUATION RESULTS
• Tool-Use Exactness (TUE): Our specialist system
achieved the highest TUE score at 57.69%, compared
to 48.62% for Cline (+9.1 pp) and 38.11% for Roo
(+19.6 pp) (Figure 4(a)). The per-workflow breakdown
in Figure 3(a) confirms this advantage holds consis-
tently across all ten workflows regardless of complex-
ity.
• Tool-Call Errors: The specialist system averaged 1.27
total errors per run versus 3.19 for Cline and 3.22 for
Roo (both 2.5× higher; Figure 4(b)). The dominant
error mode was missed tool calls (0.86 specialist, 2.05
Cline, 1.76 Roo), reflecting generalist agents’ tendency
to return an output once sufficient information was
gathered rather than completing the full prescribed
sequence. Excess calls were less frequent but still el-
evated (0.95/Cline, 1.13/Roo vs. 0.37/specialist), and
out-of-sequence calls were low across all approaches
(≤0.33). These patterns are consistent across work-
flows (Figure 3(b)).
• Process Adherence: The specialist system achieved
the highest adherence rate at 54.68%, versus 51.57%
for Cline (+3.1 pp) and 42.43% for Roo (+12.2 pp) (Fig-
ure 4(d)). The gap widens on more complex workflows
(Figure 3(d)), suggesting that generalist systems’ ten-
dency to omit tool calls compounds into lower process
conformance as workflow complexity increases.
• Penalty-Adjusted Latency: The specialist system
achieved the lowest latency at 2.49 s per effective step,
versus 6.59 for Cline (2.6×) and 9.08 for Roo (3.6×)
(Figures 4(c), 3(c)). The elevated generalist latency
reflects both longer raw execution times and a higher
incidence of tool-call errors, both of which inflate the
metric.
Taken together, the specialist system outperforms both base-
lines on all four metrics, demonstrating the benefits of struc-
tured, specification-driven agent generation over general-
purpose coding frameworks. These gains likely stem from
6
