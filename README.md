# three-iges-loader

**IGESLoader** is an IGES file loader for Three.js.

## Install

`npm install three-iges-loader three`

## Usage

```js
import * as THREE from "three";
import { IGESLoader } from "three-iges-loader";

const loader = new IGESLoader();
const iges_file_path = "/file.iges";
loader.load(iges_file_path, onLoad);
```

## Author

Alex Marinov - Konsept Design Limited
