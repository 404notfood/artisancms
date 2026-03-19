<?php

declare(strict_types=1);

namespace MemberSpace\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use MemberSpace\Models\MemberVerification;

class VerificationApprovedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly MemberVerification $verification,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre verification a ete approuvee',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'member-space::emails.verification-approved',
        );
    }
}
