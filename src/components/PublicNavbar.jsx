import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function PublicNavbar({ onNavigate, activePage, scrolled }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Home',        page: 'landing'      },
    { label: 'About',       page: 'tentang'      },
    { label: 'Programs',    page: 'program'      },
    { label: 'Events',      page: 'event'        },
    { label: 'News',        page: 'berita'       },
    { label: 'Articles',    page: 'artikel'      },
    { label: 'Partnership', page: 'partnership'  },
    { label: 'Contact',     page: 'kontak'       },
  ]

  const handleNav = (page) => {
    setMenuOpen(false)
    onNavigate?.(page)
  }

  // Transparent at top of hero, solid white after scroll
  const isHero = activePage === 'landing'
  const transparent = isHero && !scrolled && !menuOpen

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent border-transparent'
          : 'bg-white/95 backdrop-blur border-b border-sky-100 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <button
          className="flex items-center gap-2"
          onClick={() => handleNav('landing')}
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <span className="text-white font-extrabold text-xs tracking-tight">IN</span>
          </div>
          <span className={`font-extrabold text-lg tracking-tight transition-colors ${
            transparent ? 'text-white' : 'text-gray-900'
          }`}>
            INOTAL <span className="text-sky-400">PARTNER</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden xl:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => handleNav(page)}
              className={`transition-colors ${
                activePage === page
                  ? 'text-sky-400 font-semibold'
                  : transparent
                    ? 'text-white/80 hover:text-white'
                    : 'text-gray-500 hover:text-sky-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden xl:flex items-center gap-3">
          <button
            onClick={() => handleNav('login')}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
              transparent
                ? 'text-white border-white/30 hover:border-white/60 hover:bg-white/10'
                : 'text-gray-600 border-gray-200 hover:text-sky-500 hover:border-sky-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleNav('register')}
            className="text-sm bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg transition-colors font-semibold"
          >
            Join Us
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className={`xl:hidden transition-colors ${transparent ? 'text-white' : 'text-gray-500'}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu — always solid white */}
      {menuOpen && (
        <div className="xl:hidden bg-white border-t border-sky-100 px-6 py-4 flex flex-col gap-3 text-sm text-gray-600">
          {navLinks.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => handleNav(page)}
              className={`text-left py-1 font-medium transition-colors ${
                activePage === page ? 'text-sky-500' : 'hover:text-sky-500'
              }`}
            >
              {label}
            </button>
          ))}
          <hr className="border-sky-100 my-1" />
          <button
            onClick={() => handleNav('login')}
            className="text-left text-gray-700 font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => handleNav('register')}
            className="bg-sky-500 text-white px-4 py-2 rounded-lg w-fit font-semibold text-sm"
          >
            Join Us
          </button>
        </div>
      )}
    </nav>
  )
}