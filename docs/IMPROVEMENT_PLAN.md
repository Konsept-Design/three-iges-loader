# IGES → Three.js improvement & implementation plan

This document is the detailed review and phased plan for making `iges-core` robust and delivering full IGES 2D/3D tessellation into Three.js. It supersedes the high-level sequencing in [ROADMAP.md](./ROADMAP.md) for prioritization; keep both in sync as phases complete.

**Target:** IGES 5.3 wireframe → surfaces → solids, rendered with current Three.js practices (dev target **r185+**).

---

## Executive summary

The monorepo layering is sound: `iges-core` (no `three`) → `toThreeGroup` → `IGESLoader`. Phase A foundation and most of Phase B wireframe exist, but **several parser bugs make Global fields, T-section validation, DE↔PD mapping, and Type 126 NURBS incorrect today**. Fixing those and hardening abstractions must come **before** surfaces/B-rep.

“All IGES 2D and 3D” is not a single PR. Production-grade B-rep belongs behind an optional Open CASCADE WASM adapter (`iges-occt`); native JS should own curves, analytic surfaces, NURBS surfaces, and trimmed surfaces with clear fidelity limits.

---

## Current state (as of this review)

| Area | Status |
|------|--------|
| Section split / Hollerith tokenizer | Present; gaps below |
| DE / PD / Global / Terminate | Present; bugs below |
| Type 124 transform resolve | Works; no cycle guard; thin tests |
| Wireframe decode: 100, 106 (partial), 110, 116, 126 | Present; 126 indexing bug |
| Three tessellation | Points / Line / EllipseCurve arcs / NURBS samples |
| Surfaces / B-rep | Not started |
| Three.js | Peer `>=0.160.0`, pinned **r184**; latest npm **0.185.1** |
| Tests | Thin: tokenizer + a few fixtures + loader parse smoke |

### Strengths to keep

1. Strict package boundary: no `three` inside `iges-core`.
2. One decoder file per entity type + registry.
3. Warning-tolerant parse (non-fatal issues accumulate).
4. Single root Z-up → Y-up rotation in `toThreeGroup` only.
5. Dual ESM/CJS publish, Changesets, Vitest workspace, AGENTS.md.

---

## Critical bugs (fix before new entities)

These are correctness defects in code that already claims to work.

### P0 — Parser correctness

| # | Issue | Location | Fix |
|---|--------|----------|-----|
| 1 | Terminate section counts always zero | `parse/sections.ts` `slice(8,8)` etc. | Use `slice(8,16)`, `slice(16,24)`, `slice(24,32)`; test against fixtures |
| 2 | Empty Global fields dropped → all G indices shift | `paramTokenizer.ts` `fields.filter(f => f.length > 0)` | Keep empty fields; fix Global tests to assert real `productId` / `modelSpaceScale` / units |
| 3 | P-section DE back-pointer discarded; PD mapped by array index | `sections.ts` `slice(0,64)`; `parseParameters.ts` `dePointer: null` | Preserve cols 65–72 per P-line; map via `de.parameterDataPointer`; fixture with DE order ≠ PD order |
| 4 | Type 126 weight/control index off-by-one | `decoders/type126.ts` `weightStart = 7+K+M` | Spec: knots then weights at `8+K+M`; add dedicated NURBS fixture + eval tests |
| 5 | Warnings duplicated in `parseAndResolveIGES` | `parseIGES.ts` + `resolveReferences.ts` | Merge once |
| 6 | `applyWorldTransform` leaves `transform` on point/line | `resolveReferences.ts` | Always bake coords and set `IDENTITY_TRANSFORM` (document invariant) |
| 7 | Transform chain can recurse forever | `resolveTransform` | Path `Set` + warning on cycle |

### P1 — Three.js wireframe fidelity

| # | Issue | Fix |
|---|--------|-----|
| 8 | Arc sampling assumes world XY via `EllipseCurve` | Orthonormal basis from start/end/center in 3D |
| 9 | Closed polylines (`closed: true`) not closed / not `LineLoop` | Close path or use `LineLoop` |
| 10 | Material per entity; no dispose helper | Material cache by color; export `disposeGroup` |
| 11 | `userData.iges` only on lines | Attach `{ deSequence, type, form, colorNumber, level }` on all objects |
| 12 | Loader does not forward `crossOrigin` / headers / credentials | Match other Three loaders |

---

## Architecture improvements (maintainability)

Do these early so every new entity benefits.

### 1. Parameter cursor / schema helpers

Replace hand-rolled `paramNumber(p, i)` chains with a small cursor:

```ts
class ParamCursor {
  readInt(): number;
  readReal(default?: number): number;
  readVec3(): Vec3;
  readPointer(): number; // DE sequence
  remaining(): number;
}
```

