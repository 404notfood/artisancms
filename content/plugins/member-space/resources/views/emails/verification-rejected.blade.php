<x-mail::message>
# Verification refusee

Bonjour {{ $verification->user?->name }},

Votre demande de verification a ete refusee.

@if($verification->admin_notes)
**Raison :** {{ $verification->admin_notes }}
@endif

Vous pouvez soumettre une nouvelle demande a tout moment.

<x-mail::button :url="url('/members/account')">
Mon compte
</x-mail::button>

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
