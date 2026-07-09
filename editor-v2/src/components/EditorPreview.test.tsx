import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EditorPreview from './EditorPreview';
import { makeEd, mockContext, mockContent } from '../test/mockEd';

describe('<EditorPreview />', () => {
  it('renders nothing when there is no content (negative)', () => {
    const ed = makeEd({ content: null });
    const { container } = render(<EditorPreview ed={ed} context={mockContext} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the content name and a localized mimeType label', () => {
    const ed = makeEd({ content: mockContent });
    render(<EditorPreview ed={ed} context={mockContext} />);
    expect(screen.getByText('Sample content')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();     // application/pdf → PDF
    expect(screen.getByText('Preview mode')).toBeInTheDocument();
  });

  it('builds the renderer iframe src with webview=true', () => {
    const ed = makeEd({ content: mockContent, previewUrl: '/content/preview/preview.html' });
    const { container } = render(<EditorPreview ed={ed} context={mockContext} />);
    const iframe = container.querySelector('iframe')!;
    expect(iframe).toHaveAttribute('src', '/content/preview/preview.html?webview=true');
    expect(iframe).toHaveAttribute('title', 'Sample content');
  });

  it('appends webview with & when previewUrl already has a query', () => {
    const ed = makeEd({ content: mockContent, previewUrl: '/preview.html?foo=1' });
    const { container } = render(<EditorPreview ed={ed} context={mockContext} />);
    expect(container.querySelector('iframe')).toHaveAttribute('src', '/preview.html?foo=1&webview=true');
  });
});
