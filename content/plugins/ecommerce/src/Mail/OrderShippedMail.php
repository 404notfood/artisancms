<?php

declare(strict_types=1);

namespace Ecommerce\Mail;

use Ecommerce\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderShippedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly Order $order,
        public readonly string $trackingNumber,
        public readonly ?string $estimatedDelivery = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('cms.order_shipped_subject', [
                'id' => $this->order->id,
            ]),
        );
    }

    public function content(): Content
    {
        $this->order->loadMissing(['items', 'user']);

        return new Content(
            markdown: 'ecommerce::emails.order-shipped',
            with: [
                'order' => $this->order,
                'trackingNumber' => $this->trackingNumber,
                'estimatedDelivery' => $this->estimatedDelivery,
                'orderUrl' => route('admin.shop.orders.show', $this->order),
            ],
        );
    }
}
