export const readNullableContent = (body, isRecord, fallback) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true || (body.data !== null && !isRecord(body.data))) {
    throw new Error(fallback)
  }
  return body.data
}

// Respons tulis bukan bukti tersimpan: pemanggil tetap memverifikasi dengan GET.
export const requireContentAcknowledgement = (body, fallback) => {
  if (body?.success !== true || (Object.hasOwn(body, 'message') && typeof body.message !== 'string')) {
    throw new Error(typeof body?.message === 'string' && body.message.trim()
      ? body.message : fallback)
  }
}
