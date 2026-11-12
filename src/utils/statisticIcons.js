import * as Icons from 'lucide-react'
import { resolveLucideIconKey } from './highlightIcons'

export function resolveStatisticIconKey(name) {
  const key = resolveLucideIconKey(name)
  const type = Icons[key]?.$$typeof
  return type === Symbol.for('react.forward_ref') || type === Symbol.for('react.memo') ? key : null
}

export const normalizeStatisticIcon = (name) => resolveStatisticIconKey(name) ?? 'BarChart3'
