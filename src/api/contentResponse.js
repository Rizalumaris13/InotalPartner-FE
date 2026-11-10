export const readNullableContent = (body, isRecord, fallback) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true || (body.data !== null && !isRecord(body.data))) {
    throw new Error(fallback)
  }
  return body.data
}

// Penerimaan PUT bukan bukti tersimpan: pemanggil tetap memverifikasi dengan GET.
export const requireContentAcknowledgement = (body, fallback) => {
  if (body?.success !== true) {
    throw new Error(typeof body?.message === 'string' && body.message.trim()
      ? body.message : fallback)
  }
}
