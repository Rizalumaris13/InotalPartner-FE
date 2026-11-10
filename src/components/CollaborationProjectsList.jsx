import { MoreHorizontal, Code2, GraduationCap, Layers, ServerCog, MonitorCog } from 'lucide-react'

const collaborationProjects = [
  {
    id: 1,
    partner: 'PT Maju Bersama',
    initials: 'MB',
    color: '#0ea5e9',
    project: 'Integrated Financial Application',
    service: 'Software Development',
    icon: Code2,
    progress: 72,
  },
  {
    id: 2,
    partner: 'Teknologi Nusantara',
    initials: 'TN',
    color: '#8b5cf6',
    project: 'Campus Learning Program',
    service: 'Training Development',
    icon: GraduationCap,
    progress: 45,
  },
  {
    id: 3,
    partner: 'DataCore Asia',
    initials: 'DA',
    color: '#10b981',
    project: 'ERP System Integration',
    service: 'System Integration',
    icon: Layers,
    progress: 88,
  },
  {
    id: 4,
    partner: 'InfraNet Group',
    initials: 'IG',
    color: '#f59e0b',
    project: 'Cloud Infrastructure & Monitoring',
    service: 'Ops & Maintenance',
    icon: ServerCog,
    progress: 31,
  },
  {
    id: 5,
    partner: 'CloudBridge ID',
    initials: 'CB',
    color: '#ef4444',
    project: 'Digital Transformation Consulting',
    service: 'IT Consultant',
    icon: MonitorCog,
    progress: 60,
  },
]

export default function CollaborationProjectsList() {
  return (
    <div className="xl:col-span-3 bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-sky-50 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest">Collaboration Projects</p>
          <h2 className="text-base font-bold text-gray-900 mt-0.5">Currently In Progress with Partners</h2>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="divide-y divide-slate-50">
        {collaborationProjects.map((item) => {
          const ServiceIcon = item.icon
          return (
            <div key={item.id} className="px-5 py-4 hover:bg-sky-50/40 transition-colors">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-extrabold shadow-sm mt-0.5"
                  style={{ backgroundColor: item.color }}
                >
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 leading-snug">{item.project}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-medium text-gray-600">{item.partner}</span>
                        <span>·</span>
                        <ServiceIcon size={11} className="text-sky-400" />
                        <span>{item.service}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-sky-600 shrink-0">{item.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.progress}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}