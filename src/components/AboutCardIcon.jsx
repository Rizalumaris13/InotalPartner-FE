import { ABOUT_CARD_ICONS } from '../data/aboutCardIcons'

export default function AboutCardIcon({ name, size = 22, className = '' }) {
  const Icon = ABOUT_CARD_ICONS.find((item) => item.value === name)?.Icon
  return Icon ? (
    <Icon
      size={size}
      strokeWidth={1.6}
      className={className}
      aria-hidden="true"
    />
  ) : null
}
