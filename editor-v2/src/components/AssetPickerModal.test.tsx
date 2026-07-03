import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AssetPickerModal from './AssetPickerModal';
import { makeEd, mockService } from '../test/mockEd';

const ASSETS = [
  { identifier: 'a1', name: 'Cat', src: 'cat.png', thumbnail: 'cat-t.png' },
  { identifier: 'a2', name: 'Dog', src: 'dog.png' },
];

const picker = { onPick: vi.fn() };

describe('<AssetPickerModal />', () => {
  it('renders nothing when closed (negative)', () => {
    const ed = makeEd({ assetPicker: null });
    const { container } = render(<AssetPickerModal ed={ed} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('loads "my images" on open and renders the grid', async () => {
    const service = mockService({ searchImageAssets: vi.fn().mockResolvedValue(ASSETS) });
    const ed = makeEd({ assetPicker: picker, service, userId: 'u1' });
    render(<AssetPickerModal ed={ed} />);
    await waitFor(() => expect(service.searchImageAssets).toHaveBeenCalledWith('u1', undefined, 0, 18));
    expect(await screen.findByAltText('Cat')).toBeInTheDocument();
    expect(screen.getByAltText('Dog')).toBeInTheDocument();
  });

  it('Select is disabled until an image is chosen, then picks its src', async () => {
    const service = mockService({ searchImageAssets: vi.fn().mockResolvedValue(ASSETS) });
    const onPick = vi.fn();
    const ed = makeEd({ assetPicker: { onPick }, service });
    render(<AssetPickerModal ed={ed} />);
    await screen.findByAltText('Cat');
    const select = screen.getByRole('button', { name: /Select$/ });
    expect(select).toBeDisabled();
    fireEvent.click(screen.getByAltText('Cat'));
    expect(select).not.toBeDisabled();
    fireEvent.click(select);
    expect(onPick).toHaveBeenCalledWith('cat.png');
  });

  it('shows the empty state when search returns nothing (negative)', async () => {
    const service = mockService({ searchImageAssets: vi.fn().mockResolvedValue([]) });
    const ed = makeEd({ assetPicker: picker, service });
    render(<AssetPickerModal ed={ed} />);
    expect(await screen.findByText('No images found')).toBeInTheDocument();
  });

  it('rejects an oversized upload with an error toast (negative)', async () => {
    const service = mockService({ searchImageAssets: vi.fn().mockResolvedValue([]) });
    const showToast = vi.fn();
    const ed = makeEd({ assetPicker: picker, service, showToast });
    render(<AssetPickerModal ed={ed} />);
    await screen.findByText('No images found');
    fireEvent.click(screen.getByRole('button', { name: /Upload$/ }));
    const big = new File([new Uint8Array(2 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [big] } });
    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/1 MB/), 'error'));
  });
});
