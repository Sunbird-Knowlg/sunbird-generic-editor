import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { detectFileMime, detectUrlMime, UploadService } from './UploadService';
import { ContentEditorService } from './ContentEditorService';
import { MIME_HTML, MIME_H5P, MIME_SCORM, MIME_YOUTUBE, MIME_URL } from '../constants';

/* Node's test runtime has no FileReader; JSZip reads Blobs/Files through it.
   Minimal shim backed by Blob.arrayBuffer() so detectFileMime can inspect zips. */
if (typeof (globalThis as { FileReader?: unknown }).FileReader === 'undefined') {
  class FileReaderShim {
    result: ArrayBuffer | null = null;
    onload: ((ev: unknown) => void) | null = null;
    onerror: ((ev: unknown) => void) | null = null;
    readAsArrayBuffer(blob: Blob) {
      blob.arrayBuffer()
        .then((buf) => { this.result = buf; this.onload?.({ target: this }); })
        .catch((err) => this.onerror?.(err));
    }
  }
  (globalThis as { FileReader?: unknown }).FileReader = FileReaderShim;
}

async function zipFile(entries: Record<string, string>, name = 'pkg.zip'): Promise<File> {
  const zip = new JSZip();
  for (const [path, body] of Object.entries(entries)) zip.file(path, body);
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  const file = new File([bytes], name);
  // jsdom's Blob.arrayBuffer() is unreliable for JSZip; hand it the real bytes.
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  Object.defineProperty(file, 'arrayBuffer', { value: async () => buf });
  return file;
}

describe('detectFileMime', () => {
  it('maps known extensions (positive)', async () => {
    expect(await detectFileMime(new File([''], 'doc.pdf'))).toBe('application/pdf');
    expect(await detectFileMime(new File([''], 'clip.mp4'))).toBe('video/mp4');
    expect(await detectFileMime(new File([''], 'clip.webm'))).toBe('video/webm');
    expect(await detectFileMime(new File([''], 'book.epub'))).toBe('application/epub');
    expect(await detectFileMime(new File([''], 'game.h5p'))).toBe(MIME_H5P);
  });

  it('falls back to octet-stream for unknown extensions (negative)', async () => {
    expect(await detectFileMime(new File([''], 'notes.txt'))).toBe('application/octet-stream');
    expect(await detectFileMime(new File([''], 'noextension'))).toBe('application/octet-stream');
  });

  it('inspects zips: SCORM has imsmanifest.xml', async () => {
    expect(await detectFileMime(await zipFile({ 'imsmanifest.xml': '<manifest/>' }))).toBe(MIME_SCORM);
    expect(await detectFileMime(await zipFile({ 'course/imsmanifest.xml': '<x/>' }))).toBe(MIME_SCORM);
  });

  it('inspects zips: H5P has h5p.json', async () => {
    expect(await detectFileMime(await zipFile({ 'h5p.json': '{}' }))).toBe(MIME_H5P);
  });

  it('inspects zips: plain archive is HTML content', async () => {
    expect(await detectFileMime(await zipFile({ 'index.html': '<html/>' }))).toBe(MIME_HTML);
  });

  it('treats a corrupt zip as HTML (negative — loadAsync throws)', async () => {
    const notAZip = new File([new Uint8Array([1, 2, 3, 4])], 'broken.zip');
    expect(await detectFileMime(notAZip)).toBe(MIME_HTML);
  });
});

describe('detectUrlMime', () => {
  it('detects YouTube (positive)', () => {
    expect(detectUrlMime('https://www.youtube.com/watch?v=x')).toBe(MIME_YOUTUBE);
    expect(detectUrlMime('https://youtu.be/x')).toBe(MIME_YOUTUBE);
  });
  it('treats everything else as generic URL content', () => {
    expect(detectUrlMime('https://example.com/a.mp4')).toBe(MIME_URL);
    expect(detectUrlMime('not-a-real-url')).toBe(MIME_URL);
  });
});

describe('UploadService.finalizeUrl', () => {
  it('throws with .code = ERR_INVALID_FILE_URL when the API rejects the link', async () => {
    const savedFetch = globalThis.fetch;
    globalThis.fetch = (async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        responseCode: 'CLIENT_ERROR',
        params: { err: 'ERR_INVALID_FILE_URL', errmsg: 'Please Provide Valid File Url!' },
      }),
    })) as unknown as typeof fetch;

    try {
      const uploader = new UploadService(new ContentEditorService());
      await expect(uploader.finalizeUrl('do_1', 'bad-url', MIME_URL)).rejects.toMatchObject({
        code: 'ERR_INVALID_FILE_URL',
        message: 'Please Provide Valid File Url!',
      });
    } finally {
      globalThis.fetch = savedFetch;
    }
  });

  it('rejects a non-http(s) URL before hitting the network (SSRF guard, negative)', async () => {
    const savedFetch = globalThis.fetch;
    const spy = vi.fn();
    globalThis.fetch = spy as unknown as typeof fetch;
    try {
      const uploader = new UploadService(new ContentEditorService());
      await expect(uploader.finalizeUrl('do_1', 'file:///etc/passwd', MIME_URL)).rejects.toMatchObject({
        code: 'ERR_INVALID_FILE_URL',
      });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = savedFetch;
    }
  });

  it('resolves when the API accepts the link (positive)', async () => {
    const savedFetch = globalThis.fetch;
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ responseCode: 'OK', result: { identifier: 'do_1' } }),
    })) as unknown as typeof fetch;

    try {
      const uploader = new UploadService(new ContentEditorService());
      await expect(uploader.finalizeUrl('do_1', 'https://x/y.mp4', 'video/mp4')).resolves.toBeUndefined();
    } finally {
      globalThis.fetch = savedFetch;
    }
  });
});
