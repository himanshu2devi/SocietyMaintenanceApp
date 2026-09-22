package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class PaymentQrDtos {

    public record UpsertPaymentQrRequest(
            @Size(max = 100, message = "UPI ID must be at most 100 characters")
            String upiId,
            @Size(max = 250, message = "Instruction must be at most 250 characters")
            String instruction,
            @NotBlank(message = "Image content type is required")
            @Size(max = 80, message = "Content type must be at most 80 characters")
            String contentType,
            @NotBlank(message = "QR image is required")
            String imageBase64,
            @Size(max = 200, message = "File name must be at most 200 characters")
            String fileName
    ) {}

    public record PaymentQrResponse(
            boolean configured,
            String id,
            String upiId,
            String instruction,
            String contentType,
            String imageBase64,
            String fileName,
            Instant updatedAt
    ) {
        public static PaymentQrResponse notConfigured() {
            return new PaymentQrResponse(false, null, null,
                    "Scan to pay society maintenance", null, null, null, null);
        }
    }
}
