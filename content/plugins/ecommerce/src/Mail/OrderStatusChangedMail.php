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

class OrderStatusChangedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly Order $order,
        public readonly string $newStatus,
        public readonly ?string $trackingNumber = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('cms.order_status_changed_subject', [
                'id' => $this->order->id,
            ]),
        );
    }

    public function content(): Content
    {
        $statusLabels = [
            'pending' => __('cms.order_status_pending'),
            'processing' => __('cms.order_status_processing'),
            'shipped' => __('cms.order_status_shipped'),
            'completed' => __('cms.order_status_completed'),
            'cancelled' => __('cms.order_status_cancelled'),
            'refunded' => __('cms.order_status_refunded'),
        ];

        return new Content(
            markdown: 'ecommerce::emails.order-status-changed',
            with: [
                'order' => $this->order,
                'newStatus' => $this->newStatus,
                'statusLabel' => $statusLabels[$this->newStatus] ?? $this->newStatus,
                'trackingNumber' => $this->trackingNumber,
                'orderUrl' => route('admin.shop.orders.show', $this->order),
            ],
        );
    }
}
