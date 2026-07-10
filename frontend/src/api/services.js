import { identityApi, coreApi } from './client'

export const MemberService = {
  list: () => identityApi.get('/members').then((r) => r.data),
  add: (payload) => identityApi.post('/members', payload).then((r) => r.data),
  deactivate: (id) => identityApi.delete(`/members/${id}`).then((r) => r.data),
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
  markPaid: (chargeId) => coreApi.patch(`/maintenance/${chargeId}/paid`).then((r) => r.data),
}

export const MaintenanceRateService = {
  list: () => coreApi.get('/maintenance-rates').then((r) => r.data),
  effective: (year, month) =>
    coreApi.get('/maintenance-rates/effective', { params: { year, month } }).then((r) => r.data),
  setRate: (payload) => coreApi.post('/maintenance-rates', payload).then((r) => r.data),
}

export const ExpenseService = {
  list: () => coreApi.get('/expenses').then((r) => r.data),
  create: (payload) => coreApi.post('/expenses', payload).then((r) => r.data),
}

export const NoticeService = {
  list: () => coreApi.get('/notices').then((r) => r.data),
  create: (payload) => coreApi.post('/notices', payload).then((r) => r.data),
}

export const RuleService = {
  list: () => coreApi.get('/rules').then((r) => r.data),
  create: (payload) => coreApi.post('/rules', payload).then((r) => r.data),
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
