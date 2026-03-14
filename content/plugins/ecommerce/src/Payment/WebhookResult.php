<?php

declare(strict_types=1);

namespace Ecommerce\Payment;

/**
 * Value object representing the result of a webhook processing.
 */
final class WebhookResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $transactionId = null,
        public readonly ?string $status = null,
        public readonly ?string $error = null,
    ) {}

    /**
     * Create a successful webhook result.
     */
    public static function success(string $transactionId, string $status = 'paid'): self
    {
        return new self(
            success: true,
            transactionId: $transactionId,
            status: $status,
        );
    }

    /**
     * Create a failed webhook result.
     */
    public static function failed(string $error): self
    {
        return new self(
            success: false,
            error: $error,
        );
    }
}
