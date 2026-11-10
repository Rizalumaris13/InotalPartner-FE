import * as Icons from 'lucide-react'
import { Sparkles } from 'lucide-react'
import { resolveLucideIconKey } from '../utils/highlightIcons'

export function DynamicHighlightIcon({ name, size = 18, className = '' }) {
  const key = resolveLucideIconKey(name)
  const Icon = key === null ? Sparkles : Icons[key] || Sparkles
  return <Icon size={size} className={className} />
}
