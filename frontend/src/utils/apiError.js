export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  if (data?.fieldErrors) {
    return Object.values(data.fieldErrors).filter(Boolean).join(' ')
  }
  const raw = data?.message || ''
  // Spring returns this when an API route is missing (e.g. backend not restarted yet).
  if (/no static resource/i.test(raw)) {
    return 'This feature is temporarily unavailable. Please refresh in a moment or contact support if it continues.'
  }
  return raw || (error?.request ? 'The service is unavailable. Please try again shortly.' : fallback)
}
