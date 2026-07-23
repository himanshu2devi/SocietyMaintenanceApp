package com.society.core.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.society.core.domain.MaintenanceCharge;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * PDF receipt for a paid maintenance charge (member download).
 */
@Service
public class MaintenanceReceiptPdfService {

    private static final DateTimeFormatter PAID_AT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z").withZone(ZoneId.of("Asia/Kolkata"));
    private static final String[] MONTHS = {
            "", "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
    };
    private static final Color NAVY = new Color(16, 42, 67);
    private static final Color ORANGE = new Color(249, 115, 22);
    private static final Color SLATE = new Color(71, 85, 105);
    private static final Color LIGHT = new Color(248, 250, 252);

    private final String appUrl;
    private final String supportEmail;

    public MaintenanceReceiptPdfService(
            @Value("${app.mail.app-url:https://societywale.in}") String appUrl,
            @Value("${app.mail.from:societywale.in@gmail.com}") String supportEmail) {
        this.appUrl = normalizeAppUrl(appUrl);
        this.supportEmail = supportEmail == null || supportEmail.isBlank()
                ? "societywale.in@gmail.com"
                : supportEmail.trim();
    }

    public byte[] generate(
            String societyName,
            String memberName,
            MaintenanceCharge charge) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 48, 48, 48, 48);
            PdfWriter.getInstance(document, out);
            document.open();

            Font brand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, NAVY);
            Font brandAccent = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, ORANGE);
            Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, NAVY);
            Font label = FontFactory.getFont(FontFactory.HELVETICA, 9, SLATE);
            Font value = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, NAVY);
            Font body = FontFactory.getFont(FontFactory.HELVETICA, 10, SLATE);
            Font small = FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE);
            Font paidBadge = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(4, 120, 87));

            Paragraph brandLine = new Paragraph();
            brandLine.add(new Phrase("Society", brand));
            brandLine.add(new Phrase("Wale", brandAccent));
            brandLine.setSpacingAfter(4f);
            document.add(brandLine);

            Paragraph tagline = new Paragraph("Maintenance payment receipt · societywale.in", small);
            tagline.setSpacingAfter(16f);
            document.add(tagline);

            PdfPTable banner = new PdfPTable(2);
            banner.setWidthPercentage(100);
            banner.setWidths(new float[]{3.2f, 1.2f});
            banner.setSpacingAfter(18f);
            PdfPCell left = cell("PAYMENT RECEIPT", title, Element.ALIGN_LEFT, LIGHT, 12f);
            left.setBorder(Rectangle.NO_BORDER);
            banner.addCell(left);
            PdfPCell right = cell("PAID", paidBadge, Element.ALIGN_RIGHT, LIGHT, 12f);
            right.setBorder(Rectangle.NO_BORDER);
            banner.addCell(right);
            document.add(banner);

            String period = monthName(charge.getBillingMonth()) + " " + charge.getBillingYear();
            String amount = formatInr(charge.getAmount());
            String paidAt = charge.getPaidAt() != null ? PAID_AT.format(charge.getPaidAt()) : "—";
            String mode = formatMode(charge.getPaymentMode());
            String txn = resolveTransactionId(charge);

            document.add(sectionHeading("Billed to", title));
            document.add(kvTable(label, value, new String[][]{
                    {"Member", dash(memberName)},
                    {"Flat / shop", dash(charge.getFlatNumber())},
                    {"Society", dash(societyName)},
            }));

            document.add(sectionHeading("Payment details", title));
            document.add(kvTable(label, value, new String[][]{
                    {"Receipt / charge ID", charge.getId() != null ? charge.getId().toString() : "—"},
                    {"Billing period", period},
                    {"Amount paid", amount},
                    {"Status", "Paid"},
                    {"Payment mode", mode},
                    {"Transaction ID", txn},
                    {"Paid at", paidAt},
            }));

            Paragraph note = new Paragraph(
                    "This receipt confirms maintenance payment recorded in SocietyWale for the period above. "
                            + "This is a computer-generated document and does not require a signature.",
                    body);
            note.setSpacingBefore(18f);
            note.setSpacingAfter(14f);
            document.add(note);

            Paragraph footer = new Paragraph(
                    "SocietyWale · " + appUrl + " · " + supportEmail,
                    small);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (DocumentException ex) {
            throw new IllegalStateException("Could not generate maintenance receipt PDF", ex);
        }
    }

    public String filename(MaintenanceCharge charge) {
        String flat = charge.getFlatNumber() == null
                ? "flat"
                : charge.getFlatNumber().replaceAll("[^A-Za-z0-9_-]", "");
        return "SocietyWale-Maintenance-Receipt-"
                + flat + "-"
                + charge.getBillingYear()
                + String.format(Locale.ROOT, "%02d", charge.getBillingMonth())
                + ".pdf";
    }

    static String resolveTransactionId(MaintenanceCharge charge) {
        if (charge.getTransactionReference() != null && !charge.getTransactionReference().isBlank()) {
            return charge.getTransactionReference().trim();
        }
        String mode = charge.getPaymentMode() == null ? "" : charge.getPaymentMode().trim().toUpperCase(Locale.ROOT);
        if ("ONLINE".equals(mode) || "UPI".equals(mode) || "NEFT".equals(mode) || "BANK_TRANSFER".equals(mode)) {
            String notes = charge.getNotes();
            if (notes != null) {
                int idx = notes.toLowerCase(Locale.ROOT).indexOf("ref:");
                if (idx >= 0) {
                    String extracted = notes.substring(idx + 4).replace(")", "").trim();
                    if (!extracted.isEmpty()) return extracted;
                }
            }
            return "—";
        }
        return "N/A (Cash)";
    }

    private static String formatMode(String mode) {
        if (mode == null || mode.isBlank()) return "—";
        String m = mode.trim().toUpperCase(Locale.ROOT);
        if ("CASH".equals(m)) return "Cash";
        if ("ONLINE".equals(m) || "UPI".equals(m) || "NEFT".equals(m) || "BANK_TRANSFER".equals(m)) return "Online";
        return mode;
    }

    private static String monthName(int month) {
        if (month < 1 || month > 12) return String.valueOf(month);
        return MONTHS[month];
    }

    private static String formatInr(BigDecimal amount) {
        if (amount == null) return "—";
        return "₹" + String.format(Locale.ENGLISH, "%,.2f", amount);
    }

    private static Paragraph sectionHeading(String text, Font font) {
        Paragraph p = new Paragraph(text, font);
        p.setSpacingBefore(8f);
        p.setSpacingAfter(8f);
        return p;
    }

    private static PdfPTable kvTable(Font labelFont, Font valueFont, String[][] rows) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.35f, 2.2f});
        table.setSpacingAfter(10f);
        boolean alt = false;
        for (String[] row : rows) {
            Color bg = alt ? LIGHT : Color.WHITE;
            PdfPCell k = cell(row[0], labelFont, Element.ALIGN_LEFT, bg, 8f);
            PdfPCell v = cell(row[1], valueFont, Element.ALIGN_LEFT, bg, 8f);
            k.setBorderColor(new Color(226, 232, 240));
            v.setBorderColor(new Color(226, 232, 240));
            table.addCell(k);
            table.addCell(v);
            alt = !alt;
        }
        return table;
    }

    private static PdfPCell cell(String text, Font font, int align, Color bg, float padding) {
        PdfPCell cell = new PdfPCell(new Phrase(text == null ? "—" : text, font));
        cell.setHorizontalAlignment(align);
        cell.setBackgroundColor(bg);
        cell.setPadding(padding);
        cell.setPaddingTop(padding + 2);
        cell.setPaddingBottom(padding + 2);
        return cell;
    }

    private static String dash(String value) {
        return value == null || value.isBlank() ? "—" : value.trim();
    }

    private static String normalizeAppUrl(String url) {
        if (url == null || url.isBlank()) return "https://societywale.in";
        String cleaned = url.trim().replaceAll("/+$", "");
        if (cleaned.contains("localhost") || cleaned.contains("127.0.0.1")) {
            return "https://societywale.in";
        }
        return cleaned;
    }
}
