
const activePartners = [
  { id: 1, name: 'PT Maju Bersama', type: 'Enterprise', since: 'Jan 2026', status: 'active', projects: 3 },
  { id: 2, name: 'Teknologi Nusantara', type: 'Startup', since: 'Mar 2026', status: 'active', projects: 1 },
  { id: 3, name: 'DataCore Asia', type: 'Enterprise', since: 'Nov 2025', status: 'active', projects: 2 },
  { id: 4, name: 'Solusi Digital', type: 'Government', since: 'Feb 2026', status: 'on-hold', projects: 1 },
  { id: 5, name: 'InfraNet Group', type: 'Enterprise', since: 'May 2024', status: 'active', projects: 4 },
  { id: 6, name: 'CloudBridge ID', type: 'Startup', since: 'Jun 2025', status: 'active', projects: 2 },
]

const statusStyle = {
  active: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  'on-hold': 'bg-amber-50 text-amber-600 border border-amber-200',
  completed: 'bg-sky-50 text-sky-600 border border-sky-200',
}

const statusLabel = {
  active: 'Active',
  'on-hold': 'On Hold',
  completed: 'Completed',
}

export default function ActivePartnersList() {
  return (
    <div className="xl:col-span-2 bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-sky-50 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest">Active Partners</p>
          <h2 className="text-base font-bold text-gray-900 mt-0.5">Collaborating Companies</h2>
        </div>
        <span className="text-xs bg-sky-50 text-sky-600 border border-sky-200 font-semibold px-2.5 py-1 rounded-full">
          {activePartners.length} total
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {activePartners.map((partner) => (
          <div key={partner.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-sky-50/40 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-extrabold"
                style={{ background: `hsl(${(partner.id * 53) % 360}, 65%, 55%)` }}
              >
                {partner.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{partner.name}</p>
                <p className="text-xs text-gray-400">{partner.type} · since {partner.since}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-gray-400 hidden sm:block">{partner.projects} projects</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyle[partner.status]}`}>
                {statusLabel[partner.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}