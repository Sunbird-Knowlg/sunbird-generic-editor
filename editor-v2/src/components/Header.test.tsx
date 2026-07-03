import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';
import { makeEd, mockContent } from '../test/mockEd';

describe('<Header />', () => {
  it('shows the content title', () => {
    const ed = makeEd({ view: 'player', content: mockContent });
    render(<Header ed={ed} />);
    expect(screen.getByText('Sample content')).toBeInTheDocument();
  });

  it('renders the saved appIcon as the far-left logo when present', () => {
    const ed = makeEd({ view: 'player', content: { ...mockContent, appIcon: 'https://cdn/icon.png' } });
    const { container } = render(<Header ed={ed} />);
    const img = container.querySelector('.ce-logo-mark img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('https://cdn/icon.png');
  });

  it('opens the collaborator drawer from the icon button', () => {
    const setDrawer = vi.fn();
    const ed = makeEd({ view: 'player', mode: 'edit', setDrawer });
    render(<Header ed={ed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add collaborators' }));
    expect(setDrawer).toHaveBeenCalledWith('collaborator');
  });

  it('disables action buttons while busy (negative)', () => {
    const ed = makeEd({ view: 'player', mode: 'edit', busy: true });
    render(<Header ed={ed} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add collaborators' })).toBeDisabled();
  });

  it('shows Publish for a reviewer and wires it up', () => {
    const publish = vi.fn();
    const ed = makeEd({ view: 'player', mode: 'review', publish });
    render(<Header ed={ed} />);
    const btn = screen.getByRole('button', { name: /Publish/ });
    fireEvent.click(btn);
    expect(publish).toHaveBeenCalled();
  });
});
