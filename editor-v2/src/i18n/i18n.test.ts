import { describe, it, expect } from 'vitest';
import { t, tf, getDir, getMimeTypeLabel, getCategoryLabel } from './i18n';
import { MIME_H5P } from '../constants';

describe('i18n', () => {
  it('t returns the key itself when missing (negative)', () => {
    expect(t('en', 'DOES_NOT_EXIST')).toBe('DOES_NOT_EXIST');
    expect(t('en', 'SAVE')).toBe('Save');
  });
  it('tf interpolates {placeholders}', () => {
    expect(tf('en', 'MAX_SIZE', { n: '150 MB' })).toContain('150 MB');
  });
  it('getMimeTypeLabel maps knowns and defaults unknowns', () => {
    expect(getMimeTypeLabel('en', 'application/pdf')).toBe('PDF');
    expect(getMimeTypeLabel('en', MIME_H5P)).toBe('H5P');
    expect(getMimeTypeLabel('en', 'application/weird')).toBe('CONTENT');
    expect(getMimeTypeLabel('en', undefined)).toBe('CONTENT');
  });
  it('getCategoryLabel falls back to the raw category when unknown', () => {
    expect(getCategoryLabel('en', 'Totally Custom Category')).toBe('Totally Custom Category');
  });
  it('getDir defaults to ltr for latin languages', () => {
    expect(getDir('en')).toBe('ltr');
  });
});
