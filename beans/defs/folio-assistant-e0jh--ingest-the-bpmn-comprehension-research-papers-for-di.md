---
# folio-assistant-e0jh
$schema: bean/1.0.0
title: 'Ingest the BPMN comprehension research papers (7PMG, labeling, PMCF, flow direction, ...) so diagram lint rules cite evidence'
status: todo
type: task
priority: normal
created_at: 2026-10-31T10:10:00Z
updated_at: 2026-10-31T10:10:00Z
---

Owner, 2026-10-31 (thread "Improve BPMN quality checks from research"): review a Gemini discussion on evidence-based BPMN style, and have the connected agent (agy) download and ingest every referenced article so the authoring rules and the diagram lint rules cite the papers, not Gemini's summary of them.

Cloud sessions cannot reach researchgate.net, pmc.ncbi.nlm.nih.gov (captcha) or dbis.eprints.uni-ulm.de (robots), so this is an agy bean.

## Where the papers go

`litlfred/cat-harness` `library/<slug>/` (process-modelling evidence for the `bpmn-authoring` skill), via `bun run cat ingest uploads/FILE`. One entry per paper, with publisher, year, DOI and licence in `structure.json`.

**Licence rule (cat-harness is public).** Commit the PDF and its section text only when the licence allows redistribution (CC BY, CC BY-NC, or the arXiv licence as for the existing `arxiv-*` entries). For a publisher-copyright paper (accepted manuscripts on author pages included), keep the PDF local: record the bibliographic node (title, authors, venue, DOI, URL fetched, SHA-256, licence) and short findings notes in your own words with page numbers. No full text. Say in the bean notes which papers took which route.

## Papers

From the Gemini discussion (links as given there):

1. Winter, Pryss, Fink, Reichert. The Process Model Comprehension Framework (PMCF). arXiv:2106.12880. https://arxiv.org/pdf/2106.12880.pdf
2. Pinggera, Zugal et al. A Visual Analysis of the Process of Process Modeling. arXiv:1511.04055. https://arxiv.org/pdf/1511.04055
3. Möller, Winter, Reichert. Cognitive Factors in Process Model Comprehension: A Systematic Literature Review. Brain Sciences (open access). https://pmc.ncbi.nlm.nih.gov/articles/PMC12109775/
4. Mendling, Reijers, van der Aalst. Seven Process Modeling Guidelines (7PMG). IST 52(2), 2010. https://www.vdaalst.com/publications/p574.pdf
5. Mendling, Reijers, Recker. Activity Labeling in Process Modeling: Empirical Insights and Recommendations. Information Systems 35(4), 2010. https://hreijers.win.tue.nl/H.A.%20Reijers%20Bestanden/IS611_acceptedManuscript.pdf
6. Leopold, Mendling, Günther. Learning from Quality Issues of BPMN Models from Industry. IEEE Software 33(4), 2016. https://www.researchgate.net/publication/273258454
7. Genon, Heymans, Amyot. Analysing the Cognitive Effectiveness of the BPMN 2.0 Visual Notation. SLE 2010, LNCS 6563. https://www.researchgate.net/publication/221055397
8. Zimoch, Pryss, Schobel, Reichert. Eye Tracking Experiments on Process Model Comprehension: Lessons Learned. BPMDS 2017. https://dbis.eprints.uni-ulm.de/1505/1/Zimoch_BPMDS_2017_LessonsLearned_CameraReady.pdf

Added by the thread, because they test claims Gemini made:

9. Mendling, Sánchez-González, García, La Rosa. Thresholds for error probability measures of business process models. JSS 85(5), 2012. https://research.wu.ac.at/files/38083607/JSS12-Metrics.pdf (check: is this where Gemini's "warn at 31 nodes" comes from?)
10. Figl, Strembeck. Findings from an experiment on flow direction of business process models. EMISA 2015. https://nm.wu-wien.ac.at/nm/strembeck/publications/emisa15.pdf
11. Figl, Strembeck. On the Importance of Flow Direction in Business Process Models. ICSOFT 2014. https://scitepress.org/Papers/2014/50904/pdf/index.html
12. The Effectiveness of Business Process Visualisations: a Systematic Literature Review. arXiv:2504.10971. https://arxiv.org/pdf/2504.10971
13. Avila, dos Santos, Mendling, Thom. A systematic literature review of process modeling guidelines and their empirical support. BPMJ 27(1), 2021. doi:10.1108/BPMJ-10-2019-0407
14. Reijers, Freytag, Mendling, Eckleder. Syntax highlighting in business process models. Decision Support Systems 51(3), 2011.
15. Zimoch, Pryss, Probst, Schobel, Reichert. Cognitive insights into business process model comprehension: preliminary results for experienced and inexperienced individuals. BPMDS 2017 (tests Gemini's novices-vs-experts claim).
16. zur Muehlen, Recker. How Much Language Is Enough? Theoretical and Practical Use of BPMN. CAiSE 2008 (the real source for "a small part of BPMN is used").
17. Moody. The "Physics" of Notations. IEEE TSE 35(6), 2009.

If a paper cannot be fetched, record the URL tried and the error, and move on.

## Done when
- [ ] each paper above is a `library/` entry or a recorded bibliographic node with findings notes, with its route (full text / notes only) stated
- [ ] for each, the notes answer: study design (n, participants, notation, task), what was measured (error probability, accuracy, time, perceived ambiguity), and any numeric threshold the paper itself states
- [ ] the open questions are answered with page cites: the source of "31 nodes"; Leopold et al.'s model and company counts (Gemini said 585 models, six enterprises); whether Leopold et al. use the term "banana model"; whether Zimoch et al. show experts and novices failing alike on complex models
- [ ] one PR on litlfred/cat-harness, linked in these notes
- [ ] needs network: agy only (researchgate, PMC captcha, uni-ulm robots block the cloud container)
