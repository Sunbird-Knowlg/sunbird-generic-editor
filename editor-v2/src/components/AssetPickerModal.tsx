/**
 * AssetPickerModal — full-screen image asset browser for the appicon / thumbnail.
 *
 * Mirrors the old org.ekstep.assetbrowser plugin, with three tabs:
 *  - My images   → composite/v3/search filtered to the current user (createdBy).
 *  - All images  → composite/v3/search across everyone.
 *  - Upload      → a dropzone; the picked file uploads immediately and is selected.
 * Pick an existing image then "Select" to confirm; uploads resolve on their own.
 *
 * Rendered at the editor root (driven by ed.assetPicker) so the overlay covers the
 * whole screen rather than being scoped to a drawer.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorController } from '../useEditor';
import type { AssetItem } from '../types';
import { t } from '../i18n/i18n';
import { CloseIcon, SearchIcon, UploadIcon, ImageIcon, CheckIcon } from '../icons';

const MAX_ASSET_BYTES = 1 * 1024 * 1024; // 1 MB, matching the old asset browser

type Tab = 'my' | 'all' | 'upload';

const AssetPickerModal: React.FC<{ ed: EditorController }> = ({ ed }) => {
  const { lang, service, userId, context, assetPicker, closeAssetPicker } = ed;
  const open = !!assetPicker;

  const PAGE = 18; // 3 rows × 6 columns per page, then Load More
  const [tab, setTab] = useState<Tab>('my');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<AssetItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  /** Upload tab: a file staged for preview before the actual upload. */
  const [staged, setStaged] = useState<{ file: File; preview: string } | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  /** Tracks how many items we've requested so far (the next page offset). */
  const offset = useRef(0);

  const load = useCallback(
    (which: Tab, q?: string, append = false) => {
      if (which === 'upload') return;
      if (append) setLoadingMore(true);
      else { setLoading(true); offset.current = 0; }
      service
        .searchImageAssets(which === 'my' ? userId : undefined, q || undefined, append ? offset.current : 0, PAGE)
        .then((res) => {
          setItems((prev) => (append ? [...prev, ...res] : res));
          offset.current = (append ? offset.current : 0) + res.length;
          setHasMore(res.length === PAGE);
        })
        .catch(() => { if (!append) setItems([]); })
        .finally(() => { setLoading(false); setLoadingMore(false); });
    },
    [service, userId],
  );

  /** Drop the staged file and free its object URL. */
  const clearStaged = useCallback(() => {
    setStaged((s) => {
      if (s) URL.revokeObjectURL(s.preview);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setTab('my');
    setSelected(null);
    setQuery('');
    clearStaged();
    load('my');
  }, [open, load, clearStaged]);

  const pick = useCallback(
    (url: string) => {
      assetPicker?.onPick(url);
      closeAssetPicker();
    },
    [assetPicker, closeAssetPicker],
  );

  /** Stage a picked/dropped file for preview (validated, not yet uploaded). */
  const stageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        ed.showToast(t(lang, 'ERROR_FILE_TYPE'), 'error');
        return;
      }
      if (file.size > MAX_ASSET_BYTES) {
        ed.showToast(t(lang, 'ASSET_TOO_LARGE'), 'error');
        return;
      }
      setStaged((s) => {
        if (s) URL.revokeObjectURL(s.preview);
        return { file, preview: URL.createObjectURL(file) };
      });
    },
    [ed, lang],
  );

  /** Upload the staged file, then select its resulting URL. */
  const uploadStaged = useCallback(async () => {
    if (!staged) return;
    setUploading(true);
    try {
      const url = await service.uploadImageAsset(staged.file, context);
      clearStaged();
      pick(url);
    } catch {
      ed.showToast(t(lang, 'ERROR_UPLOAD'), 'error');
    } finally {
      setUploading(false);
    }
  }, [staged, service, context, clearStaged, pick, ed, lang]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) stageFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) stageFile(f);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setSelected(null);
    if (next !== 'upload') { setQuery(''); clearStaged(); load(next); }
  };

  if (!open) return null;

  return (
    <div className="ce-asset-modal-overlay" onClick={closeAssetPicker}>
      <div className="ce-asset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ce-asset-modal-head">
          <span className="ce-asset-modal-title">
            <ImageIcon size={18} /> {t(lang, 'SELECT_APP_ICON')}
          </span>
          <button type="button" className="ce-icon-btn" onClick={closeAssetPicker} aria-label={t(lang, 'CANCEL')}>
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="ce-asset-tabs">
          <button type="button" className={`ce-asset-tab${tab === 'my' ? ' is-active' : ''}`} onClick={() => switchTab('my')}>
            {t(lang, 'MY_IMAGES')}
          </button>
          <button type="button" className={`ce-asset-tab${tab === 'all' ? ' is-active' : ''}`} onClick={() => switchTab('all')}>
            {t(lang, 'ALL_IMAGES')}
          </button>
          <button type="button" className={`ce-asset-tab${tab === 'upload' ? ' is-active' : ''}`} onClick={() => switchTab('upload')}>
            {t(lang, 'UPLOAD_TAB')}
          </button>
        </div>

        {/* Search — its own row below the tabs (grid tabs only) */}
        {tab !== 'upload' && (
          <div className="ce-asset-search-row">
            <div className="ce-asset-search">
              <SearchIcon size={14} />
              <input
                className="ce-asset-search-input"
                value={query}
                placeholder={t(lang, 'SEARCH_IMAGE')}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') load(tab, query); }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="ce-asset-grid-wrap">
          {tab === 'upload' ? (
            staged ? (
              /* Staged preview — confirm with "Upload & Use" or delete to re-pick */
              <div className="ce-asset-staged">
                <div className="ce-asset-staged-thumb">
                  <img src={staged.preview} alt={staged.file.name} />
                  <button
                    type="button"
                    className="ce-asset-staged-del"
                    onClick={clearStaged}
                    disabled={uploading}
                    aria-label={t(lang, 'REMOVE_FILE')}
                    title={t(lang, 'REMOVE_FILE')}
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>
                <p className="ce-asset-staged-name">{staged.file.name}</p>
              </div>
            ) : (
              <div
                className={`ce-asset-dropzone ce-asset-dropzone--tab${dragOver ? ' ce-asset-dropzone--over' : ''}`}
                onClick={() => !uploading && fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                role="button"
                tabIndex={0}
              >
                <input ref={fileInput} type="file" hidden accept="image/png,image/jpeg,image/jpg" onChange={onPickFile} />
                <UploadIcon size={28} />
                <p className="ce-asset-drop-text">
                  {t(lang, 'ASSET_DROP')} <span className="ce-link-inline">{t(lang, 'ASSET_BROWSE')}</span>
                </p>
                <p className="ce-asset-drop-sub">{t(lang, 'ASSET_MAX_SIZE')}</p>
              </div>
            )
          ) : loading ? (
            <div className="ce-center"><div className="ce-spinner ce-spinner--sm" /></div>
          ) : items.length === 0 ? (
            <p className="ce-asset-empty">{t(lang, 'NO_IMAGES')}</p>
          ) : (
            <>
              <div className="ce-asset-grid">
                {items.map((it) => (
                  <button
                    type="button"
                    key={it.identifier}
                    className={`ce-asset-cell${selected?.identifier === it.identifier ? ' is-selected' : ''}`}
                    onClick={() => setSelected(it)}
                    onDoubleClick={() => pick(it.src)}
                    title={it.name}
                  >
                    <img src={it.thumbnail || it.src} alt={it.name} loading="lazy" />
                    {selected?.identifier === it.identifier && (
                      <span className="ce-asset-check"><CheckIcon size={14} /></span>
                    )}
                  </button>
                ))}
              </div>
              {hasMore && (
                <button
                  type="button"
                  className="ce-asset-load-more"
                  disabled={loadingMore}
                  onClick={() => load(tab, query, true)}
                >
                  {loadingMore ? <span className="ce-spinner ce-spinner--xs" /> : t(lang, 'LOAD_MORE')}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer — Select for grid tabs, Upload & Use for the upload tab. */}
        <div className="ce-asset-modal-foot">
          <button type="button" className="ce-btn ce-btn--ghost" onClick={closeAssetPicker}>
            {t(lang, 'CANCEL')}
          </button>
          {tab === 'upload' ? (
            <button
              type="button"
              className="ce-btn ce-btn--primary"
              disabled={!staged || uploading}
              onClick={uploadStaged}
            >
              {uploading
                ? <><span className="ce-spinner ce-spinner--xs" /> {t(lang, 'UPLOADING')}</>
                : <><UploadIcon size={13} /> {t(lang, 'UPLOAD_AND_USE')}</>}
            </button>
          ) : (
            <button
              type="button"
              className="ce-btn ce-btn--primary"
              disabled={!selected}
              onClick={() => { if (selected) pick(selected.src); }}
            >
              <CheckIcon size={13} /> {t(lang, 'SELECT')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetPickerModal;
