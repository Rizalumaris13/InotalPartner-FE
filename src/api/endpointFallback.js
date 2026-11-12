// Only a missing route selects the alternate contract; other failures propagate.
export const withEndpointFallback = (primary, fallback) => primary.catch((error) => {
  if (error.response?.status === 404) return fallback()
  throw error
})
