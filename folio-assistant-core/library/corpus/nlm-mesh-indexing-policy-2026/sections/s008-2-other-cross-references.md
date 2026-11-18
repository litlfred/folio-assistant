---
doc_id: nlm-mesh-indexing-policy-2026
doc_title: "NLM — MeSH indexing policy and vocabulary structure (selected pages)"
section_id: s008-2-other-cross-references
section_title: "2. Other cross-references"
file: "nlm-mesh-indexing-policy-2026.md"
lines: 253-295
source_sha256: ef74ac912a89e108
granularity: heading
---
#### 2. Other cross-references

Three kinds of informative references suggest other Descriptors in MeSH that relate to the subject and that may be useful in indexing, cataloging, or searching a particular topic.

**2.1 See Related**

See related references are used for a variety of relationships between Descriptor records where a user of one Descriptor is reminded of another Descriptor which may be of interest. For example, the relationship may be between a disease and its cause:

       Factor XIII Deficiency see related Factor XIIIa

Or between an organ and a physiological process:

       Bone and Bones see related Osteogenesis

Or between an organ and a drug acting on it:

       Bronchi see related Bronchoconstrictor Agents

Or between an organ and a procedure:

       Bile Ducts see related Cholangiography

In the [MeSH Browser](/mesh/MBrowser.html) the See Related reference is displayed as **See Also**, and is the \<[SeeRelatedDescriptor](/mesh/xml_data_elements.html#SeeRelatedDescriptor)\> element in XML MeSH.

**2.2 Consider Also**

Reference to other Descriptors having related linguistic roots, for example:

       Brain consider also terms at CEREBR- and ENCEPHAL-.

Consider Also references are used primarily with anatomical Descriptors to refer to groups of Descriptors beginning with a common stem rather than to a single Descriptor. In the [MeSH Browser](/mesh/MBrowser.html) the reference is displayed as **Consider Also**, and as the \<[ConsiderAlso](/mesh/xml_data_elements.html#ConsiderAlso)\> element in XML MeSH.

**2.3 Entry Combination**

In some NLM systems using MeSH, certain Descriptor/Qualifier combinations are prohibited by a special MeSH data element called the \<[EntryCombination](/mesh/xml_data_elements.html#EntryCombination)\> in XML MeSH, and **Entry Combination** in the [MeSH Browser](/mesh/MBrowser.html). For example, the Descriptor *Accidents* cannot be used with the Qualifier *prevention & control*, but instead of this combination, the Descriptor *Accident Prevention* should be used.

**2.4 MeSH Tree Structures**

In some thesauri the function cross references to broader and narrower terms is comparable to the hierarchical relationships in the [MeSH Tree Structures](/mesh/intro_trees.html), though hierarchies enable multiple levels of specificity, as do the MeSH Trees. These relationships are displayed graphically in the [MeSH Browser](/mesh/MBrowser.html) and the [online MeSH Tree Structures](/mesh/trees.html). The Trees data are also used by PubMed for the default behavior of inclusive searching. The Trees data in XML MeSH are to be found in the [TreeNumber](/mesh/xml_data_elements.html#TreeNumber) element.

Last Reviewed: July 9, 2025
