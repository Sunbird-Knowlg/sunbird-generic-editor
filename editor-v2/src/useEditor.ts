/**
 * useEditor — the editor controller. Owns content + view state and orchestrates
 * the services (content CRUD, upload, telemetry). UI components are thin and call
 * these actions.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ContentData, DrawerKind, EditorConfig, EditorContext, EditorEventPayload,
  EditorMode, EditorView, UploadProgress,
} from './types';
import { ContentEditorService } from './services/ContentEditorService';
import { UploadService, detectFileMime, detectUrlMime } from './services/UploadService';
import { TelemetryService } from './telemetry/TelemetryService';
import type { TelemetryEvent } from './telemetry/telemetry.types';
import { t, tf } from './i18n/i18n';
import {
  DEFAULT_MAX_FILE_SIZE_MB, DEFAULT_PRIMARY_CATEGORIES, EDITOR_EVENTS,
  IDLE_TIMEOUT_MS, LARGE_UPLOAD_EXTENSIONS, LARGE_UPLOAD_MAX_MB, STATUS,
} from './constants';

export interface UseEditorOptions {
  context: EditorContext;
  config?: EditorConfig;
  contentId?: string;
  language?: string;
  service?: ContentEditorService;
  onEvent?: (e: EditorEventPayload) => void;
  onTelemetryEvent?: (e: TelemetryEvent) => void;
  onClose?: () => void;
  /** Host-provided asset uploader for the thumbnail/appIcon. Returns the asset URL. */
  onUploadAsset?: (file: File) => Promise<string>;
}

export interface ToastState {
  msg: string;
  kind: 'success' | 'error';
}

const REVIEWER_ROLES = ['CONTENT_REVIEWER', 'BOOK_REVIEWER'];

function resolveMode(status: string | undefined, roles: string[] = []): EditorMode {
  const s = (status || STATUS.DRAFT).toLowerCase();
  const isReviewer = roles.some((r) => REVIEWER_ROLES.includes(r));
  if (['processing', 'flagged', 'flagdraft', 'flagreview'].includes(s)) return 'read';
  if (s === 'review') return isReviewer ? 'review' : 'read';
  return 'edit';
}

