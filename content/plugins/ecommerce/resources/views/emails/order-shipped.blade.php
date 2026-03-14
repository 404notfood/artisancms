@component('mail::message')
# Votre commande a ete expediee !

Bonne nouvelle ! Votre commande **#{{ $order->id }}** est en route.

**Numero de suivi:** {{ $trackingNumber }}

@if($estimatedDelivery)
**Livraison estimee:** {{ $estimatedDelivery }}
@endif

@component('mail::table')
| Produit | Qte | Total |
|:--------|:---:|------:|
@foreach($order->items as $item)
| {{ $item->name }} | {{ $item->quantity }} | {{ number_format($item->total, 2) }} € |
@endforeach
@endcomponent

**Total:** {{ number_format($order->total, 2) }} €

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

@component('mail::button', ['url' => $orderUrl])
Suivre ma commande
@endcomponent

Merci,
{{ config('app.name') }}
@endcomponent
