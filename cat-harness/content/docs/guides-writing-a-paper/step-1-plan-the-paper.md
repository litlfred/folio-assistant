Start by asking the agent to load the planning skill and propose a structure.
Behind the scenes it calls `skill_fetch content-plan`.

> **You:** I want to write a short paper, *"A note on the harmonic series"*. It
> should define the partial sums, state and prove that the series diverges, and
> include one worked example. Plan it out.
>
> **Assistant:** *(loads `content-plan`)* Here's a proposed plan:
>
> 1. **`prose`** — Introduction & motivation
> 2. **`definition`** `def:harmonic-partial-sum` — the partial sum $H_n$
> 3. **`theorem`** `thm:harmonic-diverges` — $H_n \to \infty$
> 4. **`proof`** `prf:harmonic-diverges` — Oresme's grouping argument
> 5. **`example`** `ex:H4` — compute $H_4$
>
> The definition and theorem will get Lean counterparts. Shall I scaffold the
> repo and create these blocks as drafts?
>
> **You:** Yes, go ahead.

This is also where you'd open work-plan items so the plan survives across
sessions:

```sh
beans create "Draft harmonic-series paper: blocks + Lean"
beans <id> --status in-progress
```
