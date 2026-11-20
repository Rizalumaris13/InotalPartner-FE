import { TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const barData = [
  { month: 'Jan', active: 4 },
  { month: 'Feb', active: 6 },
  { month: 'Mar', active: 5 },
  { month: 'Apr', active: 8 },
  { month: 'May', active: 7 },
  { month: 'Jun', active: 11 },
  { month: 'Jul', active: 9 },
  { month: 'Aug', active: 13 },
  { month: 'Sep', active: 10 },
  { month: 'Oct', active: 15 },
  { month: 'Nov', active: 14 },
  { month: 'Dec', active: 17 },
]

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-sky-100 rounded-xl px-4 py-2.5 shadow-lg">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-sky-600">{payload[0].value} partnerships</p>
      </div>
    )
  }
  return null
}

export default function MonthlyActivityChart() {
  return (
    <div className="xl:col-span-3 bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-1">Monthly Activity</p>
          <h2 className="text-base font-bold text-gray-900">Active Partnership Trends</h2>
          <p className="text-xs text-gray-400 mt-0.5">Number of active partnerships per month — 2026</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          <TrendingUp size={12} />
          +21% YoY
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={barData} barSize={18} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f0f9ff' }} />
          <Bar dataKey="active" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}