import '@testing-library/jest-dom';
import { vi } from 'vitest';

/* jsdom lacks a few APIs the editor touches; stub them so components render. */
if (!('matchMedia' in window)) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

/* Minimal FileReader backed by Blob.arrayBuffer() (jsdom's is flaky for JSZip). */
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
vi.stubGlobal('FileReader', FileReaderShim);
