# Blueprint 17 - Form Builder (Plugin officiel)

## Vue d'ensemble
Le Form Builder est un **plugin officiel** (`content/plugins/form-builder/`) qui permet de créer des formulaires visuellement et de collecter les soumissions. C'est le plugin le plus demandé pour les sites clients.

---

## 1. Structure du plugin

```
content/plugins/form-builder/
├── artisan-plugin.json
├── src/
│   ├── FormBuilderServiceProvider.php
│   ├── Models/
│   │   ├── Form.php
│   │   └── FormSubmission.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── FormController.php         # Admin CRUD
│   │   │   ├── FormSubmissionController.php
│   │   │   └── PublicFormController.php    # Soumission front
│   │   └── Requests/
│   │       ├── StoreFormRequest.php
│   │       └── SubmitFormRequest.php
│   └── Services/
│       ├── FormService.php
│       ├── SubmissionService.php
│       └── SpamProtectionService.php
├── database/migrations/
│   ├── create_forms_table.php
│   └── create_form_submissions_table.php
├── resources/
│   ├── js/
│   │   ├── blocks/
│   │   │   └── FormBlock.tsx              # Bloc page builder
│   │   ├── admin/
│   │   │   ├── Forms/
│   │   │   │   ├── Index.tsx
│   │   │   │   ├── Create.tsx
│   │   │   │   └── Edit.tsx               # Visual form builder
│   │   │   └── Submissions/
│   │   │       ├── Index.tsx
│   │   │       └── Show.tsx
│   │   └── components/
│   │       ├── FormFieldRenderer.tsx       # Rendu d'un champ
│   │       ├── FormFieldEditor.tsx         # Éditeur de champ (admin)
│   │       └── ConditionalLogicEditor.tsx  # UI logique conditionnelle
│   └── lang/
│       ├── fr/messages.php
│       └── en/messages.php
└── routes/
    ├── web.php                            # Route soumission publique
    └── admin.php                          # Routes admin
```

---

## 2. Tables

### forms
```php
Schema::create('forms', function (Blueprint $table) {
    $table->id();
    $table->string('name');                          // "Formulaire de contact"
    $table->string('slug')->unique();                // "contact"
    $table->json('fields');                          // Définition des champs (JSON)
    $table->json('settings')->nullable();            // Paramètres du formulaire
    $table->json('notifications')->nullable();       // Config email
    $table->json('confirmation')->nullable();        // Message/redirect après soumission
    $table->json('spam_protection')->nullable();     // Config anti-spam
    $table->boolean('is_active')->default(true);
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
});
```

### form_submissions
```php
Schema::create('form_submissions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('form_id')->constrained()->cascadeOnDelete();
    $table->json('data');                            // Données soumises
    $table->string('ip_address')->nullable();
    $table->string('user_agent')->nullable();
    $table->string('referrer')->nullable();
    $table->enum('status', ['new', 'read', 'replied', 'spam', 'trash'])->default('new');
    $table->timestamps();

    $table->index(['form_id', 'status', 'created_at']);
});
```

---

## 3. Structure JSON des champs

```typescript
interface FormField {
    id: string;                    // UUID
    type: FieldType;
    label: string;
    name: string;                  // Identifiant unique (snake_case)
    placeholder?: string;
    helpText?: string;
    required: boolean;
    validation?: ValidationRule[];
    defaultValue?: string;
    options?: FieldOption[];       // Pour select, radio, checkbox
    conditional?: ConditionalRule; // Logique conditionnelle
    width?: 'full' | 'half';      // Disposition
    order: number;
}

type FieldType =
    | 'text' | 'email' | 'phone' | 'number' | 'url'
    | 'textarea' | 'richtext'
    | 'select' | 'radio' | 'checkbox' | 'toggle'
    | 'date' | 'time' | 'datetime'
    | 'file'
    | 'hidden'
    | 'heading' | 'paragraph' | 'divider';  // Champs visuels (pas de données)

interface FieldOption {
    label: string;
    value: string;
}

interface ValidationRule {
    type: 'min' | 'max' | 'pattern' | 'mime' | 'maxSize';
    value: string | number;
    message?: string;
}

interface ConditionalRule {
    field: string;                 // ID du champ de référence
    operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty';
    value?: string;
    action: 'show' | 'hide';
}
```

