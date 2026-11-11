import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  Key,
  Pin,
  ChevronDown,
  House,
  MessageSquare,
  Info,
  Handshake,
  LayoutList,
  PanelsTopLeft,
} from 'lucide-react'
import { PAGE_BANNER_PAGES, PAGE_BANNER_ROLES } from '../data/pageBanners'
import { JOIN_SECTION_NAV_GROUP } from '../data/homepageJoinSection'
import { ABOUT_INTRO_NAV } from '../data/aboutIntro'
import { HOMEPAGE_SERVICES_NAV } from '../data/homepageServices'

export const navItems = [
  { key: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard, roles: ['super_admin','admin','operator','guest'] },
  { key: 'company',   label: 'Input Company', icon: Building2,       roles: ['super_admin','admin','operator'] },
  { 
    key: 'post',      
    label: 'Post',        
    icon: Pin,             
    roles: ['super_admin','admin','operator'],
    subItems: [
      { key: 'createPost', label: 'Create Post' },
      { key: 'listPost',   label: 'List Post' },
    ],
  },
  { key: 'contact',   label: 'Kontak',        icon: MessageSquare,   roles: ['super_admin','admin','operator'] },
  { 
    key: 'slider',      
    label: 'Home Page',        
    icon: House,             
    roles: ['super_admin','admin'],
    subGroups: [
      {
        key: 'homeSliderGroup',
        label: 'Slider',
        items: [
          { key: 'createSlider', label: 'Create Slider' },
          { key: 'listSlider',   label: 'List Slider' },
        ],
      },
      {
        key: 'homeTestimonialGroup',
        label: 'Testimoni',
        items: [
          { key: 'createTestimonial', label: 'Create Testimoni' },
          { key: 'listTestimonial',   label: 'List Testimoni' },
        ],
      },
      JOIN_SECTION_NAV_GROUP,
      {
        key: 'homeServicesGroup',
        label: HOMEPAGE_SERVICES_NAV.group,
        items: [
          { key: HOMEPAGE_SERVICES_NAV.key, label: HOMEPAGE_SERVICES_NAV.label },
        ],
      },
    ],
  },
  { 
    key: 'about',      
    label: 'About',        
    icon: Info,             
    roles: ['super_admin','admin'],
    subGroups: [
      {
        key: 'aboutIntroGroup',
        label: ABOUT_INTRO_NAV.group,
        items: [
          { key: ABOUT_INTRO_NAV.key, label: ABOUT_INTRO_NAV.label },
        ],
      },
      {
        key: 'aboutVideoGroup',
        label: 'Video Profil',
        items: [
          { key: 'createVideo', label: 'Create Video' },
          { key: 'listVideo',   label: 'List Video' },
          { key: 'videoSetting', label: 'Deskripsi Video' },
          {
            key: 'aboutHighlightGroup',
            label: 'Poin Video',
            isSubGroup: true,
            items: [
              { key: 'createVideoHighlight', label: 'Tambah Poin Video' },
              { key: 'listVideoHighlight',   label: 'Daftar Poin Video' },
            ],
          },
        ],
      },
      {
        key: 'aboutStatisticGroup',
        label: 'Statistik',
        items: [
          { key: 'createStatistic', label: 'Tambah Statistik' },
          { key: 'listStatistic',   label: 'List Statistik' },
        ],
      },
      {
        key: 'aboutSettingsGroup',
        label: 'Tim Kami',
        items: [
          { key: 'createAbout', label: 'Tambah Tim Kami' },
          { key: 'listAbout',   label: 'List Tim Kami' },
        ],
      },
      {
        key: 'aboutFAQGroup',
        label: 'FAQ',
        items: [
          { key: 'createFAQ',   label: 'Create FAQ' },
          { key: 'listFAQ',     label: 'List FAQ' },
        ],
      },
      {
        key: 'aboutJoinInvitationGroup',
        label: 'Ajakan Bergabung',
        items: [
          { key: 'createJoinInvitation', label: 'Tambah Ajakan Bergabung' },
          { key: 'listJoinInvitation',   label: 'Daftar Ajakan Bergabung' },
        ],
      },
    ],
  },
  {
    key: 'partners',
    label: 'Kemitraan',
    icon: Handshake,
    roles: ['super_admin', 'admin'],
  },
  {
    key: 'aboutCards',
    label: 'Kartu Tentang',
    icon: LayoutList,
    roles: ['super_admin', 'admin'],
  },
  { key: 'users',     label: 'Users',         icon: Users,           roles: ['super_admin','admin'] },
  {
    key: 'pageBanners',
    label: 'Banner Halaman',
    icon: PanelsTopLeft,
    roles: PAGE_BANNER_ROLES,
    subItems: PAGE_BANNER_PAGES.map((page) => ({
      key: page.navKey,
      label: page.name,
    })),
  },
  { key: 'settings',  label: 'Settings',      icon: Settings,        roles: ['super_admin','admin','operator','guest'] },
]

