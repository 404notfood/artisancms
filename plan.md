# Plan : Refonte plugin Member Space + création Member Plus

## Résumé

Réécriture complète du plugin `member-space` pour en faire un espace membre **classique et solide**, et création d'un nouveau plugin `member-plus` qui étend le premier avec les fonctionnalités premium.

---

## Plugin `member-space` (base) — Ce qui reste

### Tables DB (3 tables, on supprime 7)
- `member_profiles` — profil étendu (on garde, on simplifie : on retire show_in_directory, cover_photo, profile_visibility car c'est du member-plus)
- `member_admin_notes` — **NOUVELLE** : notes privées admin par membre (id, user_id, admin_id, content, created_at, updated_at)
- `member_activity_log` — journal d'activité (on garde tel quel)

### Tables supprimées du member-space (déplacées vers member-plus)
- `member_custom_fields` → member-plus
- `member_field_values` → member-plus
- `membership_plans` → member-plus
- `user_memberships` → member-plus
- `social_accounts` → member-plus
- `member_verifications` → member-plus
- `content_restrictions` → member-plus
- `two_factor_auth` → member-plus

### Admin — Gestion des membres (`/admin/member-space/`)

**Pages :**
1. **Liste des membres** (`/admin/member-space/members`) — Tableau avec recherche, filtre par rôle/statut, pagination, actions rapides (activer/désactiver)
2. **Fiche membre / Édition** (`/admin/member-space/members/{user}/edit`) — Page complète :
   - Section "Informations" : nom, email (modifiable), rôle, avatar, bio, téléphone, site web, localisation
   - Section "Mot de passe" : changer le mdp manuellement OU bouton "Envoyer un email de réinitialisation"
   - Section "Notes admin" : notes privées (CRUD inline, seuls les admins les voient)
   - Section "Liens & infos" : champs libres (liens custom, infos complémentaires stockées en JSON dans le profil)
   - Section "Statut" : actif/inactif, date d'inscription, dernière connexion
   - Section "Activité récente" : dernières 20 actions
   - Bouton "Supprimer le membre"
3. **Paramètres** (`/admin/member-space/settings`) — Simplifié :
   - Inscription ouverte oui/non
   - Rôle par défaut à l'inscription
   - Vérification email requise oui/non
   - Page de redirection après connexion
   - Page de redirection après inscription

### Front — Espace compte du membre (`/account/`)

**Pages :**
1. **Dashboard** (`/account`) — Bienvenue + nom, résumé du profil, liens rapides
2. **Mon profil** (`/account/profile`) — Voir/éditer : nom, avatar, bio, téléphone, site web, localisation, liens sociaux
3. **Changer mot de passe** (`/account/password`) — Ancien mdp + nouveau + confirmation
4. **Changer email** (`/account/email`) — Nouvel email + mdp actuel pour confirmer (envoie un email de vérification)
5. **Supprimer mon compte** (`/account/delete`) — Confirmation avec mot de passe, suppression définitive

### Backend — Fichiers à créer/modifier

**Controllers Admin (3) :**
- `MemberAdminController` — index, edit, update, destroy, toggleStatus, sendPasswordReset
- `MemberNoteController` — store, update, destroy (notes admin)
- `MemberSettingsController` — index, update

**Controllers Front (4) :**
- `AccountDashboardController` — index
- `AccountProfileController` — edit, update, uploadAvatar
- `AccountPasswordController` — edit, update
- `AccountEmailController` — edit, update
- `AccountDeleteController` — show, destroy

**Services (3) :**
- `MemberService` — gestion admin (updateMember, toggleStatus, deleteMember, sendPasswordReset, changePassword, changeEmail)
- `ProfileService` — simplifié (getOrCreateProfile, updateProfile, uploadAvatar)
- `MemberSettingsService` — inchangé

**Models (3) :**
- `MemberProfile` — simplifié (sans les champs directory/visibility)
- `MemberAdminNote` — nouveau
- `MemberActivity` — inchangé

**Migrations :**
- Nouvelle migration pour `member_admin_notes`
- Modifier `member_profiles` : retirer les colonnes directory (show_in_directory, profile_visibility, show_email, show_phone, cover_photo) — ces colonnes seront rajoutées par member-plus

### Frontend — Pages React

**Admin (3 pages) :**
- `Pages/Admin/MemberSpace/Members/Index.tsx` — réécriture
- `Pages/Admin/MemberSpace/Members/Edit.tsx` — **NOUVEAU** (remplace Show.tsx)
- `Pages/Admin/MemberSpace/Settings.tsx` — simplifié

**Front (5 pages) :**
- `Pages/Front/Account/Dashboard.tsx` — simplifié
- `Pages/Front/Account/Profile.tsx` — édition profil
- `Pages/Front/Account/Password.tsx` — changement mdp
- `Pages/Front/Account/Email.tsx` — changement email
- `Pages/Front/Account/Delete.tsx` — suppression compte

### Sidebar admin
Simplifier le groupe "Espace Membres" :
- Membres
- Paramètres

---

## Plugin `member-plus` (premium) — Nouveau plugin séparé

Dépend de `member-space`. Ajoute toutes les fonctionnalités avancées.
**Sera créé dans une phase ultérieure**, pas dans cette implémentation.

Contenu prévu :
- Plans/abonnements Stripe
- Restriction de contenu (pages/articles par plan/rôle)
- Annuaire public des membres
- Social login (Google, Facebook, GitHub)
- 2FA (Google Authenticator)
- Custom fields (champs perso sur les profils)
- Vérification admin des inscriptions

---

## Plan d'exécution

### Étape 1 : Nettoyage
- Supprimer tous les fichiers existants du plugin member-space (src/, routes/, resources/, database/)
- Supprimer les pages React admin et front existantes
- Rollback les migrations des tables qui partent vers member-plus

### Étape 2 : Migrations
- Nouvelle migration : `member_admin_notes`
- Nouvelle migration : modifier `member_profiles` (retirer colonnes directory)
- Garder `member_activity_log` tel quel

### Étape 3 : Backend (Models, Services, Controllers)
- Recréer les 3 models
- Recréer les 3 services
- Créer les controllers admin (3) et front (5)
- Recréer le ServiceProvider simplifié
- Recréer les routes

### Étape 4 : Frontend Admin
- Page liste des membres
- Page édition membre (formulaire complet avec notes, mdp, etc.)
- Page paramètres simplifiée

### Étape 5 : Frontend Front
- Dashboard, Profil, Mot de passe, Email, Suppression compte

### Étape 6 : Sidebar + Build
- Mettre à jour la sidebar admin
- Build Vite
- Test