### Exemple JSON d'un formulaire
```json
{
    "fields": [
        {
            "id": "f1",
            "type": "text",
            "label": "Nom complet",
            "name": "full_name",
            "required": true,
            "width": "half",
            "order": 0
        },
        {
            "id": "f2",
            "type": "email",
            "label": "Adresse email",
            "name": "email",
            "required": true,
            "width": "half",
            "order": 1
        },
        {
            "id": "f3",
            "type": "select",
            "label": "Sujet",
            "name": "subject",
            "required": true,
            "options": [
                { "label": "Question générale", "value": "general" },
                { "label": "Demande de devis", "value": "quote" },
                { "label": "Support technique", "value": "support" }
            ],
            "width": "full",
            "order": 2
        },
        {
            "id": "f4",
            "type": "textarea",
            "label": "Votre message",
            "name": "message",
            "required": true,
            "validation": [{ "type": "min", "value": 10, "message": "Minimum 10 caractères" }],
            "order": 3
        },
        {
            "id": "f5",
            "type": "file",
            "label": "Pièce jointe",
            "name": "attachment",
            "required": false,
            "validation": [
                { "type": "mime", "value": "pdf,doc,docx,jpg,png" },
                { "type": "maxSize", "value": 5242880 }
            ],
            "conditional": {
                "field": "f3",
                "operator": "equals",
                "value": "quote",
                "action": "show"
            },
            "order": 4
        }
    ],
    "settings": {
        "submitLabel": "Envoyer",
        "successMessage": "Merci ! Votre message a été envoyé.",
        "redirectUrl": null,
        "storeSubmissions": true,
        "limitPerIp": 5,
        "limitPeriod": "hour"
    },
    "notifications": [
        {
            "to": "admin@site.com",
            "replyTo": "{email}",
            "subject": "Nouveau message de {full_name}",
            "template": "default"
        }
    ],
    "spam_protection": {
        "honeypot": true,
        "recaptcha": false,
        "recaptcha_key": null,
        "time_check": true,
        "min_time_seconds": 3
    }
}
```

---

## 4. Anti-spam

```php
// src/Services/SpamProtectionService.php
class SpamProtectionService
{
    public function validate(Request $request, array $spamConfig): bool
    {
        // 1. Honeypot : champ caché qui doit rester vide
        if ($spamConfig['honeypot'] ?? false) {
            if ($request->filled('_hp_name')) {
                return false; // Bot a rempli le champ caché
            }
        }

        // 2. Time check : soumission trop rapide = bot
        if ($spamConfig['time_check'] ?? false) {
            $minTime = $spamConfig['min_time_seconds'] ?? 3;
            $loadedAt = $request->input('_form_loaded_at');
            if ($loadedAt && (time() - (int)$loadedAt) < $minTime) {
                return false;
            }
        }

        // 3. reCAPTCHA v3 (optionnel)
        if ($spamConfig['recaptcha'] ?? false) {
            return $this->verifyRecaptcha($request->input('_recaptcha_token'), $spamConfig['recaptcha_key']);
        }

        return true;
    }
}
```

---

## 5. Bloc Page Builder

```tsx
// resources/js/blocks/FormBlock.tsx
// Ce bloc permet d'insérer un formulaire dans une page via le page builder

interface FormBlockProps {
    formId: number;         // ID du formulaire à afficher
    formSlug: string;       // Slug pour le rendu
    theme?: 'default' | 'inline' | 'card';
}

// Dans le builder : un sélecteur dropdown avec la liste des formulaires créés
// En front : le formulaire est rendu avec ses champs et la logique conditionnelle
```

---

## 6. Export des soumissions

```php
// CSV export
public function export(Form $form): StreamedResponse
{
    return response()->streamDownload(function () use ($form) {
        $handle = fopen('php://output', 'w');
        $fields = collect($form->fields)->pluck('label', 'name');

        // En-tête
        fputcsv($handle, ['Date', ...$fields->values(), 'IP', 'Statut']);

        // Données
        $form->submissions()->orderByDesc('created_at')->chunk(100, function ($submissions) use ($handle, $fields) {
            foreach ($submissions as $sub) {
                $row = [$sub->created_at->format('Y-m-d H:i')];
                foreach ($fields as $name => $label) {
                    $row[] = $sub->data[$name] ?? '';
                }
                $row[] = $sub->ip_address;
                $row[] = $sub->status;
                fputcsv($handle, $row);
            }
        });

        fclose($handle);
    }, "{$form->slug}-submissions.csv");
}
```

---

## 7. Hooks du plugin

```php
// Le form builder s'intègre via le système de hooks CMS :
CMS::hook('admin_sidebar', function (&$items) {
    $items[] = [
        'label' => 'Formulaires',
        'icon' => 'file-text',
        'url' => '/admin/forms',
        'children' => [
            ['label' => 'Tous les formulaires', 'url' => '/admin/forms'],
            ['label' => 'Soumissions', 'url' => '/admin/forms/submissions'],
        ],
    ];
});

// Hook quand un formulaire est soumis (autres plugins peuvent écouter)
CMS::fireHook('form.submitted', $form, $submission);
```
