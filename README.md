# three-iges-loader

[![npm](https://img.shields.io/npm/v/three-iges-loader)](https://www.npmjs.com/package/three-iges-loader)
[![NPM](https://img.shields.io/npm/l/three-iges-loader)](https://github.com/Konsept-Design/three-iges-loader/blob/main/LICENSE)

**IGESLoader** is an IGES file loader for Three.js.

> [!WARNING]
> This package is currently in active development and may not be stable. Use with caution.

> [!NOTE]
> Currently, only a limited number of 'entity' types are parsed (mainly to be able to display points/lines/curves).

## Install

`npm install three-iges-loader three`

## Usage

```js
import * as THREE from "three";
import { IGESLoader } from "three-iges-loader";

const loader = new IGESLoader();

const iges_file_path = "/file.iges";

loader.load(
  // resource URL
  iges_file_path,
  // called when load is complete
  function (object) {
    sceneGeometry.add(object);
  },
  // called when loading is in progress
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("Error: " + error);
  }
);
```

## Author

Alex Marinov - Konsept Design Limited
