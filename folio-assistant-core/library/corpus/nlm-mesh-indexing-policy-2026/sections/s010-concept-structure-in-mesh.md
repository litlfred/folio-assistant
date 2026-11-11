---
doc_id: nlm-mesh-indexing-policy-2026
doc_title: "NLM — MeSH indexing policy and vocabulary structure (selected pages)"
section_id: s010-concept-structure-in-mesh
section_title: "Concept Structure in MeSH"
file: "nlm-mesh-indexing-policy-2026.md"
lines: 315-390
source_sha256: ef74ac912a89e108
granularity: heading
---
## Concept Structure in MeSH

Source: <https://www.nlm.nih.gov/mesh/concept_structure.html> · Last Reviewed: July 14, 2025

Terms in a MeSH record which are strictly synonymous with each other are grouped in a category called a "Concept." (Not to be confused with Supplementary Concept Records.) See the [Concept](/mesh/xml_data_elements.html#Concept) element in MeSH. Each MeSH record consists of one or more Concepts, and each Concept consists in one or more synonymous terms. For example,

    Cardiomegaly [Descriptor]
         Cardiomegaly                      [Concept, Preferred]
              Cardiomegaly                    [Term, Preferred]
              Enlarged Heart                  [Term]
              Heart Enlargement               [Term]
         Cardiac Hypertrophy               [Concept, Narrower]
              Cardiac Hypertrophy             [Term, Preferred]
              Heart Hypertrophy               [Term]

This Descriptor record consists of two Concepts and five terms. Each Concept has a Preferred Term, which is also said to be the name of the Concept. And each record has a Preferred Concept. The name of the record - the term most often used to refer to the Descriptor - is the Preferred Term of the preferred Concept.

Within each Concept the terms are synonymous with each other. In contrast, the terms in one Concept are not strictly synonymous with terms in another Concept, even in the same record. For example, one concept in a record may be narrower than the Preferred Concept, as in the above example. Also note that the terms in a concept inherit this relationship and so are narrower, for example, than the terms in the other concept. However, all the terms in a record are equivalent for purposes of indexing and searching MEDLINE and so they are still entry terms for the record.

A more complex example, with three Concepts and 12 terms.

    AIDS Dementia Complex [Descriptor]
         AIDS Dementia Complex                                   [Concept, Preferred]
              AIDS Dementia Complex                                 [Term, Preferred]
              Acquired-Immune Deficiency Syndrome Dementia Complex  [Term]
              AIDS-Related Dementia Complex                         [Term]
              HIV Dementia                                          [Term]
              Dementia Complex, Acquired Immune Deficiency Syndrome [Term]
              Dementia Complex, AIDS-Related                        [Term]
         HIV Encephalopathy                                       [Concept, Narrower]
              HIV Encephalopathy                                    [Term, Preferred]
              AIDS Encephalopathy                                   [Term]
              Encephalopathy, HIV                                   [Term, Preferred]
              Encephalopathy, AIDS                                  [Term]
         HIV-1-Associated Cognitive Motor Complex                [Concept, Narrower]
              HIV-1-Associated Cognitive Motor Complex              [Term, Preferred]
              HIV-1 Cognitive and Motor Complex                     [Term]       

Another example :

    Exercise [Descriptor]
         Exercise                    [Concept, Preferred]
              Exercise                  [Term, Preferred]
              Exercise, Physical        [Term]
         Exercise, Aerobic           [Concept, Narrower]
              Exercise, Aerobic         [Term, Preferred]
              Aerobic Exercise          [Term]
         Exercise, Isometric         [Concept, Narrower]
              Exercise, Isometric       [Term, Preferred]
              Isometric Exercise        [Term]      

An example of a chemical (partial record).

    Aspirin [Descriptor]
         Aspirin                        [Concept, Preferred]
              Aspirin                      [Term, Preferred]
              Acetylsalicylic Acid         [Term]
              2-(Acetyloxy)benzoic Acid    [Term]
         Solprin                        [Concept, Narrower]
              Solprin                      [Term, Preferred]
         Ecotrin                        [Concept, Narrower]
              Ecotrin                      [Term, Preferred]

The Descriptor/Concept/Term structure makes it possible to attach various data elements in MeSH to the appropriate object. For example, thesauri have long distinguished between "broader terms" and "narrower" terms, but it is clear that these are relations between concepts and only derivatively between terms in the concepts. (See the [ConceptRelation](/mesh/xml_data_elements.html#ConceptRelation) element.) Similarly, [Scope Notes](/mesh/xml_data_elements.html#ScopeNote) are properly attributed to Concepts, while the [Annotation](/mesh/xml_data_elements.html#Annotation) applies to the record level. The Concept structure also provides a precise way to specify strict synonymy since Concepts by definition consist of synonymous terms.

Note that this three-tiered structure is within a given record, not between separate records. This is in contrast to the [MeSH Tree Structures](/mesh/intro_trees.html), which are hierarchical in structure, but the relationships are between different Descriptor records. MeSH includes both types of relationships. See "Concepts, Synonyms, and Descriptor Structure" in [Introduction to MeSH in XML format](/mesh/xmlmesh.html).

The MeSH Concept structure is not currently used in MEDLINE indexing or PubMed searching but is used by MeSH analysts in creating and updating the MeSH vocabulary and it supports relationships with other systems such as NLM's [Unified Medical Language System](//www.nlm.nih.gov/research/umls/umlsmain.html). The Concept structure is also used by The MeSH Translation Maintenance System\* and has potential use for more advanced technology in information retrieval and other applications. For more information see the following:

1\. "Concepts, synonyms, and Descriptor structure" in [Introduction to MeSH in XML format](/mesh/xmlmesh.html).

2\. NLM Technical Bulletin article [Changes in MeSH Data Structure](//www.nlm.nih.gov/pubs/techbull/ma00/ma00_mesh.html) (includes the example "AIDS Dementia Complex").

Last Reviewed: July 14, 2025
