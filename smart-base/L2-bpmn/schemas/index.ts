/** The layers this subgraph's schemas hold, for the engine in ../../L1/schemas/ (layers.ts). */
import type { LayerSpec } from "../../L1/schemas/ontology.ts";
import { L2_BPMN } from "./l2-bpmn.ts";

export const layers: LayerSpec[] = [L2_BPMN];
