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
