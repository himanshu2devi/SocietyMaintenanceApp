const monthNames = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function monthName(m) {
  return monthNames[m] || m
}

export function inr(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

/**
 * Build a WhatsApp deep link. Passing no phone number opens WhatsApp's
 * contact chooser, so the sender never has to save a contact number.
 * Optionally pass a phone (with country code, digits only) to target a chat.
 */
export function whatsappLink(text, phone) {
  const encoded = encodeURIComponent(text)
  return phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
}

export function buildMonthlyReportText(society, report) {
  const lines = [
    `*${society || 'Society'} — Monthly Report*`,
    `Period: ${monthName(report.month)} ${report.year}`,
    '',
    `Maintenance Collected: ${inr(report.maintenanceCollected)}`,
    `Maintenance Pending: ${inr(report.maintenancePending)}`,
    `Total Expenses: ${inr(report.totalExpenses)}`,
    `Net (Surplus/Deficit): ${inr(report.netSurplusDeficit)}`,
  ]
  if (report.expenseBreakdown?.length) {
    lines.push('', '*Expense Breakdown:*')
    report.expenseBreakdown.forEach((c) => lines.push(`- ${c.category}: ${inr(c.amount)}`))
  }
  lines.push('', 'Shared via SocietyHub')
  return lines.join('\n')
}

export function buildAnnualReportText(society, sheet) {
  return [
    `*${society || 'Society'} — Annual Balance Sheet ${sheet.year}*`,
    '',
    `Opening Balance: ${inr(sheet.openingBalance)}`,
    `Total Income: ${inr(sheet.totalIncome)}`,
    `Total Expenses: ${inr(sheet.totalExpenses)}`,
    `Closing Balance: ${inr(sheet.closingBalance)}`,
    `Outstanding Dues: ${inr(sheet.pendingDues)}`,
    '',
    'Shared via SocietyHub',
  ].join('\n')
}
