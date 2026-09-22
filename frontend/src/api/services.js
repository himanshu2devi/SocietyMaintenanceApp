import { identityApi, coreApi } from './client'

export const MemberService = {
  list: () => identityApi.get('/members').then((r) => r.data),
  add: (payload) => identityApi.post('/members', payload).then((r) => r.data),
  update: (id, payload) => identityApi.put(`/members/${id}`, payload).then((r) => r.data),
  deactivate: (id) => identityApi.delete(`/members/${id}`).then((r) => r.data),
  reactivate: (id) => identityApi.post(`/members/${id}/reactivate`).then((r) => r.data),
}

export const AuthService = {
  forgotPassword: (payload) => identityApi.post('/auth/forgot-password', payload).then((r) => r.data),
}

export const SocietyService = {
  listOptions: () => identityApi.get('/societies').then((r) => r.data),
}

export const CommitteeService = {
  list: (includeInactive = false) =>
    identityApi.get('/committee', { params: { includeInactive } }).then((r) => r.data),
  create: (payload) => identityApi.post('/committee', payload).then((r) => r.data),
  update: (id, payload) => identityApi.put(`/committee/${id}`, payload).then((r) => r.data),
  remove: (id) => identityApi.delete(`/committee/${id}`).then((r) => r.data),
}

export const MaintenanceService = {
  list: () => coreApi.get('/maintenance').then((r) => r.data),
  collect: (payload) => coreApi.post('/maintenance/collect', payload).then((r) => r.data),
  markPending: (payload) => coreApi.post('/maintenance/pending', payload).then((r) => r.data),
  markPaid: (chargeId, paymentMode) =>
    coreApi.patch(`/maintenance/${chargeId}/paid`, null, { params: { paymentMode } }).then((r) => r.data),
  memberOutstanding: (memberId) =>
    coreApi.get(`/maintenance/members/${memberId}/outstanding`).then((r) => r.data),
  downloadReceipt: (chargeId) =>
    coreApi.get(`/maintenance/${chargeId}/receipt`, { responseType: 'blob' }).then((r) => r.data),
}

export const MaintenanceRateService = {
  list: () => coreApi.get('/maintenance-rates').then((r) => r.data),
  effective: (year, month) =>
    coreApi.get('/maintenance-rates/effective', { params: { year, month } }).then((r) => r.data),
  setRate: (payload) => coreApi.post('/maintenance-rates', payload).then((r) => r.data),
}

export const MaintenanceBillingService = {
  settings: () => coreApi.get('/maintenance-billing/settings').then((r) => r.data),
  chooseMode: (billingMode) =>
    coreApi.post('/maintenance-billing/settings/mode', { billingMode }).then((r) => r.data),
  listMemberDefaults: () => coreApi.get('/maintenance-billing/member-defaults').then((r) => r.data),
  upsertMemberDefaults: (defaults) =>
    coreApi.put('/maintenance-billing/member-defaults', { defaults }).then((r) => r.data),
  resolve: (year, month, { memberId, flatNumber } = {}) =>
    coreApi
      .get('/maintenance-billing/resolve', { params: { year, month, memberId, flatNumber } })
      .then((r) => r.data),
}


export const ExpenseService = {
  list: () => coreApi.get('/expenses').then((r) => r.data),
  create: (payload) => coreApi.post('/expenses', payload).then((r) => r.data),
}

export const NoticeService = {
  list: () => coreApi.get('/notices').then((r) => r.data),
  create: (payload) => coreApi.post('/notices', payload).then((r) => r.data),
  update: (id, payload) => coreApi.put(`/notices/${id}`, payload).then((r) => r.data),
  remove: (id) => coreApi.delete(`/notices/${id}`).then((r) => r.data),
  notify: (id) => coreApi.post(`/notices/${id}/notify`).then((r) => r.data),
  unreadCount: () => coreApi.get('/notices/unread-count').then((r) => r.data),
  markRead: () => coreApi.post('/notices/mark-read').then((r) => r.data),
}

export const RuleService = {
  list: () => coreApi.get('/rules').then((r) => r.data),
  create: (payload) => coreApi.post('/rules', payload).then((r) => r.data),
  update: (id, payload) => coreApi.put(`/rules/${id}`, payload).then((r) => r.data),
  remove: (id) => coreApi.delete(`/rules/${id}`).then((r) => r.data),
}

