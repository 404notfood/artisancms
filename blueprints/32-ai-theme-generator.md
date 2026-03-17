# Blueprint 32 - AI Theme & Template Generator

## Vue d'ensemble

L'**AI Theme Generator** permet de créer un thème complet (palette, typographie, CSS variables) ou un template de site (structure de pages avec blocs pré-remplis) à partir d'une description en langage naturel.

**Exemple :**
> "Restaurant gastronomique, ambiance chic, couleurs sombres et dorées, typographie élégante"

→ Génère : thème CSS + pages Homepage/Menu/Contact avec blocs pré-remplis, prêt à utiliser.

---

## 1. Modèles économiques possibles

### Option A — Clé API de l'utilisateur (modèle actuel du plugin AI Assistant)
- L'utilisateur entre sa propre clé OpenAI ou Anthropic dans les settings
- **Avantage** : zéro coût pour toi, zéro infrastructure
- **Inconvénient** : friction élevée (l'utilisateur doit avoir un compte API)
- **Usage** : thèmes illimités tant que l'utilisateur a des crédits API
- **Idéal pour** : les développeurs techniques qui utilisent ArtisanCMS

### Option B — Crédits ArtisanCMS (système de tokens internes)
- Tu achètes des tokens en gros via l'API Anthropic/OpenAI
- L'utilisateur achète des "crédits ArtisanCMS" (ex: 5 crédits = 5 générations)
- Chaque génération de thème consomme 1 crédit (~$0.01–0.05 de coût API réel)
- Tu revends avec une marge (ex: 10 crédits à $5 → marge ~70%)
- **Avantage** : expérience fluide, pas de compte API requis, revenus récurrents
- **Inconvénient** : nécessite un backend de paiement (Stripe) + gestion de crédits
- **Idéal pour** : utilisateurs non-techniques (cible principale ArtisanCMS)

### Option C — Génération sur le site de présentation ArtisanCMS (SaaS)
- Page marketing `artisancms.dev/generate-theme`
- L'utilisateur décrit son site → preview du thème → achat → téléchargement du `.zip`
- Le thème généré est un fichier `artisan-theme.zip` installable en un clic
- **Avantage** : vitrine du produit + source de revenus avant installation
- **Inconvénient** : nécessite un serveur dédié pour le site de présentation
- **Modèle de prix suggéré** : 3 générations gratuites, puis $2/thème ou pack $9/10 thèmes
- **Idéal pour** : conversion de prospects → clients

### Option D — Génération one-shot lors de l'installation (recommandée)
- Étape optionnelle dans le wizard d'installation (après choix du template)
- "Personnaliser ce template avec l'AI" → prompt utilisateur → thème généré
- Nécessite une clé API OU un crédit offert à l'installation (1 génération gratuite)
- **Avantage** : WOW effect à l'onboarding, zéro friction, pas d'achat requis
- **Inconvénient** : 1 seul appel API gratuit à absorber
- **Idéal pour** : onboarding et différenciation concurrentielle

### Recommandation : combiner A + D pour la V1, B + C pour la V2
```
V1 : Clé API propre (Option A) + 1 génération gratuite à l'install (Option D)
V2 : Système de crédits ArtisanCMS (Option B) + site de présentation (Option C)
```

---

## 2. Architecture technique

### 2.1 Nouveau driver dans le plugin AI Assistant

```
content/plugins/ai-assistant/
└── src/
    └── Services/
        └── Drivers/
            ├── ThemeGeneratorDriver.php      # Génération de thème CSS
            └── TemplateGeneratorDriver.php   # Génération de template de pages
```

### 2.2 Nouveaux endpoints API

```
POST /api/ai/generate-theme      # Génère un thème à partir d'un prompt
POST /api/ai/generate-template   # Génère un template de pages
POST /api/ai/preview-theme       # Preview CSS sans sauvegarder
GET  /api/ai/theme-credits       # Solde de crédits (Option B)
```

### 2.3 Flux de génération (Option A - clé utilisateur)

```
1. Utilisateur saisit prompt dans l'admin
2. Frontend → POST /api/ai/generate-theme {prompt, style_hints}
3. ThemeGeneratorDriver construit le prompt système (voir §3)
4. Appel API Anthropic/OpenAI → réponse JSON structurée
5. Validation + transformation → artisan-theme.json + CSS variables
6. Sauvegarde en DB (table themes) + fichiers dans content/themes/
7. Activation optionnelle immédiate
```

---

## 3. Prompt système pour la génération de thème

### Structure du prompt système envoyé à l'AI

```
Tu es un expert en design web spécialisé dans la création de thèmes pour CMS.

Tu dois générer un thème complet pour ArtisanCMS à partir de la description fournie.

CONTRAINTES :
- Retourne UNIQUEMENT du JSON valide, sans commentaire ni explication
- Toutes les couleurs en format hexadécimal (#RRGGBB)
- Les polices doivent être disponibles sur Google Fonts
- Le thème doit être accessible (contraste WCAG AA minimum)
- Génère 5 variantes de couleur (primary, secondary, accent, neutral, danger)

STRUCTURE JSON ATTENDUE :
{
  "theme": {
    "name": "string (nom du thème)",
    "slug": "string (kebab-case)",
    "description": "string",
    "category": "business|creative|minimal|bold|elegant",
    "preview_colors": ["#hex1", "#hex2", "#hex3"]
  },
  "css_variables": {
    "colors": {
      "--color-primary": "#hex",
      "--color-primary-foreground": "#hex",
      "--color-secondary": "#hex",
      "--color-secondary-foreground": "#hex",
      "--color-accent": "#hex",
      "--color-accent-foreground": "#hex",
      "--color-background": "#hex",
      "--color-foreground": "#hex",
      "--color-muted": "#hex",
      "--color-muted-foreground": "#hex",
      "--color-border": "#hex",
      "--color-card": "#hex",
      "--color-card-foreground": "#hex",
      "--color-destructive": "#hex",
      "--color-destructive-foreground": "#hex"
    },
    "typography": {
      "--font-heading": "'Font Name', serif",
      "--font-body": "'Font Name', sans-serif",
      "--font-mono": "'Font Name', monospace",
      "--font-size-base": "16px",
      "--font-size-lg": "18px",
      "--font-size-xl": "20px",
      "--font-size-2xl": "24px",
      "--font-size-3xl": "30px",
      "--font-size-4xl": "36px",
      "--font-size-5xl": "48px",
      "--line-height-tight": "1.2",
      "--line-height-normal": "1.5",
      "--line-height-relaxed": "1.75"
    },
    "spacing": {
      "--spacing-section": "80px",
      "--spacing-container-max": "1280px",
      "--radius": "0.5rem",
      "--radius-lg": "0.75rem",
      "--radius-full": "9999px"
    },
    "shadows": {
      "--shadow-sm": "0 1px 2px rgba(0,0,0,0.05)",
      "--shadow-md": "0 4px 6px rgba(0,0,0,0.07)",
      "--shadow-lg": "0 10px 15px rgba(0,0,0,0.10)",
      "--shadow-xl": "0 20px 25px rgba(0,0,0,0.10)"
    }
  },
  "google_fonts": ["Font Name 1", "Font Name 2"],
  "dark_mode": {
    "--color-background": "#hex",
    "--color-foreground": "#hex",
    "--color-card": "#hex",
    "--color-muted": "#hex",
    "--color-border": "#hex"
  }
}
```

### Prompt utilisateur enrichi (ajout de contexte automatique)

```php
// ThemeGeneratorDriver.php
private function buildUserPrompt(string $userPrompt, array $hints = []): string
{
    $style = $hints['style'] ?? 'auto';
    $industry = $hints['industry'] ?? 'general';

    return "Description du site : {$userPrompt}\n"
        . "Secteur : {$industry}\n"
        . "Style préféré : {$style}\n"
        . "Génère un thème professionnel adapté à cette description.";
}
```

---

## 4. Prompt système pour la génération de template

### Structure JSON du template généré

```json
{
  "template": {
    "name": "string",
    "slug": "string",
    "description": "string",
    "category": "business|creative|blog|landing"
  },
  "pages": [
    {
      "title": "Accueil",
      "slug": "/",
      "is_homepage": true,
      "content": [
        {
          "type": "section",
          "id": "uuid",
          "settings": { "background": "var(--color-background)" },
          "children": [
            {
              "type": "hero-section",
              "id": "uuid",
              "props": {
                "heading": "string généré par l'AI",
                "subheading": "string généré par l'AI",
                "cta_text": "string",
                "cta_url": "#contact",
                "image_placeholder": true
              }
            }
          ]
        }
      ]
    }
  ],
  "menus": {
    "header": [
      { "label": "Accueil", "url": "/" },
      { "label": "Services", "url": "/services" },
      { "label": "Contact", "url": "/contact" }
    ],
    "footer": []
  },
  "settings": {
    "site_name": "string",
    "site_description": "string"
  }
}
```

---

## 5. Système de crédits (Option B - V2)

### Table `ai_generation_credits`

```sql
CREATE TABLE ai_generation_credits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    balance INT NOT NULL DEFAULT 0,          -- Crédits disponibles
    total_purchased INT NOT NULL DEFAULT 0,
    total_used INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table `ai_generation_log`

```sql
CREATE TABLE ai_generation_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('theme', 'template', 'content', 'seo', 'alt_text') NOT NULL,
    provider ENUM('openai', 'anthropic', 'artisancms') NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    credits_used INT NOT NULL DEFAULT 1,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    result_id BIGINT UNSIGNED NULL,          -- ID du thème/template généré
    result_type VARCHAR(50) NULL,
    metadata JSON NULL,                       -- Prompt, paramètres, etc.
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table `ai_credit_transactions`

```sql
CREATE TABLE ai_credit_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('purchase', 'use', 'refund', 'bonus') NOT NULL,
    amount INT NOT NULL,                     -- Positif = ajout, négatif = consommation
    balance_after INT NOT NULL,
    stripe_payment_intent_id VARCHAR(255) NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Packs de crédits suggérés

| Pack | Crédits | Prix | Prix/crédit | Usage |
|------|---------|------|-------------|-------|
| Starter | 3 | Gratuit (à l'install) | $0 | Découverte |
| Basic | 10 | $5 | $0.50 | Petits projets |
| Pro | 30 | $12 | $0.40 | Freelance |
| Agency | 100 | $35 | $0.35 | Agences |

*Coût réel API par génération : ~$0.02-0.05 (Claude Haiku / GPT-4o-mini)*

---

## 6. Intégration dans le wizard d'installation (Option D)

### Étape 5.5 — Personnalisation AI (après choix du template)

```
Wizard :
Étape 1 : Stack (Laravel)
Étape 2 : Langue
Étape 3 : Prérequis
Étape 4 : Base de données
Étape 5 : Site (nom, URL)
→ Étape 5.5 : Template + AI (NOUVEAU)
Étape 6 : Admin (compte)
Étape 7 : Installation
```

**UX de l'étape 5.5 :**
```
┌─────────────────────────────────────────────────────┐
│  Choisissez votre point de départ                   │
│                                                     │
│  ○ Template existant                                │
│    [Restaurant] [Agence] [Portfolio] [Blog] ...     │
│                                                     │
│  ○ ✨ Générer avec l'AI (1 génération offerte)      │
│    ┌─────────────────────────────────────────────┐ │
│    │ Décrivez votre site en quelques mots...     │ │
│    │ Ex: "Restaurant gastronomique, ambiance     │ │
│    │ chic, couleurs sombres et dorées"           │ │
│    └─────────────────────────────────────────────┘ │
│    [Générer mon thème →]                            │
│                                                     │
│  ○ Site vierge                                      │
└─────────────────────────────────────────────────────┘
```

**Mécanisme de la génération gratuite :**
- 1 token JWT signé par installation (stocké dans `storage/.install_ai_token`)
- Validation côté serveur : 1 seule utilisation, expire après 24h
- Appel direct à l'API Anthropic avec **ta clé API** (absorbée comme coût marketing)
- Coût estimé : ~$0.03 par installation qui utilise la feature

---

## 7. Site de présentation (Option C - V2)

### Page `artisancms.dev/generate-theme`

**Flux UX :**
```
1. Formulaire de description
   ├── Prompt libre : "Décrivez votre site"
   ├── Secteur (select) : Restaurant, Agence, Portfolio...
   ├── Style (select) : Moderne, Classique, Minimaliste, Bold...
   └── Palette préférée (color picker optionnel)

2. Preview en temps réel
   ├── Aperçu des couleurs générées
   ├── Aperçu typographique (heading + body)
   └── Mini-preview d'une page fictive

3. Actions
   ├── [Régénérer] → nouveau prompt ou variante
   ├── [Télécharger le thème - $2] → paiement Stripe one-shot
   └── [Pack 10 thèmes - $9] → paiement Stripe

4. Après paiement
   └── Téléchargement artisan-theme.zip (installable via admin)
```

### Backend du site de présentation

- Serveur Node.js/Laravel séparé (ou même app avec domaine distinct)
- Utilise **ta clé API Anthropic** (pas celle de l'utilisateur)
- Paiement via Stripe Checkout (one-shot, pas d'abonnement)
- Pas de compte requis (email → lien de téléchargement)

---

## 8. Implémentation V1 (clé API utilisateur)

### Priorité : faible (post Phase 4)
### Dépendances : Plugin AI Assistant actif + clé API configurée

### Fichiers à créer

```php
// content/plugins/ai-assistant/src/Services/Drivers/ThemeGeneratorDriver.php
class ThemeGeneratorDriver
{
    public function __construct(
        private AiService $ai,
        private ThemeService $themes
    ) {}

    public function generate(string $prompt, array $options = []): array
    {
        $systemPrompt = $this->buildSystemPrompt();
        $userPrompt = $this->buildUserPrompt($prompt, $options);

        $response = $this->ai->complete($systemPrompt, $userPrompt, [
            'max_tokens' => 2048,
            'temperature' => 0.8,
            'response_format' => 'json', // OpenAI JSON mode
        ]);

        return $this->parseAndValidate($response);
    }

    private function parseAndValidate(string $json): array
    {
        $data = json_decode($json, true);

        // Validation de la structure attendue
        $required = ['theme', 'css_variables', 'google_fonts'];
        foreach ($required as $key) {
            if (!isset($data[$key])) {
                throw new AiGenerationException("Champ manquant : {$key}");
            }
        }

        // Validation des couleurs hex
        foreach ($data['css_variables']['colors'] as $var => $value) {
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $value)) {
                throw new AiGenerationException("Couleur invalide : {$var} = {$value}");
            }
        }

        return $data;
    }
}
```

```tsx
// resources/js/Pages/Admin/AI/ThemeGenerator.tsx
export default function ThemeGenerator() {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [preview, setPreview] = useState<ThemePreview | null>(null);

    const handleGenerate = async () => {
        setGenerating(true);
        const result = await router.post('/api/ai/generate-theme', { prompt });
        setPreview(result.data);
        setGenerating(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1>Générer un thème avec l'AI</h1>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Décrivez votre site : secteur, ambiance, couleurs préférées..."
                className="w-full h-32 p-4 border rounded-lg"
            />

            <Button onClick={handleGenerate} disabled={generating}>
                {generating ? 'Génération en cours...' : '✨ Générer le thème'}
            </Button>

            {preview && <ThemePreviewCard theme={preview} />}
        </div>
    );
}
```

---

## 9. Feuille de route

| Version | Fonctionnalité | Prérequis |
|---------|---------------|-----------|
| V1 (Phase 4) | Génération thème avec clé API propre | Plugin AI Assistant |
| V1 (Phase 4) | 1 génération gratuite au wizard d'install | Clé API ArtisanCMS |
| V1 (Phase 4) | Génération template avec clé API propre | Plugin AI Assistant |
| V2 | Système de crédits ArtisanCMS + Stripe | Backend paiement |
| V2 | Site de présentation avec générateur | Serveur dédié |
| V2 | API publique pour intégrations tierces | Auth API tokens |

---

## 10. Estimation des coûts API par génération

| Modèle | Tokens estimés | Coût estimé |
|--------|---------------|-------------|
| Claude Haiku | ~1500 tokens | ~$0.002 |
| Claude Sonnet | ~1500 tokens | ~$0.015 |
| GPT-4o-mini | ~1500 tokens | ~$0.003 |
| GPT-4o | ~1500 tokens | ~$0.015 |

**Recommandation** : utiliser Claude Haiku ou GPT-4o-mini pour la génération de thèmes (tâche structurée, pas besoin du modèle le plus puissant).

---

## 11. Intégration dans blueprint 21 (AI Assistant)

Le blueprint 21 reste la référence pour :
- La configuration des drivers (clé API, modèle)
- Le suivi d'utilisation (`ai_usage_logs`)
- Le rate limiting et les politiques d'autorisation

Ce blueprint 32 étend le plugin AI Assistant avec deux nouveaux drivers spécialisés (`ThemeGeneratorDriver`, `TemplateGeneratorDriver`) et définit les modèles économiques pour monétiser la feature.
