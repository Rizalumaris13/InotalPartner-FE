import * as Icons from 'lucide-react'
import { BarChart3 } from 'lucide-react'
import { resolveStatisticIconKey } from '../utils/statisticIcons'

export function DynamicStatisticIcon({ name, size = 18, className = '' }) {
  const key = resolveStatisticIconKey(name)
  const Icon = key === null ? BarChart3 : Icons[key] || BarChart3
  return <Icon size={size} className={className} />
}
