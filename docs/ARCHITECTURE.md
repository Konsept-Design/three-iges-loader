# Architecture

This repository is a **pnpm monorepo** implementing IGES → Three.js in layers. Each layer has one job; only the top layer imports `three`.

## Packages

| Package | Path | Depends on | Responsibility |
|---------|------|------------|----------------|
| **iges-core** | `packages/iges-core` | — | Parse IGES 5.3, build entity map, resolve pointers/transforms, decode wireframe geometry |
| **three-iges-loader** | root `src/` | `iges-core`, `three` (peer) | `IGESLoader`, `toThreeGroup()` tessellation |

## Data flow

```
.iges file (80-column ASCII)
        │
        ▼
  splitSections()          ← packages/iges-core/src/parse/sections.ts
        │
        ├── GlobalSection
        ├── DirectoryEntry[]  (2 lines per entity)
        └── Parameter records
        │
        ▼
  parseIGES() → IGESModel    Map<deSequence, RawEntity>
        │
        ▼
  resolveReferences() → ResolvedIGESModel
        │                  • Type 124 transforms
        │                  • ENTITY_DECODERS → GeometryEntity[]
        ▼
  toThreeGroup() → THREE.Group   (root src/three/toThree.ts)
```

## Adding a new entity type

1. Read the parameter table in [ENTITY_IMPLEMENTATION.md](./ENTITY_IMPLEMENTATION.md).
2. Add `packages/iges-core/src/entities/decoders/typeNNN.ts`.
3. Register in `packages/iges-core/src/entities/registry.ts`.
4. Add geometry to `types.ts` if needed.
5. Handle tessellation in `src/three/toThree.ts` (or defer if surface).
6. Add a fixture under `test/fixtures/` and tests in `packages/iges-core/test/`.

## Coordinate systems

- IGES model space is typically **Z-up**.
- Three.js is **Y-up**.
- A single root rotation (`rotation.x = -π/2`) is applied in `toThreeGroup()`, not per entity.

## Out of scope (for now)

Surface entities (128, 144, B-rep 186, etc.) live on the [ROADMAP](./ROADMAP.md) under Phase C/D. Full sequencing, known parser bugs, and abstractions are in [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md).

Optional future package: `iges-occt` using Open CASCADE WASM for full B-rep tessellation.

## AI / contributor entry points

- [AGENTS.md](../AGENTS.md) — rules for automated contributors
- [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) — review, correctness fixes, full 2D/3D plan
- [ENTITY_IMPLEMENTATION.md](./ENTITY_IMPLEMENTATION.md) — per-type checklist
- [ROADMAP.md](./ROADMAP.md) — phased delivery plan
