/** Sunbird Content Editor v2 — public types. */

/** Editor runtime context (user, session, device, channel). Mirrors player PlayerContext. */
export interface EditorContext {
  uid: string;
  sid: string;
  did: string;
  channel: string;
  pdata: { id: string; pid: string; ver: string };
  /** Logged-in user — used for createdBy/creator, lock, collaborator ownership checks. */
  user?: {
    id: string;
    name: string;
    rootOrgId?: string;
    organisationIds?: string[];
    organisationNames?: string[];
    roles?: string[];
  };
  /** Default framework id (e.g. "NCF") for new content + taxonomy. */
  framework?: string;
  cdata?: Array<{ id: string; type: string }>;
  rollup?: Record<string, string>;
}

/** Host-tunable configuration. */
export interface EditorConfig {
  /** BCP-47 language code, default 'en'. */
  language?: string;
  /** API origin; '' = same-origin (portal proxy). */
  baseUrl?: string;
  /** Path prefix for action APIs; default '/action'. */
  apiSlug?: string;
  /** Extra headers merged into every request (e.g. auth for standalone use). */
  headers?: Record<string, string>;
  /** Cloud storage hints for presigned upload PUTs. */
  cloudStorage?: {
    provider?: 'azure' | 'aws';
    presignedHeaders?: Record<string, string>;
  };
  /** Max upload size in MB (default 150). */
  maxFileSizeMB?: number;
  /** Content category options for the upload picker (fallback when the Form API has none). */
  primaryCategories?: string[];
  /** Large-content upload mode: restricts to mp4/webm/zip and a 15 GB cap. */
  largeUpload?: boolean;
  /** Header brand logo URL. Falls back to the built-in Sunbird logo when unset. */
  headerLogo?: string;
  /** Legacy ekstep content-renderer preview page. Default `/content/preview/preview.html`. */
  previewUrl?: string;
  /**
   * Config object handed to the renderer's `initializePreview({ config })` — mirrors the old
   * generic editor's `previewConfig`. Use it to pass endpage/endscreen options, e.g.
   * `{ showEndpage: true, endpageConfig: {...} }`. Defaults to `{ showEndpage: true }`.
   */
  previewConfig?: Record<string, unknown>;
  telemetry?: { url?: string; batchSize?: number };
}

/** Normalized content object the editor works with. */
export interface ContentData {
  identifier: string;
  name: string;
  description?: string;
  mimeType?: string;
  contentType?: string;
  primaryCategory?: string;
  resourceType?: string;
  status?: string;
  artifactUrl?: string;
  streamingUrl?: string;
  downloadUrl?: string;
  appIcon?: string;
  posterImage?: string;
  framework?: string;
  board?: string;
  medium?: string[];
  gradeLevel?: string[];
  subject?: string[];
  keywords?: string[];
  collaborators?: string[];
  createdBy?: string;
  creator?: string;
  versionKey?: string;
  pkgVersion?: number;
  rejectReasons?: string[];
  rejectComment?: string;
  /** Any extra fields returned by content read. */
  [key: string]: unknown;
}

export type EditorMode = 'edit' | 'review' | 'read';

export type EditorView = 'loading' | 'upload' | 'uploading' | 'player';

/** A single field definition from data/v1/form/read */
export interface FormField {
  code: string;
  dataType?: string;
  description?: string;
  editable?: boolean;
  inputType?: string;
  label?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  visible?: boolean;
  index?: number;
  depends?: string[];
  range?: Array<{ name: string; code?: string }>;
  default?: unknown;
  renderingHints?: Record<string, unknown>;
}

/** An image asset returned by composite/v3/search (appicon picker). */
export interface AssetItem {
  identifier: string;
  name: string;
  /** preview/medium image URL */
  src: string;
  thumbnail?: string;
  mediaType?: string;
  mimeType?: string;
}

export type DrawerKind = 'metadata' | 'collaborator' | 'review' | 'reviewComments' | null;

export interface UploadProgress {
  /** 0–100 */
  percent: number;
  bytesUploaded: number;
  totalBytes: number;
  /** human-readable estimate, e.g. "2m 30s" */
  estimated?: string;
}

export interface EditorEventPayload {
  eid: string;
  edata?: Record<string, unknown>;
  ts?: number;
}

/** Framework category as parsed from framework/v1/read. */
export interface FrameworkTerm {
  identifier?: string;
  code: string;
  name: string;
  associations?: Array<{ name: string; code?: string; category: string; identifier?: string }>;
}

export interface FrameworkCategory {
  identifier?: string;
  code: string; // e.g. 'board' | 'medium' | 'gradeLevel' | 'subject'
  name: string;
  /** parent category codes this one depends on */
  index?: number;
  terms: FrameworkTerm[];
}
