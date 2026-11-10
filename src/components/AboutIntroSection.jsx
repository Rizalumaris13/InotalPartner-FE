import Reveal from './Reveal'
import useInView from '../hooks/useInView'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { resolveImageUrl } from '../api/posts'
import { DEFAULT_ABOUT_INTRO } from '../data/aboutIntro'

function SubTitle({ children }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold tracking-[0.14em] uppercase text-[#0c4a6e] border border-dashed border-gray-300 rounded-md px-5 py-2.5 mb-6 bg-white">
      {children}
    </span>
  )
}

function PillButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-3 rounded-full pl-7 pr-1.5 py-1.5 text-[15px] font-semibold transition-all bg-[#0284c7] text-white hover:bg-[#0c4a6e]"
    >
      <span>{children}</span>
      <span className="w-9 h-9 rounded-full bg-white text-sky-600 flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-45deg]">
        <ArrowRight size={16} strokeWidth={2.5} />
      </span>
    </button>
  )
}

function ProgressBars({ rows, animate }) {
  // Bar mengisi saat kartu terlihat; tanpa animasi (pratinjau) langsung penuh.
  const [ref, seen] = useInView({ threshold: 0.4, fallbackMs: 1200 })
  const filled = !animate || seen
  return (
    <div ref={ref} className="space-y-4">
      {rows.map(({ label, percent }, index) => (
        <div key={`${label}-${index}`}>
          <div className="flex justify-between text-[12px] font-semibold mb-1.5">
            <span className="text-[#364e52]">{label}</span>
            <span className="text-[#0284c7]">{percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0284c7] transition-all duration-[1400ms] ease-out"
              style={{ width: filled ? `${percent}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const cards = [
  { key: 'mission', dot: 'bg-[#0284c7]' },
  { key: 'vision', dot: 'bg-sky-500' },
]

// `preview` memaksa tata letak desktop supaya pratinjau admin sama persis
// dengan halaman pada lebar tetap 1280px, berapa pun lebar panelnya.
export default function AboutIntroSection({ intro = DEFAULT_ABOUT_INTRO, onNavigate, animate = true, preview = false }) {
  return (
    <section className={`bg-[#F0F4F8] ${preview ? 'py-16' : 'py-12 md:py-16'}`}>
      <div className={`max-w-7xl mx-auto px-6 grid items-center ${preview ? 'grid-cols-2 gap-10' : 'gap-8 lg:grid-cols-[0.85fr_1.15fr] xl:grid-cols-2 xl:gap-10'}`}>
        <Reveal className={preview ? 'relative' : 'relative mb-8 lg:mb-0'} animate={animate}>
          <div className="rounded-2xl overflow-hidden">
            <img
              src={resolveImageUrl(intro.photo_url)}
              alt={intro.photo_alt}
              className={`w-full object-cover ${preview ? 'h-[500px]' : 'h-[420px] md:h-[500px]'}`}
              loading="lazy"
            />
          </div>
          <div className={`absolute -bottom-8 bg-white rounded-xl shadow-xl border border-gray-100 px-7 py-6 w-[280px] ${preview ? 'left-10' : 'left-6 md:left-10'}`}>
            <h4 className="font-bold text-[15px] mb-4">{intro.progress_title}</h4>
            <ProgressBars rows={intro.progress} animate={animate} />
          </div>
        </Reveal>
        <div className="min-w-0">
          <Reveal animate={animate}>
            <SubTitle>{intro.eyebrow}</SubTitle>
            <h2 className={`${preview ? 'text-[42px]' : 'text-3xl md:text-[42px]'} font-extrabold tracking-tight leading-[1.18] mb-8`}>
              {intro.headline}{' '}
              <span className="text-[#0284c7]">{intro.headline_accent}</span>
            </h2>
          </Reveal>

          <div className={`grid ${preview ? 'grid-cols-2' : 'sm:grid-cols-2'} gap-6 mb-8`}>
            {cards.map(({ key, dot }, index) => {
              const card = intro[key]
              return (
                <Reveal key={key} delay={index * 120} animate={animate}>
                  <div className="bg-white rounded-xl border border-gray-200/80 p-6 h-full hover:border-[#0284c7]/50 transition-colors">
                    <h3 className="text-lg font-bold mb-2.5 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      {card.title}
                    </h3>
                    <p className="text-[13.5px] leading-relaxed text-[#364e52] mb-4">{card.description}</p>
                    <ul className="space-y-2.5">
                      {card.items.map((item, itemIndex) => (
                        <li key={`${item}-${itemIndex}`} className="flex items-start gap-2 text-[13px] text-[#0c4a6e]">
                          <CheckCircle2 size={15} className="text-[#0284c7] shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )
            })}
          </div>

          <Reveal delay={200} animate={animate}>
            <PillButton onClick={() => onNavigate?.(intro.cta_target)}>{intro.cta_label}</PillButton>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
