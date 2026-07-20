import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseAndResolveIGES, parseIGES } from "../src/index.js";
import { parseTerminateSection, splitSections } from "../src/parse/sections.js";
import { parseGlobalSection } from "../src/parse/parseGlobal.js";
import { splitParameterRecords } from "../src/parse/paramTokenizer.js";


const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = (name: string) =>
  readFileSync(join(__dirname, "../../../test/fixtures", name), "utf8");

describe("parseIGES", () => {
  it("parses point fixture global section", () => {
    const point = readFileSync(join(__dirname, "../../../test/models/point.iges"), "utf8");
    const model = parseIGES(point);
    expect(model.entities.size).toBe(1);
    const entity = model.entities.get(1);
    expect(entity?.type).toBe(116);
  });

  it("parses line fixture", () => {
    const line = readFileSync(join(__dirname, "../../../test/models/line.iges"), "utf8");
    const model = parseAndResolveIGES(line);
    expect(model.geometry).toHaveLength(1);
    expect(model.geometry[0]?.kind).toBe("line");
    const lineGeom = model.geometry[0];
    if (lineGeom?.kind === "line") {
      expect(lineGeom.start.x).toBeCloseTo(-30.133802, 4);
      expect(lineGeom.end.x).toBeCloseTo(31.404655, 4);
    }
  });

  it("parses point into PointGeometry", () => {
    const point = readFileSync(join(__dirname, "../../../test/models/point.iges"), "utf8");
    const model = parseAndResolveIGES(point);
    expect(model.geometry).toHaveLength(1);
    const g = model.geometry[0];
    expect(g?.kind).toBe("point");
    if (g?.kind === "point") {
      expect(g.position.x).toBe(10);
      expect(g.position.y).toBe(20);
      expect(g.position.z).toBe(30);
    }
  });

  it("parses slot fixture parameter records", () => {
    const sections = splitSections(fixtures("slot.iges"));
    const global = parseGlobalSection(sections.global);
    const records = splitParameterRecords(sections.parameter, global.recordDelimiter);
    expect(records.length).toBe(6);
  });

  it("parses slot fixture with 6 geometry entities", () => {
    const model = parseAndResolveIGES(fixtures("slot.iges"));
    expect(model.warnings).toEqual([]);
    const kinds = model.geometry.map((g) => g.kind);
    expect(kinds.filter((k) => k === "point")).toHaveLength(2);
    expect(kinds.filter((k) => k === "circularArc")).toHaveLength(2);
    expect(kinds.filter((k) => k === "line")).toHaveLength(2);
  });

  it("parses terminate counts and validates DE line count on slot", () => {
    const model = parseIGES(fixtures("slot.iges"));
    expect(model.terminate).toEqual({
      startLineCount: 1,
      globalLineCount: 4,
      directoryLineCount: 12,
      parameterLineCount: 6,
    });
    expect(model.warnings).toEqual([]);
    expect(model.entities.size).toBe(6);

    const sections = splitSections(fixtures("slot.iges"));
    expect(parseTerminateSection(sections.terminate)).toEqual(model.terminate);
  });


  it("parses arc fixture with correct radius", () => {
    const model = parseAndResolveIGES(fixtures("arc.iges"));
    const arc = model.geometry.find((g) => g.kind === "circularArc");
    expect(arc?.kind).toBe("circularArc");
    if (arc?.kind === "circularArc") {
      expect(arc.radius).toBeCloseTo(1, 5);
      expect(arc.center.x).toBeCloseTo(0, 5);
      expect(arc.center.y).toBeCloseTo(0, 5);
    }
  });
});

describe("hollerith and delimiters", () => {
  it("keeps empty Global delimiter fields so later indices stay aligned", () => {
    const model = parseIGES(fixtures("slot.iges"));
    expect(model.global.productIdFromSender).toBe(
      "three-iges-loader Wikipedia slot fixture"
    );
    expect(model.global.fileName).toBe("slot.iges");
    expect(model.global.nativeSystemId).toBe("three-iges-loader");
    expect(model.global.preprocessorVersion).toBe("three-iges-loader");
    expect(model.global.integerBits).toBe(32);
    expect(model.global.productIdForReceiver).toBe("SLOT");
    expect(model.global.modelSpaceScale).toBe(1);
    expect(model.global.unitsFlag).toBe(1);
    expect(model.global.unitsName).toBe("INCH");
    expect(model.global.author).toBe("Konsept Design / three-iges-loader");
    expect(model.global.organization).toBe("Konsept Design");
    expect(model.global.igesVersion).toBe(4);
    expect(model.global.draftingStandard).toBe(0);
  });
});

