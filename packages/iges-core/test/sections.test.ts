import { describe, expect, it } from "vitest";
import { parseTerminateSection } from "../src/parse/sections.js";

describe("parseTerminateSection", () => {
  it("reads zero-padded S/G/D/P count fields", () => {
    expect(parseTerminateSection("S0000001G0000004D0000012P0000006")).toEqual({
      startLineCount: 1,
      globalLineCount: 4,
      directoryLineCount: 12,
      parameterLineCount: 6,
    });
  });

  it("reads space-padded S/G/D/P count fields", () => {
    expect(parseTerminateSection("S      1G      4D      2P      1")).toEqual({
      startLineCount: 1,
      globalLineCount: 4,
      directoryLineCount: 2,
      parameterLineCount: 1,
    });
  });
});
