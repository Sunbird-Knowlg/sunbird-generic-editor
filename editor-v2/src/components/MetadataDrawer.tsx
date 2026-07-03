import React, { useEffect, useMemo, useRef, useState } from 'react';
import Drawer from './Drawer';
import type { EditorController } from '../useEditor';
import type { FormField, FrameworkCategory } from '../types';
import { t } from '../i18n/i18n';
import { cascadedOptions } from '../taxonomy';
import { PencilIcon, ChevronDown, ImageIcon, CheckIcon } from '../icons';

/**
 * Multi-value field? Driven by the form definition, not a hardcoded list — a field
 * is an array if the form marks it multiselect (or dataType 'list'), so any custom
 * taxonomy category the framework returns is handled dynamically.
 */
function isMultiField(f: FormField): boolean {
  const it = (f.inputType ?? '').toLowerCase();
  if (it.includes('multi')) return true;
  const dt = (f.dataType ?? '').toLowerCase();
  return dt === 'list';
}

/** Fallback field set when form/read returns nothing (keeps the drawer usable). */
const FALLBACK_FIELDS: FormField[] = [
  { code: 'appicon', inputType: 'file', label: 'Thumbnail', index: 1, visible: true, editable: true },
  { code: 'name', inputType: 'text', label: 'Title', index: 2, required: true, visible: true, editable: true },
  { code: 'description', inputType: 'textarea', label: 'Description', index: 3, visible: true, editable: true },
  { code: 'board', inputType: 'select', label: 'Board / Syllabus', index: 4, visible: true, editable: true },
  { code: 'medium', inputType: 'multiselect', label: 'Medium', index: 5, visible: true, editable: true },
  { code: 'gradeLevel', inputType: 'multiselect', label: 'Class', index: 6, visible: true, editable: true },
  { code: 'subject', inputType: 'multiselect', label: 'Subject', index: 7, visible: true, editable: true },
];

const Select: React.FC<{
  label: string; placeholder: string; value: string; required?: boolean; disabled?: boolean;
  options: { code: string; name: string }[]; onChange: (v: string) => void;
}> = ({ label, placeholder, value, required, disabled, options, onChange }) => (
  <div>
    <label className="ce-label-sm">{label}{required && <span className="ce-required-star">*</span>}</label>
    <div className="ce-select-wrap" style={{ maxWidth: 'none' }}>
      <select
        className="ce-select ce-select-sm"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.code} value={o.name}>{o.name}</option>)}
      </select>
      <span className="ce-select-chevron"><ChevronDown size={12} /></span>
    </div>
  </div>
);

