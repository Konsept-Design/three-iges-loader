<p align="center">
<h1 align="center">three-iges-loader</h1>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/three-iges-loader"><img src="https://img.shields.io/npm/v/three-iges-loader?label=latest" alt="npm version" /></a>
<a href="https://github.com/KonseptDesign/three-iges-loader/blob/main/LICENSE" rel="nofollow"><img src="https://img.shields.io/npm/l/three-iges-loader" alt="license" /></a>
<a href="https://github.com/KonseptDesign/three-iges-loader/actions?query=branch%3Amain" rel="nofollow"><img src="https://github.com/KonseptDesign/three-iges-loader/actions/workflows/ci.yml/badge.svg?branch=main" alt="build status" /></a>
<a href="https://github.com/KonseptDesign/three-iges-loader" rel="nofollow"><img src="https://img.shields.io/github/stars/KonseptDesign/three-iges-loader" alt="stars"></a>
</p>

**IGESLoader** is a modern TypeScript-native IGES file loader for Three.js.

> [!WARNING]
> This package is currently in active development and may not be stable. Use with caution.

> [!NOTE]
> Wireframe entities (points, lines, arcs, paths, NURBS curves) are supported first. **Surfaces and B-rep solids** are planned — see [docs/ROADMAP.md](docs/ROADMAP.md).

## Features

✨ **Layered architecture** — `iges-core` parser (no Three.js) + thin `IGESLoader`  
📦 **Modern ESM/CJS** — Dual package format with tree-shaking support  
🔧 **Typed geometry model** — `parseAndResolveIGES()` for custom pipelines  
⚡ **Fast** — Optimized build with tsup and pnpm workspaces  
🧪 **Tested** — Unit tests + Wikipedia *slot* fixture  
🤖 **AI-friendly** — See [AGENTS.md](AGENTS.md) and [docs/ENTITY_IMPLEMENTATION.md](docs/ENTITY_IMPLEMENTATION.md)

## Architecture

```
iges-core/          Parse IGES → ResolvedIGESModel (geometry[])
src/three/          toThreeGroup() → THREE.Group
IGESLoader.ts       FileLoader + parse + tessellate
```

Full details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md) · Plan: [docs/IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md)

## Install

`three` is a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies) — install it alongside this package (any version `>=0.160.0` is supported; development targets Three.js r184).

```bash
pnpm add three-iges-loader three
```

Or using npm:

```bash
npm install three-iges-loader three
```

Or using yarn:

```bash
yarn add three-iges-loader three
```

## Usage

### JavaScript

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

### TypeScript

```typescript
import * as THREE from "three";
import { IGESLoader } from "three-iges-loader";

const scene = new THREE.Scene();
const loader = new IGESLoader();

loader.load(
  "/path/to/file.iges",
  (geometry: THREE.Group) => {
    scene.add(geometry);
  },
  (xhr: ProgressEvent) => {
    console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  (error: Error | ErrorEvent) => {
    console.error("Error loading IGES file:", error);
  }
);
```

### React Three Fiber

```tsx
import { useLoader } from "@react-three/fiber";
import { IGESLoader } from "three-iges-loader";

function IgesModel({ url }: { url: string }) {
  const group = useLoader(IGESLoader, url);
  return <primitive object={group} />;
}
```

### Advanced — parse without the loader

```typescript
import { parseAndResolveIGES, toThreeGroup } from "three-iges-loader";

const text = await fetch("/model.igs").then((r) => r.text());
const model = parseAndResolveIGES(text);
const group = toThreeGroup(model, { convertZUpToYUp: true });
scene.add(group);
```

## Development

### Prerequisites

- Node.js >= 24.0.0 (LTS)
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies (pnpm workspace: root + packages/iges-core)
pnpm install

# Build iges-core + three-iges-loader
pnpm build

# Run all tests (core unit + loader integration)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm type-check

# Lint and format
pnpm lint
pnpm format
```

### Running the Example

The package includes a modern Vite-based example:

```bash
# Start the development server
pnpm dev:example

# Build the example
pnpm build:example
```

Then open http://localhost:3000 in your browser.

## API Reference

### `IGESLoader`

#### Constructor

```typescript
new IGESLoader(manager?: THREE.LoadingManager)
```

#### Methods

**`load(url, onLoad, onProgress?, onError?)`**

Load an IGES file from a URL.

- `url: string` - The URL or path to the IGES file
- `onLoad: (geometry: THREE.Group) => void` - Callback when loading is complete
- `onProgress?: (event: ProgressEvent) => void` - Callback for loading progress
- `onError?: (event: ErrorEvent | Error) => void` - Callback when an error occurs

**`parse(data)`**

Parse IGES file content.

- `data: string` - The IGES file content as string
- Returns: `THREE.Group` - A Three.js Group containing the parsed geometry

### Type exports

```typescript
import type { ResolvedIGESModel, GeometryEntity, LineGeometry } from "three-iges-loader";
```

## Supported IGES entities (Phase B)

| Type | Name | Status |
|------|------|--------|
| 116 | Point | ✅ |
| 110 | Line | ✅ |
| 100 | Circular arc | ✅ |
| 106 | Copious data / paths | ✅ partial forms |
| 126 | Rational B-spline curve | ✅ sampled |
| 124 | Transform matrix | ✅ resolve only |
| 102 | Composite curve | ⬜ [roadmap](docs/ROADMAP.md) |
| 128+ | Surfaces / B-rep | ⬜ deferred |

## Contributing

Contributions are welcome — see **[CONTRIBUTING.md](CONTRIBUTING.md)**.

| Doc | Purpose |
|-----|---------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, PR flow, changesets |
| [AGENTS.md](AGENTS.md) | AI coding assistants |
| [RELEASING.md](RELEASING.md) | Versioning & npm (maintainers) |
| [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md) | One-time GitHub/npm configuration |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |

**Releases:** [Semantic versioning](https://semver.org/) via [Changesets](https://github.com/changesets/changesets); merges to `main` open a Version Packages PR, then publish to npm automatically.

## License

MIT © [Alex Marinov](https://github.com/alex-marinov)

## Acknowledgments

- Based on the original work by [Alex Marinov](https://github.com/alex-marinov)
- Maintained by [Konsept Design](https://github.com/KonseptDesign)
- Built with [Three.js](https://threejs.org/)

## Resources

- [IGES File Specification](https://wiki.eclipse.org/IGES_file_Specification)
- [IGES Version 5.3 Specification](https://web.archive.org/web/20120821190122/http://www.uspro.org/documents/IGES5-3_forDownload.pdf)
- [IGES Version 6.0 Specification](https://filemonger.com/specs/igs/devdept.com/version6.pdf)
- [IGES on Wikipedia](https://en.wikipedia.org/wiki/IGES)

## Author

Alex Marinov - Konsept Design Limited
