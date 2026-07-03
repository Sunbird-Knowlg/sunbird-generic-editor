/**
 * ContentEditorService — backend abstraction for the editor.
 *
 * All calls go to relative `/action/...` by default (same-origin). In the portal
 * these are proxied to knowledge-mw / Kong with the session cookie — exactly how
 * the old AngularJS generic editor used `apislug: '/action'`. Standalone hosts can
 * override baseUrl / headers via EditorConfig.
 *
 * Endpoint versions: create/read/update/upload/review = v3, publish/reject/lock/
 * framework/form = v1. All go through /action → knowledge-mw. Override via
 * `endpoints` if a deployment differs.
 */
import type { ContentData, EditorContext, EditorConfig, FrameworkCategory, FormField, AssetItem } from '../types';

const DEFAULT_ENDPOINTS = {
  /* Versions verified against the portal's working ContentService + the old generic
     editor's real calls + the backend proxy (upload = v3). All hit /action → knowledge-mw. */
  create: 'content/v3/create',
  read: 'content/v3/read',
  update: 'content/v3/update',
  collaboratorUpdate: 'content/v1/collaborator/update',
  presigned: 'content/v3/upload/url',
  uploadFinalize: 'content/v3/upload',
  review: 'content/v3/review',
  publish: 'content/v1/publish',
  reject: 'content/v1/reject',
  lockCreate: 'lock/v1/create',
  lockRetire: 'lock/v1/retire',
  framework: 'framework/v1/read',
  form: 'data/v1/form/read',
  compositeSearch: 'composite/v3/search',
  assetCreate: 'content/v3/create',
  assetUpload: 'content/v3/upload',
  userSearch: 'user/v1/search',
  reviewCommentCreate: 'review/comment/v1/create/comment',
  reviewCommentRead: 'review/comment/v1/read/comment',
} as const;

export type EndpointMap = Partial<typeof DEFAULT_ENDPOINTS>;

const READ_FIELDS = [
  'name', 'description', 'mimeType', 'contentType', 'primaryCategory', 'resourceType',
  'status', 'artifactUrl', 'streamingUrl', 'downloadUrl', 'appIcon', 'posterImage',
  'framework', 'board', 'medium', 'gradeLevel', 'subject', 'keywords', 'collaborators',
  'createdBy', 'creator', 'versionKey', 'pkgVersion', 'rejectReasons', 'rejectComment',
].join(',');

function toArray(val: unknown): string[] | undefined {
  if (val == null) return undefined;
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string') {
    const m = val.match(/\[([^\]]*)\]/);
    if (m) return m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    return val ? [val] : undefined;
  }
  return undefined;
}

export function normalizeContent(raw: Record<string, unknown>): ContentData {
  return {
    ...raw,
    identifier: String(raw.identifier ?? ''),
    name: String(raw.name ?? ''),
    mimeType: raw.mimeType ? String(raw.mimeType) : undefined,
    artifactUrl: raw.artifactUrl ? String(raw.artifactUrl) : undefined,
    medium: toArray(raw.medium),
    gradeLevel: toArray(raw.gradeLevel),
    subject: toArray(raw.subject),
    keywords: toArray(raw.keywords),
    collaborators: toArray(raw.collaborators),
    rejectReasons: toArray(raw.rejectReasons),
    board: typeof raw.board === 'string' ? raw.board : toArray(raw.board)?.[0],
  } as ContentData;
}

export class ContentEditorService {
  private baseUrl: string;
  private apiSlug: string;
  private headers: Record<string, string>;
  private fetchImpl: typeof fetch;
  private ep: typeof DEFAULT_ENDPOINTS;

