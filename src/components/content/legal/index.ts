import type { DocKey, LegalDoc } from './blocks'
import { TERMS } from './terms'
import { PRIVACY } from './privacy'
import { REFUNDS } from './refunds'
import { COMPLIANCE } from './compliance'

export type { DocKey, LegalDoc } from './blocks'
export { DocLink, GrievanceCard } from './blocks'

/** Single date shown on every legal document. Update whenever any policy text changes. */
export const LEGAL_LAST_UPDATED = '2026-09-30'
export const LEGAL_VERSION = 'Draft v0.1'

export const LEGAL_DOCS: LegalDoc[] = [TERMS, PRIVACY, REFUNDS, COMPLIANCE]

export function isDocKey(v: string | undefined): v is DocKey {
  return LEGAL_DOCS.some((d) => d.key === v)
}

export function legalDoc(key: DocKey): LegalDoc {
  return LEGAL_DOCS.find((d) => d.key === key) ?? TERMS
}
