/**
 * UploadService — file → cloud → content artifact, the way the old editor did it.
 *
 * 1. getPresignedUrl()  → POST content/v3/upload/url/{id}  → time-limited cloud URL
 * 2. putToCloud()       → browser PUTs bytes straight to cloud storage
 *      - small files: single PUT
 *      - large files: 5 MB Azure block-blob chunks + blocklist commit (resumable)
 * 3. finalizeUpload()   → POST content/v3/upload/{id} (multipart fileUrl + mimeType)
 *      → backend validates artifact, sets artifactUrl
 *
 * Bytes never pass through the app server, so very large video/SCORM uploads work.
 */
import JSZip from 'jszip';
import type { EditorConfig, UploadProgress } from '../types';
import {
  CHUNK_SIZE_BYTES, CHUNK_THRESHOLD_BYTES, CHUNK_RETRY_LIMIT, CHUNK_RETRY_DELAY_MS,
  EXTENSION_MIME, MIME_HTML, MIME_H5P, MIME_SCORM, MIME_YOUTUBE, MIME_URL,
} from '../constants';
import type { ContentEditorService } from './ContentEditorService';

const YT_RE = /(?:youtube\.com|youtu\.be)/i;

function ext(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Detect mimeType for a URL string. */
export function detectUrlMime(url: string): string {
  return YT_RE.test(url) ? MIME_YOUTUBE : MIME_URL;
}

/** Detect mimeType for a File. ZIPs are inspected for SCORM (imsmanifest.xml) / H5P. */
export async function detectFileMime(file: File): Promise<string> {
  const e = ext(file.name);
  if (e === 'h5p') return MIME_H5P;
  if (e !== 'zip') return EXTENSION_MIME[e] ?? 'application/octet-stream';
  try {
    const zip = await JSZip.loadAsync(file);
    const names = Object.keys(zip.files).map((n) => n.toLowerCase());
    if (names.some((n) => n.endsWith('imsmanifest.xml'))) return MIME_SCORM;
    if (names.some((n) => n === 'h5p.json' || n.endsWith('/h5p.json'))) return MIME_H5P;
    return MIME_HTML;
  } catch {
    return MIME_HTML;
  }
}

function blockId(index: number): string {
  /* fixed-width id so all base64 block ids are equal length (Azure requirement) */
  const padded = `block-${String(index).padStart(6, '0')}`;
  return btoa(padded);
}

export class UploadService {
  private service: ContentEditorService;
  private cloudHeaders: Record<string, string>;

  constructor(service: ContentEditorService, config: EditorConfig = {}) {
    this.service = service;
    this.cloudHeaders = config.cloudStorage?.presignedHeaders ?? { 'x-ms-blob-type': 'BlockBlob' };
  }

  /** POST {api}/content/v3/upload/url/{id} → presigned cloud URL. */
  async getPresignedUrl(contentId: string, fileName: string): Promise<string> {
    const { baseUrl, apiSlug, headers, fetchImpl } = this.service.getBase();
    const ep = this.service.getEndpoints().presigned;
    const url = `${baseUrl}${apiSlug}/${ep}/${encodeURIComponent(contentId)}`;
    const resp = await fetchImpl(url, {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify({ request: { content: { fileName } } }),
    });
    const data = await resp.json().catch(() => ({}));
    const signed = data?.result?.pre_signed_url ?? data?.result?.preSignedUrl;
    if (!resp.ok || !signed) throw new Error(`Presigned URL failed (${resp.status})`);
    return String(signed);
  }

  /** PUT file bytes to the presigned cloud URL. Chunks large files. */
  async putToCloud(
    presignedUrl: string,
    file: File,
    mimeType: string,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<void> {
    if (file.size <= CHUNK_THRESHOLD_BYTES) {
      await this.putSingle(presignedUrl, file, mimeType, onProgress);
    } else {
      await this.putChunked(presignedUrl, file, mimeType, onProgress);
    }
  }

  private async putSingle(
    presignedUrl: string,
    file: File,
    mimeType: string,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<void> {
    onProgress?.({ percent: 5, bytesUploaded: 0, totalBytes: file.size });
    const resp = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType, ...this.cloudHeaders },
      body: file,
    });
    if (!resp.ok) throw new Error(`Cloud upload failed (${resp.status})`);
    onProgress?.({ percent: 100, bytesUploaded: file.size, totalBytes: file.size });
  }

  private async putChunked(
    presignedUrl: string,
    file: File,
    mimeType: string,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<void> {
    const total = file.size;
    const ids: string[] = [];
    let pointer = 0;
    let index = 0;
    const startedAt = Date.now();

    while (pointer < total) {
      const chunk = file.slice(pointer, pointer + CHUNK_SIZE_BYTES);
      const id = blockId(index);
      const url = `${presignedUrl}&comp=block&blockid=${encodeURIComponent(id)}`;
      await this.putWithRetry(url, chunk, mimeType);
      ids.push(id);
      pointer += CHUNK_SIZE_BYTES;
      index += 1;
      const bytesUploaded = Math.min(pointer, total);
      const percent = Math.min(99, Math.round((bytesUploaded / total) * 100));
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = bytesUploaded / Math.max(elapsed, 0.001);
      const remaining = rate > 0 ? Math.round((total - bytesUploaded) / rate) : undefined;
      onProgress?.({
        percent,
        bytesUploaded,
        totalBytes: total,
        estimated: remaining != null ? `${Math.floor(remaining / 60)}m ${remaining % 60}s` : undefined,
      });
    }

    /* Commit the block list */
    const xml =
      '<?xml version="1.0" encoding="utf-8"?><BlockList>' +
      ids.map((id) => `<Latest>${id}</Latest>`).join('') +
      '</BlockList>';
    const commit = await fetch(`${presignedUrl}&comp=blocklist`, {
      method: 'PUT',
      headers: { 'x-ms-blob-content-type': mimeType, 'Content-Type': 'text/plain; charset=UTF-8' },
      body: xml,
    });
    if (!commit.ok) throw new Error(`Block list commit failed (${commit.status})`);
    onProgress?.({ percent: 100, bytesUploaded: total, totalBytes: total });
  }

  private async putWithRetry(url: string, chunk: Blob, mimeType: string): Promise<void> {
    let attempt = 0;
    for (;;) {
      try {
        const resp = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': mimeType, 'x-ms-blob-type': 'BlockBlob', ...this.cloudHeaders },
          body: chunk,
        });
        if (resp.ok) return;
        throw new Error(`block PUT ${resp.status}`);
      } catch (err) {
        attempt += 1;
        if (attempt >= CHUNK_RETRY_LIMIT) throw err;
        await sleep(CHUNK_RETRY_DELAY_MS);
      }
    }
  }

  /**
   * POST {api}/content/v3/upload/{id} — multipart with fileUrl (presigned minus query)
   * + mimeType. Backend ingests the cloud artifact and sets artifactUrl.
   */
  async finalizeUpload(contentId: string, presignedUrl: string, mimeType: string): Promise<void> {
    const { baseUrl, apiSlug, headers, fetchImpl } = this.service.getBase();
    const ep = this.service.getEndpoints().uploadFinalize;
    const fileUrl = presignedUrl.split('?')[0];
    const form = new FormData();
    form.append('fileUrl', fileUrl);
    form.append('mimeType', mimeType);
    /* Let the browser set the multipart boundary — strip JSON content-type. */
    const h = { ...headers };
    delete h['Content-Type'];
    const resp = await fetchImpl(`${baseUrl}${apiSlug}/${ep}/${encodeURIComponent(contentId)}`, {
      method: 'POST',
      headers: h,
      credentials: 'same-origin',
      body: form,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || (data.responseCode && data.responseCode !== 'OK')) {
      throw new Error(data?.params?.errmsg || `Finalize upload failed (${resp.status})`);
    }
  }

  /** Upload a remote URL (YouTube / direct link) as the artifact — no cloud PUT. */
  async finalizeUrl(contentId: string, sourceUrl: string, mimeType: string): Promise<void> {
    const { baseUrl, apiSlug, headers, fetchImpl } = this.service.getBase();
    const ep = this.service.getEndpoints().uploadFinalize;
    const form = new FormData();
    form.append('fileUrl', sourceUrl);
    form.append('mimeType', mimeType);
    const h = { ...headers };
    delete h['Content-Type'];
    const resp = await fetchImpl(`${baseUrl}${apiSlug}/${ep}/${encodeURIComponent(contentId)}`, {
      method: 'POST',
      headers: h,
      credentials: 'same-origin',
      body: form,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || (data.responseCode && data.responseCode !== 'OK')) {
      const e = new Error(data?.params?.errmsg || `Finalize URL failed (${resp.status})`) as Error & { code?: string };
      e.code = data?.params?.err;
      throw e;
    }
  }
}