  constructor(config: EditorConfig = {}, endpoints?: EndpointMap, context?: EditorContext) {
    this.baseUrl = (config.baseUrl ?? '').replace(/\/$/, '');
    this.apiSlug = config.apiSlug ?? '/action';
    // knowledge-mw / lock service require these device + client headers (the old
    // generic editor sent them on every /action call). Derive from the editor
    // context; explicit config.headers always win.
    const did = context?.did || (typeof localStorage !== 'undefined' ? localStorage.getItem('deviceId') || '' : '');
    const contextHeaders: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
      ...(did ? { 'X-device-Id': did } : {}),
      ...(context?.uid ? { 'user-id': context.uid } : {}),
    };
    this.headers = {
      'Content-Type': 'application/json',
      ...contextHeaders,
      ...(config.headers ?? {}),
    };
    this.fetchImpl = (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (undefined as never));
    this.ep = { ...DEFAULT_ENDPOINTS, ...(endpoints ?? {}) };
  }

  private url(path: string): string {
    return `${this.baseUrl}${this.apiSlug}/${path}`;
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const resp = await this.fetchImpl(this.url(path), {
      method,
      headers: this.headers,
      credentials: 'same-origin',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await resp.json().catch(() => ({}));
    const code = (data as { responseCode?: string }).responseCode;
    if (!resp.ok || (code && code !== 'OK' && code !== 'ok')) {
      const errmsg =
        (data as { params?: { errmsg?: string; err?: string } }).params?.errmsg ||
        `Request failed (${resp.status}) for ${path}`;
      const err = new Error(errmsg) as Error & { code?: string; status?: number; body?: unknown };
      err.code = (data as { params?: { err?: string } }).params?.err;
      err.status = resp.status;
      err.body = data;
      throw err;
    }
    return (data as { result?: T }).result as T;
  }

  /** POST content/v1/create — returns new identifier. */
  async createContent(context: EditorContext, props: {
    name?: string;
    mimeType: string;
    primaryCategory: string;
    contentType?: string;
    framework?: string;
  }): Promise<string> {
    const user = context.user;
    const code = `ce-${Date.now()}-${Math.round(Number(String(Date.now()).slice(-4)))}`;
    const content: Record<string, unknown> = {
      name: props.name || 'Untitled Content',
      code,
      mimeType: props.mimeType,
      createdBy: user?.id,
      createdFor: user?.organisationIds,
      contentType: props.contentType || 'Resource',
      resourceType: 'Learn',
      creator: user?.name,
      framework: props.framework || context.framework,
      organisation: user?.organisationNames,
      primaryCategory: props.primaryCategory,
    };
    const result = await this.request<{ identifier?: string; node_id?: string; versionKey?: string }>(
      'POST',
      this.ep.create,
      { request: { content } },
    );
    return String(result.identifier ?? result.node_id ?? '');
  }

  /** GET content/v3/read/{id}?mode=edit */
  async readContent(contentId: string, mode = 'edit'): Promise<ContentData> {
    const path = `${this.ep.read}/${encodeURIComponent(contentId)}?mode=${mode}&fields=${READ_FIELDS}`;
    const result = await this.request<{ content: Record<string, unknown> }>('GET', path);
    return normalizeContent(result.content);
  }

  /** PATCH content/v3/update/{id} — partial metadata update. */
  async updateContent(
    contentId: string,
    fields: Record<string, unknown>,
    versionKey?: string,
  ): Promise<{ versionKey?: string; identifier?: string }> {
    const content = versionKey ? { ...fields, versionKey } : fields;
    return this.request('PATCH', `${this.ep.update}/${encodeURIComponent(contentId)}`, {
      request: { content },
    });
  }

  /** POST content/v3/review/{id} — Draft → Review. */
  async sendForReview(contentId: string): Promise<unknown> {
    return this.request('POST', `${this.ep.review}/${encodeURIComponent(contentId)}`, {
      request: { content: {} },
    });
  }

  /** POST content/v1/publish/{id} */
  async publishContent(contentId: string, lastPublishedBy: string): Promise<unknown> {
    return this.request('POST', `${this.ep.publish}/${encodeURIComponent(contentId)}`, {
      request: { content: { lastPublishedBy } },
    });
  }

  /** POST content/v1/reject/{id} — request changes. */
  async rejectContent(contentId: string, rejectReasons: string[], rejectComment?: string): Promise<unknown> {
    return this.request('POST', `${this.ep.reject}/${encodeURIComponent(contentId)}`, {
      request: { content: { rejectReasons, ...(rejectComment ? { rejectComment } : {}) } },
    });
  }

  /**
   * PATCH content/v1/collaborator/update/{id} — set the full collaborator list.
   * Payload is exactly {request:{content:{collaborators:[...]}}} (no versionKey),
   * matching the generic editor. Add = include the id; remove = drop it.
   */
  async updateCollaborators(contentId: string, collaborators: string[]): Promise<unknown> {
    return this.request('PATCH', `${this.ep.collaboratorUpdate}/${encodeURIComponent(contentId)}`, {
      request: { content: { collaborators } },
    });
  }

  /** POST lock/v1/create */
  async createLock(contentId: string, context: EditorContext, content: ContentData): Promise<{
    lockKey?: string; expiresAt?: string; expiresIn?: number;
  }> {
    return this.request('POST', this.ep.lockCreate, {
      request: {
        resourceId: contentId,
        resourceType: 'Content',
        resourceInfo: JSON.stringify({
          contentType: content.contentType,
          identifier: contentId,
          mimeType: content.mimeType,
          framework: content.framework,
        }),
        creatorInfo: JSON.stringify({ name: context.user?.name, id: context.user?.id }),
        createdBy: context.user?.id,
      },
    });
  }

  /** DELETE lock/v1/retire */
  async retireLock(contentId: string): Promise<void> {
    await this.request('DELETE', this.ep.lockRetire, {
      request: { resourceId: contentId, resourceType: 'Content' },
    });
  }

  /** GET framework/v1/read/{id} — returns category list for taxonomy cascade. */
  async readFramework(frameworkId: string): Promise<FrameworkCategory[]> {
    const result = await this.request<{ framework: { categories?: FrameworkCategory[] } }>(
      'GET',
      `${this.ep.framework}/${encodeURIComponent(frameworkId)}`,
    );
    return result.framework?.categories ?? [];
  }

  /** POST data/v1/form/read — checklist / form config (publish, review). */
  async readForm(request: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', this.ep.form, { request });
  }

  /**
   * Fetch form field definitions for a given content type + action.
   *
   * Mirrors the old generic editor / metadata plugin payload exactly:
   *   {type:'content', subType, action, framework, rootOrgId, popup:true, editMode:true}
   * Note the API expects `subType` (camelCase) and the channel as `rootOrgId`.
   *
   * Response shape: result.form.data.fields[] (a single section object, not an array).
   * Sorts fields by `index` so render order matches the configured form.
   */
  async readFormFields(
    _subtype: string,
    action: 'save' | 'review' | 'publish',
    opts: { framework?: string; rootOrgId?: string } = {},
  ): Promise<FormField[]> {
    type FormResp = { form?: { data?: { fields?: FormField[] } } };
    const result = await this.request<FormResp>('POST', this.ep.form, {
      request: {
        type: 'content',
        // Form config is keyed on a fixed subType ('resource'), not the content's
        // primaryCategory — matches the old generic editor's form/read call.
        subType: 'resource',
        action,
        framework: opts.framework ?? '*',
        rootOrgId: opts.rootOrgId ?? '*',
        popup: true,
        editMode: true,
      },
    });
    const fields = result?.form?.data?.fields ?? [];
    return [...fields].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }

  /**
   * Fetch the reject-checklist structure from the form API.
   *
   * Mirrors the legacy editor's `initPopup` call with `action: 'requestforchanges'`.
   * Returns category columns (Appropriateness, Content details, Usability) and an
   * optional "Other Issue(s)" label. The reject reasons stored in content metadata
   * (`rejectReasons`) are matched against items in these categories.
   */
  async readRejectChecklist(opts: {
    subType?: string;
    framework?: string;
    rootOrgId?: string;
  } = {}): Promise<{
    categories: Array<{ name: string; checkList: string[] }>;
    otherReason?: string;
  }> {
    type FormResp = {
      form?: {
        data?: {
          fields?: Array<{
            contents?: Array<{ name: string; checkList: string[] }>;
            otherReason?: string;
          }>;
        };
      };
    };
    try {
      const result = await this.request<FormResp>('POST', this.ep.form, {
        request: {
          type: 'content',
          subType: opts.subType ?? 'resource',
          action: 'requestforchanges',
          framework: opts.framework ?? '*',
          rootOrgId: opts.rootOrgId ?? '*',
        },
      });
      const field = result?.form?.data?.fields?.[0];
      return {
        categories: field?.contents ?? [],
        otherReason: field?.otherReason,
      };
    } catch {
      return { categories: [] };
    }
  }

  /**
   * Resolve the upload content-type options from the save form's `primaryCategory`
   * field range (falls back to a `contentType` field). Returns [] on miss/error so
   * the caller can fall back to config/defaults. Mirrors the old generic editor,
   * which sourced the upload dropdown from context.primaryCategories.
   */
  async readPrimaryCategories(opts: { framework?: string; rootOrgId?: string } = {}): Promise<string[]> {
    try {
      const fields = await this.readFormFields('resource', 'save', opts);
      const field =
        fields.find((f) => f.code === 'primaryCategory') ??
        fields.find((f) => f.code === 'contentType');
      const range = field?.range ?? [];
      return range.map((r) => r.name).filter((n): n is string => !!n);
    } catch {
      return [];
    }
  }

  /**
   * POST composite/v3/search — image asset browser (appicon picker).
   * `createdBy` filters to the user's own uploads ("My Images"); omit for "All Images".
   */
  async searchImageAssets(createdBy?: string, query?: string, offset = 0, limit = 50): Promise<AssetItem[]> {
    const filters: Record<string, unknown> = {
      mediaType: ['image'],
      contentType: ['Asset'],
      compatibilityLevel: { min: 1, max: 2 },
      status: ['Live', 'Review', 'Draft'],
    };
    if (createdBy) filters.createdBy = createdBy;
    const result = await this.request<{ content?: Array<Record<string, unknown>> }>(
      'POST',
      this.ep.compositeSearch,
      { request: { filters, ...(query ? { query } : {}), limit, offset } },
    );
    return (result?.content ?? []).map((c) => {
      const variants = c.variants as { medium?: string; low?: string } | undefined;
      const src = String(
        variants?.medium ?? c.downloadUrl ?? c.artifactUrl ?? '',
      );
      return {
        identifier: String(c.identifier ?? ''),
        name: String(c.name ?? ''),
        src,
        thumbnail: String(variants?.low ?? src),
        mediaType: c.mediaType ? String(c.mediaType) : undefined,
        mimeType: c.mimeType ? String(c.mimeType) : undefined,
      };
    });
  }

  /**
   * Create an image Asset record then upload the file to it.
   * Returns the uploaded artifact URL. Mirrors the portal's uploadAsset flow
   * (asset/v1/create → asset/v1/upload/{id}, multipart form).
   */
  async uploadImageAsset(file: File, context: EditorContext): Promise<string> {
    const created = await this.request<{ identifier?: string; node_id?: string }>(
      'POST',
      this.ep.create,
      {
        request: {
          content: {
            name: file.name,
            code: `asset-${Date.now()}`,
            mimeType: file.type || 'image/png',
            mediaType: 'image',
            contentType: 'Asset',
            primaryCategory: 'Asset',
            creator: context.user?.name,
            createdBy: context.user?.id,
            channel: context.channel,
          },
        },
      },
    );
    const assetId = String(created.identifier ?? created.node_id ?? '');
    if (!assetId) throw new Error('Asset create failed');

    const form = new FormData();
    form.append('file', file);
    // Multipart upload: drop the JSON Content-Type so the browser sets the boundary.
    const { 'Content-Type': _ct, ...rest } = this.headers;
    const resp = await this.fetchImpl(this.url(`${this.ep.assetUpload}/${encodeURIComponent(assetId)}`), {
      method: 'POST',
      headers: rest,
      credentials: 'same-origin',
      body: form,
    });
    const data = await resp.json().catch(() => ({}));
    const url = (data as { result?: { artifactUrl?: string; content_url?: string } }).result?.artifactUrl
      ?? (data as { result?: { content_url?: string } }).result?.content_url;
    if (!resp.ok || !url) throw new Error('Asset upload failed');
    return String(url);
  }

  /**
   * POST user/v1/search?fields=orgName — fetches the CONTENT_CREATOR user pool.
   * Mirrors the generic editor's collaborator search exactly: an optional free-text
   * `query`, the CONTENT_CREATOR role filter, and the org scope as rootOrgId[].
   * The full pool is returned; the drawer marks which ones are already collaborators.
   */
  async searchUsers(query = '', rootOrgId?: string): Promise<Array<Record<string, unknown>>> {
    const result = await this.request<{ response?: { content?: Array<Record<string, unknown>> } }>(
      'POST',
      `${this.ep.userSearch}?fields=orgName`,
      {
        request: {
          query,
          filters: {
            'organisations.roles': ['CONTENT_CREATOR'],
            rootOrgId: rootOrgId ? [rootOrgId] : [],
          },
          fields: ['email', 'firstName', 'identifier', 'lastName', 'organisations', 'rootOrgName', 'phone'],
          offset: 0,
          limit: 200,
        },
      },
    );
    return result.response?.content ?? [];
  }

  /** POST review comments. */
  async createReviewComment(payload: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', this.ep.reviewCommentCreate, { request: payload });
  }
  async readReviewComments(payload: Record<string, unknown>): Promise<unknown> {
    return this.request('POST', this.ep.reviewCommentRead, { request: payload });
  }

  /** Raw access for UploadService (presigned URL + finalize). */
  getEndpoints(): typeof DEFAULT_ENDPOINTS { return this.ep; }
  getBase(): { baseUrl: string; apiSlug: string; headers: Record<string, string>; fetchImpl: typeof fetch } {
    return { baseUrl: this.baseUrl, apiSlug: this.apiSlug, headers: this.headers, fetchImpl: this.fetchImpl };
  }
}
