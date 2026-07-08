import { identityApi, coreApi } from './client'

// Identity service
export const MemberService = {
  list: () => identityApi.get('/members').then((r) => r.data),
  add: (payload) => identityApi.post('/members', payload).then((r) => r.data),
  deactivate: (id) => identityApi.delete(`/members/${id}`).then((r) => r.data),
}

// Core service
export const MaintenanceService = {
  list: () => coreApi.get('/maintenance').then((r) => r.data),
  collect: (payload) => coreApi.post('/maintenance/collect', payload).then((r) => r.data),
  markPending: (payload) => coreApi.post('/maintenance/pending', payload).then((r) => r.data),
  markPaid: (chargeId) => coreApi.patch(`/maintenance/${chargeId}/paid`).then((r) => r.data),
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
