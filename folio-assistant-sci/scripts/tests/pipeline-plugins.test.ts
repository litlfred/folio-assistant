/**
 * `pipeline-plugins` tests whose subject is folio-assistant-sci's contribution
 * — that this instance fills every pipeline-plugin slot — moved here from
 * `cat-harness/content/pipeline/pipeline-plugins.test.ts` (bean `ho66`). The
 * code under test is cat-harness's, imported DOWN; what it is held against is
 * this instance's, so standing alone cat-harness has nothing for these to
 * read. The rest of that file's tests stay there.
 */
import { afterEach, describe, expect, it } from "bun:test";

import {
  PIPELINE_PLUGIN_KINDS,
  pipelinePlugin,
  usePipelinePluginRegistry,
} from "../../../cat-harness/content/pipeline/pipeline-plugins";

afterEach(() => usePipelinePluginRegistry(undefined));

describe("this repository", () => {
  it("folio-assistant-sci fills every slot, loaded lazily from the running folio", () => {
    usePipelinePluginRegistry(undefined);
    for (const kind of PIPELINE_PLUGIN_KINDS) {
      expect(() => pipelinePlugin(kind)).not.toThrow();
    }
  });
});
