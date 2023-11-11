import fs from "fs";
import { log } from "console";
import path from "path";
import { IGESLoader } from "../src/IGESLoader";

describe("IGESLoader", () => {
  it("should be defined", () => {
    const loader = new IGESLoader();
    expect(loader).toBeInstanceOf(IGESLoader);
  });

  // it("should parse a point", () => {
  //   const loader = new IGESLoader();
  //   const filePath = path.join(__dirname, "models/point.iges");
  //   const data = fs.readFileSync(filePath, "utf8");
  //   log("inside testing parsing a point");
  //   log("filePath: " + filePath);
  //   log("data: " + data);

  //   loader.parse(data, function (geometry) {
  //     log("inside testing parsing a point");
  //     log(geometry);
  //     // geometry is an instance of THREE.Points
  //   });
  //   expect(loader).toBeInstanceOf(IGESLoader);
  // });
});
