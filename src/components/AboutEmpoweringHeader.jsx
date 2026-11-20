export default function AboutEmpoweringHeader({ configuration, preview = false }) {
  return (
    <>
      <span className="inline-flex max-w-full items-center gap-1 text-[12px] font-bold tracking-[0.14em] uppercase text-[#0c4a6e] border border-dashed border-gray-300 rounded-md px-5 py-2.5 mb-6 bg-white [overflow-wrap:anywhere]">
        {configuration.label}
      </span>
      <h2 className={`${preview ? 'text-5xl' : 'text-3xl md:text-5xl'} font-extrabold tracking-tight leading-[1.15] max-w-2xl [overflow-wrap:anywhere]`}>
        {configuration.title}
        {configuration.title_accent && <>{' '}<span className="text-[#0284c7]">{configuration.title_accent}</span></>}
      </h2>
    </>
  )
}
