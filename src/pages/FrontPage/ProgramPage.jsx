import PublicNavbar from "../../components/PublicNavbar"

export default function ProgramPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-white pt-[68px] font-sans">
        <PublicNavbar onNavigate={onNavigate} activePage="program" />
        <div className="mx-3 mt-6 flex flex-col items-center rounded-2xl border border-sky-100 bg-sky-50/40 px-6 py-12 text-center md:mx-4">
            <p className="text-sky-500 text-xs font-bold tracking-[0.2em] uppercase mb-3">
                Page
            </p>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Programs</h1>
            <p className="text-gray-400 text-base max-w-sm">
                This page is currently under development.
            </p>
            <button
                onClick={() => onNavigate?.('landing')}
                className="mt-8 text-sm text-sky-500 hover:text-sky-600 font-semibold transition-colors"
            >
                ← Back to Home
            </button>
        </div>
    </div>
    )
}