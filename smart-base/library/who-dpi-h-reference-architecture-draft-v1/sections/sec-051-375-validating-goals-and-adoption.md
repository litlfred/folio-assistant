---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-051-375-validating-goals-and-adoption
section_title: "Validating goals and adoption"
section_number: 3.7.5
pages: 96-97
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
1172 
The same structure makes two further things checkable: whether the architecture's goals are 
1173 
being met, and whether a country's architecture adopts the reference. Both reuse constructs 
1174 
already introduced, shifted to the appropriate elements. 
1175 
 
1176 
Validating goals 
1177 
 
1178 
A goal is validated in the same way as a component, with the parts shifted up to the motivation 
1179 
layer. A goal carries its criteria as Outcomes — measurable results that, when achieved, signal 
1180 
it (an Outcome realises the Goal it satisfies). Where a component is checked against the 
1181 
Requirements its services are expected to satisfy, a goal is checked against its Outcomes; 
1182 
both checks yield the same kind of verdict. 
1183 
 
1184 
The criterion is the Outcome (or a Requirement); the mechanism that checks it — an indicator 
1185 
or measure — is modelled, where it needs to be shown, as a behaviour (an Application Function 
1186 
or Business Process) that evaluates the outcome, just as a conformance test is the behaviour 
1187 
that evaluates a component. The verdict of that check — whether the criterion is met — is left 
1188 
implicit for now: it is not modelled as a distinct element. (ArchiMate has no "control" type; the 
1189 
verdict would naturally be recorded as an Assessment if the model is later made to carry 
1190 
evaluation results explicitly.) The pattern is the same at both levels — criterion → evaluating 
1191 
mechanism → (implicit) verdict — whether the criterion is a service Requirement or a goal 
1192 
Outcome. 
1193 
 
1194 
Evaluating adoption by mapping 
1195 
 
1196 
When a country expresses its architecture in the same formal language, adoption becomes 
1197 
measurable by mapping each country element to the reference element it corresponds to. The 
1198 
mapping is a realisation relationship — a country component realises a reference component 
1199 
(or actor) — the very relationship already used for "a system realises an actor", now applied 
1200 
between a country's architecture and the reference. 
1201 
 
1202 
A country relates its architecture to the reference in one of three ways, and the mapping records 
1203 
which. Under adoption, the national architecture uses the reference elements directly, without 
1204 
modification — the strongest form of alignment, and the most straightforward to assess. Under 
1205 
adaptation, it modifies or extends reference elements to suit local context, health system 
1206 
structure, or regulatory requirements — the most common path — and assessment then turns 
1207 
on whether those modifications are explicitly documented and the rationale for deviation is clear. 
1208 
Under mapping, a country that already has an established architecture keeps its own 
1209 
terminology and structure and provides an explicit correspondence to the reference elements, 
1210 
with assessment focused on the completeness and correctness of that correspondence. In each 
1211 
 
 
86 
case the correspondence is expressed as a realisation relationship, and it is this that makes 
1212 
adoption measurable. 
1213 
 
1214 
Coverage and gaps then fall out mechanically: 
1215 
• 
A reference element is covered when at least one country element realises it. The 
1216 
country architecture inherits that element's criteria — the Requirements, Constraints, 
1217 
and conformance expectations attached to it — which are then tested as in 
1218 
Conformance at the Application Component level. 
1219 
• 
A single country system may realise several reference components; it covers all of them 
1220 
and is subject to each one's criteria. 
1221 
• 
A reference element that no country element realises is treated as absent — a gap, 
1222 
surfaced exactly as under Planning testing from the architecture. 
1223 
 
1224 
Adoption is thereby quantifiable: coverage is the proportion of reference elements realised by 
1225 
the country architecture, while the conformance of those covered elements is tested through 
1226 
their inherited criteria. This holds whether the country adopts the reference elements directly, 
1227 
adapts them (realisation with documented modification), or maps its own elements onto them. 
1228 
Realisation is the strongest mapping — it asserts that the country element fulfils the reference 
1229 
element's intent and so inherits its criteria; looser correspondences may use an Association or 
1230 
Specialisation, but only realisation carries that inheritance. 
1231 
 
1232
