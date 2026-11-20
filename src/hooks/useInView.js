import { useEffect, useRef, useState } from 'react'

export default function useInView({ threshold = 0.1, fallbackMs = 700 } = {}) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true)
        observer.disconnect()
      }
    }, { threshold })
    observer.observe(element)

    // Tanpa fallback, konten dan angka bisa tersembunyi saat observer tidak terpicu.
    const timer = setTimeout(() => setSeen(true), fallbackMs)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [threshold, fallbackMs])

  return [ref, seen]
}
