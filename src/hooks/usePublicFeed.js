import { useEffect, useState } from 'react'

export default function usePublicFeed({ load, mapItem, errorMessage }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchFeed = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await load()
        // Helper API mengembalikan body; daftar publik masih dibungkus data.data.
        const data = response?.data?.data || []
        const formatted = data.map(mapItem)
        if (isMounted) setItems(formatted)
      } catch (error) {
        console.error(`${errorMessage}:`, error)
        if (isMounted) {
          setError(error.response?.data?.message || errorMessage)
          setItems([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchFeed()
    return () => { isMounted = false }
  }, [load, mapItem, errorMessage])

  return { items, loading, error }
}
