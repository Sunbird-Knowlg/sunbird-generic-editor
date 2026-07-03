/* ---- Components ---- */
export { default as ContentEditor } from './ContentEditor';
export type { ContentEditorProps } from './ContentEditor';

/* ---- Controller (advanced hosts) ---- */
export { useEditor } from './useEditor';
export type { UseEditorOptions, EditorController, ToastState } from './useEditor';

/* ---- Types ---- */
export type {
  EditorContext, EditorConfig, ContentData, EditorMode, EditorView, DrawerKind,
  UploadProgress, EditorEventPayload, FrameworkCategory, FrameworkTerm,
} from './types';

/* ---- Services ---- */
export { ContentEditorService, normalizeContent } from './services/ContentEditorService';
export type { EndpointMap } from './services/ContentEditorService';
export { UploadService, detectFileMime, detectUrlMime } from './services/UploadService';

/* ---- Telemetry ---- */
export { TelemetryService } from './telemetry/TelemetryService';
export type { TelemetryEvent } from './telemetry/telemetry.types';

/* ---- i18n ---- */
export { t, tf, getDir, getMimeTypeLabel, getCategoryLabel } from './i18n/i18n';

/* ---- Constants ---- */
export {
  DEFAULT_PRIMARY_CATEGORIES, DEFAULT_MAX_FILE_SIZE_MB, EDITOR_EVENTS, STATUS,
} from './constants';

/* ------------------------------------------------------------------ */
/* Vanilla JS / UMD helper — mount the editor without React knowledge   */
/* ------------------------------------------------------------------ */
import React from 'react';
import { createRoot } from 'react-dom/client';
import ContentEditorComponent from './ContentEditor';
import type { ContentEditorProps } from './ContentEditor';

/**
 * Mount the editor into a DOM element.
 *
 *   const handle = SunbirdGenericEditor.mount({
 *     container: document.getElementById('editor'),
 *     context: { uid, sid, did, channel, pdata, user, framework },
 *     contentId: 'do_123',
 *     onClose: () => history.back(),
 *   });
 *   // later: handle.destroy();
 */
export function mount(options: ContentEditorProps & { container: HTMLElement }): { destroy(): void } {
  const { container, ...props } = options;
  const root = createRoot(container);
  root.render(React.createElement(ContentEditorComponent, props));
  return { destroy: () => root.unmount() };
}
