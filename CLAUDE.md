# CLAUDE.md — PCFMaker

## Project Overview

PCFMaker is an Electron desktop app that provides a GUI for PowerApps Component Framework (PCF) development — replacing manual PAC CLI commands with visual project creation, building, packaging, and deployment. Built for Dynamics CRM / Power Apps developers.

## Tech Stack

- **Desktop:** Electron 40 (main + renderer + preload, three-process model)
- **Frontend:** React 19, TypeScript 5.9, Vite 7.3
- **UI:** Fluent UI v9 (`@fluentui/react-components`)
- **State:** Zustand 5 (7 stores)
- **Forms:** React Hook Form 7 + Zod 4
- **Routing:** React Router 7 (HashRouter for Electron)
- **DnD:** @dnd-kit (visual designer)
- **Packaging:** electron-builder (NSIS/DMG/AppImage)
- **External tools wrapped:** PAC CLI, .NET SDK 8+, Git, npm

## Project Structure

```
src/
├── main/                    # Electron main process (Node.js)
│   ├── index.ts             # App entry, window creation
│   ├── ipc/                 # IPC handlers (12 modules: project, pac-cli, solution, environment, localization, git, tools, file-system, settings, template...)
│   └── services/            # Business logic (13 services: pac-cli, project, solution, environment, localization, git, template, zip, diff, docs, deps, profiler...)
├── preload/
│   └── index.ts             # contextBridge — typed window.electronAPI
├── renderer/                # React frontend
│   ├── main.tsx             # Entry point
│   ├── App.tsx              # Root with HashRouter + FluentProvider
│   ├── pages/               # 10 pages: Home, Project, Solutions, Designer, ManifestBuilder, Localization, Environments, Gallery, Tools, Settings
│   ├── components/          # Organized by feature: common/, project/, solution/, designer/, manifest-builder/, localization/, environments/, templates/, git/, tools/
│   ├── stores/              # Zustand: project, designer, ui, settings, environment, manifest, tools
│   ├── hooks/               # useKeyboardShortcuts
│   ├── utils/               # Helpers
│   └── styles/              # Global CSS
└── shared/                  # Shared between main & renderer
    ├── types/               # 12 type files (pcf, project, solution, designer, environment, localization, git, manifest, template, tools, settings, connection)
    └── constants/           # pcf, fluent (component defs), manifest, templates (built-in templates ~51KB)

resources/                   # Icons and PCF project templates
electron-builder.json        # Packaging config
vite.config.ts               # Root: src/renderer, outDir: dist/renderer, port 5173
tsconfig.json                # Renderer (ESNext)
tsconfig.node.json           # Main process (CommonJS)
tsconfig.preload.json        # Preload (CommonJS)
```

## Architecture & Patterns

- **IPC flow:** Renderer → `window.electronAPI.{domain}.{method}()` → preload contextBridge → `ipcRenderer.invoke('{domain}:{method}')` → `ipcMain.handle` → service
- **Security:** `nodeIntegration: false`, `contextIsolation: true` — no Node.js in renderer
- **Services** are pure TS classes wrapping CLI tools via `child_process.spawn` with `shell: true`
- **State:** Zustand stores per feature domain, actions colocated with state
- **Styles:** Fluent UI `makeStyles` (Griffel) — no CSS modules
- **Component pattern:** Functional components, `useStyles()` hook, store hooks, `handle*` event handlers
- **Command results** use `{ success, stdout, stderr, code }` pattern across IPC
- **Path aliases:** `@main/*`, `@renderer/*`, `@shared/*`

## Development Commands

```bash
npm install                  # Install dependencies
npm run dev                  # Dev mode (Vite + Electron concurrently)
npm run build                # Full build (vite + electron + preload)
npm run package:win          # Package Windows NSIS installer
npm run lint                 # ESLint
npm run lint:fix             # ESLint auto-fix
npm run format               # Prettier format
npm run typecheck            # TS type check (no emit)
# npm test                   # Not configured yet
```

## Coding Conventions

- **File naming:** PascalCase for components (`HomePage.tsx`), kebab-case for services/IPC (`pac-cli.service.ts`, `project.ipc.ts`), `*.types.ts` / `*.constants.ts` for shared
- **Imports:** React/external → Fluent UI → local components → stores/hooks → types → styles
- **Prettier:** single quotes, semicolons, 2-space indent, trailing comma es5, 100 print width, no parens on single arrow params
- **ESLint:** no unused vars (warn, `_` prefix allowed), no explicit any (warn), no console except warn/error
- **Handlers:** arrow functions prefixed with `handle` (`handleBuild`, `handleSubmit`)
- **Stores:** `create<StoreType>((set, get) => ({ ...state, ...actions }))` pattern
- **IPC channels:** `{domain}:{action}` naming (e.g., `project:open`, `pac-cli:build`)

