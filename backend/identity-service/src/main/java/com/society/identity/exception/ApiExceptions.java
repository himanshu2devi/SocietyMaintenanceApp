package com.society.identity.exception;

/**
 * Domain exceptions mapped to HTTP status codes by GlobalExceptionHandler.
 */
public class ApiExceptions {

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) { super(message); }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) { super(message); }
    }

    public static class BadRequestException extends RuntimeException {
        public BadRequestException(String message) { super(message); }
    }

    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) { super(message); }
    }

    private ApiExceptions() {}
}
