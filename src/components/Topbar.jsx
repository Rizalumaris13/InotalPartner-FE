import { Menu, ChevronRight } from 'lucide-react'
import { navItems } from '../data/dashboardNavItems'
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

    </header>
  )
}
