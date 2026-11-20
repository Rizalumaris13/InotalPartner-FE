// Ikon kecil khusus kategori peluang, mengikuti garis dan warna dashboard yang ada.
const PATHS = {
  graduation: <><path d="m2 9 10-5 10 5-10 5-10-5Z" /><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v7" /></>,
  investment: <><path d="M4 20h16M6 16v-4M12 16V9M18 16V5M4 8l6-4 5 2 5-4" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12c6 4 12 4 18 0M12 12v4" /></>,
  handshake: <><path d="m2 8 4-3 5 2 2-1h4l5 4-3 8-4 3-7-3-4-6M8 9l4-2 5 4-3 3-4-3M6 15l5 4M9 13l7 6" /></>,
  project: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18m-13 6 3 3 5-6" /></>,
}

export default function CompanyIcon({ kind, className = '', size = 20 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[kind]}
    </svg>
  )
}
