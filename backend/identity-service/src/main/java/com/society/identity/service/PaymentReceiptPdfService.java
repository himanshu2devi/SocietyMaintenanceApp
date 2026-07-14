package com.society.identity.service;

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
import com.society.identity.domain.SubscriptionPayment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Generates a professional SocietyWale payment receipt PDF for paid society signup.
 */
@Service
public class PaymentReceiptPdfService {

    private static final DateTimeFormatter PAID_AT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z").withZone(ZoneId.of("Asia/Kolkata"));
    private static final Color NAVY = new Color(16, 42, 67);
    private static final Color ORANGE = new Color(249, 115, 22);
    private static final Color SLATE = new Color(71, 85, 105);
    private static final Color LIGHT = new Color(248, 250, 252);

    private final String appUrl;
    private final String supportEmail;

    public PaymentReceiptPdfService(
            @Value("${app.mail.app-url:https://societywale.in}") String appUrl,
            @Value("${app.mail.from:societywale.in@gmail.com}") String supportEmail) {
        this.appUrl = normalizeAppUrl(appUrl);
        this.supportEmail = supportEmail == null || supportEmail.isBlank()
                ? "societywale.in@gmail.com"
                : supportEmail.trim();
    }

    public byte[] generate(
            String adminName,
            String adminEmail,
            String societyName,
            String societyCode,
            SubscriptionPayment payment) {
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

            Paragraph tagline = new Paragraph("Official payment receipt · societywale.in", small);
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

            String amount = payment != null
                    ? RazorpayPaymentService.formatInr(payment.getAmountPaise())
                    : "—";
            String receiptNo = dash(payment != null ? payment.getReceiptNumber() : null);
            String paymentId = dash(payment != null ? payment.getRazorpayPaymentId() : null);
            String orderId = dash(payment != null ? payment.getRazorpayOrderId() : null);
            String paidAt = payment != null && payment.getPaidAt() != null
                    ? PAID_AT.format(payment.getPaidAt())
                    : "—";

            document.add(sectionHeading("Billed to", title));
            document.add(kvTable(label, value, new String[][]{
                    {"Committee administrator", dash(adminName)},
                    {"Email", dash(adminEmail)},
                    {"Society", dash(societyName)},
                    {"Society code", dash(societyCode)},
            }));

            document.add(sectionHeading("Payment details", title));
            document.add(kvTable(label, value, new String[][]{
                    {"Receipt number", receiptNo},
                    {"Amount paid", amount},
                    {"Currency", payment != null && payment.getCurrency() != null ? payment.getCurrency() : "INR"},
                    {"Status", "Paid"},
                    {"Plan", "Annual society workspace (1 year)"},
                    {"Paid at", paidAt},
                    {"Razorpay payment ID", paymentId},
                    {"Razorpay order ID", orderId},
                    {"Payment method", "Razorpay (UPI / Cards / Netbanking)"},
            }));

            Paragraph note = new Paragraph(
                    "This receipt confirms payment received by SocietyWale for activation of your society workspace. "
                            + "This is a computer-generated document and does not require a signature. "
                            + "Subscription fees are non-refundable as per our Refund & Cancellation Policy.",
                    body);
            note.setSpacingBefore(18f);
            note.setSpacingAfter(14f);
            document.add(note);

            Paragraph footer = new Paragraph(
                    "SocietyWale · " + appUrl + " · " + supportEmail + " · Sign in: " + appUrl + "/login",
                    small);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            Paragraph policy = new Paragraph(appUrl + "/refund-policy", small);
            policy.setAlignment(Element.ALIGN_CENTER);
            document.add(policy);

            document.close();
            return out.toByteArray();
        } catch (DocumentException ex) {
            throw new IllegalStateException("Could not generate payment receipt PDF", ex);
        }
    }

    public String filename(String receiptNumber, String societyCode) {
        String code = societyCode == null ? "society" : societyCode.replaceAll("[^A-Za-z0-9_-]", "");
        String receipt = receiptNumber == null ? "receipt" : receiptNumber.replaceAll("[^A-Za-z0-9_-]", "");
        return "SocietyWale-Payment-Receipt-" + code + "-" + receipt + ".pdf";
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
        if (url == null || url.isBlank()) {
            return "https://societywale.in";
        }
        String cleaned = url.trim().replaceAll("/+$", "");
        if (cleaned.contains("localhost") || cleaned.contains("127.0.0.1")) {
            return "https://societywale.in";
        }
        return cleaned;
    }
}
