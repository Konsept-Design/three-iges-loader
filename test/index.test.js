import fs from "fs";
import { log } from "console";
import { IGESLoader } from "../src/IGESLoader";
import * as THREE from "three";

describe("IGESLoader", () => {
  it("loader should be type of IGESLoader", () => {
    const loader = new IGESLoader();
    expect(loader).toBeInstanceOf(IGESLoader);
  });

  it("should parse a point", () => {
    const loader = new IGESLoader();
    expect(loader).toBeInstanceOf(IGESLoader);

    const filePath = "test/models/point.iges";
    const data = fs.readFileSync(filePath, "utf8");

    let test = loader.parse(data);
    let points = test.children[0];
    expect(points).toBeInstanceOf(THREE.Points);

    let pointBufferGeometry = points.geometry;
    expect(pointBufferGeometry).toBeInstanceOf(THREE.BufferGeometry);

    let pointVertice = pointBufferGeometry;
    let pointVertice_x = pointVertice.attributes.position.array[0];
    let pointVertice_y = pointVertice.attributes.position.array[1];
    let pointVertice_z = pointVertice.attributes.position.array[2];
    expect(pointVertice_x).toBe(10);
    expect(pointVertice_y).toBe(20);
    expect(pointVertice_z).toBe(30);
  });

  it("should parse a line", () => {
    const loader = new IGESLoader();
    expect(loader).toBeInstanceOf(IGESLoader);

    const filePath = "test/models/line.iges";
    const data = fs.readFileSync(filePath, "utf8");

    let test = loader.parse(data);
    let line = test.children[0];
    expect(line).toBeInstanceOf(THREE.Line);

    let lineBufferGeometry = line.geometry;
    expect(lineBufferGeometry).toBeInstanceOf(THREE.BufferGeometry);

    let p1_x = lineBufferGeometry.attributes.position.array[0];
    let p1_y = lineBufferGeometry.attributes.position.array[1];
    let p1_z = lineBufferGeometry.attributes.position.array[2];
    expect(p1_x).toBe(-30.13380241394043);
    expect(p1_y).toBe(13.59160041809082);
    expect(p1_z).toBe(0);

    let p2_x = lineBufferGeometry.attributes.position.array[3];
    let p2_y = lineBufferGeometry.attributes.position.array[4];
    let p2_z = lineBufferGeometry.attributes.position.array[5];
    expect(p2_x).toBe(31.40465545654297);
    expect(p2_y).toBe(42.65143585205078);
    expect(p2_z).toBe(0);
  });
});