/** Checkbox popover for multi-value taxonomy fields (medium, class, subject). */
const MultiSelect: React.FC<{
  label: string; placeholder: string; values: string[]; required?: boolean; disabled?: boolean;
  options: { code: string; name: string }[]; onChange: (v: string[]) => void;
}> = ({ label, placeholder, values, required, disabled, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  const toggle = (name: string) =>
    onChange(values.includes(name) ? values.filter((v) => v !== name) : [...values, name]);
  const summary = values.length ? values.join(', ') : placeholder;
  return (
    <div>
      <label className="ce-label-sm">{label}{required && <span className="ce-required-star">*</span>}</label>
      <div className="ce-multi" ref={ref}>
        <button
          type="button"
          className="ce-multi-control"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`ce-multi-summary${values.length ? '' : ' is-placeholder'}`}>{summary}</span>
          <span className="ce-select-chevron"><ChevronDown size={12} /></span>
        </button>
        {open && (
          <div className="ce-multi-panel">
            {options.length === 0 ? (
              <div className="ce-multi-empty">{placeholder}</div>
            ) : (
              options.map((o) => (
                <label key={o.code} className="ce-multi-opt">
                  <input type="checkbox" checked={values.includes(o.name)} onChange={() => toggle(o.name)} />
                  <span>{o.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MetadataDrawer: React.FC<{ ed: EditorController }> = ({ ed }) => {
  const {
    lang, content, drawer, setDrawer, saveMetadata, saveMetadataAndSubmit, service, framework, busy, busyAction,
    showToast, reviewErrors, setReviewErrors, reviewSubmitMode, setReviewSubmitMode,
  } = ed;
  const saving = busyAction === 'save-metadata' || busyAction === 'save-submit';
  const open = drawer === 'metadata';

  /* Single-value fields (name, description, board). */
  const [values, setValues] = useState<Record<string, string>>({});
  /* Multi-value taxonomy fields (medium, gradeLevel, subject) — real arrays. */
  const [multiVals, setMultiVals] = useState<Record<string, string[]>>({});
  const [appIcon, setAppIcon] = useState<string | undefined>();
  const [categories, setCategories] = useState<FrameworkCategory[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const loadedFw = useRef<string | null>(null);
  const loadedFormKey = useRef<string | null>(null);

  /* Framework categories for taxonomy cascade. */
  useEffect(() => {
    const fw = content?.framework || framework;
    if (!open || !fw || loadedFw.current === fw) return;
    loadedFw.current = fw;
    service.readFramework(fw).then(setCategories).catch(() => setCategories([]));
  }, [open, content, framework, service]);

  /* Form/read field definitions — save form for Edit Details, review form for
   * Submit-for-review. Keyed on subtype+action so switching mode refetches even
   * while the drawer stays open. */
  useEffect(() => {
    const subtype = content?.primaryCategory ?? content?.contentType ?? '';
    const action: 'save' | 'review' = reviewSubmitMode ? 'review' : 'save';
    const key = `${subtype}:${action}`;
    if (!open || !subtype || loadedFormKey.current === key) return;
    loadedFormKey.current = key;
    service
      .readFormFields(subtype, action, {
        framework: content?.framework ?? framework,
        rootOrgId: ed.rootOrgId ?? ed.context.channel,
      })
      .then((f) => setFormFields(f.length ? f : FALLBACK_FIELDS))
      .catch(() => setFormFields(FALLBACK_FIELDS));
  }, [open, content, reviewSubmitMode, service, framework, ed.rootOrgId, ed.context.channel]);

  /* Visible, render-ordered fields. */
  const fields = useMemo(() => {
    const src = formFields.length ? formFields : FALLBACK_FIELDS;
    return src.filter((f) => f.visible !== false);
  }, [formFields]);

  /* Taxonomy category codes come from the framework, not a hardcoded list. */
  const taxoCodes = useMemo(() => new Set(categories.map((c) => c.code)), [categories]);
  /* Cascade order: parents first (framework index), so we can reset dependents. */
  const orderedTaxoCodes = useMemo(
    () => [...categories].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((c) => c.code),
    [categories],
  );

  const setVal = (code: string, v: string) => setValues((s) => ({ ...s, [code]: v }));
  const setMulti = (code: string, v: string[]) => setMultiVals((s) => ({ ...s, [code]: v }));

  /* Seed values from content once the field set is known — string fields into
     `values`, multiselect fields into `multiVals`, driven by the form definition. */
  useEffect(() => {
    if (!open || !content) return;
    const vals: Record<string, string> = {
      name: content.name ?? '',
      description: content.description ?? '',
    };
    const multi: Record<string, string[]> = {};
    for (const f of fields) {
      if (f.code === 'name' || f.code === 'description') continue;
      if (f.code === 'appicon' || f.code === 'appIcon') continue;
      const cv = (content as Record<string, unknown>)[f.code];
      if (isMultiField(f)) {
        multi[f.code] = Array.isArray(cv) ? cv.map(String) : cv != null && cv !== '' ? [String(cv)] : [];
      } else {
        vals[f.code] = cv != null ? String(cv) : '';
      }
    }
    setValues(vals);
    setMultiVals(multi);
    setAppIcon(content.appIcon);
  }, [open, content, fields]);

  const appIconField = fields.find((f) => f.code === 'appicon' || f.code === 'appIcon');
  const hasAppIcon = !!appIconField;
  const appIconLabel = appIconField?.label ?? appIconField?.name ?? t(lang, 'THUMBNAIL');
  const appIconAddText = appIconField?.placeholder ?? t(lang, 'ADD_IMAGE');

  /* Selected taxonomy values keyed by category code (for the cascade). */
  const selectedTaxo = useMemo(() => {
    const sel: Record<string, string | string[]> = {};
    for (const code of taxoCodes) sel[code] = multiVals[code] ?? values[code] ?? '';
    return sel;
  }, [taxoCodes, multiVals, values]);

  /* Reset every category that depends on `changedCode` (later in cascade order). */
  const resetDependents = (changedCode: string) => {
    const idx = orderedTaxoCodes.indexOf(changedCode);
    if (idx < 0) return;
    for (const code of orderedTaxoCodes.slice(idx + 1)) {
      setMulti(code, []);
      setVal(code, '');
    }
  };

  const onSave = () => {
    const nameField = fields.find((f) => f.code === 'name');
    if (nameField?.required !== false && !(values.name ?? '').trim()) {
      showToast(t(lang, 'ERROR_TITLE_REQUIRED'), 'error');
      return;
    }
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.editable === false) continue;
      const code = f.code === 'appIcon' ? 'appIcon' : f.code;
      if (code === 'appicon' || code === 'appIcon') continue; // handled below
      if (isMultiField(f)) {
        const arr = multiVals[f.code] ?? [];
        out[f.code] = arr.length ? arr : undefined;
        continue;
      }
      const raw = values[f.code];
      if (raw == null) continue;
      out[f.code] = raw || undefined;
    }
    if (appIcon) out.appIcon = appIcon;
    out.name = (values.name ?? '').trim();
    setReviewErrors([]);
    if (reviewSubmitMode) saveMetadataAndSubmit(out);
    else saveMetadata(out);
  };

  const onClose = () => { setReviewErrors([]); setReviewSubmitMode(false); setDrawer(null); };

  /* Renders a single form field by its inputType. */
  const renderField = (f: FormField) => {
    const code = f.code;
    const label = f.label ?? f.name ?? code;
    const placeholder = f.placeholder ?? '';
    const disabled = f.editable === false;
    const required = !!f.required;

    if (code === 'appicon' || code === 'appIcon') return null; // rendered in the top block

    if (taxoCodes.has(code)) {
      const options = cascadedOptions(categories, code, selectedTaxo);
      // Multi vs single is decided by the form definition, not the field name.
      if (isMultiField(f)) {
        return (
          <MultiSelect
            key={code}
            label={label}
            placeholder={placeholder || `Select ${label}`}
            required={required}
            disabled={disabled}
            values={multiVals[code] ?? []}
            options={options}
            onChange={(vals) => {
              setMulti(code, vals);
              resetDependents(code); // clear categories that depend on this one
            }}
          />
        );
      }
      return (
        <Select
          key={code}
          label={label}
          placeholder={placeholder || `Select ${label}`}
          required={required}
          disabled={disabled}
          value={values[code] ?? ''}
          options={options}
          onChange={(v) => {
            setVal(code, v);
            resetDependents(code);
          }}
        />
      );
    }

    if (f.inputType === 'textarea') {
      return (
        <div key={code} className="ce-field-full">
          <label className="ce-label-sm">{label}{required && <span className="ce-required-star">*</span>}</label>
          <textarea
            className="ce-textarea ce-textarea-sm"
            value={values[code] ?? ''}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => setVal(code, e.target.value)}
          />
        </div>
      );
    }

    // default: text / number / url → text input
    return (
      <div key={code} className="ce-field-full">
        <label className="ce-label-sm">{label}{required && <span className="ce-required-star">*</span>}</label>
        <input
          className="ce-input ce-input-sm"
          value={values[code] ?? ''}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setVal(code, e.target.value)}
        />
      </div>
    );
  };

  const taxoFields = fields.filter((f) => taxoCodes.has(f.code));
  const nonTaxoFields = fields.filter(
    (f) => !taxoCodes.has(f.code) && f.code !== 'appicon' && f.code !== 'appIcon',
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      titleIcon={<PencilIcon size={18} />}
      title={t(lang, 'EDIT_CONTENT_DETAILS')}
      footer={
        <>
          <button type="button" className="ce-btn ce-btn--ghost" onClick={onClose}>
            {t(lang, 'CANCEL')}
          </button>
          <button type="button" className="ce-btn ce-btn--primary" onClick={onSave} disabled={busy}>
            {saving
              ? <><span className="ce-spinner ce-spinner--xs" /> {t(lang, 'SAVING')}</>
              : <><CheckIcon size={13} /> {reviewSubmitMode ? t(lang, 'SAVE_AND_SUBMIT') : t(lang, 'SAVE_CHANGES')}</>}
          </button>
        </>
      }
    >
      {reviewErrors.length > 0 && (
        <div className="ce-validation" style={{ marginBottom: 16 }}>
          <p className="ce-validation-title">{t(lang, 'REVIEW_VALIDATION')}</p>
          <ul>{reviewErrors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <div className="ce-meta-top">
        {hasAppIcon && (
          <div>
            <label className="ce-label-sm">
              {appIconLabel}
              {appIconField?.required && <span className="ce-required-star">*</span>}
            </label>
            <div className="ce-thumb" onClick={() => ed.openAssetPicker(setAppIcon)} role="button" tabIndex={0}>
              {appIcon ? (
                <img src={appIcon} alt="" />
              ) : (
                <>
                  <div className="ce-thumb-ic"><ImageIcon size={16} /></div>
                  <span className="ce-thumb-text">{appIconAddText}</span>
                </>
              )}
            </div>
            {appIcon && (
              <button type="button" className="ce-link-btn" onClick={() => ed.openAssetPicker(setAppIcon)}>
                {t(lang, 'CHANGE_IMAGE')}
              </button>
            )}
          </div>
        )}
        <div className="ce-meta-fields">
          {nonTaxoFields.map(renderField)}
        </div>
      </div>

      {taxoFields.length > 0 && (
        <div className="ce-taxo-grid">
          {taxoFields.map(renderField)}
        </div>
      )}
    </Drawer>
  );
};

export default MetadataDrawer;
