import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { IGESLoader } from "../src/IGESLoader.js";
import { parseAndResolveIGES, toThreeGroup } from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => fs.readFileSync(join(__dirname, "fixtures", name), "utf8");
const model = (name: string) => fs.readFileSync(join(__dirname, "models", name), "utf8");

describe("IGESLoader", () => {
  it("loader should be type of IGESLoader", () => {
    expect(new IGESLoader()).toBeInstanceOf(IGESLoader);
  });

  it("should parse a point", () => {
    const loader = new IGESLoader();
    const group = loader.parse(model("point.iges"));
    const points = group.children[0] as THREE.Points;
    expect(points).toBeInstanceOf(THREE.Points);
    const pos = points.geometry.attributes.position;
    expect(pos).toBeDefined();
    expect(pos!.array[0]).toBe(10);
    expect(pos!.array[1]).toBe(20);
    expect(pos!.array[2]).toBe(30);
  });

  it("should parse a line", () => {
    const loader = new IGESLoader();
    const group = loader.parse(model("line.iges"));
    const line = group.children[0] as THREE.Line;
    expect(line).toBeInstanceOf(THREE.Line);
    const arr = line.geometry.attributes.position!.array;
    expect(arr[0]).toBeCloseTo(-30.13380241394043, 4);
    expect(arr[3]).toBeCloseTo(31.40465545654297, 4);
  });

  it("should parse slot with six children", () => {
    const loader = new IGESLoader();
    const group = loader.parse(fixture("slot.iges"));
    expect(group.children.length).toBe(6);
  });

  it("toThreeGroup matches loader output child count", () => {
    const resolved = parseAndResolveIGES(fixture("slot.iges"));
    const group = toThreeGroup(resolved);
    expect(group.children.length).toBe(resolved.geometry.length);
  });
});
