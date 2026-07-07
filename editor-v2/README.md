# @project-sunbird/generic-editor-v2

A modern, self-contained **React content editor** for the Sunbird platform. It handles
the full creator flow for a piece of content — upload, metadata, collaborators, review,
publish — and previews the result through the legacy ekstep content renderer.

It is a fork of `@sunbird/content-editor`. The two are API-compatible; this fork swaps the
preview engine (see [Why a new editor](#why-a-new-editor)).

---

## Highlights

- **One React component.** Drop `<ContentEditor />` into any React 18+ app, or mount it into
  a plain DOM node via the UMD `mount()` helper — no framework lock-in.
- **Theme-reactive.** All colours derive from HSL seed CSS variables; the host's brand colour
  flows through the whole UI.
- **Multilingual + RTL.** Built-in translations with `dir` handling.
- **Direct-to-cloud uploads.** Bytes stream from the browser straight to cloud storage
  (presigned PUT), so multi-GB video/SCORM uploads never touch the app server.
- **Zero portal coupling.** Preview uses the hosted ekstep renderer; the host only supplies
  context, config, and callbacks.

---

## Install

```bash
npm install @project-sunbird/generic-editor-v2
```

Peer deps: `react >=18`, `react-dom >=18`.

## Usage (React)

```tsx
import { ContentEditor } from '@project-sunbird/generic-editor-v2';
import '@project-sunbird/generic-editor-v2/dist/sunbird-generic-editor.css';

<ContentEditor
  context={{
    uid, sid, did, channel,
    pdata: { id: 'sunbird.portal', pid: 'creation-portal', ver: '1.0' },
    user: { id, name, rootOrgId, roles },
    framework: 'NCF',
  }}
  config={{ language: 'en' }}
  contentId="do_123"                 // omit for a brand-new upload
  onClose={() => navigate('/workspace')}
  onEvent={(e) => console.log(e.eid)}
  onTelemetryEvent={(t) => post(t)}
  onUploadAsset={(file) => uploadThumbnail(file)}
/>
```

## Opening the editor (modes)

There is a single `<ContentEditor />`; a couple of props decide which experience opens.

```tsx
// 1. Normal upload editor (standard file/link upload, 150 MB cap)
<ContentEditor context={ctx} onClose={close} />

// 2. Large content editor (video/zip only, 15 GB cap, chunked resumable upload)
<ContentEditor context={ctx} config={{ largeUpload: true }} onClose={close} />

// 3. Edit an existing content (skips upload, opens straight into preview + metadata)
<ContentEditor context={ctx} contentId="do_123" onClose={close} />
```

- **Normal vs large** is toggled by `config.largeUpload` (default `false`). Large mode restricts
  formats to `mp4 / webm / zip`, raises the cap to 15 GB, hides the "Add by link" tab, and uses
  chunked 5 MB Azure block-blob uploads with retry/resume.
- **New vs existing** is decided by `contentId`: omit it to start a brand-new upload; pass it to
  open an existing content (locks it for editing when the user is the creator on a draft).
- **Files auto-upload** the moment they're selected/dropped (no confirm step). Only **link/YouTube**
  uploads keep an explicit **Upload** button.

## Usage (vanilla / UMD)

```js
const handle = SunbirdGenericEditor.mount({
  container: document.getElementById('editor'),
  context: { /* … */ },
  contentId: 'do_123',
  onClose: () => history.back(),
});
// later
handle.destroy();
```

---

## Running standalone (independently)

The editor is backend-agnostic — it just needs a Sunbird / knowledge-platform
instance to serve the `/action` content APIs and the ekstep renderer assets for preview.

### Dev harness

```bash
npm run dev          # Vite dev server on http://localhost:3002
```

`src/dev-harness.tsx` renders `<ContentEditor />` with a small toolbar (Content ID / language /
reload). It's for local development only, not shipped in the package.

By default the action APIs are same-origin under `/action`. Point them at a real backend by
creating **`.env.local`**:

```bash
# .env.local  — proxied only in `npm run dev`
VITE_API_PROXY=https://dev.sunbirded.org   # proxies /action → this origin
VITE_FRAMEWORK=NCF                          # default framework id
VITE_LANGUAGE=en                            # default UI language
VITE_CONTENT_ID=do_123                      # optional: open an existing content
```

You can also override per-load via URL query params: `?contentId=do_123&lang=hi&framework=NCF`.

### Environment / dev variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `VITE_API_PROXY` | dev only | Origin the Vite dev server proxies `/action` to. Unset ⇒ same-origin. |
| `VITE_FRAMEWORK` | dev only | Default `framework` id passed to the editor. |
| `VITE_LANGUAGE` | dev only | Default UI language. |
| `VITE_CONTENT_ID` | dev only | Content id to open on load (blank ⇒ new upload). |

> These `VITE_*` vars only affect the dev harness. In production the host app supplies
> everything through the `context` / `config` props — there are no runtime env vars in the library.

### What the backend must provide

1. **Action APIs** — `content/v3/*` (create/update/upload), `content/v1/collaborator/update`,
   `lock/v1/{create,retire}`, `data/v1/form/read`, `framework/v1/read`, `composite/v3/search`,
   review/publish endpoints. Served under `config.apiSlug` (default `/action`) at `config.baseUrl`.
2. **Cloud storage** — reachable presigned PUT target (Azure/AWS) for direct uploads.
3. **ekstep renderer assets** — the preview iframe loads `config.previewUrl`
   (default `/content/preview/preview.html`) plus its `/assets/public` and `/content-plugins`.
   In `npm run dev` only `/action` is proxied, so to see previews either proxy those paths too
   or set `previewUrl` to a fully-qualified hosted URL.


## Capabilities

| Area | What it does |
|------|--------------|
| **Upload** | Type-card picker → file drop / URL link → circular progress → preview. |
| **Metadata** | Title, description, thumbnail (app-icon picker), framework taxonomy (board / medium / class / subject cascaded from `framework/v1/read`). |
| **Collaborators** | Search users, add/remove, persisted via `content/v1/collaborator/update`. |
| **Review workflow** | Send for review, reviewer request-changes (with reasons checklist), publish. |
| **Locking** | Creates a content lock on upload / edit-open; retires it on close and on send-for-review. |
| **Session guard** | 30-minute inactivity prompt (Continue / Close). |
| **Telemetry** | Emits Sunbird 3.0 telemetry (impression / interact / error / end) via `onTelemetryEvent`. |
| **Preview** | Renders through the ekstep content renderer for every supported mimeType. |

### Supported content types

Detected automatically from the file (or link):

| Input | Resulting mimeType |
|-------|--------------------|
| `.pdf` | `application/pdf` |
| `.mp4`, `.webm` | `video/mp4`, `video/webm` |
| `.epub` | `application/epub` |
| `.h5p` | `application/vnd.ekstep.h5p-archive` |
| `.zip` with `imsmanifest.xml` | SCORM — `application/vnd.ekstep.scorm-archive` |
| `.zip` with `h5p.json` | H5P — `application/vnd.ekstep.h5p-archive` |
| `.zip` (other) | HTML — `application/vnd.ekstep.html-archive` |
| YouTube link | `video/x-youtube` |
| Other link | `text/x-url` |

### Upload modes

- **Standard** (default): `pdf, mp4, webm, epub, h5p, zip` (+ YouTube/URL links), 150 MB cap
  (configurable via `config.maxFileSizeMB`). Files auto-upload on select; links use an Upload button.
- **Large content** (`config.largeUpload: true`): `mp4, webm, zip` only, 15 GB cap (configurable),
  chunked 5 MB Azure block-blob upload with retry/resume. The "Add by link" tab is hidden.

---

## Configuration

### `context` (EditorContext) — who / where

| Field | Purpose |
|-------|---------|
| `uid`, `sid`, `did` | User / session / device ids (telemetry + audit). |
| `channel` | Content channel. |
| `pdata` | Producer data `{ id, pid, ver }`. |
| `user` | `{ id, name, rootOrgId, roles, … }` — drives creator/lock/collaborator ownership and edit-vs-review mode. |
| `framework` | Default framework id for new content + taxonomy (e.g. `NCF`). |
| `cdata`, `rollup` | Optional telemetry context / rollup. |

### `config` (EditorConfig) — host-tunable

| Field | Default | Purpose |
|-------|---------|---------|
| `language` | `en` | BCP-47 UI language. |
| `baseUrl` | `''` | API origin (`''` = same-origin via portal proxy). |
| `apiSlug` | `/action` | Path prefix for action APIs. |
| `headers` | `{}` | Extra headers merged into every request (auth for standalone use). |
| `cloudStorage` | Azure | `{ provider, presignedHeaders }` for the cloud PUT. |
| `maxFileSizeMB` | `150` standard / `15360` (15 GB) large | Upload size cap (applies to whichever mode is active). |
| `primaryCategories` | built-in | Content-type options (fallback when the Form API returns none). |
| `largeUpload` | `false` | Enables large-content mode (see [Opening the editor](#opening-the-editor-modes)). |
| `headerLogo` | Sunbird logo | Brand logo URL (overridden by the saved content's app-icon). |
| `previewUrl` | `/content/preview/preview.html` | Legacy ekstep renderer page. |
| `previewConfig` | `{ showEndpage: true }` | Object handed to `initializePreview({ config })` — endpage/endscreen options, mirrors the old editor's `previewConfig`. |
| `telemetry` | — | `{ url, batchSize }`. |

### What's configurable vs fixed

| Setting | Configurable? | How |
|---------|---------------|-----|
| Standard upload cap (150 MB) | ✅ | `config.maxFileSizeMB` |
| Large upload cap (15 GB) | ✅ | `config.maxFileSizeMB` (with `largeUpload: true`) |
| Upload mode (normal / large) | ✅ | `config.largeUpload` |
| Preview endpage/endscreen | ✅ | `config.previewConfig` |
| UI language | ✅ | `config.language` / `language` prop |
| API origin / slug / auth headers | ✅ | `config.baseUrl`, `config.apiSlug`, `config.headers` |
| Brand logo | ✅ | `config.headerLogo` (or the content's own app-icon) |
| Preview renderer page | ✅ | `config.previewUrl` |
| Content-type category list | ✅ (fallback only) | `config.primaryCategories` — otherwise sourced live from the Form API |
| Accepted file extensions per mode | ❌ | Fixed: standard `pdf/mp4/webm/epub/h5p/zip`, large `mp4/webm/zip` |
| mimeType detection (SCORM/H5P/HTML zip, YouTube) | ❌ | Automatic from file/link contents |
| Chunk size / retry (5 MB, 10 retries) | ❌ | Fixed constants |
| Idle-timeout prompt (30 min) | ❌ | Fixed constant |
| Files auto-upload; links need a button | ❌ | Fixed behaviour |

### Callbacks

| Prop | When |
|------|------|
| `onClose` | User closes, or after review/publish/reject completes. |
| `onEvent` | Lifecycle events (`editor:ready`, `editor:upload-complete`, `editor:saved`, `editor:sent-for-review`, `editor:published`, …). |
| `onTelemetryEvent` | Every telemetry event; the host batches/POSTs. |
| `onUploadAsset` | Host uploads a thumbnail/app-icon file and returns its URL. |

---

## Why a new editor

The legacy creation experience was an AngularJS "generic editor" that unzipped and rendered
content client-side inside the portal. It was heavy, hard to theme, tightly coupled to the
portal, and awkward to embed elsewhere.

`@sunbird/content-editor` (v2) rebuilt it as a React library and previews via `@sunbird/content-player`
(the new iframe player). But the new player **requires a server-extracted `streamingUrl`** and
never unzips — so freshly uploaded **draft** packages (HTML/SCORM/H5P zips) could not preview
until the backend processed them.

**`@project-sunbird/generic-editor-v2` is the fork that fixes preview for drafts** by rendering through the
proven **ekstep content renderer** (`content/preview/preview.html` + `initializePreview()`), which
routes every mimeType through the ekstep coreplugins — exactly what the old editor relied on, so
drafts preview immediately.

### What improved over the old (AngularJS) editor

- **React 18 + TypeScript**, shipped as an embeddable library (ES + UMD + `.d.ts`) — not a portal-bound app.
- **Theme-reactive** design system instead of hard-coded styles.
- **Direct-to-cloud, chunked uploads** with resume — reliable multi-GB video/SCORM.
- **Redesigned upload flow**: content-type cards, source tabs, drag-drop, circular progress,
  inline link validation surfaced from the upload API.
- **Per-action loading feedback** on every API call (save, draft, collaborator, publish, review).
- **Correct lock lifecycle** — lock on upload/edit-open, retire on close *and* send-for-review.
- **First-class telemetry, i18n, and events** via clean callbacks.

---

## Development

```bash
npm run dev       # Vite dev harness
npm run build     # tsc -b && vite build → dist/ (ES, UMD, .css, .d.ts)
npm run lint      # eslint
npm run test      # vitest (unit tests)
```

### Build output

```
dist/sunbird-generic-editor.es.js     # ES module
dist/sunbird-generic-editor.umd.js    # UMD (global: SunbirdGenericEditor)
dist/sunbird-generic-editor.css       # styles (import once)
dist/index.d.ts                        # types
```

## Public API

Besides `ContentEditor` and `mount`, the package exports the controller hook and services for
advanced hosts: `useEditor`, `ContentEditorService`, `UploadService`, `TelemetryService`,
`normalizeContent`, `detectFileMime`, `detectUrlMime`, the i18n helpers (`t`, `tf`, `getDir`,
`getMimeTypeLabel`, `getCategoryLabel`), and constants (`EDITOR_EVENTS`, `STATUS`,
`DEFAULT_PRIMARY_CATEGORIES`, `DEFAULT_MAX_FILE_SIZE_MB`).

## License

MIT (or the Sunbird project license, per your distribution).
