# IGES implementation roadmap

Status key: ✅ done · 🚧 in progress · ⬜ planned · 🔴 blocked by bugs

Target spec: **IGES 5.3** ([PDF](https://web.archive.org/web/20120821190122/http://www.uspro.org/documents/IGES5-3_forDownload.pdf)). IGES 6.0 extensions are tracked separately.

Test corpus: `test/fixtures/` (including Wikipedia **slot**), `test/models/`, and future [IGES X-files](https://web.archive.org/web/20100301144417/http://www.wiz-worx.com/iges5x/wysiwyg/f214x.shtml).

> **Detailed review, bug list, abstractions, Three.js upgrades, and PR sequence:**  
> **[IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md)**

---

## Phase 0 — Parser correctness & test harden 🚧

Must land before expanding entity coverage. See IMPROVEMENT_PLAN § Critical bugs / Sprint 1.

| Item | Status |
|------|--------|
| Fix Terminate section field slices (`S/G/D/P` + 7-digit counts) | ✅ |
| Keep empty Global delimiter fields (index alignment) | ✅ |
| Correct slot fixture Hollerith lengths for Global tests | ✅ |
| Preserve P-section DE back-pointer; map by `parameterDataPointer` | ⬜ |
| Fix Global leading-Hollerith delimiter off-by-one | ⬜ |
| Fix Type 126 weight/control indexing + NURBS fixture | ⬜ |
| Transform identity invariant + cycle guard + warning dedupe | ⬜ |
| Unit tests for tokenizer / Global / DE↔PD / transforms / NURBS | 🚧 partial |

---

## Phase A — Foundation ✅

| Item | Status |
|------|--------|
| `iges-core` package, section parser, Hollerith, param tokenizer | ✅ |
| DE / PD mapping, `IGESModel`, warnings | ✅ (mapping needs Phase 0 fix) |
| Type 124 transform resolution | ✅ (needs cycle guard + tests) |
| Unit tests + slot / arc fixtures | ✅ (expand in Phase 0) |
| Monorepo, docs, AGENTS.md | ✅ |

---

## Phase B — Wireframe & curves (current focus)

| Type | Name | Decode | Three.js | Tests |
|------|------|--------|----------|-------|
| 116 | Point | ✅ | ✅ | ✅ |
| 110 | Line | ✅ | ✅ | ✅ |
| 100 | Circular arc | ✅ | 🚧 3D basis | ✅ arc.iges |
| 106 | Copious data / paths | ✅ partial | 🚧 close loops | ✅ slot |
| 126 | NURBS curve | 🔴 index bug | ✅ sample | ⬜ dedicated fixture |
| 102 | Composite curve | ⬜ | ⬜ | ⬜ |
| 104 | Conic arc | ⬜ | ⬜ | ⬜ |
| 112 | Parametric spline curve | ⬜ | ⬜ | ⬜ |
| 123 | Direction | ⬜ meta | — | ⬜ |
| 124 | Transform | ✅ resolve | — | ⬜ |
| 314 | Color definition | ⬜ | ⬜ | ⬜ |
| 402 | Associativity | ⬜ | ⬜ | ⬜ |
| 406 | Property | ⬜ | ⬜ | ⬜ |
| 408 | Subfigure instance | ⬜ | ⬜ | ⬜ |

**Phase B exit criteria:** slot + fmeparte-class wireframe renders correctly; composites follow DE pointers; colors from DE/314; Phase 0 bugs closed.

**Three.js wireframe polish (B):** material cache, `disposeGroup`, fat `Line2` opt-in, merge-by-color, loader CORS/auth forwarding, bump to r185.

---

## Phase C — Surfaces

| Type | Name | Notes |
|------|------|-------|
| 190–198 | Analytic surfaces | Plane, cylinder, sphere, torus — first native meshes |
| 128 | Rational B-spline surface | Critical for most CAD |
| 118 | Ruled surface | Sweep between curves |
| 120 | Surface of revolution | |
| 122 | Tabulated cylinder | |
| 114 | Parametric spline surface | Polynomial patches |
| 141–144 | Boundary / trimmed surface | Needs UV trimming |
| 140 | Offset surface | Optional / approximate |

Tessellation: adaptive UV grid → `BufferGeometry` meshes + normals. Details in IMPROVEMENT_PLAN § Phase C.

---

## Phase D — Solids & B-rep

| Type | Name | Notes |
|------|------|-------|
| 150–168 | Primitive solids | Native approx meshes OK for preview |
| 186 | Manifold solid B-rep | Prefer **opencascade.js** adapter |
| 502–514 | Vertex/edge/loop/face/shell | Topology via OCCT |
| 180 | Boolean tree | CSG via OCCT |

Optional package: `iges-occt` for production-grade solids (`solidBackend: "occt"`).

---

## Phase E — Product polish

- Worker-based `parseAsync`
- `userData.iges` on all objects (partial today)
- Structured warnings + support stats on model
- R3F examples in docs
- Published `@konsept/iges-core` npm package (optional separate publish)
- CI peer matrix: min supported Three + current

---

## Maintainability track (parallel)

| Item | Status |
|------|--------|
| `ParamCursor` / decoder helpers | ⬜ |
| Structured P-records at section split | ⬜ |
| Unify `ENTITY_DECODERS` / geometry / meta registries | ⬜ |
| Structured `IGESWarning` codes | ⬜ |
| Exhaustive transform / tessellation switches | ⬜ |
