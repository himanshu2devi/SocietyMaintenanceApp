package com.society.core.service;

import com.society.core.domain.SocietyPaymentQr;
import com.society.core.dto.PaymentQrDtos.UpsertPaymentQrRequest;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.repository.SocietyPaymentQrRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentQrServiceTest {

    private static final UUID SOCIETY_A = UUID.randomUUID();
    private static final UUID SOCIETY_B = UUID.randomUUID();
    private static final UUID ADMIN = UUID.randomUUID();

    private static final byte[] PNG_HEADER =
            {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    @Mock
    private SocietyPaymentQrRepository repository;

    @InjectMocks
    private PaymentQrService service;

    @Test
    void rejectsDisallowedContentType() {
        assertThatThrownBy(() -> service.upsert(SOCIETY_A, ADMIN,
                request("image/svg+xml", pngBase64(64))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("PNG, JPEG or WebP");

        verify(repository, never()).save(any());
    }

    @Test
    void rejectsPdfDisguisedAsPng() {
        String pdf = Base64.getEncoder().encodeToString("%PDF-1.7 payload".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.upsert(SOCIETY_A, ADMIN, request("image/png", pdf)))
                .isInstanceOf(BadRequestException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void rejectsSvgPayloadEvenWhenContentTypeLooksFine() {
        String svg = Base64.getEncoder()
                .encodeToString("<svg onload=\"alert(1)\"></svg>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.upsert(SOCIETY_A, ADMIN, request("image/png", svg)))
                .isInstanceOf(BadRequestException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void rejectsImageLargerThanTheAllowedSize() {
        String oversized = pngBase64(PaymentQrService.MAX_DECODED_BYTES + 2048);

        assertThatThrownBy(() -> service.upsert(SOCIETY_A, ADMIN, request("image/png", oversized)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("too large");

        verify(repository, never()).save(any());
    }

    @Test
    void rejectsContentThatDoesNotMatchTheDeclaredType() {
        String png = pngBase64(64);

        assertThatThrownBy(() -> service.upsert(SOCIETY_A, ADMIN, request("image/jpeg", png)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("does not match");
    }

    @Test
    void acceptsValidPngAndStripsDataUrlPrefix() {
        when(repository.findBySocietyId(SOCIETY_A)).thenReturn(Optional.empty());
        when(repository.save(any(SocietyPaymentQr.class))).thenAnswer(inv -> inv.getArgument(0));

        String png = pngBase64(256);
        var response = service.upsert(SOCIETY_A, ADMIN,
                request("image/png", "data:image/png;base64," + png));

        assertThat(response.configured()).isTrue();
        assertThat(response.imageBase64()).isEqualTo(png);
        assertThat(response.instruction()).isEqualTo(PaymentQrService.DEFAULT_INSTRUCTION);
    }

    @Test
    void getReturnsNotConfiguredForASocietyWithoutAQr() {
        when(repository.findBySocietyId(SOCIETY_B)).thenReturn(Optional.empty());

        var response = service.get(SOCIETY_B);

        assertThat(response.configured()).isFalse();
        assertThat(response.imageBase64()).isNull();
    }

    private static UpsertPaymentQrRequest request(String contentType, String imageBase64) {
        return new UpsertPaymentQrRequest("society@upi", null, contentType, imageBase64, "qr.png");
    }

    private static String pngBase64(int totalBytes) {
        byte[] data = new byte[Math.max(totalBytes, PNG_HEADER.length)];
        Arrays.fill(data, (byte) 0x41);
        System.arraycopy(PNG_HEADER, 0, data, 0, PNG_HEADER.length);
        return Base64.getEncoder().encodeToString(data);
    }
}
