import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MetadataDrawer from './MetadataDrawer';
import { makeEd, mockContent, mockService } from '../test/mockEd';

describe('<MetadataDrawer />', () => {
  it('renders the fallback form fields when open', () => {
    const ed = makeEd({ drawer: 'metadata', content: mockContent });
    render(<MetadataDrawer ed={ed} />);
    expect(screen.getByRole('heading', { name: 'Edit Content Details' })).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('saves metadata with the trimmed name (positive)', () => {
    const saveMetadata = vi.fn();
    const ed = makeEd({ drawer: 'metadata', content: mockContent, saveMetadata });
    render(<MetadataDrawer ed={ed} />);
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(saveMetadata).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sample content' }));
  });

  it('blocks save and toasts when the title is empty (negative)', () => {
    const saveMetadata = vi.fn();
    const showToast = vi.fn();
    const ed = makeEd({ drawer: 'metadata', content: { ...mockContent, name: '' }, saveMetadata, showToast });
    render(<MetadataDrawer ed={ed} />);
    fireEvent.click(screen.getByRole('button', { name: /Save changes/ }));
    expect(showToast).toHaveBeenCalledWith('Title is required.', 'error');
    expect(saveMetadata).not.toHaveBeenCalled();
  });

  it('renders a dynamic (non-hardcoded) framework category as a taxonomy select', async () => {
    const service = mockService({
      // Form defines a custom taxonomy field "topic" (not board/medium/subject).
      readFormFields: vi.fn().mockResolvedValue([
        { code: 'name', inputType: 'text', label: 'Title', required: true, visible: true, editable: true },
        { code: 'topic', inputType: 'select', label: 'Topic', visible: true, editable: true },
      ]),
      readFramework: vi.fn().mockResolvedValue([
        { code: 'topic', name: 'Topic', index: 1, terms: [{ code: 't1', name: 'Algebra' }, { code: 't2', name: 'Geometry' }] },
      ]),
    });
    const ed = makeEd({
      drawer: 'metadata',
      service,
      content: { ...mockContent, primaryCategory: 'Learning Resource' },
    });
    render(<MetadataDrawer ed={ed} />);
    // The custom category renders with its framework terms as options.
    expect(await screen.findByText('Topic')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algebra' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'Geometry' })).toBeInTheDocument();
  });

  it('routes to save-and-submit in review-submit mode', () => {
    const saveMetadataAndSubmit = vi.fn();
    const ed = makeEd({ drawer: 'metadata', content: mockContent, reviewSubmitMode: true, saveMetadataAndSubmit });
    render(<MetadataDrawer ed={ed} />);
    fireEvent.click(screen.getByRole('button', { name: /Save & Submit/ }));
    expect(saveMetadataAndSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sample content' }));
  });
});
