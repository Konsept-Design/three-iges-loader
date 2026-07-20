import { describe, expect, it } from "vitest";
import { parseHollerith } from "../src/parse/hollerith.js";
import { splitParameterRecords, tokenizeFields } from "../src/parse/paramTokenizer.js";

describe("paramTokenizer", () => {
  it("decodes hollerith strings", () => {
    expect(parseHollerith("4HSLOT")).toBe("SLOT");
    expect(parseHollerith("2HMM")).toBe("MM");
  });

  it("splits records on semicolon outside hollerith", () => {
    const records = splitParameterRecords("116,1.,2.,3.;110,0.,1.,2.,3.,4.;", ";");
    expect(records).toHaveLength(2);
  });

  it("tokenizes comma-separated fields", () => {
    const fields = tokenizeFields("116,10.,20.,30.", ",");
    expect(fields[0]).toBe("116");
    expect(fields[1]).toBe("10.");
  });

  it("preserves empty fields between delimiters", () => {
    expect(tokenizeFields(",,foo", ",")).toEqual(["", "", "foo"]);
    expect(tokenizeFields("a,,b", ",")).toEqual(["a", "", "b"]);
  });

  it("does not insert empty fields after hollerith tokens", () => {
    expect(tokenizeFields("4HSLOT,9Hslot.iges", ",")).toEqual(["4HSLOT", "9Hslot.iges"]);
    expect(tokenizeFields(",,4HSLOT,9Hslot.iges", ",")).toEqual(["", "", "4HSLOT", "9Hslot.iges"]);
  });
});


