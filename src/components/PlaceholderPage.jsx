import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import { navItems } from '../data/dashboardNavItems'

export default function PlaceholderPage({ activeNav }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4">
        {React.createElement(navItems.find(n => n.key === activeNav)?.icon || LayoutDashboard, {
          size: 28,
          className: 'text-sky-400',
        })}
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">
        {navItems.find(n => n.key === activeNav)?.label}
      </h2>
      <p className="text-sm text-gray-400 max-w-xs">
        This page is under development. Features will be available soon.
      </p>
    </div>
  )
}