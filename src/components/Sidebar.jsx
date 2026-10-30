import { useState, useEffect, useRef } from 'react'
import { LogOut, Key, ChevronDown } from 'lucide-react'
import { navItems } from '../data/dashboardNavItems'

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
      if (item.subItems && item.subItems.some(sub => sub.key === activeNav)) {
        setOpenDropdowns(prev => ({ ...prev, [item.key]: true }))
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
  const currentRole = user?.role || 'guest'
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
            const isOpen = openDropdowns[item.key]
            
            const isSubItemActive = hasSubItems && item.subItems.some(sub => sub.key === activeNav)
            const isActive = activeNav === item.key || isSubItemActive

            return (
              <div key={item.key} className="flex flex-col space-y-1">
                <button
                  onClick={() => {
                    if (hasSubItems) {
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
                  
                  {hasSubItems && (
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-500' : 'text-gray-400'}`} 
                    />
                  )}
                </button>

                {/* Sub-items: Teks sejajar dengan label induk, tanpa kotak pembungkus */}
                {hasSubItems && isOpen && (
                  <div className="flex flex-col space-y-0.5 mt-0.5">
                    {item.subItems.map(subItem => {
                      const isSubActive = activeNav === subItem.key
                      return (
                        <button
                          key={subItem.key}
                          onClick={() => { 
                            setActiveNav(subItem.key)
                            setSidebarOpen(false) 
                          }}
                          /* pl-11 (44px) mensejajarkan teks dropdown tepat dengan teks "Post" */
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