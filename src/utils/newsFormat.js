export function formatDate(iso) {
  if (!iso) return '-'

  try {
    return new Date(iso).toLocaleDateString(
      'id-ID',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }
    )
  } catch {
    return '-'
  }
}

export function formatTime(iso) {
  if (!iso) return '--:--'

  try {
    return new Date(iso).toLocaleTimeString(
      'id-ID',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
      }
    )
  } catch {
    return '--:--'
  }
}

export function formatViewCount(value) {
  return Number(value || 0).toLocaleString('id-ID')
}
