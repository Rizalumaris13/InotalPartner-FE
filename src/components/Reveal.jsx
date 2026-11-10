import useInView from '../hooks/useInView'

export default function Reveal({ children, delay = 0, className = '', animate = true }) {
  const [ref, seen] = useInView()
  const shown = !animate || seen

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
