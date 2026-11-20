export const getApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message
  if (!error?.isAxiosError && typeof error?.message === 'string' && error.message.trim()) return error.message
  return fallback
}
