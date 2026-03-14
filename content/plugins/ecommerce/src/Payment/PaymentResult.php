<?php

declare(strict_types=1);

namespace Ecommerce\Payment;

/**
 * Value object representing the result of a payment operation.
 */
final class PaymentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $transactionId = null,
        public readonly ?string $redirectUrl = null,
        public readonly ?string $error = null,
        public readonly ?string $status = null,
    ) {}

    /**
     * Create a successful payment result.
     */
    public static function success(string $transactionId, ?string $redirectUrl = null): self
    {
        return new self(
            success: true,
            transactionId: $transactionId,
            redirectUrl: $redirectUrl,
            status: 'paid',
        );
    }

    /**
     * Create a pending payment result (e.g. redirect to external gateway).
     */
    public static function pending(string $transactionId, string $redirectUrl): self
    {
        return new self(
            success: true,
            transactionId: $transactionId,
            redirectUrl: $redirectUrl,
            status: 'pending',
        );
    }

    /**
     * Create a failed payment result.
     */
    public static function failed(string $error): self
    {
        return new self(
            success: false,
            error: $error,
            status: 'failed',
        );
    }

    public function requiresRedirect(): bool
    {
        return $this->redirectUrl !== null;
    }
}
