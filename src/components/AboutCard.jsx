import { ArrowRight } from 'lucide-react'
import AboutCardIcon from './AboutCardIcon'
import {
  formatAboutCardPosition,
  getAboutCardTarget,
} from '../utils/aboutCards'

export default function AboutCard({ card, onNavigate, preview = false }) {
  const target = getAboutCardTarget(card.url)
  const Wrapper = !preview && target ? 'a' : 'div'
  const navigate = (event) => {
    if (
      target?.kind !== 'internal' ||
      !onNavigate ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    event.preventDefault()
    onNavigate(target.route)
  }

  return (
    <article className="h-full min-w-0">
      <Wrapper
        {...(!preview && target
          ? {
              href: target.href,
              onClick: navigate,
              'aria-label': `Selengkapnya: ${card.title}`,
              ...(target.kind === 'external'
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {}),
            }
          : {})}
        className="group relative block h-full overflow-hidden rounded-xl border border-gray-200/80 bg-white p-8 transition-colors hover:border-[#0284c7]/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
      >
        <span
          aria-hidden="true"
          className="absolute -top-2 right-4 select-none text-[88px] font-extrabold leading-none text-[#F0F4F8] transition-colors duration-500 group-hover:text-[#0284c7]/15"
        >
          {formatAboutCardPosition(card.sort_order)}
        </span>
        <span className="relative mb-16 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#F0F4F8] transition-colors duration-500 group-hover:bg-[#0284c7]">
          <AboutCardIcon
            name={card.icon}
            className="text-[#0284c7] transition-colors duration-500 group-hover:text-white"
          />
        </span>
        <h3 className="relative mb-3 break-words text-xl font-bold">
          {card.title}
        </h3>
        <p className="relative mb-6 whitespace-pre-line break-words text-[14.5px] leading-relaxed text-[#364e52]">
          {card.description}
        </p>
        <span className="relative inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0284c7]">
          Selengkapnya
          <ArrowRight
            size={14}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1.5"
          />
        </span>
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-1 w-0 bg-sky-500 transition-all duration-500 group-hover:w-full"
        />
      </Wrapper>
    </article>
  )
}
