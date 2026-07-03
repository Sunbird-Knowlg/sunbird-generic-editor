import { describe, it, expect } from 'vitest';
import { normalizeContent, ContentEditorService } from './ContentEditorService';

describe('normalizeContent', () => {
  it('coerces missing identifier/name to empty strings (negative)', () => {
    const c = normalizeContent({});
    expect(c.identifier).toBe('');
    expect(c.name).toBe('');
  });
  it('parses stringified Python-style arrays', () => {
    const c = normalizeContent({
      identifier: 'do_1', name: 'X', mimeType: 'application/pdf',
      medium: "['Hindi','English']", gradeLevel: "['Class 2']", subject: ['Science'],
    });
    expect(c.medium).toEqual(['Hindi', 'English']);
    expect(c.gradeLevel).toEqual(['Class 2']);
    expect(c.subject).toEqual(['Science']);
  });
  it('keeps board scalar but reduces board-array to its first value', () => {
    expect(normalizeContent({ identifier: 'd', name: 'n', board: 'CBSE' }).board).toBe('CBSE');
    expect(normalizeContent({ identifier: 'd', name: 'n', board: ['CBSE', 'ICSE'] }).board).toBe('CBSE');
  });
});

describe('ContentEditorService endpoints', () => {
  it('defaults to the verified versions and supports overrides', () => {
    const svc = new ContentEditorService({}, { review: 'content/v9/review' });
    const ep = svc.getEndpoints();
    expect(ep.create).toBe('content/v3/create');
    expect(ep.update).toBe('content/v3/update');
    expect(ep.uploadFinalize).toBe('content/v3/upload');
    expect(ep.collaboratorUpdate).toBe('content/v1/collaborator/update');
    expect(ep.review).toBe('content/v9/review');
  });
  it('uses /action slug and empty base by default', () => {
    const base = new ContentEditorService().getBase();
    expect(base.apiSlug).toBe('/action');
    expect(base.baseUrl).toBe('');
  });
});

describe('ContentEditorService config', () => {
  it('honours baseUrl / apiSlug overrides', () => {
    const base = new ContentEditorService({ baseUrl: 'https://api.example.org', apiSlug: '/api' }).getBase();
    expect(base.baseUrl).toBe('https://api.example.org');
    expect(base.apiSlug).toBe('/api');
  });
  it('merges custom headers', () => {
    const base = new ContentEditorService({ headers: { Authorization: 'Bearer t' } }).getBase();
    expect(base.headers.Authorization).toBe('Bearer t');
  });
});

describe('ContentEditorService.readRejectChecklist', () => {
  it('handles a successful response', async () => {
    const mockResponse = {
      responseCode: 'OK',
      result: {
        form: {
          data: {
            fields: [
              {
                title: 'Please check',
                otherReason: 'Other issues',
                contents: [{ name: 'Appropriateness', checkList: ['A', 'B'] }],
              },
            ],
          },
        },
      },
    };

    const savedFetch = globalThis.fetch;
    globalThis.fetch = (async () => ({ ok: true, json: async () => mockResponse })) as unknown as typeof fetch;

    try {
      const svc = new ContentEditorService();
      const res = await svc.readRejectChecklist();
      expect(res.categories).toEqual([{ name: 'Appropriateness', checkList: ['A', 'B'] }]);
      expect(res.otherReason).toBe('Other issues');
    } finally {
      globalThis.fetch = savedFetch;
    }
  });
});
