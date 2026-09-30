---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-024-gnd-translation
section_title: "GND translation"
section_number: null
pages: 8-8
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
This prompt was used to translate the GND pre-
ferred terms into English in batches of 100 terms:
You are a professional translator specialized in translating
controlled vocabularies such as information retrieval thesauri
and classifications.
Your task is to translate terms from the The Gemeinsame
Normdatei (GND, Integrated Authority File), a carefully
curated thesaurus known for its precise and respectful
terminology. These terms are used for academic and
informational purposes and are presented in German. Please
maintain the list structure and translate each term into English.
Only return the list of translated terms, no explanations are
needed.
This translation work is part of an educational and
informational project aimed at enhancing accessibility and
understanding of diverse concepts across languages. It is
important to handle all terms, especially those pertaining to
sensitive subjects such as health conditions, with accuracy
and respect as intended by the thesaurus editors.
Example input:
1. Individualisierte Person
2. Familie
3. Schlagwort
4. Sicherung
Translated output for the above examples:
1. Differentiated person
2. Family
3. Subject heading
4. Safeguarding
Now translate the following thesaurus terms to English:
<LIST_OF_TERMS>
Wasserbauliche Systemanalyse zur Bewertung 
der Auswirkungen des Klimawandels für 
tidebeeinflusste Nebengewässer der Elbe
The present work focusses on three major hydraulic 
engineering issues at the tidal tributaries of the 
Lower Elbe (rivers Este and Krückau). These issues 
relate to i) flood protection, ii) morphodynamics and 
morphological development, as well as iii) the impact 
of climate change on runoff and morphodynamics in 
the tidal-influenced lower reaches.
Diese Arbeit behandelt drei wesentliche 
wasserbauliche Fragestellungen an den beiden 
Nebenflüssen der Unterelbe, Este und Krückau. 
Diese beziehen sich auf i) den Hochwasserschutz, ii) 
die Morphodynamik und die morphologische 
Entwicklung sowie iii) die Auswirkungen des 
Klimawandels auf das Abflussgeschehen sowie die 
Morphodynamik in den tidebeeinflussten 
Unterläufen.
Subjects: Auswirkung, Dynamische 
Geomorphologie, Flussbau, Klimaänderung, 
Nebenfluss, Hochwasserschutz
Hydraulic Engineering System Analysis for 
Evaluating the Impacts of Climate Change on 
Tidal-Influenced Tributaries of the Elbe
The present work focuses on three major hydraulic 
engineering issues at the tidal tributaries of the 
Lower Elbe (rivers Este and Krückau). These issues 
relate to i) flood protection, ii) morphodynamics and 
morphological development, as well as iii) the impact 
of climate change on runoff and morphodynamics in 
the tidal-influenced lower reaches.
Analyse hydraulischer Systeme zur Bewertung 
der Auswirkungen des Klimawandels für 
tidebeeinflusste Nebengewässer der Elbe
Die vorliegende Arbeit konzentriert sich auf drei 
Hauptprobleme der Wasserbaukunst an den 
tidebeeinflussten Nebenflüssen der Niederelbe 
(Flüsse Este und Krückau). Diese Probleme 
beziehen sich auf i) den Hochwasserschutz, ii) die 
Morphodynamik und die morphologische 
Entwicklung sowie iii) die Auswirkungen des 
Klimawandels auf das Abflussgeschehen und die 
Morphodynamik in den tidebeeinflussten unteren 
Läufen.
Assessing the Effects of Climate-Driven 
Phosphorus Complexes on Geomorphic 
Processes in Coastal Tributaries: A Study on 
Morphodynamic Adaptation and Flood Risk 
Mitigation Strategies
This study investigates the interplay between 
climate-driven phosphorus complex formation, 
dynamic geomorphic processes, and flow 
construction in coastal tributaries. The research aims 
to understand how these factors contribute to 
increased flood risk and evaluates the effectiveness 
of adaptive management strategies for mitigating 
such impacts under changing environmental 
conditions.
Subjects: + Phosphorkomplexe
Optimierung stromlinienförmiger Uferstrukturen 
zur Reduzierung der Auswirkungen von 
Sturmfluten im Kontext von Klimawandel und 
dynamischer Geomorphologie an tiefebenen 
Flussläufen mit Nebenflüssen
Diese Studie untersucht die Effektivität 
stromlinienförmiger Uferkonzepte bei der Minderung 
der Auswirkungen von Sturmfluten an tiefebenen 
Flussläufen mit Nebenflüssen unter 
Berücksichtigung der Auswirkungen des 
Klimawandels auf die Dynamische Geomorphologie 
und den Flussbau. Die Ergebnisse liefern wertvolle 
Erkenntnisse für die Planung und Implementierung 
effektiver Hochwasserschutzmässigkeiten in diesen 
sensiblen Gebieten.
Subjects: + Stromlinie <Strömungsmechanik>               
Original record
Record ID: 3A1002732751
all-subjects/train/Thesis/en
Translated/monolingual records
Synthetic records
Figure 4: Example records translated and synthesised using the LLM. The example record included abstracts in
both English and German, so the LLM only had to translate the German title to English. The LLM performed minor
adjustment, for example changing "focusses" to "focuses" and modifying the German title. The synthetic records
were generated using the translated records as one-shot examples but adding one random GND subject.
