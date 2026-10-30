import { MapPin } from 'lucide-react'
import { socialLinks } from '../data/socialLinks'

const footerProfil = ['Tentang', 'Visi Misi', 'Kemitraan', 'Event']

const footerPartnership = [
  'Bergabung Sekarang',
  'InotalHub Tech',
  'Group & Div',
  'Kontak',
]

export default function PublicFooter({ onNavigate }) {
  return (
    <footer className="bg-gray-900 text-gray-400 px-6 pt-14 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] gap-10 mb-12">
          {/* Identitas dan kontak */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                <span className="text-white font-extrabold text-xs">
                  IN
                </span>
              </div>

              <span className="font-extrabold text-lg text-white tracking-tight">
                INOTAL
                <span className="text-sky-400"> PARTNER</span>
              </span>
            </div>

            <p className="text-sm leading-relaxed text-gray-400 mb-5">
              Menyatukan potensi bangsa tuk kebangkitan emas 2045
            </p>

            <div className="flex items-start gap-2 text-sm text-gray-500 mb-2">
              <MapPin
                size={14}
                className="mt-0.5 flex-shrink-0 text-sky-500"
              />
              <span>
                Jl. Placeholder No. 123, Jakarta Selatan,
                DKI Jakarta 12345
              </span>
            </div>
          </div>

          {/* Navigasi profil */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 tracking-wider uppercase">
              Profil
            </h4>

            <ul className="space-y-3">
              {footerProfil.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate?.(item)
                    }}
                    className="text-sm text-gray-500 hover:text-sky-400 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigasi partnership */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 tracking-wider uppercase">
              Partnership
            </h4>

            <ul className="space-y-3">
              {footerPartnership.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate?.(item)
                    }}
                    className="text-sm text-gray-500 hover:text-sky-400 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Media sosial di sisi kanan footer */}
          <nav
            aria-label="Media sosial"
            className="flex items-start gap-3 lg:justify-self-end"
          >
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
              className="w-11 h-11 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:bg-green-500 hover:border-green-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 transition-colors"
            >
              {/* Logo WhatsApp dari Simple Icons: simpleicons.org. */}
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="w-11 h-11 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:bg-pink-500 hover:border-pink-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </nav>
        </div>

        {/* Copyright dan kebijakan */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex gap-5">
            <a
              href="#"
              className="hover:text-sky-400 transition-colors"
            >
              Kebijakan Privasi
            </a>

            <span>|</span>

            <a
              href="#"
              className="hover:text-sky-400 transition-colors"
            >
              Kebijakan Pengguna
            </a>
          </div>

          <span>Copyright © {new Date().getFullYear()} INOTAL Partner</span>
        </div>
      </div>
    </footer>
  )
}