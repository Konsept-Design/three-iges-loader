# Agent instructions (AI & automation)

This file tells coding agents how to work on **three-iges-loader** safely and consistently.

## Project goal

Parse **IGES 5.3** CAD files into a typed model (`iges-core`) and tessellate wireframe geometry to **Three.js** (`three-iges-loader`). Surfaces and B-rep are **out of scope** unless the user explicitly requests a roadmap phase.

## Monorepo layout

```
packages/iges-core/     ← Parser + geometry (NO three.js)
src/                    ← IGESLoader + toThreeGroup()
test/fixtures/          ← Shared IGES test files
docs/                   ← ARCHITECTURE.md, ROADMAP.md, ENTITY_IMPLEMENTATION.md
```

## Rules

1. **Never import `three` inside `packages/iges-core`.**
2. **One entity type per decoder file** under `entities/decoders/typeNNN.ts`.
3. **Register** every decoder in `entities/registry.ts`.
4. **Always add tests** with a fixture in `test/fixtures/` when adding behavior.
5. **Do not** implement Phase C/D surface/B-rep types unless asked — add a stub that returns `unsupported` and a roadmap note.
6. **Transforms:** only `resolve/resolveReferences.ts` composes type 124; decoders emit model-space coordinates.
7. **Z-up → Y-up:** only `src/three/toThree.ts` applies root rotation.
8. Prefer **small PR-sized changes**: one entity type or one parser fix per change.

## Commands

```bash
pnpm install
pnpm --filter iges-core test    # core unit tests
pnpm test                       # core + integration
pnpm type-check
pnpm build
```

## Releases & changesets

- User-visible changes to the published package require a **changeset**: run `pnpm changeset` and commit the file under `.changeset/`.
- Use **patch** (fix), **minor** (new entity/API), **major** (breaking).
- Do **not** bump `package.json` version manually — CI uses Changesets.
- See [RELEASING.md](RELEASING.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Before finishing a task

- [ ] `pnpm test` passes
- [ ] `pnpm type-check` passes
- [ ] New entity documented in `docs/ENTITY_IMPLEMENTATION.md`
- [ ] Roadmap table updated in `docs/ROADMAP.md` if status changed
- [ ] `pnpm changeset` added if the change is user-visible (unless docs-only internal)

## Common mistakes to avoid

- Splitting parameter data with naive `split(';')` on the whole P-section without Hollerith awareness — use `paramTokenizer.ts`.
- Mapping PD to entities only by array index — use DE `parameterDataPointer` when building `parseParameterSection`.
- Drawing NURBS by connecting control points — use `sampleNurbsCurve`.
- Applying `rotation.x = -π/2` on every mesh — use root group in `toThreeGroup` only.

## Entry documents

1. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. [docs/ENTITY_IMPLEMENTATION.md](docs/ENTITY_IMPLEMENTATION.md)
3. [docs/ROADMAP.md](docs/ROADMAP.md)
4. [CONTRIBUTING.md](CONTRIBUTING.md) — human contributors
5. [RELEASING.md](RELEASING.md) — versioning & npm (maintainers)

## Cursor Cloud specific instructions

Standard install/test/build/run commands live in the **Commands** section above; nothing here overrides them.

- **Node version:** This repo requires Node **>=24** (`engines`), but the base VM's default `node` on `PATH` (`/exec-daemon/node`) is **v22**. An nvm-managed Node 24 is installed and `~/.bashrc` prepends it so **interactive/login shells get Node 24 automatically**. If you run a command and hit an engine/version error, you're in a non-login shell using v22 — fix it in that shell with `export PATH="$HOME/.nvm/versions/node/$(nvm version 24)/bin:$PATH"` (or start `bash -l`). `pnpm` (10.33.4) is provided via corepack on the Node 24 install.
- **Services:** This is a **library monorepo — no backend/DB/network services.** End-to-end verification = `pnpm test` (Vitest: `iges-core` unit + loader integration). `pnpm build` uses tsup.
- **Example viewer:** `pnpm dev:example` runs a Vite + Three.js browser demo on **http://localhost:3000** (dropdown switches IGES fixtures: point/line/slot/arc). It requires WebGL. In the headless VM, Chrome must be launched with `--use-angle=swiftshader` for software WebGL, otherwise the canvas is black with `WebGLRenderer: A WebGL context could not be created` in the console.
