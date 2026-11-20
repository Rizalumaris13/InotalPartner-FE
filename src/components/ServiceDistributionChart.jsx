import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

const pieData = [
  { name: 'IT Consultant', value: 32 },
  { name: 'Software Dev', value: 27 },
  { name: 'Sys Integration', value: 18 },
  { name: 'Training', value: 12 },
  { name: 'Ops & Maintenance', value: 7 },
  { name: 'Resource Mgmt', value: 4 },
]
const PIE_COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0369a1', '#075985', '#bae6fd']

export default function ServiceDistributionChart() {
  return (
    <div className="xl:col-span-2 bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-1">Service Distribution</p>
        <h2 className="text-base font-bold text-gray-900">Active Service Composition</h2>
        <p className="text-xs text-gray-400 mt-0.5">Based on ongoing projects</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(value) => <span style={{ fontSize: 10, color: '#64748b' }}>{value}</span>}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Share']}
            contentStyle={{
              fontSize: 12,
              borderRadius: 10,
              border: '1px solid #e0f2fe',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}