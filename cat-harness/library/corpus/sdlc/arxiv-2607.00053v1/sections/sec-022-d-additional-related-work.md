---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-022-d-additional-related-work
section_title: "Additional Related Work"
section_number: D
pages: 10-10
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
LLMs for software engineering. OpenHands (Wang et al., 2024b) provides an open platform for generalist software agents.
Other approaches localize and patch bugs via program structure (Zhang et al., 2024b), simple two-stage pipelines (Xia
et al., 2024), planning (Bairi et al., 2024), multi-agent testing (Huang et al., 2023), or executable code actions (Wang et al.,
2024a). For training, SWE-smith (Yang et al., 2025) synthesizes bug-and-fix data by injecting defects into repositories,
and Agent-RLVR (Da et al., 2025) uses execution-based RL rewards. SWE-RM (SHUM et al., 2026) instead provides
execution-free reward signals for patch scoring; our value head is related but operates on partial trajectories.
Software engineering benchmarks. Repository-level evaluations often involve cross-file completion (Ding et al., 2023;
Liu et al., 2023) and complex tool use (Zhuo et al., 2024). SWE-bench (Jimenez et al., 2024) now has extensions to
multimodal (Yang et al., 2024c), multilingual (Zan et al., 2024), higher-rigor (Aleithan et al., 2024), live (Zhang et al.,
2025a), and performance (He et al., 2025) settings. Since these tasks are scraped from public code, contamination is a
recurring concern (Xu et al., 2024; Deng et al., 2024), motivating contamination-resistant alternatives (White et al., 2024;
Zhang et al., 2024a); SWE-bench Pro (Deng et al., 2025) addresses this with private repositories.
LLM routing. Existing approaches to routing between LLMs combine models of differing capability via hybrid rout-
ing (Ding et al., 2024), mixing (Aggarwal et al., 2023), meta-modeling (ˇSakota et al., 2024), or output ensembling (Jiang
et al., 2023). Subsequent routers use contrastive embeddings (Chen et al., 2024b), real-time prompt classification (Hari
& Thomson, 2023), graph formulations (Feng et al., 2024), and explicit cost or budget controls (Shirkavand et al., 2025;
Somerstep et al., 2025; Mei et al., 2025; Feng et al., 2025); others target reasoning vs. non-reasoning routing (Ma et al.,
2025; Pan et al., 2025; Shao et al., 2025; Wang et al., 2025; Guo et al., 2026) and thought-level cascades (Yue et al., 2024).
To handle unseen models, EmbedLLM (Zhuang et al., 2025) and universal model routing (Jitkrittum et al., 2025) embed
both prompts and LLMs so routers generalize beyond training. RL-based routers (Zhang et al., 2025b; Song et al., 2025)
learn multi-round or interpretable selection policies, and benchmarks (Hu et al., 2024; Huang et al., 2025; Lu et al., 2025)
consolidate the field.
10