export const ComplaintService = {
  list: () => coreApi.get('/complaints').then((r) => r.data),
  create: (payload) => coreApi.post('/complaints', payload).then((r) => r.data),
  update: (id, payload) => coreApi.put(`/complaints/${id}`, payload).then((r) => r.data),
  remove: (id) => coreApi.delete(`/complaints/${id}`).then((r) => r.data),
}

export const ReportService = {
  monthly: (year, month) =>
    coreApi.get('/reports/monthly', { params: { year, month } }).then((r) => r.data),
  annual: (year, openingBalance) =>
    coreApi.get('/reports/annual', { params: { year, openingBalance } }).then((r) => r.data),
}

export const BankAccountService = {
  list: () => coreApi.get('/bank-accounts').then((r) => r.data),
  create: (payload) => coreApi.post('/bank-accounts', payload).then((r) => r.data),
  update: (id, payload) => coreApi.put(`/bank-accounts/${id}`, payload).then((r) => r.data),
  remove: (id) => coreApi.delete(`/bank-accounts/${id}`).then((r) => r.data),
}

export const AuditDocumentService = {
  list: () => coreApi.get('/audit-documents').then((r) => r.data),
  create: (payload) => coreApi.post('/audit-documents', payload).then((r) => r.data),
  update: (id, payload) => coreApi.put(`/audit-documents/${id}`, payload).then((r) => r.data),
  remove: (id) => coreApi.delete(`/audit-documents/${id}`).then((r) => r.data),
}

export const PaymentClaimService = {
  list: (status) => coreApi.get('/payment-claims', { params: status ? { status } : {} }).then((r) => r.data),
  submit: (payload) => coreApi.post('/payment-claims', payload).then((r) => r.data),
  review: (id, payload) => coreApi.post(`/payment-claims/${id}/review`, payload).then((r) => r.data),
}

export const AssistantService = {
  status: () => coreApi.get('/assistant/status').then((r) => r.data),
  chat: (payload) => coreApi.post('/assistant/chat', payload).then((r) => r.data),
}

/** Admin-only OpenAI tools (dues drafts, notice writer, attention digest). */
export const SocietyAiService = {
  status: () => coreApi.get('/ai/status').then((r) => r.data),
  duesWhatsAppDraft: (payload) => coreApi.post('/ai/dues-whatsapp-draft', payload).then((r) => r.data),
  noticeDraft: (payload) => coreApi.post('/ai/notice-draft', payload).then((r) => r.data),
  attentionDigest: (payload) => coreApi.post('/ai/attention-digest', payload).then((r) => r.data),
}

/** Society UPI / QR image. Admin writes, members read to pay maintenance. */
export const PaymentQrService = {
  get: () => coreApi.get('/payment-qr').then((r) => r.data),
  upsert: (payload) => coreApi.put('/payment-qr', payload).then((r) => r.data),
  remove: () => coreApi.delete('/payment-qr').then((r) => r.data),
}

export const EventService = {
  list: (params) => coreApi.get('/events', { params }).then((r) => r.data),
  get: (id) => coreApi.get(`/events/${id}`).then((r) => r.data),
  create: (payload) => coreApi.post('/events', payload).then((r) => r.data),
  update: (id, payload) => coreApi.put(`/events/${id}`, payload).then((r) => r.data),
  remove: (id) => coreApi.delete(`/events/${id}`).then((r) => r.data),
}

export const MemberAnnouncementService = {
  list: (params) => coreApi.get('/member-announcements', { params }).then((r) => r.data),
  mine: (params) => coreApi.get('/member-announcements/mine', { params }).then((r) => r.data),
  pending: (params) => coreApi.get('/member-announcements/pending', { params }).then((r) => r.data),
  pendingCount: () => coreApi.get('/member-announcements/pending-count').then((r) => r.data),
  get: (id) => coreApi.get(`/member-announcements/${id}`).then((r) => r.data),
  submit: (payload) => coreApi.post('/member-announcements', payload).then((r) => r.data),
  updateOwn: (id, payload) => coreApi.put(`/member-announcements/${id}`, payload).then((r) => r.data),
  approve: (id, reviewNote) =>
    coreApi.post(`/member-announcements/${id}/approve`, { reviewNote }).then((r) => r.data),
  reject: (id, reviewNote) =>
    coreApi.post(`/member-announcements/${id}/reject`, { reviewNote }).then((r) => r.data),
  remove: (id) => coreApi.delete(`/member-announcements/${id}`).then((r) => r.data),
}

