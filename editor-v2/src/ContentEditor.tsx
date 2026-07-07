/**
 * ContentEditor — the editor root component.
 *
 *   import { ContentEditor } from '@project-sunbird/generic-editor-v2';
 *   import '@project-sunbird/generic-editor-v2/dist/sunbird-generic-editor.css';
 *
 *   <ContentEditor
 *     context={{ uid, sid, did, channel, pdata, user, framework }}
 *     contentId="do_123"            // omit for a brand-new upload
 *     language="en"
 *     onClose={() => navigate('/workspace')}
 *     onTelemetryEvent={(e) => post(e)}
 *   />
 */
import React from 'react';
import './editor.css';
import { useEditor, type UseEditorOptions } from './useEditor';
import { getDir } from './i18n/i18n';
import Header from './components/Header';
import UploadCanvas from './components/UploadCanvas';
import EditorPreview from './components/EditorPreview';
import MetadataDrawer from './components/MetadataDrawer';
import CollaboratorDrawer from './components/CollaboratorDrawer';
import ReviewDrawer from './components/ReviewDrawer';
import ReviewCommentsDrawer from './components/ReviewCommentsDrawer';
import AssetPickerModal from './components/AssetPickerModal';
import Toast from './components/Toast';
import { t } from './i18n/i18n';
import { CheckIcon } from './icons';

export type ContentEditorProps = UseEditorOptions;

const ContentEditor: React.FC<ContentEditorProps> = (props) => {
  const ed = useEditor(props);
  const dir = getDir(ed.lang);

  return (
    <div className="ce-editor" dir={dir} data-view={ed.view}>
      <Header ed={ed} />

      <main className="ce-main">
        {ed.view === 'loading' && (
          <div className="ce-center">
            <div className="ce-spinner" />
          </div>
        )}
        {(ed.view === 'upload' || ed.view === 'uploading') && (
          <div className="ce-upload-overlay"><UploadCanvas ed={ed} /></div>
        )}
        {ed.view === 'player' && <EditorPreview ed={ed} context={props.context} />}
      </main>

      <div className="ce-backdrop" data-open={ed.drawer !== null} onClick={() => ed.setDrawer(null)} />

      <MetadataDrawer ed={ed} />
      <CollaboratorDrawer ed={ed} />
      <ReviewDrawer ed={ed} />
      <ReviewCommentsDrawer ed={ed} />
      <AssetPickerModal ed={ed} />

      <Toast toast={ed.toast} />

      {/* Inactivity / session timeout prompt */}
      {ed.sessionExpired && (
        <div className="ce-session-overlay">
          <div className="ce-session-card">
            <p className="ce-session-title">{t(ed.lang, 'SESSION_TITLE')}</p>
            <p className="ce-session-msg">{t(ed.lang, 'SESSION_MSG')}</p>
            <div className="ce-session-actions">
              <button type="button" className="ce-btn ce-btn--ghost" onClick={ed.close}>
                {t(ed.lang, 'CLOSE_EDITOR')}
              </button>
              <button type="button" className="ce-btn ce-btn--primary" onClick={ed.dismissSessionExpiry}>
                {t(ed.lang, 'CONTINUE_EDITING')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload success overlay */}
      {ed.uploadSuccess && (
        <div className="ce-upload-success-overlay">
          <div className="ce-upload-success-card">
            <div className="ce-upload-success-icon"><CheckIcon size={28} /></div>
            <p className="ce-upload-success-title">Content uploaded successfully!</p>
            <p className="ce-upload-success-sub">Your content is ready to preview and configure.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentEditor;
