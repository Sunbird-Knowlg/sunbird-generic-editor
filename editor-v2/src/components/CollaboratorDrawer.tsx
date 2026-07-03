import React, { useEffect, useMemo, useState } from 'react';
import Drawer from './Drawer';
import type { EditorController } from '../useEditor';
import { t } from '../i18n/i18n';
import { UserPlusIcon, SearchIcon, CheckIcon } from '../icons';

interface Person {
  id: string;
  name: string;
  email?: string;
  org?: string;
}

const PAGE_SIZE = 5;

function personFromResult(r: Record<string, unknown>): Person {
  const first = String(r.firstName ?? '');
  const last = String(r.lastName ?? '');
  const orgs = r.organisations as Array<{ orgName?: string }> | undefined;
  return {
    id: String(r.identifier ?? r.id ?? ''),
    name: `${first} ${last}`.trim() || String(r.identifier ?? ''),
    email: r.email ? String(r.email) : undefined,
    org: r.rootOrgName ? String(r.rootOrgName) : orgs?.[0]?.orgName,
  };
}

const CollaboratorDrawer: React.FC<{ ed: EditorController }> = ({ ed }) => {
  const { lang, content, drawer, setDrawer, service, saveCollaborators, busy, userId, rootOrgId, userRoles } = ed;
  const open = drawer === 'collaborator';
  const canManage = content?.createdBy === userId || userRoles.includes('ORG_ADMIN');

  /** The full CONTENT_CREATOR pool, fetched once per open (cached client-side). */
  const [pool, setPool] = useState<Person[]>([]);
  /** IDs currently collaborating — kept in sync with content + each PATCH. */
  const [collabIds, setCollabIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  /** id mid-flight for an add/remove PATCH (disables its button). */
  const [pending, setPending] = useState<string | null>(null);
  /** how many rows are currently shown (Load more bumps this — no extra API call). */
  const [shown, setShown] = useState(PAGE_SIZE);

  /* Load the user pool once per open, and seed the current collaborators. */
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setShown(PAGE_SIZE);
    setCollabIds(content?.collaborators ?? []);
    setLoading(true);
    service
      .searchUsers('', rootOrgId)
      .then((rows) => setPool(rows.map(personFromResult).filter((p) => p.id)))
      .catch(() => setPool([]))
      .finally(() => setLoading(false));
  }, [open, content, service, rootOrgId]);

  const selfId = userId;

  /* Pool minus self, filtered by query (name/email). Self never addable. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((p) => {
      if (p.id === selfId) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q);
    });
  }, [pool, query, selfId]);

  /* Reset paging whenever the filter changes so we don't show a stale offset. */
  useEffect(() => { setShown(PAGE_SIZE); }, [query]);

  const visible = filtered.slice(0, shown);
  const hasMore = filtered.length > shown;
  const isCollab = (id: string) => collabIds.includes(id);

  /** Persist a new collaborator list, then sync local state. */
  const persist = async (next: string[], id: string) => {
    setPending(id);
    try {
      await saveCollaborators(next);
      setCollabIds(next);
    } finally {
      setPending(null);
    }
  };

  const add = (id: string) => persist([...collabIds, id], id);
  const remove = (id: string) => persist(collabIds.filter((x) => x !== id), id);

  return (
    <Drawer
      open={open}
      onClose={() => setDrawer(null)}
      titleIcon={<UserPlusIcon size={18} />}
      title={t(lang, 'ADD_COLLABORATORS')}
    >
      <div className="ce-input-icon">
        <span className="ce-leading"><SearchIcon size={14} /></span>
        <input
          className="ce-input ce-input-sm"
          placeholder={t(lang, 'SEARCH_USERS')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="ce-collab-results">
        {loading && <p className="ce-empty">…</p>}
        {!loading && filtered.length === 0 && <p className="ce-empty">{t(lang, 'NO_USERS_FOUND')}</p>}
        {!loading && visible.map((p) => {
          const added = isCollab(p.id);
          const inFlight = pending === p.id;
          return (
            <div key={p.id} className={`ce-collab-card${added ? ' ce-collab-card--active' : ''}`}>
              <div className={`ce-avatar${added ? ' ce-avatar--active' : ''}`}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="ce-user-info">
                <div className="ce-user-name">{p.name}</div>
                {(p.email || p.org) && <div className="ce-user-email">{p.email ?? p.org}</div>}
              </div>
              {added ? (
                <div className="ce-collab-actions">
                  <span className="ce-collab-chip"><CheckIcon size={12} /> {t(lang, 'ADDED')}</span>
                  {canManage && (
                    <button
                      type="button"
                      className="ce-collab-pill ce-collab-pill--remove"
                      onClick={() => remove(p.id)}
                      disabled={busy || inFlight}
                    >
                      {inFlight ? <span className="ce-spinner ce-spinner--xs" /> : t(lang, 'REMOVE')}
                    </button>
                  )}
                </div>
              ) : (
                canManage && (
                  <button
                    type="button"
                    className="ce-collab-pill ce-collab-pill--add"
                    onClick={() => add(p.id)}
                    disabled={busy || inFlight}
                  >
                    {inFlight ? <span className="ce-spinner ce-spinner--xs" /> : `+ ${t(lang, 'ADD')}`}
                  </button>
                )
              )}
            </div>
          );
        })}

        {!loading && hasMore && (
          <button type="button" className="ce-collab-loadmore" onClick={() => setShown((n) => n + PAGE_SIZE)}>
            {t(lang, 'LOAD_MORE')}
          </button>
        )}
      </div>
    </Drawer>
  );
};

export default CollaboratorDrawer;
