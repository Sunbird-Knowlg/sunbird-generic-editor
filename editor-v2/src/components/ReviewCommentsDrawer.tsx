import React, { useEffect, useState } from 'react';
import Drawer from './Drawer';
import type { EditorController } from '../useEditor';
import { t } from '../i18n/i18n';
import { CommentIcon } from '../icons';

interface ChecklistCategory {
  name: string;
  checkList: string[];
}

/**
 * ReviewCommentsDrawer — read-only drawer that shows the reviewer's rejection
 * reasons and comment. Mirrors the legacy editor's "Reviewer Suggestions" popup.
 *
 * Data flow:
 * - `content.rejectReasons` / `content.rejectComment` come from the content /read API
 * - The checklist structure (category columns) comes from `data/v1/form/read`
 *   with `action: 'requestforchanges'`
 */
const ReviewCommentsDrawer: React.FC<{ ed: EditorController }> = ({ ed }) => {
  const { lang, drawer, setDrawer, content, service, context } = ed;
  const open = drawer === 'reviewComments';

  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [otherReason, setOtherReason] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const rejectReasons = content?.rejectReasons ?? [];
  const rejectComment = content?.rejectComment ?? '';

  // Fetch the checklist structure when the drawer opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    service
      .readRejectChecklist({
        subType: content?.primaryCategory ?? content?.contentType ?? 'resource',
        framework: content?.framework ?? context.framework,
        rootOrgId: context.user?.rootOrgId ?? context.channel,
      })
      .then((result) => {
        setCategories(result.categories);
        setOtherReason(result.otherReason);
      })
      .finally(() => setLoading(false));
  }, [open, service, content, context]);

  return (
    <Drawer
      open={open}
      onClose={() => setDrawer(null)}
      titleIcon={<CommentIcon size={18} />}
      title={t(lang, 'REVIEWER_SUGGESTIONS')}
    >
      {loading ? (
        <div className="ce-center" style={{ padding: 40 }}>
          <div className="ce-spinner ce-spinner--sm" />
        </div>
      ) : (
        <div className="ce-checklist-content">
          {/* Category columns */}
          {categories.length > 0 && (
            <div className="ce-checklist-grid">
              {categories.map((cat) => (
                <div key={cat.name} className="ce-checklist-col">
                  <h4 className="ce-checklist-heading">{cat.name}</h4>
                  {cat.checkList.map((item) => (
                    <label key={item} className="ce-checklist-item">
                      <input
                        type="checkbox"
                        checked={rejectReasons.includes(item)}
                        disabled
                        readOnly
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* "Other Issue(s)" checkbox */}
          {otherReason && (
            <label className="ce-checklist-other">
              <input
                type="checkbox"
                checked={rejectReasons.includes('Others')}
                disabled
                readOnly
              />
              <span>{otherReason}</span>
            </label>
          )}

          {/* Comment */}
          <div className="ce-checklist-comment-section">
            <h4 className="ce-checklist-heading">{t(lang, 'COMMENTS_LABEL')}</h4>
            <textarea
              className="ce-textarea ce-textarea-sm"
              value={rejectComment}
              disabled
              readOnly
              rows={3}
            />
          </div>

          {/* Fallback when no checklist categories loaded but there are reasons */}
          {categories.length === 0 && rejectReasons.length > 0 && (
            <div className="ce-checklist-fallback">
              <h4 className="ce-checklist-heading">{t(lang, 'REJECT_REASONS')}</h4>
              {rejectReasons.map((reason) => (
                <label key={reason} className="ce-checklist-item">
                  <input type="checkbox" checked disabled readOnly />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default ReviewCommentsDrawer;
