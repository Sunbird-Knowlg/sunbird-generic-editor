import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UploadCanvas from './UploadCanvas';
import { makeEd } from '../test/mockEd';

/** File with a forced size (avoids allocating real megabytes). */
function fileOf(name: string, sizeBytes = 1024, type = ''): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: sizeBytes });
  return f;
}

function openUpload(over = {}) {
  return makeEd({ view: 'upload', contentType: 'Learning Resource', ...over });
}

describe('<UploadCanvas /> — file auto-upload', () => {
  it('auto-uploads a valid file the moment it is selected (no Upload button)', () => {
    const uploadFile = vi.fn();
    const ed = openUpload({ uploadFile });
    const { container } = render(<UploadCanvas ed={ed} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileOf('lesson.pdf', 2048)] } });
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(uploadFile.mock.calls[0][0].name).toBe('lesson.pdf');
  });

  it('rejects an oversized file with a toast and does not upload (negative)', () => {
    const uploadFile = vi.fn();
    const showToast = vi.fn();
    const ed = openUpload({ uploadFile, showToast, maxMB: 150 });
    const { container } = render(<UploadCanvas ed={ed} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileOf('big.mp4', 200 * 1024 * 1024, 'video/mp4')] } });
    expect(uploadFile).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('150'), 'error');
  });

  it('rejects an unsupported extension with a toast (negative)', () => {
    const uploadFile = vi.fn();
    const showToast = vi.fn();
    const ed = openUpload({ uploadFile, showToast });
    const { container } = render(<UploadCanvas ed={ed} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileOf('notes.txt', 1024)] } });
    expect(uploadFile).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });
});

describe('<UploadCanvas /> — link upload', () => {
  it('keeps a manual Upload button and calls uploadFromUrl on click', () => {
    const uploadFromUrl = vi.fn();
    // uploadUrl is controlled by the controller — seed it (the input maps to ed.uploadUrl).
    const ed = openUpload({ uploadFromUrl, uploadUrl: 'https://youtu.be/x' });
    render(<UploadCanvas ed={ed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add by link' }));
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(uploadFromUrl).toHaveBeenCalledWith('https://youtu.be/x');
  });
});

describe('<UploadCanvas /> — no type selected', () => {
  it('shows a pick-a-type hint and no file input (negative)', () => {
    const ed = makeEd({ view: 'upload', contentType: '' });
    const { container } = render(<UploadCanvas ed={ed} />);
    expect(screen.getByText(/pick a content type/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
});