Optional later: declarative PD schemas per entity type for generated fixtures and pointer typing.

### 2. Preserve structured P-records at section split

```ts
interface RawParameterLine {
  payload: string;      // cols 1–64
  dePointer: number | null; // cols 65–72
  sequence: number;     // cols 74–80
}
```

Concatenate continuation lines **per logical record** (same DE pointer / semicolon), not as one blob that loses back-pointers.

### 3. Unify registry sources of truth

- Derive `GEOMETRY_ENTITY_TYPES` from `ENTITY_DECODERS.keys()`.
- Register meta parsers (`124`, `314`, `402`, `406`, `408`) separately; emit into `ResolvedIGESModel.meta`.
- Stub missing types with explicit `unsupported` + roadmap note (per AGENTS.md).

### 4. Structured warnings

```ts
interface IGESWarning {
  code: string;       // e.g. UNSUPPORTED_ENTITY, MISSING_PARAM
  message: string;
  deSequence?: number;
  entityType?: number;
}
```

Aggregate counts for large files (`Unsupported type 128 × 40`) instead of one string per DE.

### 5. Geometry / transform contract

Document and enforce:

> After `resolveReferences`, every `GeometryEntity` is in **model space**; `transform` is always identity.

Use exhaustive `switch` + `assertNever` in `applyWorldTransform` and `toThree`.

### 6. Shared base-geometry factory

```ts
function baseFromContext(ctx: DecodeContext, kind: GeometryKind): BaseGeometry
```

Stops every decoder repeating `deSequence` / `form` / `colorNumber` / `level`.

### 7. Optional package split later

| Package | Role |
|---------|------|
| `iges-core` | Parse + resolve + curve/surface math (publishable) |
| `three-iges-loader` | Loader + tessellation (current root) |
| `iges-occt` (future) | WASM B-rep tessellation adapter |

---

## Three.js modernization

| Item | Action |
|------|--------|
| Version | Bump devDeps to `three@^0.185.1` + matching `@types/three`; keep peer `>=0.160.0` (or raise floor to `>=0.170.0` if adopting WebGPU example-only APIs) |
| Imports in example | Prefer `three/addons/...` over `three/examples/jsm/...` |
| Color management | Document SRGB defaults; use `Color` consistently; map Type 314 → linear-aware hex |
| Fat lines (opt-in) | `useLine2` + `Line2` / `LineMaterial` from `three/addons/lines/*` (CAD wireframe needs this) |
| Draw calls | Opt-in `mergeByColor` → `LineSegments` + `BufferGeometryUtils.mergeGeometries` |
| Dispose | Export `disposeGroup(root)` |
| Loader API | `parse(string \| ArrayBuffer)`, `onWarning`, forward FileLoader CORS/auth options |
| Example | Remove global `Object3D.DEFAULT_UP` mutation; dispose previous scene on reload; optional WebGPU demo page |
| CI | Matrix test against peer min (r160) and current (r185) |

---

## Entity implementation phases

### Phase 0 — Correctness & tests (blocking)

**Exit criteria:** All P0 bugs fixed; Global field alignment verified on slot; T-section validation live; Type 126 fixture green; no duplicate warnings.

Tests to add (minimum):

- `parseTerminateSection` field widths
- `tokenizeFields(",,foo")` → `["","","foo"]`
- Global: `unitsFlag`, `modelSpaceScale`, `igesVersion` on slot
- DE↔PD reorder fixture
- NURBS: degree-1 line + circular NURBS endpoints/mid
- `multiplyTransforms` + 124 chain + cycle
- `applyWorldTransform` identity invariant
- Negative: missing T, missing PD, malformed real
- Loader: Z-up rotation, scale, colors, dispose, `userData.iges`

### Phase B2 — Complete wireframe / drafting

| Type | Name | Notes |
|------|------|-------|
| 102 | Composite curve | Follow DE pointers; emit group of child curves |
| 104 | Conic arc | Ellipse / hyperbola / parabola forms |
| 106 | Copious data | Remaining forms (11, 13, 20–23, 40–43, 63 already partial) |
| 112 | Parametric spline | Piecewise polynomial |
| 123 | Direction | Meta / axis helper |
| 124 | Transform | Forms beyond 0 if needed; dedicated tests |
| 314 | Color definition | Palette → `ResolvedIGESModel.colors` |
| 402 | Associativity | Visibility / grouping / blank status |
| 406 | Property | Names / attributes on `userData` |
| 408 | Subfigure instance | Instance transform + shared definition |
| 212 | General note | Optional 2D annotation (defer if scope creep) |

**Three:** close polylines, 3D arcs, material cache, fat lines opt-in, merge-by-color opt-in.

**Exit:** slot + fmeparte-class files render with colors, composites, and instances.

