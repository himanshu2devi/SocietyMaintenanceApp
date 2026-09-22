/** Unwrap the backend PageResponse envelope: { content, page, size, totalElements, totalPages }. */
export function pageContent(response) {
  if (Array.isArray(response)) return response
  return Array.isArray(response?.content) ? response.content : []
}

export function pageTotal(response, fallbackList) {
  if (Number.isFinite(Number(response?.totalElements))) return Number(response.totalElements)
  return (fallbackList || pageContent(response)).length
}
