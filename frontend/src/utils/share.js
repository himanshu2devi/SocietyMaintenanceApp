import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const monthNames = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Idle logout: 30 minutes of inactivity. */
export const IDLE_LOGOUT_MS = 30 * 60 * 1000

export function monthName(m) {
  return monthNames[m] || m
}

export function inr(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

/** PDF-safe currency (Helvetica has no rupee glyph). */
function inrPdf(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
}

export function formatNoticeDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

/**
 * Build a WhatsApp deep link. Passing no phone number opens WhatsApp's
 * contact chooser, so the sender never has to save a contact number.
 */
export function whatsappLink(text, phone) {
  const encoded = encodeURIComponent(text)
  return phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
}

export function buildNoticeWhatsAppText(notice, societyName = 'Society') {
  return [
    `*${societyName} — Notice*`,
    '',
    `*${notice.title}*`,
    notice.body,
    '',
    `Priority: ${notice.priority || 'NORMAL'}`,
    `Date: ${formatNoticeDate(notice.createdAt)}`,
    notice.createdByName ? `Posted by: ${notice.createdByName}` : null,
    '',
    'Shared via SocietyWale',
  ].filter(Boolean).join('\n')
}

function startPdfDoc(title, societyName) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const society = (societyName || 'Housing Society').trim()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(234, 88, 12)
  doc.text('SOCIETYWALE', margin, 40)

  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text(society, margin, 62)

  doc.setFontSize(14)
  doc.setTextColor(30, 41, 59)
  doc.text(title, margin, 84)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, margin, 102)
  return { doc, margin, y: 126 }
}

function addFooter(doc) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text(
      'Confidential society financial report · Powered by societywale.in',
      48,
      doc.internal.pageSize.getHeight() - 28,
    )
  }
}

/** Direct .pdf file download — no popup / print dialog. */
export function downloadMonthlyReportPdf(report, filename, societyName) {
  const title = `Monthly Income & Expense — ${monthName(report.month)} ${report.year}`
  const { doc, margin, y } = startPdfDoc(title, societyName)

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Metric', 'Amount']],
    body: [
      ['Maintenance collected', inrPdf(report.maintenanceCollected)],
      ['Maintenance pending', inrPdf(report.maintenancePending)],
      ['Total expenses', inrPdf(report.totalExpenses)],
      ['Net (surplus / deficit)', inrPdf(report.netSurplusDeficit)],
    ],
    headStyles: { fillColor: [15, 42, 67], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 8 },
    columnStyles: { 1: { halign: 'right' } },
  })

  let nextY = doc.lastAutoTable.finalY + 22
  if (report.expenseBreakdown?.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text('Expense breakdown (by category)', margin, nextY)
    autoTable(doc, {
      startY: nextY + 10,
      margin: { left: margin, right: margin },
      theme: 'striped',
      head: [['Category', 'Amount']],
      body: report.expenseBreakdown.map((c) => [c.category, inrPdf(c.amount)]),
      headStyles: { fillColor: [234, 88, 12], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 7 },
      columnStyles: { 1: { halign: 'right' } },
    })
    nextY = doc.lastAutoTable.finalY + 22
  }

  if (report.expenseLines?.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text('Expense details', margin, nextY)
    autoTable(doc, {
      startY: nextY + 10,
      margin: { left: margin, right: margin },
      theme: 'striped',
      head: [['Date', 'Category', 'Title', 'Bill ID', 'Amount']],
      body: report.expenseLines.map((line) => [
        line.expenseDate || '—',
        line.category || '—',
        line.title || '—',
        line.billId || 'N/A',
        inrPdf(line.amount),
      ]),
      headStyles: { fillColor: [15, 42, 67], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 6 },
      columnStyles: { 4: { halign: 'right' } },
    })
  }

  addFooter(doc)
  doc.save(filename || `monthly-report-${report.year}-${report.month}.pdf`)
}

/** Direct .pdf file download — no popup / print dialog. */
export function downloadAnnualReportPdf(sheet, filename, societyName) {
  const title = `Annual Balance Sheet — ${sheet.year}`
  const { doc, margin, y } = startPdfDoc(title, societyName)

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Metric', 'Amount']],
    body: [
      ['Opening balance', inrPdf(sheet.openingBalance)],
      ['Total income', inrPdf(sheet.totalIncome)],
      ['Total expenses', inrPdf(sheet.totalExpenses)],
      ['Closing balance', inrPdf(sheet.closingBalance)],
      ['Outstanding dues', inrPdf(sheet.pendingDues)],
    ],
    headStyles: { fillColor: [15, 42, 67], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 8 },
    columnStyles: { 1: { halign: 'right' } },
  })

  const nextY = doc.lastAutoTable.finalY + 22
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text('Month-wise summary', margin, nextY)

  autoTable(doc, {
    startY: nextY + 10,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [['Month', 'Income', 'Expenses', 'Net']],
    body: (sheet.monthlyLines || []).map((l) => [
      monthName(l.month),
      inrPdf(l.income),
      inrPdf(l.expenses),
      inrPdf(l.net),
    ]),
    headStyles: { fillColor: [234, 88, 12], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 7 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  })

  addFooter(doc)
  doc.save(filename || `annual-report-${sheet.year}.pdf`)
}
