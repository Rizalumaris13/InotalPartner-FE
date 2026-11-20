import { createElement } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { navItems } from '../data/dashboardNavItems'

export default function PlaceholderPage({ activeNav }) {
  const item = navItems.find((item) => item.key === activeNav)
  return (
    <div className="flex flex-col items-center rounded-2xl border border-sky-100 bg-white p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
        {createElement(item?.icon || LayoutDashboard, {
          size: 28,
          className: 'text-sky-400',
        })}
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">
        {item?.label}
      </h2>
      <p className="text-sm text-gray-400 max-w-xs">
        Halaman ini sedang dalam pengembangan. Fitur akan tersedia setelah selesai disiapkan.
      </p>
    </div>
  )
}