import { Menu, ChevronRight } from 'lucide-react'
import { navItems } from '../data/dashboardNavItems'

export default function Topbar({ activeNav, setSidebarOpen }) {
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
            {activeNav === 'dashboard' ? 'Dashboard' : navItems.find(n => n.key === activeNav)?.label}
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