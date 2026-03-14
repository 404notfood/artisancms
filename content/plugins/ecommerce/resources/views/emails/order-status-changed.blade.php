@component('mail::message')
# Mise a jour de votre commande

Le statut de votre commande **#{{ $order->id }}** a ete mis a jour.

**Nouveau statut:** {{ $statusLabel }}

@if($trackingNumber)
**Numero de suivi:** {{ $trackingNumber }}
@endif

@component('mail::table')
| Produit | Qte | Total |
|:--------|:---:|------:|
@foreach($order->items as $item)
| {{ $item->name }} | {{ $item->quantity }} | {{ number_format($item->total, 2) }} € |
@endforeach
@endcomponent

**Total:** {{ number_format($order->total, 2) }} €

@component('mail::button', ['url' => $orderUrl])
Voir ma commande
@endcomponent

Merci,
{{ config('app.name') }}
@endcomponent
