# PCF Maker

> A desktop application for streamlining PowerApps Component Framework (PCF) development — replacing manual PAC CLI commands with a visual, guided workflow.

**Current version: v0.9**

---

## Target Users

- Dynamics CRM / Power Apps developers building custom PCF controls
- PCF component developers who want to skip repetitive CLI commands
- Low-code / citizen developers (future: visual designer feature)

---

## Features

### Core Project Management
- **Create New PCF** — Guided wizard wrapping `pac pcf init` with namespace, template, and framework selection
- **Open & Manage Projects** — Browse recent projects, validate structure, open in VS Code
- **Build PCF** — Build with real-time output streaming; debug or release mode
- **Watch Mode** — Hot-reload dev server via `npm start`
- **Version Management** — Increment major/minor/patch directly in the UI

### Solution Packaging
- **Create Solution** — Initialize `.cdsproj` solution projects
- **Add PCF to Solution** — Manage component references with `pac solution add-reference`
- **Package Solution** — Build debug/release `.zip` with post-processing (version injection, metadata cleanup)
- **Deploy to Environment** — One-click `pac solution import` with publish and overwrite options

### Manifest Builder
- **Visual Property Editor** — Define PCF properties (all types: SingleLine.Text, OptionSet, Lookup, etc.)
- **Resource Configuration** — CSS, image, resx, and platform library management
- **Live XML Preview** — Real-time `ControlManifest.Input.xml` generation
- **Import Existing Manifest** — Parse and edit existing control manifests

### Environment & Auth Management
- **Auth Profiles** — Manage PAC CLI auth profiles (interactive, device code, service principal)
- **Environment Switching** — Quick switch between Power Platform environments
- **Deployment History** — Track deploys per solution with timestamps and status

### Developer Tools
- **Control Templates Library** — 6 built-in templates (Star Rating, Date Picker, File Upload, Signature Pad, QR Code, Rich Text Editor)
- **Localization Helper** — Visual `.resx` editor with CSV import/export, missing translation detection
- **Git Integration** — Status, commit, branch management, pull/push directly from the app
- **Keyboard Shortcuts** — `Ctrl+B` (Build), `Ctrl+Enter` (Watch), `Ctrl+Shift+P` (Package), `Ctrl+1-5` (Navigate)

