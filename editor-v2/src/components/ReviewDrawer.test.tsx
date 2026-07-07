import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewDrawer from './ReviewDrawer';
import { makeEd } from '../test/mockEd';

describe('<ReviewDrawer /> — creator', () => {
  it('shows the confirm callout and enables Submit when validation passes', () => {
    const sendForReview = vi.fn();
    const ed = makeEd({ drawer: 'review', mode: 'edit', validateForReview: vi.fn().mockReturnValue([]), sendForReview });
    render(<ReviewDrawer ed={ed} />);
    expect(screen.getByText(/Once submitted/i)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: /Submit/ });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
    expect(sendForReview).toHaveBeenCalled();
  });

  it('lists validation errors and disables Submit when incomplete (negative)', () => {
    const ed = makeEd({
      drawer: 'review', mode: 'edit',
      validateForReview: vi.fn().mockReturnValue(['Title', 'Board / Syllabus']),
    });
    render(<ReviewDrawer ed={ed} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Board / Syllabus')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit/ })).toBeDisabled();
  });
});

describe('<ReviewDrawer /> — reviewer', () => {
  it('request-changes stays disabled until a reason or comment is given', () => {
    const requestChanges = vi.fn();
    const ed = makeEd({ drawer: 'review', mode: 'review', requestChanges });
    render(<ReviewDrawer ed={ed} />);
    const btn = screen.getAllByRole('button', { name: 'Request changes' }).pop()!;
    expect(btn).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Low quality' }));
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(requestChanges).toHaveBeenCalledWith(['Low quality'], '');
  });
});
