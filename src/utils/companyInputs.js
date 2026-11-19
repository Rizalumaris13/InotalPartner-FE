export function emptyCompanyDraft(menu) {
  return Object.fromEntries(menu.sections.flatMap(({ fields }) => fields).map(({ key }) => [key, '']))
}

export function validateCompanyDraft(menu, draft) {
  const errors = {}
  const fields = menu.sections.flatMap((section) => section.fields)
  for (const field of fields) {
    const value = draft[field.key].trim()
    if (!value) {
      if (field.required) errors[field.key] = `${field.label} wajib diisi.`
      continue
    }
    if (field.maxLength && value.length > field.maxLength) errors[field.key] = `Maksimal ${field.maxLength} karakter.`
    if (field.type === 'email' && !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(value)) {
      errors[field.key] = 'Masukkan alamat email yang valid.'
    }
    if (field.options && !field.options.includes(value)) errors[field.key] = 'Pilih salah satu pilihan yang tersedia.'
    if (field.type === 'number' && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < field.min)) {
      errors[field.key] = `Masukkan bilangan bulat minimal ${field.min}.`
    }
    if (field.type === 'date') {
      const parsed = new Date(`${value}T00:00:00Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        errors[field.key] = 'Masukkan tanggal yang valid.'
      }
    }
  }
  for (const [start, end] of menu.dateOrder || []) {
    if (draft[start] && draft[end] && !errors[start] && !errors[end] && draft[start] > draft[end]) {
      const firstLabel = fields.find((field) => field.key === start).label.toLowerCase()
      errors[end] = `Tanggal tidak boleh lebih awal dari ${firstLabel}.`
    }
  }
  if (menu.numberRange) {
    const [min, max] = menu.numberRange
    if (Boolean(draft[min].trim()) !== Boolean(draft[max].trim())) {
      errors[draft[min].trim() ? max : min] = 'Isi kedua batas gaji atau kosongkan keduanya.'
    } else if (draft[min].trim() && !errors[min] && !errors[max] && Number(draft[min]) > Number(draft[max])) {
      errors[max] = 'Gaji maksimum tidak boleh lebih kecil dari gaji minimum.'
    }
  }
  return errors
}

export function formatCompanyValue(field, rawValue) {
  const value = rawValue.trim()
  if (!value) return 'Belum diisi'
  if (field.type === 'number' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value))) {
    const amount = new Intl.NumberFormat('id-ID').format(Number(value))
    return field.suffix === 'Rp' ? `Rp ${amount}` : `${amount} ${field.suffix || ''}`.trim()
  }
  if (field.type === 'date') {
    const date = new Date(`${value}T00:00:00Z`)
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
  }
  return value.trim()
}
