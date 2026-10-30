import {
  Lightbulb,
  Award,
  Headset,
  Handshake,
  Target,
  Rocket,
  ShieldCheck,
  Users,
  TrendingUp,
  Code2,
  BriefcaseBusiness,
  Globe,
} from 'lucide-react'
import schema from '../contracts/aboutCard.schema.json'

const icons = {
  lightbulb: { label: 'Lampu', Icon: Lightbulb },
  award: { label: 'Penghargaan', Icon: Award },
  headset: { label: 'Pendampingan', Icon: Headset },
  handshake: { label: 'Kemitraan', Icon: Handshake },
  target: { label: 'Target', Icon: Target },
  rocket: { label: 'Inovasi', Icon: Rocket },
  'shield-check': { label: 'Keamanan', Icon: ShieldCheck },
  users: { label: 'Tim', Icon: Users },
  'trending-up': { label: 'Pertumbuhan', Icon: TrendingUp },
  code: { label: 'Teknologi', Icon: Code2 },
  briefcase: { label: 'Bisnis', Icon: BriefcaseBusiness },
  globe: { label: 'Jaringan', Icon: Globe },
}

export const ABOUT_CARD_ICONS = schema.properties.icon.enum.map((value) => ({
  value,
  ...icons[value],
}))
