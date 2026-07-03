import React, { useRef, useState } from 'react';
import type { EditorController } from '../useEditor';
import { t, tf, getCategoryLabel } from '../i18n/i18n';
import { ACCEPTED_EXTENSIONS, LARGE_UPLOAD_EXTENSIONS } from '../constants';
import {
  UploadIcon, LinkIcon, CloseIcon, BookIcon, BookClosedIcon, VideoIcon, FileIcon, HelpIcon, AwardIcon, ClipboardIcon,
} from '../icons';

const H5P_GUIDELINES_URL = 'https://community.sunbird.org/t/h5p-content-type-guidelines/';

/** Icon per primaryCategory (best-effort by name; falls back to a file icon). */
function categoryIcon(name: string) {
  const k = name.toLowerCase();
  if (k.includes('etext') || k.includes('textbook')) return <BookClosedIcon size={20} />;
  if (k.includes('explanation')) return <BookIcon size={20} />;
  if (k.includes('learning')) return <VideoIcon size={20} />;
  if (k.includes('practice')) return <HelpIcon size={20} />;
  if (k.includes('teacher')) return <ClipboardIcon size={20} />;
  if (k.includes('exam')) return <AwardIcon size={20} />;
  return <FileIcon size={20} />;
}

/** Distinct accent colour per primaryCategory (design uses varied icon colours). */
function categoryColor(name: string): string {
  const k = name.toLowerCase();
  if (k.includes('etext') || k.includes('textbook')) return '#e8833a'; // orange
  if (k.includes('explanation')) return '#0ea5a4';                     // teal
  if (k.includes('learning')) return '#8b5cf6';                        // purple
  if (k.includes('practice')) return '#ec4899';                        // pink
  if (k.includes('teacher')) return '#16a34a';                         // green
  if (k.includes('exam')) return '#f59e0b';                            // amber
  return '#6366f1';                                                    // indigo (fallback)
}

type Mode = 'file' | 'link';

