---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-062-431-design-data-structures-and-data-models-first
section_title: "Design Data Structures and Data Models First"
section_number: 4.3.1
pages: 105-106
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
256 
The most consequential implementation decision a country makes is not which software to 
257 
procure but what data to capture and how to structure it. Data models define the shape of 
258 
information across the entire digital health ecosystem — what fields are recorded for a client, 
259 
how a facility is described, what attributes constitute a health worker record, how a product is 
260 
catalogued. These decisions propagate into every system that stores, exchanges, or uses that 
261 
data. Getting them right at the outset — and governing them through the semantic governance 
262 
infrastructure described elsewhere in this chapter — is essential to achieving semantic 
263 
interoperability across the ecosystem. 
264 
 
36Wilton Park, Leveraging digital public infrastructure for sustainable health system 
transformation, report of the dialogue held 23–25 February 2026. 
 
 
95 
Countries should define and standardise a minimum set of data models for each DPI-H 
265 
component before implementation begins, regardless of the technology through which those 
266 
components will be delivered. These minimum data models should specify the mandatory data 
267 
elements that every implementation supports — the irreducible set of attributes without which a 
268 
registry, record, or service could not function as shared infrastructure — while allowing national 
269 
extensions that accommodate country-specific requirements without breaking interoperability 
270 
with the core. The logical information model repository is the designated home for these 
271 
national data models, and its governance processes are the mechanism through which they are 
272 
maintained, versioned, and distributed. 
273 
For the core registries, minimum data models should address at least the following: for the client 
274 
registry, the minimum demographic and identity attributes required to uniquely identify a person 
275 
across health system interactions; for the facility registry, the minimum attributes required to 
276 
describe a health service delivery point, including its location, service capabilities, and 
277 
operational status; for the health workforce registry, the minimum attributes required to describe 
278 
a licensed health worker, including their credentials, specialisation, and deployment; and for the 
279 
product registry, the minimum attributes required to describe a regulated health product, 
280 
including its identity, classification, and regulatory status. For terminology services and the 
281 
logical information model repository, minimum profiles should address the metadata 
282 
requirements for versioning, validity periods, and content integrity described in the semantic 
283 
governance infrastructure section. 
284
