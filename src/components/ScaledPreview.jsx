import { useEffect, useRef, useState } from 'react'

// Pratinjau dirender pada lebar desktop tetap lalu diskalakan, karena kelas
// breakpoint Tailwind mengikuti lebar viewport, bukan lebar panel admin.
export const PREVIEW_WIDTH = 1280

export default function ScaledPreview({ children, width = PREVIEW_WIDTH }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [box, setBox] = useState({ scale: 1, height: 0 })

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return undefined
    const measure = () => {
      const available = outer.clientWidth
      const scale = available > 0 ? Math.min(1, available / width) : 1
      setBox({ scale, height: inner.offsetHeight * scale })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [width])

  return (
    <div ref={outerRef} className="relative w-full overflow-hidden"
      style={box.height ? { height: `${box.height}px` } : undefined}>
      <div ref={innerRef} style={{ width: `${width}px`, transform: `scale(${box.scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
}
