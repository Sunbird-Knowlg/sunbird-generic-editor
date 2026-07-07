import React, { useRef } from 'react';
import type { EditorController } from '../useEditor';
import type { ContentData, EditorContext } from '../types';
import { getMimeTypeLabel, t } from '../i18n/i18n';
import { FileIcon } from '../icons';

/**
 * Preview via the legacy ekstep content renderer — the same mechanism the old
 * generic editor used (org.ekstep.genericeditorpreview). One renderer handles all
 * mimeTypes (video/pdf/epub/ecml/html/scorm/h5p/youtube/url) through its coreplugins.
 *
 * Loads `content/preview/preview.html?webview=true` in an iframe (same-origin via the
 * host proxy), then calls its global `initializePreview()` with the content id +
 * metadata. No player-v2 dependency, no client-side unzip.
 */
const RendererPreview: React.FC<{
  content: ContentData; context: EditorContext; previewUrl: string; previewConfig: Record<string, unknown>;
}> = ({ content, context, previewUrl, previewConfig }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const src = `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}webview=true`;

  const onLoad = () => {
    const win = iframeRef.current?.contentWindow as
      | (Window & { initializePreview?: (cfg: unknown) => void })
      | null;
    if (!win || typeof win.initializePreview !== 'function') return;
    win.initializePreview({
      context: {
        mode: 'edit',
        contentId: content.identifier,
        sid: context.sid,
        uid: context.uid,
        channel: context.channel,
        pdata: context.pdata,
        app: [],
        dims: [],
        partner: [],
      },
      config: previewConfig,
      metadata: content,
      data: {},
    });
  };

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={content.name}
      onLoad={onLoad}
      style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
      allow="autoplay; fullscreen; encrypted-media"
    />
  );
};

const EditorPreview: React.FC<{ ed: EditorController; context: EditorContext }> = ({ ed, context }) => {
  const { content, lang, previewUrl, previewConfig } = ed;
  if (!content) return null;

  return (
    <div className="ce-preview-card">
      <div className="ce-preview-bar">
        <div className="ce-icon-sq"><FileIcon size={12} /></div>
        <span className="ce-preview-name">{content.name}</span>
        <span className="ce-preview-type">{getMimeTypeLabel(lang, content.mimeType)}</span>
        <span className="ce-preview-chip">{t(lang, 'PREVIEW_MODE')}</span>
      </div>
      <div className="ce-preview-frame">
        <RendererPreview
          key={`${content.identifier}-${content.artifactUrl ?? ''}`}
          content={content}
          context={context}
          previewUrl={previewUrl}
          previewConfig={previewConfig}
        />
      </div>
    </div>
  );
};

export default EditorPreview;
