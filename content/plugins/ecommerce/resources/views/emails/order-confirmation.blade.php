@component('mail::message')
# Commande confirmee

Merci pour votre commande **#{{ $order->id }}** !

@component('mail::table')
| Produit | Qte | Total |
|:--------|:---:|------:|
@foreach($order->items as $item)
| {{ $item->name }} | {{ $item->quantity }} | {{ number_format($item->total, 2) }} € |
@endforeach
@endcomponent

**Sous-total:** {{ number_format($order->subtotal, 2) }} €
**Livraison:** {{ number_format($order->shipping, 2) }} €
**TVA:** {{ number_format($order->tax, 2) }} €
**Total:** {{ number_format($order->total, 2) }} €

@if($order->payment_method)
**Methode de paiement:** {{ $order->payment_method }}
@endif

@if($order->shipping_address)
**Adresse de livraison:**
{{ $order->shipping_address['first_name'] ?? '' }} {{ $order->shipping_address['last_name'] ?? '' }}
{{ $order->shipping_address['address'] ?? '' }}
@if(!empty($order->shipping_address['address2']))
{{ $order->shipping_address['address2'] }}
@endif
{{ $order->shipping_address['postal_code'] ?? '' }} {{ $order->shipping_address['city'] ?? '' }}
{{ $order->shipping_address['country'] ?? '' }}
@endif

@if($order->billing_address)
**Adresse de facturation:**
{{ $order->billing_address['first_name'] ?? '' }} {{ $order->billing_address['last_name'] ?? '' }}
{{ $order->billing_address['address'] ?? '' }}
@if(!empty($order->billing_address['address2']))
{{ $order->billing_address['address2'] }}
@endif
{{ $order->billing_address['postal_code'] ?? '' }} {{ $order->billing_address['city'] ?? '' }}
{{ $order->billing_address['country'] ?? '' }}
@endif

@component('mail::button', ['url' => $orderUrl])
Voir ma commande
@endcomponent

Merci,
{{ config('app.name') }}
@endcomponent
