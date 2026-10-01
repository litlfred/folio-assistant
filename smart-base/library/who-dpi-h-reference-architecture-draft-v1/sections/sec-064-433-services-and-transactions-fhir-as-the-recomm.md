---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-064-433-services-and-transactions-fhir-as-the-recomm
section_title: "Services and Transactions: FHIR as the Recommended Framework"
section_number: 4.3.3
pages: 107-107
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
306 
Once data structures and the actors that use them are defined, the next layer of specification 
307 
concerns how systems exchange data — the services they expose and the transactions they 
308 
support. The reference architecture recommends HL7 FHIR38 as the framework for specifying 
309 
and implementing health data exchange services and transactions. FHIR provides a 
310 
comprehensive, widely adopted, and actively maintained set of specifications for health data 
311 
resources, RESTful APIs, and transaction patterns. It delivers the syntactic and structural layer 
312 
of interoperability — a common way to represent and exchange data — together with the 
313 
mechanisms, through profiles and terminology bindings, by which semantic interoperability is 
314 
carried. Those mechanisms do not by themselves guarantee shared meaning: semantic 
315 
interoperability also depends on governed terminology and a governed logical information 
316 
model. The terminology service supplies the agreed codes and value sets; the logical 
317 
information model repository holds the authoritative, technology-independent definition of the 
318 
data, from which FHIR profiles are derived and against which they are validated. A FHIR profile 
319 
is a representation of that logical model, not a replacement for it — two systems can each be 
320 
valid FHIR and still diverge in meaning unless both conform to the same governed information 
321 
model. Its alignment with modern web standards makes it accessible to a broad ecosystem of 
322 
implementers, and its active global community ensures that it evolves with emerging health 
323 
system needs. 
324 
For each DPI-H component, FHIR-based profiles should define the minimum set of FHIR 
325 
resources the component supports, the API operations it exposes, the search parameters it 
326 
enables, and the transaction patterns through which consuming systems interact with it. 
327 
Together with the actor definitions described above, these profiles constitute the technical 
328 
specification that suppliers, implementers, and governments use to build conformant systems 
329 
and to assess whether existing systems meet DPI-H requirements. 
330 
Countries earlier in their implementation journey may not be able to achieve full FHIR 
331 
conformance immediately. The reference architecture accommodates this through a progressive 
332 
approach — countries can begin with simpler exchange mechanisms and evolve toward FHIR 
333 
conformance over time — provided that the data models and semantic standards underlying 
334 
their implementations are aligned from the outset. FHIR compatibility is hardest to retrofit where 
335 
the underlying data structures are not conformant; it is far more straightforward where data 
336 
models are already aligned to FHIR resource structures, even if the API layer is not yet fully 
337 
FHIR-compliant. 
338