### Phase C — Surfaces (native JS)

Tessellation lives in `iges-core` math (UV grids, normals) → `Mesh` in `toThree`.

| Priority | Types | Approach |
|----------|-------|----------|
| C1 | 190–198 analytic (plane, cylinder, cone, sphere, torus) | Parametric mesh; cheap wins |
| C2 | 128 Rational B-spline surface | `sampleNurbsSurface` + normals |
| C3 | 118 Ruled, 120 Revolution, 122 Tabulated cylinder | Build from child curves |
| C4 | 114 Parametric spline surface | Polynomial patches |
| C5 | 141–144 Boundary / trimmed surface | UV trim (Earcut / triangulation) — hardest native piece |
| C6 | 140 Offset surface | Optional; often skip or approximate |

Options: `surfaceUSegments` / `surfaceVSegments` / `chordTolerance`; materials `MeshStandardMaterial` default with flat wireframe overlay option.

### Phase D — Solids & B-rep

| Track | Scope | Recommendation |
|-------|-------|----------------|
| D-lite | 150–168 CSG primitives | Native mesh approximations OK for preview |
| D-full | 186 + 502–514 topology, 180 boolean | **`iges-occt`** (opencascade.js) — do not reimplement BREP in JS |

Loader option: `solidBackend: "none" \| "native-approx" \| "occt"`.

### Phase E — Product polish

- `parseAsync` / Worker entry (`iges-core/worker`)
- R3F docs + Suspense example
- Publish `@konsept/iges-core` separately if consumers want headless parse
- Fidelity report: `% entities supported` on `ResolvedIGESModel.stats`
- Golden visual tests (optional screenshot / geometry hash)

---

## Suggested PR sequence (small, reviewable)

Each PR should stay one concern (per AGENTS.md).

1. **P0 terminate + empty fields + Global tests**
2. **P0 P-section back-pointer + DE↔PD mapping + reorder fixture**
3. **P0 Type 126 + NURBS unit tests + fixture**
4. **P0 resolve: transforms identity, cycles, warning dedupe**
5. **Abstractions: ParamCursor, baseFromContext, registry unify, structured warnings**
6. **Three: bump r185, dispose, material cache, userData, loader options, example cleanup**
7. **Three: 3D arcs, closed polylines, fat-line / merge opts + tests**
8. **Entities: 314 colors → Three**
9. **Entities: 102 composite, 104 conic, 112 spline**
10. **Entities: 402 / 406 / 408**
11. **Phase C1 analytic surfaces**
12. **Phase C2 Type 128 + adaptive UV**
13. **Phase C5 trimming**
14. **Phase D-lite primitives**
15. **Phase D-full `iges-occt` adapter (optional package)**

---

## Testing strategy

| Layer | Tool | What |
|-------|------|------|
| Tokenizer / Global / DE / PD | Vitest unit | Edge cases, Hollerith, empty fields, D-exponents |
| Math | Vitest | NURBS curve/surface, transforms, arc sampling |
| Decoders | Vitest + fixtures | One minimal `.iges` per entity type under `test/fixtures/` |
| Integration | Vitest | `IGESLoader.parse` / `toThreeGroup` options |
| Corpus | Growing | Wikipedia slot, IGES X-files, vendor samples in `test/models/` |
| Peer matrix | CI | `three@0.160` and `three@0.185` |

Fixture rule: every new entity type **must** ship a minimal fixture and decoder assertions (existing AGENTS rule).

---

## Non-goals / explicit limits

- Perfect CAD kernel fidelity in pure JS for arbitrary B-rep — out of scope; use OCCT.
- IGES binary / compressed variants beyond ASCII 80-column (document if encountered).
- Editing / writing IGES (read-only loader).
- Automatically implementing every obscure form of every entity in one release — prefer stubs + warnings + roadmap status.

---

## Success metrics

1. Slot + representative industrial wireframe files: zero incorrect Global scale/units; transforms correct.
2. ≥90% of entities in target corpus either tessellated or reported as structured `unsupported` with type/form.
3. `pnpm test` + `pnpm type-check` green; peer matrix CI green.
4. Surface preview usable for 128/trimmed models without OCCT; solids available when `iges-occt` installed.
5. Public API stable: `parseAndResolveIGES` / `toThreeGroup` / `IGESLoader` remain the primary surface.

---

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ENTITY_IMPLEMENTATION.md](./ENTITY_IMPLEMENTATION.md)
- [ROADMAP.md](./ROADMAP.md)
- [IGES 5.3 PDF](https://web.archive.org/web/20120821190122/http://www.uspro.org/documents/IGES5-3_forDownload.pdf)
- Three.js r185 [migration notes](https://github.com/mrdoob/three.js/wiki/Migration-Guide#184--185)