## Key Concepts / Domain Context

- **PCF** = PowerApps Component Framework — custom controls for Power Apps / Dynamics 365
- **PAC CLI** = Power Platform CLI — Microsoft's CLI for PCF operations, wrapped by this app
- **Control types:** `field` (single value) or `dataset` (table/grid)
- **Frameworks:** vanilla TypeScript or React
- **Manifest:** `ControlManifest.Input.xml` defines properties, types, resources
- **Property types:** SingleLine.Text, Whole.None, Decimal, Currency, TwoOptions, OptionSet, DateAndTime, Lookup.Simple, etc.
- **Property usage:** `input` (read), `output` (write), `bound` (two-way)
- **Solution:** .cdsproj packaging of PCF controls into a .zip for import to Dataverse
- **Resx:** XML-based localization files in `strings/` folder, LCID-based naming
- **Auth profiles:** PAC CLI stores multiple auth profiles; app manages selection

## Known Gotchas / Important Notes

- **PAC CLI PATH:** Main process enhances PATH with `~/.dotnet/tools` so `pac` is found in child_process — see `getEnhancedEnv()` in services
- **Windows spawn:** Must use `shell: true` and include `ComSpec`, `SystemRoot` env vars
- **Process cleanup:** Watch mode processes stored in Map by project path; killed with `taskkill /T /F` on Windows
- **Manifest search:** Looks in project root first, then subdirectories (PAC CLI sometimes creates subfolder)
- **Solution prefix bug (fixed):** Don't double-add publisher prefix if name already includes it
- **Designer page:** Marked "Preview" — generated code has issues, no persistence; Manifest Builder is the stable alternative
- **Vite base path:** Must be `'./'` for Electron `file://` protocol
- **User data:** Stored at `app.getPath('userData')` — `%APPDATA%\PCF Maker\` on Windows (recent-projects.json, solutions.json, settings.json)
- **No tests yet:** test script is a placeholder
- **Window size:** 1400x900 default, 1024x768 minimum
- **`nul` file artifact:** A file literally named `nul` may appear in the repo root on Windows — it's created when a bash script runs `mkdir ... 2> nul` (bash treats `nul` as a filename, not the null device). It's now gitignored.

## Security Notes (from code review)

- **`fs:open-external` IPC** — passes URLs directly to `shell.openExternal()` without validation. Consider validating to `https://` URLs only before using in sensitive contexts.
- **`fs:open-in-editor` IPC** — spawns the editor command with `shell: true`; the `editor` parameter comes from user settings (trusted input), but treat with care if this ever accepts external input.
- **IPC input validation** — IPC handlers perform TypeScript type-checking at compile time only; there's no runtime Zod validation on IPC payloads. Fine for a local desktop app, but worth noting if the attack surface ever changes.
- **Electron hardening in place:** `nodeIntegration: false`, `contextIsolation: true`, no `remote` module, contextBridge-only renderer API.

## PCF Property Types → Fluent UI Component Mapping

Reference for Manifest Builder and Designer features. When a PCF property is a given type, these are the recommended Fluent UI components:

| PCF Type | Recommended Components |
|----------|----------------------|
| `SingleLine.Text` | `Input`, `Field` |
| `SingleLine.Email` | `Input` (type=email) with validation |
| `SingleLine.Phone` | `Input` with phone formatting |
| `SingleLine.URL` | `Input` with URL validation, `Link` |
| `Multiple` | `Textarea` |
| `Whole.None` | `SpinButton`, `Input` (type=number) |
| `Decimal` / `FP` | `Input` with decimal formatting |
| `Currency` | `Input` with currency symbol/formatting |
| `TwoOptions` | `Switch`, `Checkbox`, `ToggleButton` |
| `DateAndTime.DateOnly` | `DatePicker` |
| `DateAndTime.DateAndTime` | `DatePicker` + `TimePicker` |
| `OptionSet` / `Enum` | `Dropdown`, `Select`, `RadioGroup`, `Combobox` |
| `Lookup.Simple` | `Combobox` with search |

Auto-binding rules: `TwoOptions` → `checked ↔ property`; `SingleLine.Text` → `value ↔ property`; `OptionSet` → `selectedKey ↔ property`; `DateAndTime` → `value ↔ property`.

## References

- [PCF Documentation](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/overview)
- [PAC CLI Reference](https://docs.microsoft.com/en-us/power-platform/developer/cli/reference/)
- [Fluent UI React v9](https://react.fluentui.dev/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [PCF Gallery](https://pcf.gallery/)
