import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Toast from './Toast';

describe('<Toast />', () => {
  it('renders nothing when there is no toast (negative)', () => {
    const { container } = render(<Toast toast={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a success message', () => {
    render(<Toast toast={{ msg: 'Saved!', kind: 'success' }} />);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('Saved!');
    expect(el).not.toHaveClass('ce-toast--error');
  });

  it('applies the error modifier for error toasts', () => {
    render(<Toast toast={{ msg: 'Boom', kind: 'error' }} />);
    expect(screen.getByRole('status')).toHaveClass('ce-toast--error');
  });
});
