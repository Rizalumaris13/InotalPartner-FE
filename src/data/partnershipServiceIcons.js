import { createElement } from 'react'
import {
  Cloud, Code2, Cpu, Database, Layers, LineChart, MonitorCog, Rocket, Settings2, ShieldCheck, Users, Wrench,
} from 'lucide-react'

// Katalog ikon kartu layanan Beranda; nilai enum disimpan, bukan komponen.
const icons = {
  'monitor-cog': { label: 'Konsultasi IT', Icon: MonitorCog },
  layers: { label: 'Integrasi sistem', Icon: Layers },
  'settings-2': { label: 'Manajemen sumber daya', Icon: Settings2 },
  code: { label: 'Pengembangan software', Icon: Code2 },
  cpu: { label: 'Infrastruktur', Icon: Cpu },
  database: { label: 'Data', Icon: Database },
  'shield-check': { label: 'Keamanan', Icon: ShieldCheck },
  cloud: { label: 'Cloud', Icon: Cloud },
  rocket: { label: 'Inovasi', Icon: Rocket },
  users: { label: 'Tim', Icon: Users },
  'line-chart': { label: 'Pertumbuhan', Icon: LineChart },
  wrench: { label: 'Pemeliharaan', Icon: Wrench },
}

export const SERVICE_ICONS = Object.entries(icons).map(([value, meta]) => ({ value, ...meta }))

export const SERVICE_ICON_VALUES = SERVICE_ICONS.map((icon) => icon.value)

export function ServiceIcon({ name, ...props }) {
  const Icon = icons[name]?.Icon ?? MonitorCog
  return createElement(Icon, props)
}
