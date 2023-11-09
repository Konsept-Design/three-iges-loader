# three-iges-loader

**IGESLoader** is an IGES file loader for Three.js.

## Install

`npm i three-iges-loader three`

## Usage

```
import * as THREE from 'three'
import { IGESLoader } from 'three-iges-loader'

const loader = new IGESLoader();
const iges_file_path = '/file.iges';
loader.load(iges_file_path, onLoad);
```

## Author

Alex Marinov - Konsept Design Limited
