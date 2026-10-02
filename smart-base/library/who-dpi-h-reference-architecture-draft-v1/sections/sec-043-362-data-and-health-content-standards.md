---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-043-362-data-and-health-content-standards
section_title: "Data and health content standards"
section_number: 3.6.2
pages: 84-85
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
791 
 
792 
Moving data reliably is necessary but not sufficient; the data also needs to carry its meaning 
793 
intact. Two complementary concerns determine whether it does: the structure of the data — 
794 
how clinical facts are organised, qualified and related to one another — and the meaning of the 
795 
coded values that the structure contains. A single code for "blood pressure", for example, 
796 
conveys little without the structure that situates it: systolic and diastolic components, the body 
797 
site, and the patient's state at the time of measurement. Structure without governed meaning, 
798 
and meaning without governed structure, each leave data that a receiving system is unable to 
799 
interpret reliably. 
800 
 
801 
The architecture locates these two concerns in two foundational DPI-H components described 
802 
elsewhere in this guidance. The Terminology Service governs meaning: the codes, value sets 
803 
and classifications — drawn from, and mapped across, international vocabularies — by which 
804 
clinical and administrative concepts are represented and interpreted consistently. The Logical 
805 
Information Model Repository governs structure: the logical information models that define how 
806 
data is organised and contextualised, maintained as governed, versioned national assets. The 
807 
two are often summarised by analogy as the dictionary and the grammar of health data; both 
808 
are required for data to be exchanged with its meaning preserved. 
809 
 
810 
 
 
74 
Health content standards supply the shared vocabulary and structure on which this depends. 
811 
The architecture references, rather than reinvents, established and openly governed standards 
812 
— among them HL7 FHIR for the exchange-oriented representation of health data; SNOMED 
813 
CT (and SNOMED GPS), ICD-11 and LOINC for clinical terminology and classification; GS1 
814 
and IDMP-family identifiers for products; DICOM for imaging; integration profiles such as those 
815 
maintained by IHE; and content specifications such as the international patient summary, which 
816 
defines the meaningful minimum that a given exchange should carry. The selection and binding 
817 
of standards is made nationally and recorded in the information model and terminology 
818 
components, so that systems implement a common national specification rather than divergent 
819 
local interpretations. 
820 
 
821 
A widely used exchange standard does not by itself guarantee semantic interoperability. 
822 
Standards designed primarily for data in motion are highly extensible, and uncoordinated 
823 
extension produces what are sometimes described as interoperable silos: systems that each 
824 
conform to the same standard yet are unable to exchange meaning because they have 
825 
extended it differently. A nationally governed information model constrains and harmonises 
826 
these extensions, providing the anchor against which conformance can be defined and tested. 
827 
The benefit holds whichever representational paradigm a country adopts; aligning information 
828 
models at the outset improves interoperability regardless of the underlying exchange or 
829 
persistence technology. 
830 
 
831 
Because existing components cannot all adopt a single representation at once, the architecture 
832 
provides for adaptation at the boundary. Where a connecting component does not natively 
833 
speak the agreed specification, an adapter translates between its local representation and the 
834 
national standard. Following established practice, the consuming side should provide the 
835 
adapter it requires; this keeps the number of translations manageable and avoids the 
836 
unscalable situation in which every component maps to every other. Adapters should perform 
837 
representational translation only and should not become a place where clinical meaning is 
838 
silently altered. 
839 
 
840
