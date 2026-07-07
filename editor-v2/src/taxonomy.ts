/** Framework taxonomy cascade helpers. */
import type { FrameworkCategory } from './types';

export interface TermOption {
  code: string;
  name: string;
}

/** All option names for a category. */
export function categoryTerms(categories: FrameworkCategory[], code: string): TermOption[] {
  const cat = categories.find((c) => c.code === code);
  return (cat?.terms ?? []).map((t) => ({ code: t.code ?? t.name, name: t.name }));
}

/**
 * Options for `code`, narrowed by currently-selected values in other categories
 * (via term associations). If no parent restricts it, all terms are returned.
 *
 * selected maps category code → selected term name(s).
 */
export function cascadedOptions(
  categories: FrameworkCategory[],
  code: string,
  selected: Record<string, string | string[] | undefined>,
): TermOption[] {
  const all = categoryTerms(categories, code);
  const allowed = new Set<string>();
  let restricted = false;

  for (const cat of categories) {
    if (cat.code === code) continue;
    const sel = selected[cat.code];
    const selNames = Array.isArray(sel) ? sel : sel ? [sel] : [];
    if (!selNames.length) continue;
    for (const term of cat.terms ?? []) {
      if (!selNames.includes(term.name)) continue;
      const assoc = (term.associations ?? []).filter((a) => a.category === code);
      if (assoc.length) {
        restricted = true;
        assoc.forEach((a) => allowed.add(a.name));
      }
    }
  }

  if (!restricted) return all;
  return all.filter((o) => allowed.has(o.name));
}
