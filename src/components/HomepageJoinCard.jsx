export default function HomepageJoinCard({ card }) {
  const number = String(card.position).padStart(2, '0')
  return (
    <article aria-label={`Card ${number}`} className="group flex gap-5 items-start p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:bg-[#1a202c] transition-all duration-300 cursor-pointer">
      <span className="shrink-0 text-gray-300 group-hover:text-white font-bold text-3xl transition-colors duration-300">{number}</span>
      <div className="min-w-0">
        <h3 className="break-words text-xl font-bold text-[#0f172a] group-hover:text-white mb-2 transition-colors duration-300">{card.title}</h3>
        <p className="break-words whitespace-pre-line text-gray-500 group-hover:text-gray-300 text-sm leading-relaxed transition-colors duration-300">{card.description}</p>
      </div>
    </article>
  )
}
