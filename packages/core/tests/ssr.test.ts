// @vitest-environment node
/** On the server there is no page: `loadTag()` resolves null, `getTgm()` is null. */
import { describe, expect, it } from "vitest";

import { getTgm, loadTag } from "../src/index";

describe("on the server", () => {
  it("loads nothing", async () => {
    await expect(loadTag({ host: "tgmads.example.com" })).resolves.toBeNull();
    expect(getTgm()).toBeNull();
  });
});
