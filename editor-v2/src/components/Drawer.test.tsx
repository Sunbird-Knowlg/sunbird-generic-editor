import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Drawer from './Drawer';

function renderDrawer(props = {}) {
  const onClose = vi.fn();
  render(
    <Drawer open onClose={onClose} titleIcon={<span>ic</span>} title="My Drawer" {...props}>
      <p>body content</p>
    </Drawer>,
  );
  return { onClose };
}

describe('<Drawer />', () => {
  it('shows title + children and reflects open state', () => {
    renderDrawer();
    expect(screen.getByRole('heading', { name: 'My Drawer' })).toBeInTheDocument();
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  it('is aria-hidden and data-open=false when closed (negative)', () => {
    const { container } = render(
      <Drawer open={false} onClose={() => {}} titleIcon={<i />} title="X">c</Drawer>,
    );
    const root = container.querySelector('.ce-drawer')!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveAttribute('data-open', 'false');
  });

  it('calls onClose from the header close button', () => {
    const { onClose } = renderDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a footer only when provided', () => {
    const { container } = render(
      <Drawer open onClose={() => {}} titleIcon={<i />} title="X" footer={<button>Go</button>}>c</Drawer>,
    );
    expect(container.querySelector('.ce-drawer-foot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });
});