export function useEditor(opts: UseEditorOptions) {
  const { context, config, contentId: initialId, onEvent, onTelemetryEvent, onClose } = opts;
  const lang = opts.language ?? config?.language ?? 'en';
  const largeUpload = !!config?.largeUpload;
  const headerLogo = config?.headerLogo;
  const previewUrl = config?.previewUrl ?? '/content/preview/preview.html';
  const previewConfig = config?.previewConfig ?? { showEndpage: true };
  // Portal can override either cap via config.maxFileSizeMB; otherwise mode-specific defaults apply.
  const maxMB = config?.maxFileSizeMB ?? (largeUpload ? LARGE_UPLOAD_MAX_MB : DEFAULT_MAX_FILE_SIZE_MB);

  const service = useMemo(
    () => opts.service ?? new ContentEditorService(config, undefined, context),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const uploader = useMemo(() => new UploadService(service, config), [service, config]);
  const telemetry = useRef<TelemetryService | null>(null);
  if (!telemetry.current) {
    telemetry.current = new TelemetryService(
      context,
      (e) => onTelemetryEvent?.(e),
      config?.telemetry?.url ? () => Promise.resolve() : null,
    );
  }

  const [content, setContent] = useState<ContentData | null>(null);
  const [view, setView] = useState<EditorView>(initialId ? 'loading' : 'upload');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  /** When set, the full-screen image picker is open; onPick receives the chosen URL. */
  const [assetPicker, setAssetPicker] = useState<{ onPick: (url: string) => void } | null>(null);
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  /** Content-type options fetched from the save form (data/v1/form/read). */
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
  const categories = useMemo(
    () =>
      fetchedCategories.length
        ? fetchedCategories
        : config?.primaryCategories?.length
          ? config.primaryCategories
          : [...DEFAULT_PRIMARY_CATEGORIES],
    [fetchedCategories, config],
  );
  /* Empty = the "Select one" placeholder; user must pick before uploading. */
  const [contentType, setContentType] = useState<string>('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Which async action is in flight (drives per-control "saving…" spinners). */
  const [busyAction, setBusyAction] = useState<string | null>(null);
  /** Set when the user cancels an in-flight upload so a late finish can't flip to player. */
  const cancelledRef = useRef(false);
  const [reviewErrors, setReviewErrors] = useState<string[]>([]);
  /** When true, the metadata drawer is in "edit-then-submit-for-review" flow. */
  const [reviewSubmitMode, setReviewSubmitMode] = useState(false);
  const lockedRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mode: EditorMode = resolveMode(content?.status, context.user?.roles);

  const emit = useCallback(
    (eid: string, edata?: Record<string, unknown>) => onEvent?.({ eid, edata, ts: Date.now() }),
    [onEvent],
  );

  /** Open/close a drawer; emits an INTERACT on open (drawer-view instrumentation). */
  const openDrawer = useCallback((kind: DrawerKind) => {
    if (kind) telemetry.current?.interact('click', `${kind}Drawer`, 'open');
    setDrawer(kind);
  }, []);

  const showToast = useCallback((msg: string, kind: 'success' | 'error' = 'success') => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  /* ---- Initial load ---- */
  useEffect(() => {
    telemetry.current?.start('content-editor');
    telemetry.current?.impression('content-editor');
    emit(EDITOR_EVENTS.READY);
    if (!initialId) return;
    setBusy(true);
    service
      .readContent(initialId)
      .then((c) => {
        telemetry.current?.setObject(c.identifier);
        setContent(c);
        setView(c.artifactUrl ? 'player' : 'upload');
        // Lock the content when opened for editing (creator on a draft), mirroring the old editor.
        if (resolveMode(c.status, context.user?.roles) === 'edit' && !lockedRef.current) {
          service.createLock(c.identifier, context, c)
            .then(() => { lockedRef.current = true; })
            .catch(() => { /* non-fatal: proceed without lock */ });
        }
      })
      .catch((err) => {
        telemetry.current?.error(String((err as Error)?.message ?? err), 'load');
        showToast(t(lang, 'ERROR_LOAD'), 'error');
      })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Content-type options from the save form (dynamic, like the old editor) ---- */
  useEffect(() => {
    service
      .readPrimaryCategories({
        framework: context.framework,
        rootOrgId: context.user?.rootOrgId ?? context.channel,
      })
      .then((cats) => { if (cats.length) setFetchedCategories(cats); })
      .catch(() => { /* fall back to config/defaults */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Drop a stale selection if the options change; keep "Select one" as default. */
  useEffect(() => {
    if (contentType && categories.length && !categories.includes(contentType)) setContentType('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const reload = useCallback(
    async (id: string) => {
      const fresh = await service.readContent(id);
      setContent(fresh);
      return fresh;
    },
    [service],
  );

  /** Ensure a content record + lock exists; returns its id. */
  const ensureContent = useCallback(
    async (mimeType: string): Promise<{ id: string; data: ContentData }> => {
      if (content?.identifier) return { id: content.identifier, data: content };
      const id = await service.createContent(context, {
        mimeType,
        primaryCategory: contentType,
        framework: context.framework,
      });
      telemetry.current?.setObject(id);
      const data = await reload(id);
      emit(EDITOR_EVENTS.CONTENT_CREATED, { id });
      try {
        if (!lockedRef.current) {
          await service.createLock(id, context, data);
          lockedRef.current = true;
        }
      } catch {
        /* non-fatal: proceed without lock */
      }
      return { id, data };
    },
    [content, service, context, contentType, reload, emit],
  );

  /* ---- Upload a file ---- */
  const uploadFile = useCallback(
    async (file: File) => {
      if (!content?.identifier && !contentType) {
        showToast(t(lang, 'CONTENT_TYPE_REQUIRED'), 'error');
        return;
      }
      if (file.size > maxMB * 1024 * 1024) {
        showToast(tf(lang, 'ERROR_FILE_SIZE', { n: maxMB }), 'error');
        return;
      }
      if (largeUpload) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!(LARGE_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
          showToast(t(lang, 'ERROR_FILE_TYPE'), 'error');
          return;
        }
      }
      const mimeType = await detectFileMime(file);
      if (mimeType === 'application/octet-stream') {
        showToast(t(lang, 'ERROR_FILE_TYPE'), 'error');
        return;
      }
      cancelledRef.current = false;
      setBusy(true);
      setBusyAction('upload');
      setView('uploading');
      setProgress({ percent: 0, bytesUploaded: 0, totalBytes: file.size });
      emit(EDITOR_EVENTS.UPLOAD_START, { mimeType, size: file.size });
      telemetry.current?.interact('click', 'uploadButton', 'upload', { mimeType });
      try {
        const { id } = await ensureContent(mimeType);
        const signed = await uploader.getPresignedUrl(id, file.name);
        await uploader.putToCloud(signed, file, mimeType, (p) => {
          if (!cancelledRef.current) setProgress(p);
          emit(EDITOR_EVENTS.UPLOAD_PROGRESS, { percent: p.percent });
        });
        await uploader.finalizeUpload(id, signed, mimeType);
        if (cancelledRef.current) return;
        await reload(id);
        setView('player');
        emit(EDITOR_EVENTS.UPLOAD_COMPLETE, { id });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2500);
      } catch (err) {
        if (cancelledRef.current) return;
        telemetry.current?.error(String((err as Error)?.message ?? err));
        emit(EDITOR_EVENTS.ERROR, { phase: 'upload', message: String((err as Error)?.message) });
        showToast(t(lang, 'ERROR_UPLOAD'), 'error');
        setView(content?.artifactUrl ? 'player' : 'upload');
      } finally {
        setBusy(false);
        setBusyAction(null);
        if (!cancelledRef.current) setProgress(null);
      }
    },
    [maxMB, largeUpload, contentType, lang, emit, ensureContent, uploader, reload, content, showToast],
  );

  /* ---- Upload from a URL ---- */
  const uploadFromUrl = useCallback(
    async (url: string) => {
      const link = url.trim();
      if (!link) return;
      if (!content?.identifier && !contentType) {
        showToast(t(lang, 'CONTENT_TYPE_REQUIRED'), 'error');
        return;
      }
      const mimeType = detectUrlMime(link);
      cancelledRef.current = false;
      setUrlError(null);
      setBusy(true);
      setBusyAction('upload');
      setView('uploading');
      emit(EDITOR_EVENTS.UPLOAD_START, { mimeType, url: link });
      telemetry.current?.interact('click', 'uploadUrlButton', 'upload', { mimeType, source: 'url' });
      try {
        const { id } = await ensureContent(mimeType);
        await uploader.finalizeUrl(id, link, mimeType);
        if (cancelledRef.current) return;
        await reload(id);
        setView('player');
        emit(EDITOR_EVENTS.UPLOAD_COMPLETE, { id });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2500);
      } catch (err) {
        if (cancelledRef.current) return;
        const code = (err as { code?: string })?.code;
        const message = String((err as Error)?.message ?? err);
        telemetry.current?.error(message, 'upload');
        emit(EDITOR_EVENTS.ERROR, { phase: 'upload-url', message });
        const invalidUrl = code === 'ERR_INVALID_FILE_URL' || /valid file url/i.test(message);
        if (invalidUrl) {
          setUrlError(t(lang, 'INVALID_LINK'));
          setView('upload');
        } else {
          showToast(t(lang, 'ERROR_UPLOAD'), 'error');
          setView(content?.artifactUrl ? 'player' : 'upload');
        }
      } finally {
        setBusy(false);
        setBusyAction(null);
      }
    },
    [contentType, lang, emit, ensureContent, uploader, reload, content, showToast],
  );

  /* ---- Cancel an in-flight upload (soft: resets UI; late finish is ignored) ---- */
  const cancelUpload = useCallback(() => {
    cancelledRef.current = true;
    setBusy(false);
    setBusyAction(null);
    setProgress(null);
    setView(content?.artifactUrl ? 'player' : 'upload');
    telemetry.current?.interact('click', 'cancelUpload', 'upload');
  }, [content]);

  /* ---- Save metadata ---- */
  const saveMetadata = useCallback(
    async (fields: Record<string, unknown>) => {
      if (!content?.identifier) return;
      setBusy(true);
      setBusyAction('save-metadata');
      try {
        const res = await service.updateContent(content.identifier, fields, content.versionKey);
        setContent((c) => (c ? { ...c, ...fields, versionKey: res?.versionKey ?? c.versionKey } : c));
        setDrawer(null);
        telemetry.current?.interact('modify', 'metadata', 'save');
        emit(EDITOR_EVENTS.SAVED, { id: content.identifier });
        showToast(t(lang, 'TOAST_DETAILS_SAVED'));
      } catch (err) {
        telemetry.current?.error(String((err as Error)?.message ?? err), 'edit');
        showToast(String((err as Error)?.message ?? t(lang, 'ERROR_GENERIC')), 'error');
      } finally {
        setBusy(false);
        setBusyAction(null);
      }
    },
    [content, service, emit, lang, showToast],
  );

  /* ---- Save draft (header Save) ---- */
  const saveDraft = useCallback(async () => {
    if (!content?.identifier) {
      showToast(t(lang, 'TOAST_SAVED'));
      return;
    }
    setBusy(true);
    setBusyAction('save-draft');
    try {
      const res = await service.updateContent(content.identifier, { name: content.name }, content.versionKey);
      setContent((c) => (c ? { ...c, versionKey: res?.versionKey ?? c.versionKey } : c));
      telemetry.current?.interact('click', 'saveButton', 'save');
      emit(EDITOR_EVENTS.SAVED, { id: content.identifier });
      showToast(t(lang, 'TOAST_SAVED'));
    } catch (err) {
      showToast(String((err as Error)?.message ?? t(lang, 'ERROR_GENERIC')), 'error');
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }, [content, service, emit, lang, showToast]);

  /* ---- Collaborators ---- */
  const saveCollaborators = useCallback(
    async (collaborators: string[]) => {
      if (!content?.identifier) return;
      setBusy(true);
      setBusyAction('collaborator');
      try {
        const res = await service.updateCollaborators(content.identifier, collaborators);
        setContent((c) =>
          c ? { ...c, collaborators, versionKey: (res as { versionKey?: string })?.versionKey ?? c.versionKey } : c,
        );
        telemetry.current?.interact('modify', 'collaborator', 'collaborator');
        emit(EDITOR_EVENTS.COLLABORATORS_UPDATED, { id: content.identifier, count: collaborators.length });
        showToast(t(lang, 'TOAST_COLLAB_SAVED'));
        // Drawer stays open: add/remove are inline, persisted per click.
      } catch (err) {
        telemetry.current?.error(String((err as Error)?.message ?? err), 'edit');
        showToast(String((err as Error)?.message ?? t(lang, 'ERROR_GENERIC')), 'error');
      } finally {
        setBusy(false);
        setBusyAction(null);
      }
    },
    [content, service, emit, lang, showToast],
  );

  /* ---- Send for review ---- */
  const validateForReview = useCallback((): string[] => {
    const errs: string[] = [];
    const c = content;
    if (!c) return [t(lang, 'ERROR_LOAD')];
    if (!c.name || c.name === 'Untitled Content') errs.push(t(lang, 'TITLE'));
    if (!c.description) errs.push(t(lang, 'DESCRIPTION'));
    if (!c.appIcon) errs.push(t(lang, 'THUMBNAIL'));
    if (!c.board) errs.push(t(lang, 'BOARD'));
    if (!c.medium?.length) errs.push(t(lang, 'MEDIUM'));
    if (!c.gradeLevel?.length) errs.push(t(lang, 'CLASS'));
    if (!c.subject?.length) errs.push(t(lang, 'SUBJECT'));
    return errs;
  }, [content, lang]);

  /**
   * Async variant: fetches form/read with action='review' to get required fields
   * dynamically, then validates content against them. Falls back to static list on error.
   */
  const validateForReviewAsync = useCallback(async (): Promise<string[]> => {
    const c = content;
    if (!c) return [t(lang, 'ERROR_LOAD')];
    try {
      const subtype = c.primaryCategory ?? c.contentType ?? '';
      const fields = subtype
        ? await service.readFormFields(subtype, 'review', {
          framework: c.framework ?? context.framework,
          rootOrgId: context.user?.rootOrgId ?? context.channel,
        })
        : [];
      if (fields.length === 0) return validateForReview();
      const errs: string[] = [];
      for (const f of fields) {
        if (!f.required) continue;
        const val = c[f.code as keyof typeof c];
        const empty = val == null || val === '' || (Array.isArray(val) && val.length === 0);
        if (empty) errs.push(f.label ?? f.name ?? f.code);
      }
      return errs;
    } catch {
      return validateForReview();
    }
  }, [content, lang, service, validateForReview, context]);

  const sendForReview = useCallback(async () => {
    if (!content?.identifier) return;
    setBusy(true);
    setBusyAction('save-submit');
    try {
      await service.sendForReview(content.identifier);
      telemetry.current?.interact('click', 'reviewButton', 'review');
      emit(EDITOR_EVENTS.SENT_FOR_REVIEW, { id: content.identifier });
      if (lockedRef.current) {
        service.retireLock(content.identifier).catch(() => {});
        lockedRef.current = false;
      }
      showToast(t(lang, 'TOAST_SENT_REVIEW'));
      setDrawer(null);
      setTimeout(() => onClose?.(), 800);
    } catch (err) {
      showToast(String((err as Error)?.message ?? t(lang, 'ERROR_GENERIC')), 'error');
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }, [content, service, emit, lang, showToast, onClose]);

  /**
   * Save-edited-metadata then submit for review (the "Send for review" → edit details → submit flow).
   * Persists fields first, re-validates against the review form, and only sends if valid.
   */
  const saveMetadataAndSubmit = useCallback(
    async (fields: Record<string, unknown>) => {
      if (!content?.identifier) return;
      setBusy(true);
      setBusyAction('save-submit');
      try {
        const res = await service.updateContent(content.identifier, fields, content.versionKey);
        const merged = { ...content, ...fields, versionKey: res?.versionKey ?? content.versionKey } as ContentData;
        setContent(merged);
        telemetry.current?.interact('modify', 'metadata', 'save');
        emit(EDITOR_EVENTS.SAVED, { id: content.identifier });
      } catch (err) {
        telemetry.current?.error(String((err as Error)?.message ?? err), 'edit');
        showToast(String((err as Error)?.message ?? t(lang, 'ERROR_GENERIC')), 'error');
        setBusy(false);
        setBusyAction(null);
        return;
      }
      // Re-validate the just-saved content against the review form.
      const errs = await validateForReviewAsync();
      if (errs.length) {
        setReviewErrors(errs);
        setBusy(false);
        setBusyAction(null);
        return;
      }
      setReviewErrors([]);
      try {
        await service.sendForReview(content.identifier);
        telemetry.current?.interact('click', 'reviewButton', 'review');
        emit(EDITOR_EVENTS.SENT_FOR_REVIEW, { id: content.identifier });
        if (lockedRef.current) {
          service.retireLock(content.identifier).catch(() => {});
          lockedRef.current = false;
        }
        showToast(t(lang, 'TOAST_SENT_REVIEW'));
        setReviewSubmitMode(false);
        setDrawer(null);
        setTimeout(() => onClose?.(), 800);
      } catch (err) {
        showToast(String((err as Error)?.message ?? t(lang, 'ERROR_GENERIC')), 'error');
      } finally {
        setBusy(false);
        setBusyAction(null);
      }
    },
    [content, service, emit, lang, showToast, onClose, validateForReviewAsync],
  );

  /* ---- Reviewer actions ---- */
  const publish = useCallback(async () => {
    if (!content?.identifier) return;
    setBusy(true);
    setBusyAction('publish');
    try {
      await service.publishContent(content.identifier, context.user?.id ?? '');
      telemetry.current?.interact('click', 'publishButton', 'publish');
      emit(EDITOR_EVENTS.PUBLISHED, { id: content.identifier });
      showToast(t(lang, 'TOAST_PUBLISHED'));
      setDrawer(null);
      setTimeout(() => onClose?.(), 800);
    } catch (err) {
      showToast(String((err as Error)?.message ?? t(lang, 'ERROR_GENERIC')), 'error');
    } finally {
      setBusy(false);
      setBusyAction(null);
    }
  }, [content, service, context, emit, lang, showToast, onClose]);

  const requestChanges = useCallback(
    async (reasons: string[], comment?: string) => {
      if (!content?.identifier) return;
      setBusy(true);
      setBusyAction('reject');
      try {
        await service.rejectContent(content.identifier, reasons, comment);
        telemetry.current?.interact('click', 'requestChangesButton', 'reject', { reasons });
        emit(EDITOR_EVENTS.REJECTED, { id: content.identifier });
        showToast(t(lang, 'TOAST_REJECTED'));
        setDrawer(null);
        setTimeout(() => onClose?.(), 800);
      } catch (err) {
        telemetry.current?.error(String((err as Error)?.message ?? err), 'edit');
        showToast(String((err as Error)?.message ?? t(lang, 'ERROR_GENERIC')), 'error');
      } finally {
        setBusy(false);
        setBusyAction(null);
      }
    },
    [content, service, emit, lang, showToast, onClose],
  );

  /* ---- Close ---- */
  const close = useCallback(() => {
    if (content?.identifier && lockedRef.current) {
      service.retireLock(content.identifier).catch(() => {});
    }
    telemetry.current?.interact('click', 'closeButton', 'close');
    telemetry.current?.end('content-editor');
    telemetry.current?.destroy();
    emit(EDITOR_EVENTS.CLOSED);
    onClose?.();
  }, [content, service, emit, onClose]);

  /* ---- Inactivity / session-timeout prompt ----
     Mirrors the old editor's "session timed out due to inactivity" popup.
     A 30-min idle timer reset on user activity; on fire it shows a prompt with
     Continue / Close Editor. Telemetry fires on prompt + resolution. */
  const dismissSessionExpiry = useCallback(() => {
    setSessionExpired(false);
    telemetry.current?.interact('click', 'sessionPrompt', 'continue');
  }, []);

  /** Open the full-screen image picker; `onPick` is called with the chosen URL. */
  const openAssetPicker = useCallback((onPick: (url: string) => void) => {
    setAssetPicker({ onPick });
    telemetry.current?.interact('click', 'assetPicker', 'open');
  }, []);
  const closeAssetPicker = useCallback(() => setAssetPicker(null), []);

  useEffect(() => {
    // Don't run while still loading the initial content.
    if (view === 'loading') return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSessionExpired(true);
        telemetry.current?.interact('other', 'session', 'inactivity');
      }, IDLE_TIMEOUT_MS);
    };
    const events: Array<keyof DocumentEventMap> = ['mousemove', 'keydown', 'click', 'scroll'];
    const onActivity = () => { if (!sessionExpired) reset(); };
    events.forEach((e) => document.addEventListener(e, onActivity, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, onActivity));
    };
  }, [view, sessionExpired]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  /** True when content was rejected and has reviewer suggestions to show. */
  const hasReviewComments = !!(content?.rejectReasons?.length || content?.rejectComment);

  return {
    // state
    content, view, drawer, toast, progress, contentType, uploadUrl, urlError, busy, busyAction, mode, lang, categories,
    maxMB, largeUpload, headerLogo, previewUrl, previewConfig, framework: context.framework,
    userId: context.user?.id, rootOrgId: context.user?.rootOrgId, userRoles: context.user?.roles ?? [],
    reviewErrors, uploadSuccess, sessionExpired, assetPicker, reviewSubmitMode, hasReviewComments,
    // setters
    setDrawer: openDrawer, setContentType, setUploadUrl, setUrlError, showToast, setReviewErrors, setReviewSubmitMode,
    dismissSessionExpiry, openAssetPicker, closeAssetPicker,
    // actions
    uploadFile, uploadFromUrl, cancelUpload, saveMetadata, saveMetadataAndSubmit, saveDraft, saveCollaborators,
    validateForReview, validateForReviewAsync, sendForReview, publish, requestChanges, close,
    uploadAsset: opts.onUploadAsset,
    // services (for drawers that need search / framework)
    service, context,
  };
}

export type EditorController = ReturnType<typeof useEditor>;
