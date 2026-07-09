import React, { useMemo, useState } from 'react';
import Drawer from './Drawer';
import type { EditorController } from '../useEditor';
import { t } from '../i18n/i18n';
import { SendIcon, CheckIcon } from '../icons';

const REJECT_REASONS = ['Incorrect content', 'Low quality', 'Incomplete metadata', 'Copyright concern'];

const ReviewDrawer: React.FC<{ ed: EditorController }> = ({ ed }) => {
  const { lang, drawer, setDrawer, mode, validateForReview, sendForReview, requestChanges, busy, busyAction } = ed;
  const open = drawer === 'review';
  const isReviewer = mode === 'review';
  const rejecting = busyAction === 'reject';
  const submitting = busyAction === 'save-submit';

  const errors = useMemo(() => (open && !isReviewer ? validateForReview() : []), [open, isReviewer, validateForReview]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const toggleReason = (r: string) =>
    setReasons((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));

  if (isReviewer) {
    return (
      <Drawer
        open={open}
        onClose={() => setDrawer(null)}
        titleIcon={<SendIcon size={18} />}
        title={t(lang, 'REQUEST_CHANGES')}
        closeLabel={t(lang, 'CLOSE')}
        footer={
          <>
            <button type="button" className="ce-btn ce-btn--ghost" onClick={() => setDrawer(null)}>
              {t(lang, 'CANCEL')}
            </button>
            <button
              type="button"
              className="ce-btn ce-btn--danger"
              onClick={() => requestChanges(reasons, comment)}
              disabled={busy || (reasons.length === 0 && !comment.trim())}
            >
              {rejecting ? <><span className="ce-spinner ce-spinner--xs" /> {t(lang, 'SAVING')}</> : t(lang, 'REQUEST_CHANGES')}
            </button>
          </>
        }
      >
        <label className="ce-label-sm">{t(lang, 'REJECT_REASONS')}</label>
        <div className="ce-chips" style={{ justifyContent: 'flex-start', marginBottom: 16 }}>
          {REJECT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              className="ce-chip"
              data-active={reasons.includes(r)}
              style={reasons.includes(r) ? { borderColor: 'var(--ce-primary)', color: 'var(--ce-primary)' } : undefined}
              onClick={() => toggleReason(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <label className="ce-label-sm">{t(lang, 'ADD_COMMENT')}</label>
        <textarea
          className="ce-textarea ce-textarea-sm"
          placeholder={t(lang, 'COMMENT_PLACEHOLDER')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Drawer>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={() => setDrawer(null)}
      titleIcon={<SendIcon size={18} />}
      title={t(lang, 'REVIEW_TITLE')}
      closeLabel={t(lang, 'CLOSE')}
      footer={
        <>
          <button type="button" className="ce-btn ce-btn--ghost" onClick={() => setDrawer(null)}>
            {t(lang, 'CANCEL')}
          </button>
          <button
            type="button"
            className="ce-btn ce-btn--primary"
            onClick={sendForReview}
            disabled={busy || errors.length > 0}
          >
            {submitting
              ? <><span className="ce-spinner ce-spinner--xs" /> {t(lang, 'SAVING')}</>
              : <><CheckIcon size={13} /> {t(lang, 'SUBMIT')}</>}
          </button>
        </>
      }
    >
      {errors.length > 0 ? (
        <div className="ce-validation">
          <p className="ce-validation-title">{t(lang, 'REVIEW_VALIDATION')}</p>
          <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      ) : (
        <div className="ce-callout">{t(lang, 'REVIEW_CONFIRM')}</div>
      )}
    </Drawer>
  );
};

export default ReviewDrawer;
