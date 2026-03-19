<x-mail::message>
# Bienvenue dans votre abonnement

Bonjour {{ $membership->user?->name }},

Votre abonnement **{{ $membership->plan?->name }}** est maintenant actif.

@if($membership->trial_ends_at)
Votre periode d'essai se termine le {{ $membership->trial_ends_at->format('d/m/Y') }}.
@endif

@if($membership->expires_at)
Votre abonnement est valide jusqu'au {{ $membership->expires_at->format('d/m/Y') }}.
@endif

<x-mail::button :url="url('/members/account/membership')">
Gerer mon abonnement
</x-mail::button>

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