export const ParkingService = {
  listSlots: (params) => coreApi.get('/parking/slots', { params }).then((r) => r.data),
  getSlot: (slotId) => coreApi.get(`/parking/slots/${slotId}`).then((r) => r.data),
  createSlot: (payload) => coreApi.post('/parking/slots', payload).then((r) => r.data),
  updateSlot: (slotId, payload) => coreApi.put(`/parking/slots/${slotId}`, payload).then((r) => r.data),
  removeSlot: (slotId) => coreApi.delete(`/parking/slots/${slotId}`).then((r) => r.data),
  markUnavailable: (slotId) =>
    coreApi.post(`/parking/slots/${slotId}/mark-unavailable`).then((r) => r.data),
  markAvailable: (slotId) => coreApi.post(`/parking/slots/${slotId}/mark-available`).then((r) => r.data),
  assign: (slotId, payload) => coreApi.post(`/parking/slots/${slotId}/assign`, payload).then((r) => r.data),
  unassign: (slotId, notes) =>
    coreApi.post(`/parking/slots/${slotId}/unassign`, { notes }).then((r) => r.data),
  slotHistory: (slotId) => coreApi.get(`/parking/slots/${slotId}/assignments`).then((r) => r.data),
  listAssignments: (params) => coreApi.get('/parking/assignments', { params }).then((r) => r.data),
  myAssignments: () => coreApi.get('/parking/my-assignments').then((r) => r.data),
}

export const MeetingService = {
  list: (params) => coreApi.get('/meetings', { params }).then((r) => r.data),
  get: (id) => coreApi.get(`/meetings/${id}`).then((r) => r.data),
  create: (payload) => coreApi.post('/meetings', payload).then((r) => r.data),
  update: (id, payload) => coreApi.put(`/meetings/${id}`, payload).then((r) => r.data),
  remove: (id) => coreApi.delete(`/meetings/${id}`).then((r) => r.data),
}

/**
 * Election administration only — SocietySimplify records nominations, candidates and the
 * committee-declared outcome. There are deliberately no vote-casting endpoints.
 */
export const ElectionService = {
  list: (params) => coreApi.get('/elections', { params }).then((r) => r.data),
  get: (id) => coreApi.get(`/elections/${id}`).then((r) => r.data),
  create: (payload) => coreApi.post('/elections', payload).then((r) => r.data),
  update: (id, payload) => coreApi.put(`/elections/${id}`, payload).then((r) => r.data),
  setStatus: (id, status) => coreApi.post(`/elections/${id}/status`, { status }).then((r) => r.data),
  addPosition: (id, payload) => coreApi.post(`/elections/${id}/positions`, payload).then((r) => r.data),
  removePosition: (id, positionId) =>
    coreApi.delete(`/elections/${id}/positions/${positionId}`).then((r) => r.data),
  addCandidate: (id, payload) => coreApi.post(`/elections/${id}/candidates`, payload).then((r) => r.data),
  removeCandidate: (id, candidateId) =>
    coreApi.delete(`/elections/${id}/candidates/${candidateId}`).then((r) => r.data),
  publishResults: (id, payload) => coreApi.post(`/elections/${id}/results`, payload).then((r) => r.data),
  remove: (id) => coreApi.delete(`/elections/${id}`).then((r) => r.data),
}

/** Cross-society operator console. Requires the PLATFORM_ADMIN role. */
export const PlatformAdminService = {
  dashboard: () => identityApi.get('/platform/dashboard').then((r) => r.data),
  societies: (params) => identityApi.get('/platform/societies', { params }).then((r) => r.data),
  users: (params) => identityApi.get('/platform/users', { params }).then((r) => r.data),
  subscriptions: (params) => identityApi.get('/platform/subscriptions', { params }).then((r) => r.data),
  stats: () => identityApi.get('/platform/stats').then((r) => r.data),
}
