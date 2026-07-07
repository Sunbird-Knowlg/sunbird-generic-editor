import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CollaboratorDrawer from './CollaboratorDrawer';
import { makeEd, mockService, mockContent } from '../test/mockEd';

const USERS = [
  { identifier: 'u2', firstName: 'Alice', lastName: 'A', email: 'alice@x.io' },
  { identifier: 'u3', firstName: 'Bob', lastName: 'B', email: 'bob@x.io' },
];

describe('<CollaboratorDrawer />', () => {
  it('loads the user pool on open, excluding self', async () => {
    const service = mockService({ searchUsers: vi.fn().mockResolvedValue(USERS) });
    const ed = makeEd({ drawer: 'collaborator', service, userId: 'u1' });
    render(<CollaboratorDrawer ed={ed} />);
    await waitFor(() => expect(service.searchUsers).toHaveBeenCalledWith('', 'org1'));
    expect(await screen.findByText('Alice A')).toBeInTheDocument();
    expect(screen.getByText('Bob B')).toBeInTheDocument();
  });

  it('shows "No users found" when the pool is empty (negative)', async () => {
    const service = mockService({ searchUsers: vi.fn().mockResolvedValue([]) });
    const ed = makeEd({ drawer: 'collaborator', service });
    render(<CollaboratorDrawer ed={ed} />);
    expect(await screen.findByText('No users found')).toBeInTheDocument();
  });

  it('filters the pool by the search query', async () => {
    const service = mockService({ searchUsers: vi.fn().mockResolvedValue(USERS) });
    const ed = makeEd({ drawer: 'collaborator', service });
    render(<CollaboratorDrawer ed={ed} />);
    await screen.findByText('Alice A');
    fireEvent.change(screen.getByPlaceholderText('Search users by name or email'), { target: { value: 'bob' } });
    expect(screen.queryByText('Alice A')).not.toBeInTheDocument();
    expect(screen.getByText('Bob B')).toBeInTheDocument();
  });

  it('adds a collaborator via saveCollaborators', async () => {
    const service = mockService({ searchUsers: vi.fn().mockResolvedValue(USERS) });
    const saveCollaborators = vi.fn().mockResolvedValue(undefined);
    const ed = makeEd({ drawer: 'collaborator', service, saveCollaborators, content: { ...mockContent, collaborators: [] } });
    render(<CollaboratorDrawer ed={ed} />);
    await screen.findByText('Alice A');
    fireEvent.click(screen.getAllByRole('button', { name: /Add/ })[0]);
    await waitFor(() => expect(saveCollaborators).toHaveBeenCalledWith(['u2']));
  });
});
