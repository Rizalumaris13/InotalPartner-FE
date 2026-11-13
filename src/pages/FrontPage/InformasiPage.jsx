import PublicNavbar from "../../components/PublicNavbar"

export default function InformasiPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-white font-sans">
        <PublicNavbar onNavigate={onNavigate} activePage="informasi" />
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
            <p className="text-sky-500 text-xs font-bold tracking-[0.2em] uppercase mb-3">
                Page
            </p>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Information</h1>
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