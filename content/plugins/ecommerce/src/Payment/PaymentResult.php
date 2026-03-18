<?php

declare(strict_types=1);

namespace Ecommerce\Payment;

final class PaymentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $transactionId = null,
        public readonly ?string $redirectUrl = null,
        public readonly ?string $clientSecret = null,
        public readonly ?string $error = null,
        public readonly ?string $status = null,
    ) {}

    public static function success(string $transactionId, ?string $redirectUrl = null): self
    {
        return new self(
            success: true,
            transactionId: $transactionId,
            redirectUrl: $redirectUrl,
            status: 'paid',
        );
    }

    public static function pending(string $transactionId, ?string $redirectUrl = null, ?string $clientSecret = null): self
    {
        return new self(
            success: true,
            transactionId: $transactionId,
            redirectUrl: $redirectUrl,
            clientSecret: $clientSecret,
            status: 'pending',
        );
    }

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

    public function requiresClientConfirmation(): bool
    {
        return $this->clientSecret !== null;
    }
}
