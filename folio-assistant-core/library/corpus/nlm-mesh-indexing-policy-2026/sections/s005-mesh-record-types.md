---
doc_id: nlm-mesh-indexing-policy-2026
doc_title: "NLM — MeSH indexing policy and vocabulary structure (selected pages)"
section_id: s005-mesh-record-types
section_title: "MeSH Record Types"
file: "nlm-mesh-indexing-policy-2026.md"
lines: 194-242
source_sha256: ef74ac912a89e108
granularity: heading
---
## MeSH Record Types

Source: <https://www.nlm.nih.gov/mesh/intro_record_types.html> · Last Reviewed: March 24, 2026

MeSH contains several different types of terms.

**Descriptors (main headings):** characterize the subject matter or content.

**Qualifiers:** are used with descriptors and afford a means of grouping together those documents concerned with a particular aspect of a subject. A list of subheads appears following the list of new descriptors. MeSH also has special types of descriptors that are not printed in Index Medicus but are available for indexing, cataloging, and online searching: Publication Types: characterize what the item is, i.e., its genre, rather than what it is about. Geographics: include continents, regions, countries, states, and other geographic subdivisions. They are listed in category Z of the tree structures.

**Entry terms:** synonyms or closely related terms that are cross-references to descriptors. Generally, entry vocabulary may be used interchangeably with preferred descriptors for searching of PubMed. Thus, the entry vocabulary is a means by which the MeSH thesaurus can be enriched to the advantage of both the online user and the user of the printed bibliography.

Complex concepts can be described in three different ways. The first of these is coordination, the combined use of two or more separate descriptors. For example, jejunal enteritis may be expressed by the use of Jejunal Diseases + Enteritis. Secondly, qualifiers can be used in conjunction with appropriate descriptors. A deficiency of monoamine oxidase may be indexed as Monoamine Oxidase/deficiency. The direct linkage of the qualifier to the descriptor to which it relates avoids the possibility of false coordination that may occur if two descriptors are used to represent a single concept. Thirdly, many pre-coordinated descriptors are contained in MeSH for frequently encountered subjects. If MeSH has a precoordinated descriptor such as Heart Surgery, the indexer or cataloger uses it rather than a descriptor-qualifier combination. If a descriptor-qualifier combination is available, it will be used in preference to coordinating two descriptors.

The following is a list of the three basic types of MeSH Records: Descriptors, Qualifiers, and Supplementary Concept Records (SCRs)

- **Descriptors**  
  This record type plays a central role in MeSH vocabulary as a unit of Indexing and retrieval. With the exception of Class 3 Descriptors, all descriptors are organised into a numbered tree structure or hierarchy that allows users to browse in a orderly fashion from broader to narrower topics. Descriptors are divided into four classes.
  - **Class 1 Descriptors - Main Headings**  
    These records are topical headings that are used to index citations in NLM's MEDLINE database, for cataloging of publications, and other databases, and are searchable in PubMed as \[MH\]. Most Descriptors indicate the subject of an indexed item, such as a journal article, that is, what the article is about. Descriptors are generally updated on an annual basis but may, on occasion, be updated more frequently.
  - **Class 2 Descriptors - Publication Characteristics (Publication Types)**  
    These records indicate what the indexed item is, i.e., its genre, rather than what it is about, for example, *Historical Article*. They may include *Publication Components*, such as *Charts*; *Publication Formats*, such as *Editorial*; and *Study Characteristics*, such as *Clinical Trial*. They function as metadata, rather than being about the content. These records are searchable in PubMed as Publication Type \[PT\], and the terms in MEDLINE records are labeled as "PT" or \<PublicationType\> rather than "MH" or \<MeSHHeading\>. They are listed in category V of the [MeSH Tree Structures](/mesh/intro_trees.html). A list is available of [Publication Types, with Scope Notes](/mesh/pubtypes.html).
  - **Class 3 Descriptors - Check Tags**  
    This class of descriptors is used solely for tagging citations that contain certain categories of information. They do not appear in the MeSH tree. Modernization has largely eliminated the need for the data type and many of the Check Tags have been changed to Class 1 headings that can be used either a MH or a Check Tag. Currently only two Class 3 descriptors remain: "Male" and "Female".
  - **Class 4 Descriptors - Geographics**  
    Descriptors which include continents, regions, countries, states, and other geographic subdivisions. They are not used to characterize subject content but rather physical location. They are listed in category Z of the [MeSH Tree Structures](/mesh/intro_trees.html).
- **Qualifiers**  
  There are 77 topical Qualifiers (also known as Subheadings) used for indexing and cataloging in conjunction with Descriptors. Qualifiers afford a convenient means of grouping together those citations which are concerned with a particular aspect of a subject. For example, *Liver/drug effects* indicates that the article or book is not about the liver in general, but about the effect of drugs on the liver Qualifiers are searchable in PubMed as MeSH Subheadings \[SH\]. There is only a single type of Qualifiers in MeSH. The qualifers are listed below.
  - [Qualifier Tree Hierarchy](/mesh/subhierarchy.html)
  - [Qualifiers by Allowable Category](/mesh/topcategories.html)
  - [Qualifiers with Scope Notes](/mesh/qualifiers_scopenotes.html)
- **Supplementary Records**  
  Supplementary Records, also called Supplementary Chemical Records(SCRs), are used to index chemicals, drugs, and other concepts such as rare diseases for MEDLINE and are searchable by Substance Name \[NM\] in PubMed. Unlike Descriptors, SCRs are not organised in a tree hierarchy. Instead each SCR is linked to one or more Descriptors by the [Heading Mapped To (HM) field](/mesh/xml_data_elements.html#HeadingMappedTo) in the SCR. They also include a [Indexing Information (II) field](/mesh/xml_data_elements.html#IndexingInformation) field that is used to refer to other descriptors that are from related topics. SCRs are created daily and distributed nightly Monday-Thursday. There are currently over 230,000 SCR records with over 505,000 SCR terms. Like all MeSH records, SCRs are searchable in the [MeSH Browser](/mesh/MBrowser.html). Four classes of SCRs exist.
  - **Class 1 Supplementary Records - Chemicals**  
    These records are dedicated to chemicals and are primarily heading mapped to the D tree descriptors.
  - **Class 2 Supplementary Records - Protocols**  
    These records are dedicated to Chemotherapy Protocols. They are heading mapped to the MeSH heading "Antineoplastic Combined Chemotherapy Protocols" and to chemicals used in the protocols found in D tree descriptors.
  - **Class 3 Supplementary Records - Diseases**  
    These records are dedicated to diseases and are primarily heading mapped to the C tree descriptors and anatomical headings found in the A tree.
  - **Class 4 Supplementary Records - Organisms (new for 2018 MeSH)**  
    These records are dedicated to organisms (e.g., viruses) and are primarily heading mapped to the B tree organism descriptors.
  - **Class 5 Supplementary Records – Population Groups (new for 2023 MeSH)**  
    These records are dedicated to population groups (e.g., ethnic, ethnolinguistic or tribal names) and are primarily heading mapped to the M tree population group descriptors.

*For questions, problems, or just to give feedback [CLICK HERE](/mesh/meshsugg.html "Your Feedback is Welcome!")*

Last Reviewed: March 24, 2026
