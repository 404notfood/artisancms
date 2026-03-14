<?php

declare(strict_types=1);

namespace Ecommerce\Notifications;

use Ecommerce\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Product $product,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Stock faible : ' . $this->product->name)
            ->greeting('Alerte stock faible')
            ->line('Le produit "' . $this->product->name . '" a un niveau de stock bas.')
            ->line('Stock actuel : ' . $this->product->stock)
            ->line('Seuil d\'alerte : ' . $this->product->low_stock_threshold)
            ->action('Voir le produit', url('/admin/shop/stock'))
            ->line('Pensez a reapprovisionner ce produit.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'stock' => $this->product->stock,
            'threshold' => $this->product->low_stock_threshold,
        ];
    }
}
