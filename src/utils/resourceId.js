export function positiveResourceId(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      (typeof value === 'string' && !/^[1-9]\d{0,15}$/.test(value))) {
    throw new Error('ID record tidak valid.')
  }
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('ID record tidak valid.')
  return id
}
