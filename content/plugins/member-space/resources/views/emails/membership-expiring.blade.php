<x-mail::message>
# Votre abonnement expire bientot

Bonjour {{ $membership->user?->name }},

Votre abonnement **{{ $membership->plan?->name }}** expire le {{ $membership->expires_at?->format('d/m/Y') }}.

Pour continuer a profiter de tous les avantages, pensez a renouveler votre abonnement.

<x-mail::button :url="url('/members/account/membership')">
Renouveler mon abonnement
</x-mail::button>

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
