import { Menu, ChevronRight } from 'lucide-react'
import { navItems } from './Sidebar'
import { JOIN_SECTION_NAV_GROUP } from '../data/homepageJoinSection'
import { ABOUT_INTRO_NAV } from '../data/aboutIntro'
import { HOMEPAGE_SERVICES_NAV } from '../data/homepageServices'

export default function Topbar({ activeNav, setSidebarOpen }) {
  const getActiveLabel = () => {
    if (activeNav === 'dashboard') return 'Dashboard'
    if (activeNav === 'formAboutMember') return 'About / Form Member'
    if (activeNav === 'changePassword') return 'Change Password'

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

      {/*
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="text-xs bg-transparent outline-none text-gray-600 w-36 placeholder:text-gray-300"
          />
          <span className="text-[10px] text-gray-300 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">⌘K</span>
        </div>

        <button className="relative w-8 h-8 rounded-lg hover:bg-sky-50 flex items-center justify-center transition-colors">
          <Bell size={16} className="text-gray-500" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500" />
        </button>

        <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AD</span>
        </div>
      </div>
      */}
    </header>
  )
}
