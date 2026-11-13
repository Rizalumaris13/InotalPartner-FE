import { useState, useRef, useEffect } from 'react'
import {
  Menu,
  ChevronRight,
  ChevronDown,
  User,
  Key,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react'
import { navItems } from './Sidebar'
import { JOIN_SECTION_NAV_GROUP } from '../data/homepageJoinSection'
import { ABOUT_INTRO_NAV } from '../data/aboutIntro'
import { HOMEPAGE_SERVICES_NAV } from '../data/homepageServices'
import { useAuth } from '../hooks/useAuth'

// Jumlah notifikasi sementara (dapat dihubungkan ke API notifikasi nantinya)
const NOTIFICATION_COUNT = 3

export default function Topbar({
  activeNav,
  setSidebarOpen,
  user: userProp,
  setActiveNav,
  onNavigate,
}) {
  const { user: authUser, role: authRole, logout } = useAuth()
  const user = userProp || authUser
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    authRole ||
    'guest'
  const isGuest = currentRole === 'guest'
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    if (logout) {
      logout()
    } else {
      localStorage.removeItem('inotal_token')
      localStorage.removeItem('inotal_user')
    }
    onNavigate?.('login')
  }

  const handleMenuClick = (navKey) => {
    setDropdownOpen(false)
    setActiveNav?.(navKey)
  }

  const initials = user?.full_name?.slice(0, 2).toUpperCase() || '??'
  const displayName = user?.full_name || 'Guest User'
  const getActiveLabel = () => {
    if (activeNav === 'dashboard') return 'Dashboard'
    if (activeNav === 'profile') return 'Profil'
    if (activeNav === 'changePassword') return 'Ubah Password'
    if (activeNav === 'settings') return 'Pengaturan Aplikasi'
    if (activeNav === 'formAboutMember') return 'About / Form Member'

    const joinItem = JOIN_SECTION_NAV_GROUP.items.find((item) => item.key === activeNav)
    if (joinItem) return `Home Page / ${JOIN_SECTION_NAV_GROUP.label} / ${joinItem.label}`

    if (activeNav === ABOUT_INTRO_NAV.key) {
      return `${ABOUT_INTRO_NAV.parent} / ${ABOUT_INTRO_NAV.group} / ${ABOUT_INTRO_NAV.label}`
    }

    if (activeNav === HOMEPAGE_SERVICES_NAV.key) {
      return `${HOMEPAGE_SERVICES_NAV.parent} / ${HOMEPAGE_SERVICES_NAV.group} / ${HOMEPAGE_SERVICES_NAV.label}`
    }

    for (const item of navItems) {
      if (item.key === activeNav) return item.label
      if (item.subItems) {
        const sub = item.subItems.find((s) => s.key === activeNav)
        if (sub) return `${item.label} / ${sub.label}`
      }
      if (item.subGroups) {
        for (const group of item.subGroups) {
          if (group.items) {
            for (const sub of group.items) {
              if (sub.key === activeNav) return `${item.label} / ${group.label} / ${sub.label}`
              if (sub.isSubGroup && sub.items) {
                const nested = sub.items.find((n) => n.key === activeNav)
                if (nested) return `${item.label} / ${group.label} / ${sub.label} / ${nested.label}`
              }
            }
          }
        }
      }
    }

    return activeNav
  }

  return (
    <header className="h-14 bg-white border-b border-sky-100 flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden text-gray-400 hover:text-gray-700"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
          <span>Home</span>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium capitalize">
            {getActiveLabel()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Button (hanya untuk role guest) */}
        {isGuest && (
          <button
            type="button"
            aria-label="Notifikasi"
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <Bell size={18} />
            {NOTIFICATION_COUNT > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none shadow-sm">
                {NOTIFICATION_COUNT > 99 ? '99+' : NOTIFICATION_COUNT}
              </span>
            )}
          </button>
        )}

        {/* User profile dropdown (Shopee-style) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
            )}

            <span className="hidden md:inline-block text-xs font-medium text-gray-700 max-w-[140px] truncate">
              {displayName}
            </span>

            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-sky-500' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User quick info in dropdown */}
              <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-xs font-semibold text-gray-800 truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[11px] text-gray-400 truncate" title={user?.email}>
                  {user?.email || 'No email available'}
                </p>
              </div>

              {/* 1. Profile */}
              <button
                type="button"
                onClick={() => handleMenuClick('profile')}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-slate-50 hover:text-sky-600 transition-colors text-left"
              >
                <User size={15} className="text-gray-400" />
                <span>Profile</span>
              </button>

              {/* 2. Change Password */}
              <button
                type="button"
                onClick={() => handleMenuClick('changePassword')}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-slate-50 hover:text-sky-600 transition-colors text-left"
              >
                <Key size={15} className="text-gray-400" />
                <span>Change Password</span>
              </button>

              {/* 3. Application Settings */}
              <button
                type="button"
                onClick={() => handleMenuClick('settings')}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-slate-50 hover:text-sky-600 transition-colors text-left"
              >
                <Settings size={15} className="text-gray-400" />
                <span>Application Settings</span>
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-gray-100" />

              {/* 4. Log Out */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
              >
                <LogOut size={15} className="text-red-500" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
