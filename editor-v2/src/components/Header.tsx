import React from 'react';
import type { EditorController } from '../useEditor';
import { t } from '../i18n/i18n';
import {
  ImageIcon, PencilIcon, SaveIcon, CloseIcon, SendIcon, UserPlusIcon, CheckIcon, CommentIcon,
} from '../icons';
import { STATUS } from '../constants';

const Header: React.FC<{ ed: EditorController }> = ({ ed }) => {
  const { content, lang, mode, setDrawer, saveDraft, close, busy, busyAction, setReviewErrors, setReviewSubmitMode, headerLogo, hasReviewComments } = ed;
  const savingDraft = busyAction === 'save-draft';
  const hasContent = !!content?.identifier && ed.view === 'player';
  const isDraft = (content?.status ?? STATUS.DRAFT) === STATUS.DRAFT;
  const title = content?.name || t(lang, 'UNTITLED');
  const canEdit = mode === 'edit';
  const isReviewer = mode === 'review';

  return (
    <header className="ce-header">
      <div className="ce-logo">
        <div className={`ce-logo-mark${content?.appIcon || headerLogo ? '' : ' ce-logo-mark--placeholder'}`}>
          {content?.appIcon
            ? <img src={content.appIcon} alt="" className="ce-logo-img" />
            : headerLogo
              ? <img src={headerLogo} alt="" className="ce-logo-img" />
              : <ImageIcon size={18} />}
        </div>
      </div>

      <div className="ce-divider" />

      <button
        type="button"
        className="ce-title-zone"
        onClick={() => {
          if (!hasContent) return;
          // Edit Content Details always uses the save form — reset any review-submit mode.
          setReviewErrors([]);
          setReviewSubmitMode(false);
          setDrawer('metadata');
        }}
        disabled={!hasContent}
      >
        <span className="ce-title-text">{title}</span>
        {hasContent && canEdit && <span className="ce-title-pencil"><PencilIcon size={12} /></span>}
      </button>

      <div className="ce-spacer" />

      <div className="ce-actions">
        {canEdit && (
          <button
            type="button"
            className="ce-icon-btn"
            onClick={() => setDrawer('collaborator')}
            disabled={busy || !hasContent}
            data-tooltip={t(lang, 'ADD_COLLABORATORS')}
            aria-label={t(lang, 'ADD_COLLABORATORS')}
          >
            <UserPlusIcon size={16} />
          </button>
        )}

        {canEdit && !isReviewer && hasReviewComments && (
          <button
            type="button"
            className="ce-icon-btn"
            onClick={() => setDrawer('reviewComments')}
            disabled={busy}
            data-tooltip={t(lang, 'REVIEW_COMMENTS')}
            aria-label={t(lang, 'REVIEW_COMMENTS')}
          >
            <CommentIcon size={16} />
          </button>
        )}

        {canEdit && !isReviewer && (
          <button
            type="button"
            className="ce-icon-btn"
            onClick={saveDraft}
            disabled={busy || !hasContent}
            data-tooltip={t(lang, 'SAVE')}
            aria-label={t(lang, 'SAVE')}
          >
            {savingDraft ? <span className="ce-spinner ce-spinner--xs" /> : <SaveIcon size={16} />}
          </button>
        )}
        
        <div className="ce-divider" />

        {isReviewer ? (
          <>
            <button type="button" className="ce-btn" onClick={() => setDrawer('review')} disabled={busy}>
              {t(lang, 'REQUEST_CHANGES')}
            </button>
            <button type="button" className="ce-btn ce-btn--primary" onClick={ed.publish} disabled={busy}>
              {busyAction === 'publish'
                ? <><span className="ce-spinner ce-spinner--xs" /> {t(lang, 'PUBLISH')}</>
                : <><CheckIcon size={13} /> {t(lang, 'PUBLISH')}</>}
            </button>
          </>
        ) : (
          canEdit && (
            <button
              type="button"
              className="ce-btn ce-btn--primary"
              onClick={() => {
                // Always open Edit Content Details pre-filled; user reviews/updates, then submits.
                setReviewErrors([]);
                setReviewSubmitMode(true);
                setDrawer('metadata');
              }}
              disabled={busy || !hasContent}
            >
              <SendIcon size={13} /> {t(lang, 'SEND_FOR_REVIEW')}
            </button>
          )
        )}

        <button type="button" className="ce-btn ce-btn--ghost" onClick={close}>
          <CloseIcon size={13} /> {t(lang, 'CLOSE')}
        </button>
      </div>
    </header>
  );
};

export default Header;
