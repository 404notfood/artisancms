<x-mail::message>
# Verification approuvee

Bonjour {{ $verification->user?->name }},

Votre demande de verification a ete approuvee. Votre profil est maintenant verifie.

@if($verification->admin_notes)
**Note de l'administrateur :** {{ $verification->admin_notes }}
@endif

<x-mail::button :url="url('/members/account')">
Voir mon profil
</x-mail::button>

Cordialement,<br>
{{ config('app.name') }}
</x-mail::message>
