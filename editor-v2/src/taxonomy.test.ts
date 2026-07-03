import { describe, it, expect } from 'vitest';
import { cascadedOptions, categoryTerms } from './taxonomy';
import type { FrameworkCategory } from './types';

const categories: FrameworkCategory[] = [
  {
    code: 'board',
    name: 'Board',
    terms: [
      {
        code: 'cbse', name: 'CBSE',
        associations: [
          { name: 'English', category: 'medium' },
          { name: 'Hindi', category: 'medium' },
          { name: 'Class 1', category: 'gradeLevel' },
        ],
      },
      { code: 'icse', name: 'ICSE', associations: [{ name: 'English', category: 'medium' }] },
    ],
  },
  {
    code: 'medium',
    name: 'Medium',
    terms: [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi' },
      { code: 'ta', name: 'Tamil' },
    ],
  },
  { code: 'gradeLevel', name: 'Class', terms: [{ code: 'c1', name: 'Class 1' }, { code: 'c2', name: 'Class 2' }] },
];

describe('taxonomy', () => {
  it('returns all terms when no parent is selected', () => {
    expect(cascadedOptions(categories, 'medium', {}).map((o) => o.name)).toEqual(['English', 'Hindi', 'Tamil']);
  });

  it('narrows child options by selected-parent associations', () => {
    const opts = cascadedOptions(categories, 'medium', { board: 'CBSE' });
    expect(opts.map((o) => o.name)).toEqual(['English', 'Hindi']);
  });

  it('restricts gradeLevel by board association', () => {
    const opts = cascadedOptions(categories, 'gradeLevel', { board: 'CBSE' });
    expect(opts.map((o) => o.name)).toEqual(['Class 1']);
  });

  it('returns all terms when selected parent has no association for the category', () => {
    // ICSE has no gradeLevel association → unrestricted
    const opts = cascadedOptions(categories, 'gradeLevel', { board: 'ICSE' });
    expect(opts.map((o) => o.name)).toEqual(['Class 1', 'Class 2']);
  });

  it('categoryTerms lists every term', () => {
    expect(categoryTerms(categories, 'board').map((o) => o.name)).toEqual(['CBSE', 'ICSE']);
  });
});
