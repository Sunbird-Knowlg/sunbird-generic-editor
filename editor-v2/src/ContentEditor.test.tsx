import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ContentEditor from './ContentEditor';
import type { ContentEditorService } from './services/ContentEditorService';
import { mockContext, mockContent } from './test/mockEd';

/** A fake service covering everything useEditor touches on mount. */
function svc(over: Record<string, unknown> = {}) {
  return {
    readPrimaryCategories: vi.fn().mockResolvedValue(['eTextbook', 'Learning Resource']),
    readContent: vi.fn().mockResolvedValue(mockContent),
    createLock: vi.fn().mockResolvedValue({}),
    retireLock: vi.fn().mockResolvedValue(undefined),
    getBase: () => ({ baseUrl: '', apiSlug: '/action', headers: {}, fetchImpl: fetch }),
    getEndpoints: () => ({}),
    ...over,
  } as unknown as ContentEditorService;
}

describe('<ContentEditor /> — new upload', () => {
  it('renders the upload UI when no contentId is given', async () => {
    render(<ContentEditor context={mockContext} service={svc()} onClose={vi.fn()} />);
    expect(await screen.findByText('Upload content')).toBeInTheDocument();
    expect(screen.getByText('What are you uploading?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close Editor' })).toBeInTheDocument();
  });
});

describe('<ContentEditor /> — existing content', () => {
  it('loads the content, shows the preview, and locks it on open', async () => {
    const service = svc();
    render(<ContentEditor context={mockContext} contentId="do_1" service={service} onClose={vi.fn()} />);
    await waitFor(() => expect(service.readContent).toHaveBeenCalledWith('do_1'));
    // Preview bar shows the content name (also in the header) + type.
    await waitFor(() => expect(screen.getAllByText('Sample content').length).toBeGreaterThan(0));
    expect(screen.getByText('PDF')).toBeInTheDocument();
    // Lock created for an editable draft opened by its creator.
    await waitFor(() => expect(service.createLock).toHaveBeenCalled());
  });

  it('surfaces a load error toast when read fails (negative)', async () => {
    const service = svc({ readContent: vi.fn().mockRejectedValue(new Error('nope')) });
    render(<ContentEditor context={mockContext} contentId="do_x" service={service} onClose={vi.fn()} />);
    expect(await screen.findByText('Failed to load content.')).toBeInTheDocument();
  });
});
