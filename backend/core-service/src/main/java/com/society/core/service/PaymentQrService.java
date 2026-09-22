package com.society.core.service;

import com.society.core.domain.SocietyPaymentQr;
import com.society.core.dto.PaymentQrDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.SocietyPaymentQrRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class PaymentQrService {

    static final String DEFAULT_INSTRUCTION = "Scan to pay society maintenance";

    /** Raster image formats only: an SVG or HTML payload could carry script when rendered. */
    static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/png", "image/jpeg", "image/webp");

    /** ~400KB decoded. A QR code png is a few KB, so this is already generous. */
    static final int MAX_DECODED_BYTES = 400 * 1024;

    /** Cheap guard before decoding: base64 inflates by 4/3 plus padding. */
    private static final int MAX_BASE64_CHARS = (MAX_DECODED_BYTES / 3 + 1) * 4 + 16;

    /**
     * Base64 prefixes of payloads that are never a raster image: SVG/XML, HTML, PDF,
     * ZIP/Office, Windows executables, ELF binaries and GIF.
     */
    private static final List<String> BLOCKED_BASE64_PREFIXES = List.of(
            "PD94",   // <?xml
            "PHN2",   // <svg
            "PGh0",   // <ht(ml)
            "PCFE",   // <!D(OCTYPE)
            "PCFk",   // <!d(octype)
            "JVBER",  // %PDF-
            "UEsDB",  // PK.. (zip / docx / xlsx)
            "TVqQ",   // MZ (windows exe)
            "TVoA",   // MZ (windows exe)
            "f0VMR",  // ELF
            "R0lGOD", // GIF87a / GIF89a
            "PD9waHA" // <?php
    );

    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            "image/png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A},
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}
    );

    private final SocietyPaymentQrRepository repository;

    public PaymentQrService(SocietyPaymentQrRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PaymentQrResponse get(UUID societyId) {
        return repository.findBySocietyId(societyId)
                .map(PaymentQrService::toResponse)
                .orElseGet(PaymentQrResponse::notConfigured);
    }

    @Transactional
    public PaymentQrResponse upsert(UUID societyId, UUID updatedBy, UpsertPaymentQrRequest req) {
        String contentType = normalizeContentType(req.contentType());
        String imageBase64 = sanitizeBase64(req.imageBase64());
        decodeAndValidate(imageBase64, contentType);

        SocietyPaymentQr qr = repository.findBySocietyId(societyId).orElseGet(() -> {
            SocietyPaymentQr created = new SocietyPaymentQr();
            created.setSocietyId(societyId);
            return created;
        });

        qr.setUpiId(trimToNull(req.upiId()));
        qr.setInstruction(blankToDefault(req.instruction(), DEFAULT_INSTRUCTION));
        qr.setContentType(contentType);
        qr.setImageBase64(imageBase64);
        qr.setFileName(trimToNull(req.fileName()));
        qr.setUpdatedBy(updatedBy);
        qr.setUpdatedAt(Instant.now());

        return toResponse(repository.save(qr));
    }

    @Transactional
    public void delete(UUID societyId) {
        SocietyPaymentQr qr = repository.findBySocietyId(societyId)
                .orElseThrow(() -> new NotFoundException("Payment QR is not configured for this society"));
        repository.delete(qr);
    }

    private static String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw new BadRequestException("Image content type is required");
        }
        String value = contentType.trim().toLowerCase(Locale.ROOT);
        int separator = value.indexOf(';');
        if (separator >= 0) {
            value = value.substring(0, separator).trim();
        }
        if ("image/jpg".equals(value)) {
            value = "image/jpeg";
        }
        if (!ALLOWED_CONTENT_TYPES.contains(value)) {
            throw new BadRequestException("QR image must be a PNG, JPEG or WebP file");
        }
        return value;
    }

    /** Accepts a raw base64 payload or a full {@code data:image/png;base64,...} URL. */
    private static String sanitizeBase64(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("QR image is required");
        }
        String value = raw.trim();
        int marker = value.indexOf("base64,");
        if (value.startsWith("data:") && marker > 0) {
            value = value.substring(marker + "base64,".length());
        }
        value = value.replaceAll("\\s", "");
        if (value.length() > MAX_BASE64_CHARS) {
            throw new BadRequestException("QR image is too large. Upload an image under 400 KB.");
        }
        return value;
    }

    private static void decodeAndValidate(String base64, String contentType) {
        for (String prefix : BLOCKED_BASE64_PREFIXES) {
            if (base64.startsWith(prefix)) {
                throw new BadRequestException("QR image must be a PNG, JPEG or WebP file");
            }
        }

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("QR image could not be read. Upload the file again.");
        }

        if (decoded.length > MAX_DECODED_BYTES) {
            throw new BadRequestException("QR image is too large. Upload an image under 400 KB.");
        }
        if (!matchesMagicBytes(decoded, contentType)) {
            throw new BadRequestException("QR image content does not match the declared image type");
        }
    }

    private static boolean matchesMagicBytes(byte[] data, String contentType) {
        if ("image/webp".equals(contentType)) {
            // RIFF....WEBP
            if (data.length < 12) return false;
            return data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                    && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P';
        }
        byte[] expected = MAGIC_BYTES.get(contentType);
        if (expected == null) {
            return false;
        }
        if (data.length < expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if (data[i] != expected[i]) {
                return false;
            }
        }
        return true;
    }

    private static String blankToDefault(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return value.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    static PaymentQrResponse toResponse(SocietyPaymentQr qr) {
        return new PaymentQrResponse(
                true,
                qr.getId() == null ? null : qr.getId().toString(),
                qr.getUpiId(),
                qr.getInstruction(),
                qr.getContentType(),
                qr.getImageBase64(),
                qr.getFileName(),
                qr.getUpdatedAt()
        );
    }
}