const UploadCanvas: React.FC<{ ed: EditorController }> = ({ ed }) => {
  const {
    lang, categories, contentType, setContentType,
    uploadUrl, setUploadUrl, urlError, setUrlError, uploadFile, uploadFromUrl, cancelUpload,
    maxMB, view, progress, largeUpload, close, showToast,
  } = ed;

  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('file');
  const fileInput = useRef<HTMLInputElement | null>(null);

  const isUploading = view === 'uploading';
  const hasType = !!contentType;
  const percent = progress?.percent ?? 5;
  const acceptExts = largeUpload ? LARGE_UPLOAD_EXTENSIONS : ACCEPTED_EXTENSIONS;
  const maxLabel = maxMB >= 1024 && maxMB % 1024 === 0 ? `${maxMB / 1024} GB` : `${maxMB} MB`;
  const formatChips = largeUpload
    ? ['MP4', 'WebM', 'zip']
    : ['PDF', 'MP4', 'WebM', 'ePub', 'YouTube', 'H5P', 'HTML zip'];

  /** Validate then auto-upload immediately (files skip the manual Upload step). */
  const stageFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!(acceptExts as readonly string[]).includes(ext)) {
      showToast(t(lang, 'ERROR_FILE_TYPE'), 'error');
      return;
    }
    if (f.size > maxMB * 1024 * 1024) {
      showToast(tf(lang, 'ERROR_FILE_SIZE', { n: maxMB }), 'error');
      return;
    }
    setUploadUrl('');
    setPendingFile(f); // kept only so the uploading view can show the file name
    uploadFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!hasType || mode !== 'file') return;
    const f = e.dataTransfer.files?.[0];
    if (f) stageFile(f);
  };
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) stageFile(f);
    e.target.value = '';
  };

  const trimmedUrl = uploadUrl.trim();
  const showUrlError = mode === 'link' && !!urlError;

  const handleUpload = () => {
    if (mode === 'file' && pendingFile) uploadFile(pendingFile);
    else if (mode === 'link' && trimmedUrl) uploadFromUrl(trimmedUrl);
  };

  const canUpload = hasType && ((mode === 'file' && !!pendingFile) || (mode === 'link' && !!trimmedUrl));

  /* Circular progress geometry (r=32 → circumference ≈ 201). */
  const RING = 201;
  const ringOffset = RING * (1 - percent / 100);

  return (
    <div className="ce-card ce-upload-card">
      <div className="ce-upload-head">
        <span className="ce-upload-head-ic"><UploadIcon size={17} /></span>
        <span className="ce-upload-head-title">{t(lang, 'UPLOAD_BANNER_TITLE')}</span>
        <button type="button" className="ce-icon-btn ce-upload-head-close" onClick={close} aria-label={t(lang, 'CLOSE_EDITOR')} title={t(lang, 'CLOSE_EDITOR')}>
          <CloseIcon size={14} />
        </button>
      </div>
      <div className="ce-card-body">
        {/* Type cards */}
        <div className="ce-upload-q">{t(lang, 'WHAT_UPLOADING')} <span className="ce-required-star">*</span></div>
        <div className="ce-type-grid">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`ce-type-card${contentType === c ? ' is-selected' : ''}`}
              disabled={isUploading}
              onClick={() => setContentType(c)}
            >
              <span className="ce-type-ic" style={{ color: categoryColor(c), background: `${categoryColor(c)}1f` }}>{categoryIcon(c)}</span>
              <span className="ce-type-label">{getCategoryLabel(lang, c)}</span>
            </button>
          ))}
        </div>

        {/* Area — source tabs live in its header once a type is picked */}
        <div
          className={`ce-area${!hasType ? ' ce-area--idle' : ''}${hasType && !isUploading && !largeUpload ? ' has-head' : ''}${dragging ? ' ce-area--drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); if (hasType && mode === 'file' && !isUploading) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {hasType && !isUploading && !largeUpload && (
            <div className="ce-area-head">
              <div className="ce-source-tabs">
                <button
                  type="button"
                  className={`ce-source-tab${mode === 'file' ? ' is-active' : ''}`}
                  onClick={() => { setMode('file'); setUploadUrl(''); setUrlError(null); }}
                >
                  {t(lang, 'UPLOAD_FILE_TAB')}
                </button>
                {!largeUpload && (
                  <button
                    type="button"
                    className={`ce-source-tab${mode === 'link' ? ' is-active' : ''}`}
                    onClick={() => { setMode('link'); setPendingFile(null); setUrlError(null); }}
                  >
                    {t(lang, 'ADD_LINK_TAB')}
                  </button>
                )}
              </div>
            </div>
          )}

          {isUploading ? (
            <div className="ce-uploading-ring-wrap">
              <div className="ce-ring">
                <svg width="76" height="76" viewBox="0 0 76 76" className="ce-ring-svg">
                  <circle cx="38" cy="38" r="32" className="ce-ring-track" />
                  <circle cx="38" cy="38" r="32" className="ce-ring-fill"
                    strokeDasharray={RING} strokeDashoffset={ringOffset} />
                </svg>
                <div className="ce-ring-pct">{percent}%</div>
              </div>
              <div className="ce-uploading-name">
                {percent >= 100 ? t(lang, 'PROCESSING') : tf(lang, 'UPLOADING_FILE', { name: pendingFile?.name ?? '' })}
              </div>
              <button type="button" className="ce-link-btn" onClick={cancelUpload}>
                {t(lang, 'CANCEL_UPLOAD')}
              </button>
            </div>
          ) : !hasType ? (
            <div className="ce-area-hint">
              <UploadIcon size={28} />
              <div>{t(lang, 'PICK_TYPE_HINT')}</div>
            </div>
          ) : (
            <div className="ce-area-body">
              {mode === 'link' ? (
                <div className="ce-link-prompt">
                  <label className="ce-field-label">{t(lang, 'PASTE_LINK')}</label>
                  <div className="ce-link-row">
                    <div className={`ce-input-icon${showUrlError ? ' has-error' : ''}`}>
                      <span className="ce-leading"><LinkIcon size={14} /></span>
                      <input
                        type="url"
                        className="ce-input"
                        placeholder={t(lang, 'URL_PLACEHOLDER')}
                        value={uploadUrl}
                        onChange={(e) => { setUploadUrl(e.target.value); if (urlError) setUrlError(null); }}
                      />
                    </div>
                    <button
                      type="button"
                      className="ce-btn ce-btn--primary ce-inline-upload"
                      onClick={handleUpload}
                      disabled={!canUpload || isUploading}
                    >
                      <UploadIcon size={14} /> {t(lang, 'UPLOAD_FILE')}
                    </button>
                  </div>
                  {showUrlError && <div className="ce-link-error">{urlError}</div>}
                </div>
              ) : (
                <div
                  className="ce-drop"
                  onClick={() => fileInput.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={fileInput}
                    type="file"
                    hidden
                    accept={acceptExts.map((e) => `.${e}`).join(',')}
                    onChange={onPick}
                  />
                  <span className="ce-drop-ic"><UploadIcon size={20} /></span>
                  <div className="ce-drop-title">{dragging ? t(lang, 'DROP_ACTIVE') : t(lang, 'DRAG_DROP_TITLE')}</div>
                  <div className="ce-drop-sub">{t(lang, 'UPLOAD_DROP_SUB')}</div>
                  <span className="ce-btn ce-btn--primary ce-drop-browse">{t(lang, 'BROWSE_FILES')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conditions — a compact bar + format chips (not a note list) */}
        <div className="ce-conditions">
          <div className="ce-cond-bar">
            <span className="ce-cond-max"><UploadIcon size={14} /> {tf(lang, 'SIZE_MAX', { n: maxLabel })}</span>
            <span className="ce-cond-sep" />
            <span className="ce-cond-note">{largeUpload ? t(lang, 'LARGE_SCORM_NOTE') : t(lang, 'NOTE_H5P')}</span>
            {!largeUpload && (
              <a className="ce-cond-link" href={H5P_GUIDELINES_URL} target="_blank" rel="noopener noreferrer">
                {t(lang, 'H5P_GUIDE')} →
              </a>
            )}
          </div>
          <div className="ce-formats">
            <span className="ce-formats-label">{t(lang, 'FORMATS_LABEL')}</span>
            {formatChips.map((f) => <span key={f} className="ce-format-chip">{f}</span>)}
          </div>
          <p className="ce-cc-note">{t(lang, 'CC_CONFIRM')}</p>
        </div>
      </div>
    </div>
  );
};

export default UploadCanvas;
