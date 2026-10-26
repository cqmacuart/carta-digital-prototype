import { DEFAULT_LABELS, type Labels } from './vocabulary'

/** This business's words: theme.json → `labels` (injected by vite.config.ts as __LABELS__) over the carta's own. */
export const L: Labels = { ...DEFAULT_LABELS, ...__LABELS__ }

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "1 plato", "3 platos" */
export const count = (n: number, [one, many]: [string, string]) => `${n} ${n === 1 ? one : many}`