export default function Sidebar({ user, activeNav, setActiveNav, sidebarOpen, setSidebarOpen, onNavigate }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState({}) 
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    navItems.forEach(item => {
      // Level 1 subItems check (e.g. Post)
      if (item.subItems) {
        const isMatch = item.subItems.some(sub => sub.key === activeNav)
        if (isMatch) {
          setOpenDropdowns(prev => ({ ...prev, [item.key]: true }))
        }
      }

      // Level 2 subGroups check (e.g. Home Page & About)
      if (item.subGroups) {
        item.subGroups.forEach(group => {
          let isGroupMatch = false
          
          if (group.key === 'aboutSettingsGroup' && activeNav === 'formAboutMember') {
            isGroupMatch = true
          }

          if (group.items) {
            group.items.forEach(sub => {
              if (sub.key === activeNav) {
                isGroupMatch = true
              }
              // Jika ini nested group Level 3 (Poin Video)
              if (sub.isSubGroup && sub.items) {
                const isNestedMatch = sub.items.some(nested => nested.key === activeNav)
                if (isNestedMatch) {
                  isGroupMatch = true
                  setOpenDropdowns(prev => ({
                    ...prev,
                    [sub.key]: true,
                  }))
                }
              }
            })
          }

          if (isGroupMatch) {
            setOpenDropdowns(prev => ({
              ...prev,
              [item.key]: true,
              [group.key]: true,
            }))
          }
        })
      }
    })
  }, [activeNav])

  const handleLogout = () => {
    localStorage.removeItem('inotal_token')
    localStorage.removeItem('inotal_user')
    onNavigate?.('login')
  }

  const toggleDropdown = (key) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const initials = user?.full_name?.slice(0, 2).toUpperCase() || '??'
  const currentRole = (typeof user?.role === 'object' ? user?.role?.name : user?.role) || 'guest'
  const allowedNavItems = navItems.filter(item => item.roles.includes(currentRole))

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-sky-100
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-5 py-5 border-b border-sky-100 cursor-pointer shrink-0"
          onClick={() => onNavigate?.('landing')}
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <span className="text-white font-extrabold text-xs">IN</span>
          </div>
          <span className="font-extrabold text-base text-gray-900 tracking-tight">
            INOTAL <span className="text-sky-400">PARTNER</span>
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const hasSubItems = !!item.subItems
            const hasSubGroups = !!item.subGroups
            const hasChildren = hasSubItems || hasSubGroups
            const isOpen = openDropdowns[item.key]
            
            // Cek apakah ada anak aktif (level 1 atau level 2 atau level 3)
            const isSubItemActive = hasSubItems && item.subItems.some(sub => sub.key === activeNav)
            const isSubGroupActive = hasSubGroups && item.subGroups.some(group => {
              if (group.key === 'aboutSettingsGroup' && activeNav === 'formAboutMember') return true
              return group.items?.some(sub => {
                if (sub.key === activeNav) return true
                if (sub.isSubGroup && sub.items) {
                  return sub.items.some(nested => nested.key === activeNav)
                }
                return false
              })
            })
            const isActive = activeNav === item.key || isSubItemActive || isSubGroupActive

            return (
              <div key={item.key} className="flex flex-col space-y-1">
                {/* Menu Utama (Level 1) */}
                <button
                  type="button"
                  aria-expanded={hasSubItems ? Boolean(isOpen) : undefined}
                  aria-controls={hasSubItems && isOpen ? `sidebar-${item.key}` : undefined}
                  onClick={() => {
                    if (hasChildren) {
                      toggleDropdown(item.key)
                    } else {
                      setActiveNav(item.key)
                      setSidebarOpen(false)
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                    ${isActive
                      ? 'bg-sky-50 text-sky-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={17} className={isActive ? 'text-sky-500' : 'text-gray-400'} />
                    {item.label}
                  </div>
                  
                  {hasChildren && (
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-500' : 'text-gray-400'}`} 
                    />
                  )}
                </button>

                {/* Sub-items biasa (1 tingkat, misal: Post) */}
                {hasSubItems && isOpen && (
                  <div id={`sidebar-${item.key}`} role="group" aria-label={item.label} className="flex flex-col space-y-0.5 mt-0.5">
                    {item.subItems.map(subItem => {
                      const isSubActive = activeNav === subItem.key
                      return (
                        <button
                          key={subItem.key}
                          onClick={() => { 
                            setActiveNav(subItem.key)
                            setSidebarOpen(false) 
                          }}
                          className={`w-full py-2 pr-3 pl-11 rounded-xl text-sm font-medium transition-all text-left
                            ${isSubActive
                              ? 'text-sky-600 bg-sky-50/50'
                              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                          {subItem.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Sub-groups bertingkat (misal: Home Page & About) */}
                {hasSubGroups && isOpen && (
                  <div className="flex flex-col space-y-1 mt-0.5 pl-6 border-l-2 border-sky-100 ml-5">
                    {item.subGroups.map(group => {
                      const isGroupOpen = openDropdowns[group.key]
                      const isGroupActive = 
                        (group.key === 'aboutSettingsGroup' && activeNav === 'formAboutMember') ||
                        group.items?.some(sub => {
                          if (sub.key === activeNav) return true
                          if (sub.isSubGroup && sub.items) {
                            return sub.items.some(nested => nested.key === activeNav)
                          }
                          return false
                        })

                      return (
                        <div key={group.key} className="flex flex-col space-y-0.5">
                          {/* Kategori Header (Level 2) */}
                          <button
                            onClick={() => toggleDropdown(group.key)}
                            className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all text-left
                              ${isGroupActive
                                ? 'text-sky-600 bg-sky-50/70'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                          >
                            <span>{group.label}</span>
                            <ChevronDown 
                              size={14} 
                              className={`transition-transform duration-200 ${isGroupOpen ? 'rotate-180 text-sky-500' : 'text-gray-400'}`} 
                            />
                          </button>

                          {/* Kategori Items (Level 3) */}
                          {isGroupOpen && (
                            <div className="flex flex-col space-y-0.5 pl-3 border-l border-gray-100 ml-2 py-0.5">
                              {group.items.map(subItem => {
                                // Jika item ini adalah sub-grup bertingkat lagi (Poin Video)
                                if (subItem.isSubGroup) {
                                  const isNestedOpen = openDropdowns[subItem.key]
                                  const isNestedActive = subItem.items?.some(nested => nested.key === activeNav)

                                  return (
                                    <div key={subItem.key} className="flex flex-col space-y-0.5 pt-0.5">
                                      <button
                                        onClick={() => toggleDropdown(subItem.key)}
                                        className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all text-left
                                          ${isNestedActive
                                            ? 'text-sky-600 bg-sky-50/60'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                                      >
                                        <span>{subItem.label}</span>
                                        <ChevronDown 
                                          size={13} 
                                          className={`transition-transform duration-200 ${isNestedOpen ? 'rotate-180 text-sky-500' : 'text-gray-400'}`} 
                                        />
                                      </button>

                                      {/* Sub-menu di bawah Poin Video (Level 4) */}
                                      {isNestedOpen && (
                                        <div className="flex flex-col space-y-0.5 pl-3 border-l border-sky-100 ml-2 py-0.5">
                                          {subItem.items.map(nestedItem => {
                                            const isNestedItemActive = activeNav === nestedItem.key
                                            return (
                                              <button
                                                key={nestedItem.key}
                                                onClick={() => {
                                                  setActiveNav(nestedItem.key)
                                                  setSidebarOpen(false)
                                                }}
                                                className={`w-full py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-left
                                                  ${isNestedItemActive
                                                    ? 'text-sky-600 font-bold bg-sky-50/50'
                                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                                              >
                                                {nestedItem.label}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                }

                                const isSubActive = activeNav === subItem.key
                                return (
                                  <button
                                    key={subItem.key}
                                    onClick={() => { 
                                      setActiveNav(subItem.key)
                                      setSidebarOpen(false) 
                                    }}
                                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all text-left
                                      ${isSubActive
                                        ? 'text-sky-600 font-bold bg-sky-50/50'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                                  >
                                    {subItem.label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User pill + Logout */}
        <div className="px-3 py-4 border-t border-sky-100 shrink-0 space-y-2 relative" ref={menuRef}>
          {showUserMenu && (
            <div className="absolute bottom-[110px] left-3 w-52 bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  setActiveNav('changePassword')
                  setShowUserMenu(false)
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <Key size={16} />
                Change Password
              </button>
            </div>
          )}

          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sky-50 cursor-pointer hover:bg-sky-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate" title={user?.full_name}>
                {user?.full_name || 'Guest User'}
              </p>
              <p className="text-[10px] text-gray-400 truncate" title={user?.email}>
                {user?.email || 'No email available'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={17} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  )
}
