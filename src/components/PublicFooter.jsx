import React from 'react'
import { MapPin } from 'lucide-react'
import { socialLinks } from '../data/socialLinks'

export default function PublicFooter({ onNavigate }) {
  // Navigasi Kolom Explore: Halaman utama yang valid dan aktif di App.jsx
  const exploreLinks = [
    { label: 'Home', target: 'landing' },
    { label: 'About', target: 'tentang' },
    { label: 'Programs', target: 'program' },
    { label: 'Events', target: 'event' },
    { label: 'News', target: 'berita' },
    { label: 'Articles', target: 'artikel' },
  ]

  // Navigasi Kolom Company: Identitas & Kemitraan resmi
  // Catatan:
  // - Partnership mengarah ke halaman 'partnership'
  // - Vision & Mission mengarah ke section / halaman 'tentang'
  // - InotalHub Tech & Group & Division dipertahankan dengan fallback interaktif (arahkan ke 'partnership' jika diklik)
  const companyLinks = [
    { label: 'Vision & Mission', target: 'tentang' },
    { label: 'Partnership', target: 'partnership' },
    { label: 'InotalHub Tech', target: 'partnership' },
    { label: 'Group & Division', target: 'partnership' },
  ]

  // Konfigurasi Ikon Media Sosial Dinamis dari socialLinks
  const availableSocials = [
    {
      id: 'whatsapp',
      url: socialLinks?.whatsapp,
      label: 'WhatsApp',
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
      hoverClasses: 'hover:bg-emerald-600 hover:border-emerald-500 hover:text-white',
    },
    {
      id: 'instagram',
      url: socialLinks?.instagram,
      label: 'Instagram',
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      hoverClasses: 'hover:bg-pink-600 hover:border-pink-500 hover:text-white',
    },
  ].filter((item) => Boolean(item.url && item.url.trim() !== ''))

  return (
    <footer className="bg-[#0b1329] text-gray-400 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
        {/* ── 4 Kolom Utama Footer ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
          
          {/* Kolom A: Brand (Logo, Deskripsi, Alamat) */}
          <div className="lg:col-span-4 space-y-4">
            <button
              type="button"
              onClick={() => onNavigate?.('landing')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-xs group-hover:bg-sky-400 transition-colors">
                <span className="text-white font-extrabold text-sm tracking-tight">
                  IN
                </span>
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                INOTAL
                <span className="text-sky-400"> PARTNER</span>
              </span>
            </button>

            <p className="text-sm leading-relaxed text-gray-300 max-w-sm">
              Empowering the nation's potential for the 2045 golden generation.
            </p>

            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-400 pt-1">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0 text-sky-400"
                aria-hidden="true"
              />
              <span className="leading-relaxed">
                Bandung, West Java, Indonesia
              </span>
            </div>
          </div>

          {/* Kolom B: Explore (Navigasi Halaman Utama) */}
          <div className="lg:col-span-3 sm:pl-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              {exploreLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={`#${item.target}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate?.(item.target)
                    }}
                    className="text-gray-300 hover:text-sky-400 transition-colors inline-block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom C: Company (Identitas & Kemitraan) */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={`#${item.target}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate?.(item.target)
                    }}
                    className="text-gray-300 hover:text-sky-400 transition-colors inline-block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom D: Connect With Us (Media Sosial Berupa Ikon Saja) */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-4">
              Connect With Us
            </h4>
            <nav aria-label="Social Media Links" className="flex items-center gap-3 flex-wrap">
              {availableSocials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className={`w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-gray-300 shadow-xs transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${social.hoverClasses}`}
                >
                  {social.icon}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Garis Pemisah & Bagian Bawah Footer (Bottom Bar) ───────────── */}
        <div className="border-t border-slate-800/90 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-4 sm:gap-6 order-2 md:order-1">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="hover:text-sky-400 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-slate-700" aria-hidden="true">•</span>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="hover:text-sky-400 transition-colors"
            >
              Terms of Service
            </a>
          </div>

          <p className="order-1 md:order-2 text-center md:text-right">
            Copyright © 2026 INOTAL Partner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