### Visual Designer *(Preview)*
- Drag-and-drop Fluent UI component canvas — code generation has known issues; use Manifest Builder for stable workflow

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | v20.x LTS | Runtime |
| [Power Platform CLI](https://aka.ms/PowerAppsCLI) | Latest | PCF operations |
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0+ | Solution building |
| [Git](https://git-scm.com/) | Latest | Version control |

### Install PAC CLI

```bash
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

### Verify

```bash
node --version      # v20.x
pac --version       # Power Platform CLI version
dotnet --version    # 8.x
git --version
```

---

## Getting Started

### Clone & Install

```bash
git clone https://github.com/leduc212/pcf-control-maker.git
cd pcf-control-maker
npm install
```

### Development

```bash
npm run dev          # Start Vite dev server + Electron with hot reload
```

### Build

```bash
npm run build        # Compile TypeScript + bundle renderer
```

### Package

```bash
npm run package:win    # Windows NSIS installer
npm run package:mac    # macOS DMG
npm run package:linux  # Linux AppImage
```

### Other Commands

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier
npm run typecheck     # TypeScript type check (no emit)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 40 |
| Frontend | React 19, TypeScript 5.9 |
| UI | Fluent UI v9 (`@fluentui/react-components`) |
| State | Zustand 5 |
| Forms | React Hook Form 7 + Zod 4 |
| Routing | React Router 7 (HashRouter) |
| DnD | @dnd-kit |
| Build | Vite 7.3 |
| Packaging | electron-builder |

### Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Desktop framework | Electron over Tauri | Better ecosystem, easier debugging (larger bundle is acceptable for enterprise desktop) |
| UI library | Fluent UI v9 over v8 | Latest version, better performance, modern API |
| State management | Zustand over Redux | Simpler API, less boilerplate, TypeScript-first |
| DnD library | @dnd-kit over react-dnd | Modern, accessible, better performance |

---

## Project Structure

```
src/
├── main/                    # Electron main process (Node.js)
│   ├── index.ts             # App entry, window creation
│   ├── ipc/                 # IPC handlers (12 modules)
│   └── services/            # Business logic services (13 modules)
├── preload/
│   └── index.ts             # contextBridge — typed window.electronAPI
├── renderer/                # React frontend
│   ├── App.tsx              # Root with HashRouter + FluentProvider
│   ├── pages/               # 10 pages
│   ├── components/          # Feature-organized components
│   ├── stores/              # Zustand stores (7)
│   ├── hooks/               # Custom hooks
│   └── styles/              # Global CSS
└── shared/                  # Types and constants shared between processes
    ├── types/               # 12 type files
    └── constants/           # PCF, manifest, and template constants
```

---

## Architecture

PCF Maker uses Electron's three-process model with a strict security boundary:

- `nodeIntegration: false` + `contextIsolation: true` — no Node.js access in renderer
- All Node.js operations go through typed IPC channels via `contextBridge`
- IPC naming: `{domain}:{action}` (e.g. `project:open`, `pac-cli:build`)

```
Renderer (React)
  └── window.electronAPI.{domain}.{method}()
        └── ipcRenderer.invoke('{domain}:{method}')
              └── ipcMain.handle → Service class
```

---

## Roadmap

### Completed

- **v0.1–v0.3** — Core project management, solution packaging, PAC CLI integration, responsive UI
- **v0.4** — Settings page, build output improvements, keyboard shortcuts, Open in Editor
- **v0.5** — Manifest Builder: visual property editor, resource config, XML generation, import
- **v0.6** — Deployment & Environments: profile management, auth, one-click deploy, history
- **v0.7** — Developer Experience: templates library (6 templates), localization helper, git integration

### In Progress / Planned

#### Phase 5: Advanced Features
- [ ] **Power Platform Connection Browser** — list environments, deployed solutions, solution version comparison
- [ ] **Documentation Generator** — README from manifest, property docs table, changelog from git
- [ ] **Performance Profiler** — measure init time, track updateView() frequency, memory monitoring
- [ ] **Solution Diff Tool** — compare two `.zip` files, visual diff of solution.xml
- [ ] **Dependency Management** — npm audit, outdated package detection, one-click safe updates
- [ ] **Bundle Size Analyzer** — webpack output analysis, dependency chart, size tracking

#### Technical Debt
- [ ] Unit tests for services
- [ ] Integration tests for IPC handlers
- [ ] TypeScript strict mode compliance
- [ ] Code splitting and lazy loading for large components

#### Future (Post v1.0)
- Team collaboration features
- Cloud sync for projects
- AI-assisted component suggestions
- Plugin system for custom templates
- Azure DevOps / GitHub Actions integration
- PCF testing framework integration

---

## Known Limitations

- **Designer page** is marked "Preview" — generated code has issues and no persistence; use Manifest Builder as the stable alternative
- **Tests** are not yet configured (`npm test` is a placeholder)
- **Windows only** has been the primary test target; macOS/Linux packaging is available but less tested
- PAC CLI must be installed via `dotnet tool install` so it lands in `~/.dotnet/tools` (the app adds this to PATH automatically)

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes following the existing code style
4. Open a pull request describing the change and motivation

For larger changes, open an issue first to discuss the approach.

### Code Style

- **Prettier**: single quotes, semicolons, 2-space indent, 100-char print width
- **ESLint**: `no-unused-vars` (warn, `_` prefix allowed), `no-explicit-any` (warn)
- **Naming**: PascalCase components, kebab-case services/IPC files, `handle*` event handlers
- Run `npm run lint:fix && npm run format` before committing

---

## Security

If you discover a security vulnerability, please report it privately via [GitHub Issues](https://github.com/leduc212/pcf-control-maker/issues) with the label `security`. Do not open public issues for vulnerabilities until a fix is available.

PCF Maker is a local desktop tool — it does not collect data, connect to external services, or require internet access beyond PAC CLI auth flows to your own Power Platform tenant.

---

## References

- [PCF Documentation](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/overview)
- [PAC CLI Reference](https://docs.microsoft.com/en-us/power-platform/developer/cli/reference/)
- [Fluent UI React v9](https://react.fluentui.dev/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [PCF Gallery](https://pcf.gallery/)

---

## Version History

| Version | Changes |
|---------|---------|
| v0.1 | Initial MVP — basic project management |
| v0.2 | Solution packaging and management |
| v0.3 | UI improvements, responsive design, PAC CLI fixes |
| v0.4 | Settings page, build output panel, keyboard shortcuts, Open in Editor |
| v0.5 | Manifest Builder with visual property editor and XML generation |
| v0.6 | Deployment & Environments with profile management and one-click deploy |
| v0.7 | Templates library, localization helper, git integration |
| v0.9 | Current stable release |

---

## License

[MIT](./LICENSE)
