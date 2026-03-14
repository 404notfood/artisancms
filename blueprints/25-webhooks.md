# Blueprint 25 - Systeme de Webhooks

## Vue d'ensemble

Ce document definit le systeme de webhooks d'ArtisanCMS. Les webhooks permettent de **notifier des services externes** (Zapier, Make/Integromat, n8n, scripts personnalises) lorsqu'un evenement se produit dans le CMS. Le systeme est **event-driven** : chaque action CMS (creation/modification/publication de pages, soumission de formulaire, upload de media, etc.) peut declencher un appel HTTP POST vers une ou plusieurs URLs configurees.

Principes :
- **Securite** : chaque webhook peut etre signe via HMAC SHA-256 pour que le recepteur puisse verifier l'authenticite du payload
- **Fiabilite** : les envois sont traites en queue avec retry automatique et backoff exponentiel
- **Observabilite** : chaque livraison est loggee avec le code de reponse, la duree et le body de retour
- **Extensibilite** : les plugins peuvent enregistrer leurs propres evenements via le hook system

---

## 1. Table : webhooks

```php
// database/migrations/xxxx_xx_xx_create_cms_webhooks_table.php
<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('name');                              // "Sync avec Zapier"
            $table->string('url');                               // https://hooks.zapier.com/...
            $table->string('secret')->nullable();                // HMAC secret (auto-genere)
            $table->json('events');                              // ['page.published', 'post.created', ...]
            $table->json('headers')->nullable();                 // Headers HTTP custom
            $table->boolean('enabled')->default(true);
            $table->integer('retry_count')->default(3);          // Nombre max de tentatives
            $table->integer('timeout')->default(30);             // Timeout en secondes
            $table->integer('consecutive_failures')->default(0); // Compteur d'echecs consecutifs
            $table->timestamp('last_triggered_at')->nullable();
            $table->string('last_status')->nullable();           // success, failed
            $table->timestamps();

            $table->index('enabled');
            $table->index('last_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhooks');
    }
};
```

---

## 2. Table : webhook_deliveries (journal de livraison)

Chaque appel HTTP effectue est enregistre dans cette table pour permettre le suivi, le debug et le re-envoi manuel.

```php
// database/migrations/xxxx_xx_xx_create_cms_webhook_deliveries_table.php
<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_id')->constrained('webhooks')->cascadeOnDelete();
            $table->string('event');                        // page.published, post.created, etc.
            $table->json('payload');                         // Payload JSON envoye
            $table->json('request_headers')->nullable();     // Headers envoyes
            $table->integer('response_code')->nullable();    // 200, 500, null (timeout)
            $table->text('response_body')->nullable();       // Corps de la reponse (tronque a 10 Ko)
            $table->integer('duration_ms')->nullable();      // Duree de l'appel en ms
            $table->string('status');                        // pending, success, failed
            $table->integer('attempt')->default(1);          // Numero de la tentative
            $table->text('error_message')->nullable();       // Message d'erreur (timeout, DNS, etc.)
            $table->timestamp('next_retry_at')->nullable();  // Prochaine tentative planifiee
            $table->timestamp('created_at')->useCurrent();

            $table->index(['webhook_id', 'created_at']);
            $table->index('status');
            $table->index('event');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
    }
};
```

---

## 3. Modeles Eloquent

### Webhook

```php
// app/Models/Webhook.php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Webhook extends Model
{
    protected $fillable = [
        'name',
        'url',
        'secret',
        'events',
        'headers',
        'enabled',
        'retry_count',
        'timeout',
        'consecutive_failures',
        'last_triggered_at',
        'last_status',
    ];

    protected $casts = [
        'events'                => 'array',
        'headers'               => 'array',
        'enabled'               => 'boolean',
        'retry_count'           => 'integer',
        'timeout'               => 'integer',
        'consecutive_failures'  => 'integer',
        'last_triggered_at'     => 'datetime',
    ];

    // ─── Relations ────────────────────────────────────────

    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    // ─── Scopes ───────────────────────────────────────────

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    public function scopeListeningTo($query, string $event)
    {
        return $query->whereJsonContains('events', $event);
    }

    // ─── Helpers ──────────────────────────────────────────

    /**
     * Verifie si ce webhook ecoute un evenement donne.
     */
    public function listensTo(string $event): bool
    {
        return in_array($event, $this->events ?? [], true);
    }

    /**
     * Verifie si ce webhook a ete auto-desactive suite a trop d'echecs.
     */
    public function isAutoDisabled(): bool
    {
        return !$this->enabled && $this->consecutive_failures >= 10;
    }

    /**
     * Reinitialiser le compteur d'echecs et reactiver le webhook.
     */
    public function resetFailures(): void
    {
        $this->update([
            'consecutive_failures' => 0,
            'enabled' => true,
        ]);
    }
}
```

### WebhookDelivery

```php
// app/Models/WebhookDelivery.php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'webhook_id',
        'event',
        'payload',
        'request_headers',
        'response_code',
        'response_body',
        'duration_ms',
        'status',
        'attempt',
        'error_message',
        'next_retry_at',
        'created_at',
    ];

    protected $casts = [
        'payload'         => 'array',
        'request_headers' => 'array',
        'response_code'   => 'integer',
        'duration_ms'     => 'integer',
        'attempt'         => 'integer',
        'next_retry_at'   => 'datetime',
        'created_at'      => 'datetime',
    ];

    // ─── Relations ────────────────────────────────────────

    public function webhook(): BelongsTo
    {
        return $this->belongsTo(Webhook::class);
    }

    // ─── Scopes ───────────────────────────────────────────

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // ─── Helpers ──────────────────────────────────────────

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function isRetryable(): bool
    {
        return $this->isFailed() && $this->attempt < $this->webhook->retry_count;
    }
}
```

---

## 4. Evenements disponibles

Les evenements suivants sont disponibles nativement. Les plugins peuvent en ajouter via `CMS::registerWebhookEvent()`.

| Evenement | Categorie | Description | Declencheur |
|-----------|-----------|-------------|-------------|
| `page.created` | Contenu | Une page est creee | `PageService::create()` |
| `page.updated` | Contenu | Une page est modifiee | `PageService::update()` |
| `page.published` | Contenu | Une page est publiee | `PageService::publish()` |
| `page.deleted` | Contenu | Une page est supprimee | `PageService::delete()` |
| `post.created` | Contenu | Un article est cree | `PostService::create()` |
| `post.updated` | Contenu | Un article est modifie | `PostService::update()` |
| `post.published` | Contenu | Un article est publie | `PostService::publish()` |
| `post.deleted` | Contenu | Un article est supprime | `PostService::delete()` |
| `media.uploaded` | Media | Un fichier media est uploade | `MediaService::upload()` |
| `media.deleted` | Media | Un fichier media est supprime | `MediaService::delete()` |
| `menu.updated` | Navigation | Un menu est modifie | `MenuService::update()` |
| `form.submitted` | Formulaire | Un formulaire est soumis | Plugin form-builder |
| `user.created` | Utilisateurs | Un utilisateur est cree | `UserService::create()` |
| `user.updated` | Utilisateurs | Un utilisateur est modifie | `UserService::update()` |
| `plugin.activated` | Systeme | Un plugin est active | `PluginManager::activate()` |
| `plugin.deactivated` | Systeme | Un plugin est desactive | `PluginManager::deactivate()` |
| `theme.activated` | Systeme | Un theme est active | `ThemeManager::activate()` |
| `backup.completed` | Systeme | Une sauvegarde est terminee | Plugin backup-restore |
| `site.settings_updated` | Systeme | Les parametres du site sont modifies | `SettingsService::update()` |

### Enregistrer un evenement custom (plugin)

```php
// Dans le ServiceProvider d'un plugin
public function boot(): void
{
    CMS::registerWebhookEvent('order.completed', [
        'category'    => 'E-commerce',
        'description' => 'Une commande est finalisee',
    ]);
}
```

---

## 5. WebhookService

Service central qui orchestre la resolution des webhooks, la signature HMAC, et la mise en queue des livraisons.

```php
// app/Services/WebhookService.php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\WebhookDispatchJob;
use App\Models\Webhook;
use App\Models\WebhookDelivery;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WebhookService
{
    /**
     * Dispatcher un evenement vers tous les webhooks concernes.
     * Chaque webhook recoit un job en queue.
     */
    public function dispatch(string $event, array $data): void
    {
        $webhooks = Webhook::enabled()
            ->listeningTo($event)
            ->get();

        if ($webhooks->isEmpty()) {
            return;
        }

        $payload = $this->buildPayload($event, $data);

        foreach ($webhooks as $webhook) {
            WebhookDispatchJob::dispatch($webhook, $event, $payload);
        }
    }

    /**
     * Envoyer un webhook de maniere synchrone.
     * Utilise par le job et le bouton "Test" de l'admin.
     */
    public function send(Webhook $webhook, string $event, array $payload, int $attempt = 1): WebhookDelivery
    {
        $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $headers = $this->buildHeaders($webhook, $payloadJson);

        // Creer l'entree de livraison (status = pending)
        $delivery = WebhookDelivery::create([
            'webhook_id'      => $webhook->id,
            'event'           => $event,
            'payload'         => $payload,
            'request_headers' => $headers,
            'status'          => 'pending',
            'attempt'         => $attempt,
            'created_at'      => now(),
        ]);

        $startTime = microtime(true);

        try {
            $response = Http::timeout($webhook->timeout)
                ->withHeaders($headers)
                ->withBody($payloadJson, 'application/json')
                ->post($webhook->url);

            $durationMs = (int) ((microtime(true) - $startTime) * 1000);

            $isSuccess = $response->successful();

            $delivery->update([
                'response_code'  => $response->status(),
                'response_body'  => mb_substr($response->body(), 0, 10240), // Tronquer a 10 Ko
                'duration_ms'    => $durationMs,
                'status'         => $isSuccess ? 'success' : 'failed',
                'error_message'  => $isSuccess ? null : "HTTP {$response->status()}",
            ]);

            $this->updateWebhookStatus($webhook, $isSuccess);

        } catch (\Throwable $e) {
            $durationMs = (int) ((microtime(true) - $startTime) * 1000);

            $delivery->update([
                'duration_ms'    => $durationMs,
                'status'         => 'failed',
                'error_message'  => mb_substr($e->getMessage(), 0, 1000),
            ]);

            $this->updateWebhookStatus($webhook, false);

            Log::warning('Webhook delivery failed', [
                'webhook_id' => $webhook->id,
                'event'      => $event,
                'attempt'    => $attempt,
                'error'      => $e->getMessage(),
            ]);
        }

        return $delivery;
    }

    /**
     * Envoyer un ping de test (evenement special `ping`).
     */
    public function sendPing(Webhook $webhook): WebhookDelivery
    {
        $payload = $this->buildPayload('ping', [
            'message' => 'Webhook test from ArtisanCMS',
        ]);

        return $this->send($webhook, 'ping', $payload);
    }

    /**
     * Re-envoyer une livraison echouee.
     */
    public function retry(WebhookDelivery $delivery): WebhookDelivery
    {
        $webhook = $delivery->webhook;

        return $this->send(
            $webhook,
            $delivery->event,
            $delivery->payload,
            $delivery->attempt + 1,
        );
    }

    /**
     * Generer un secret HMAC aleatoire.
     */
    public function generateSecret(): string
    {
        return 'whsec_' . Str::random(40);
    }

    // ─── Methodes internes ────────────────────────────────

    /**
     * Construire le payload standard envoye aux webhooks.
     */
    protected function buildPayload(string $event, array $data): array
    {
        return [
            'event'      => $event,
            'timestamp'  => now()->toIso8601String(),
            'webhook_id' => null, // Sera rempli par le job pour chaque webhook
            'site'       => [
                'name' => config('cms.site_name', config('app.name')),
                'url'  => config('app.url'),
            ],
            'data'       => $data,
        ];
    }

    /**
     * Construire les headers HTTP (signature HMAC + headers custom).
     */
    protected function buildHeaders(Webhook $webhook, string $payloadJson): array
    {
        $headers = [
            'Content-Type'             => 'application/json',
            'User-Agent'               => 'ArtisanCMS-Webhook/1.0',
            'X-ArtisanCMS-Event'       => 'webhook',
            'X-ArtisanCMS-Delivery-Id' => (string) Str::uuid(),
        ];

        // Signature HMAC si un secret est configure
        if ($webhook->secret) {
            $signature = $this->sign($payloadJson, $webhook->secret);
            $headers['X-ArtisanCMS-Signature'] = "sha256={$signature}";
        }

        // Ajouter les headers custom du webhook
        if (!empty($webhook->headers)) {
            $headers = array_merge($headers, $webhook->headers);
        }

        return $headers;
    }

    /**
     * Signer un payload avec HMAC SHA-256.
     */
    protected function sign(string $payload, string $secret): string
    {
        return hash_hmac('sha256', $payload, $secret);
    }

    /**
     * Mettre a jour le statut du webhook apres un envoi.
     * Auto-desactive le webhook apres 10 echecs consecutifs.
     */
    protected function updateWebhookStatus(Webhook $webhook, bool $success): void
    {
        if ($success) {
            $webhook->update([
                'last_triggered_at'     => now(),
                'last_status'           => 'success',
                'consecutive_failures'  => 0,
            ]);
        } else {
            $failures = $webhook->consecutive_failures + 1;
            $data = [
                'last_triggered_at'     => now(),
                'last_status'           => 'failed',
                'consecutive_failures'  => $failures,
            ];

            // Auto-desactivation apres 10 echecs consecutifs
            if ($failures >= 10) {
                $data['enabled'] = false;

                Log::error('Webhook auto-disabled after 10 consecutive failures', [
                    'webhook_id'   => $webhook->id,
                    'webhook_name' => $webhook->name,
                    'url'          => $webhook->url,
                ]);

                // Notifier l'admin via le hook system
                \App\CMS\CMS::hook('webhook.auto_disabled', $webhook);
            }

            $webhook->update($data);
        }
    }
}
```

---

## 6. Format du payload

Tous les webhooks recoivent un payload JSON au format suivant :

```json
{
    "event": "page.published",
    "timestamp": "2026-03-10T12:00:00+00:00",
    "webhook_id": 1,
    "site": {
        "name": "Mon Site",
        "url": "https://example.com"
    },
    "data": {
        "id": 42,
        "title": "Nouvelle page",
        "slug": "nouvelle-page",
        "status": "published",
        "author": {
            "id": 1,
            "name": "Admin"
        },
        "url": "https://example.com/nouvelle-page",
        "published_at": "2026-03-10T12:00:00+00:00"
    }
}
```

### Exemples de payloads par evenement

#### page.published / post.published

```json
{
    "event": "page.published",
    "timestamp": "2026-03-10T12:00:00+00:00",
    "webhook_id": 1,
    "site": { "name": "Mon Site", "url": "https://example.com" },
    "data": {
        "id": 42,
        "title": "Nouvelle page",
        "slug": "nouvelle-page",
        "status": "published",
        "author": { "id": 1, "name": "Admin" },
        "url": "https://example.com/nouvelle-page",
        "published_at": "2026-03-10T12:00:00+00:00"
    }
}
```

#### media.uploaded

```json
{
    "event": "media.uploaded",
    "timestamp": "2026-03-10T12:30:00+00:00",
    "webhook_id": 2,
    "site": { "name": "Mon Site", "url": "https://example.com" },
    "data": {
        "id": 128,
        "original_filename": "photo-produit.jpg",
        "mime_type": "image/jpeg",
        "size": 245780,
        "url": "https://example.com/storage/media/photo-produit.jpg",
        "uploaded_by": { "id": 1, "name": "Admin" }
    }
}
```

#### form.submitted

```json
{
    "event": "form.submitted",
    "timestamp": "2026-03-10T14:15:00+00:00",
    "webhook_id": 3,
    "site": { "name": "Mon Site", "url": "https://example.com" },
    "data": {
        "form_id": 5,
        "form_name": "Contact",
        "submission_id": 201,
        "fields": {
            "name": "Jean Dupont",
            "email": "jean@example.com",
            "message": "Bonjour, je souhaite un devis."
        },
        "submitted_at": "2026-03-10T14:15:00+00:00"
    }
}
```

#### ping (test)

```json
{
    "event": "ping",
    "timestamp": "2026-03-10T10:00:00+00:00",
    "webhook_id": 1,
    "site": { "name": "Mon Site", "url": "https://example.com" },
    "data": {
        "message": "Webhook test from ArtisanCMS"
    }
}
```

---

## 7. Securite : signature HMAC

Chaque webhook peut avoir un **secret** utilise pour signer le payload via HMAC SHA-256. Le recepteur peut ainsi verifier que la requete provient bien d'ArtisanCMS et n'a pas ete alteree.

### Generation de la signature (cote CMS)

```php
$signature = hash_hmac('sha256', $payloadJson, $webhook->secret);
// Header envoye : X-ArtisanCMS-Signature: sha256=abc123def456...
```

### Verification cote recepteur (PHP)

```php
// verification-webhook.php
<?php

$secret = 'whsec_votre_secret_ici';
$payload = file_get_contents('php://input');
$signatureHeader = $_SERVER['HTTP_X_ARTISANCMS_SIGNATURE'] ?? '';

// Extraire le hash du header
$expectedSignature = str_replace('sha256=', '', $signatureHeader);

// Calculer la signature attendue
$computedSignature = hash_hmac('sha256', $payload, $secret);

// Comparaison securisee (timing-safe)
if (!hash_equals($computedSignature, $expectedSignature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Signature valide, traiter le payload
$data = json_decode($payload, true);
$event = $data['event'];

// Traiter l'evenement...
http_response_code(200);
echo json_encode(['status' => 'ok']);
```

### Verification cote recepteur (Node.js)

```javascript
// verification-webhook.js
const crypto = require('crypto');
const express = require('express');
const app = express();

app.use(express.raw({ type: 'application/json' }));

const WEBHOOK_SECRET = 'whsec_votre_secret_ici';

function verifySignature(payload, signatureHeader) {
    const expectedSignature = signatureHeader.replace('sha256=', '');
    const computedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-artisancms-signature'];

    if (!signature || !verifySignature(req.body, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const data = JSON.parse(req.body);
    console.log(`Event: ${data.event}`, data.data);

    // Traiter l'evenement...
    res.json({ status: 'ok' });
});

app.listen(3000);
```

### Bonnes pratiques de securite

1. **Toujours verifier la signature** avant de traiter le payload
2. Utiliser `hash_equals()` (PHP) ou `crypto.timingSafeEqual()` (Node.js) pour eviter les attaques timing
3. **Ne jamais exposer le secret** dans le code client ou les logs
4. Le secret est genere aleatoirement (`whsec_` + 40 caracteres) et stocke chiffre en base via le chiffrement Laravel (`encrypt()`)
5. **Verifier le timestamp** pour rejeter les replays trop anciens (> 5 minutes)

---

## 8. WebhookDispatchJob

Job en queue avec retry automatique et backoff exponentiel.

```php
// app/Jobs/WebhookDispatchJob.php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Webhook;
use App\Models\WebhookDelivery;
use App\Services\WebhookService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class WebhookDispatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Nombre maximum de tentatives gere manuellement (pas via $tries)
     * car on utilise un backoff exponentiel custom.
     */
    public int $tries = 1;

    /**
     * Timeout du job = timeout du webhook + marge
     */
    public int $timeout;

    public function __construct(
        protected Webhook $webhook,
        protected string $event,
        protected array $payload,
        protected int $attempt = 1,
    ) {
        $this->timeout = $webhook->timeout + 10;
        $this->queue = 'webhooks';

        // Injecter le webhook_id dans le payload
        $this->payload['webhook_id'] = $webhook->id;
    }

    /**
     * Middleware : eviter les doublons pour le meme webhook + event
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("{$this->webhook->id}-{$this->event}"))
                ->releaseAfter(60)
                ->expireAfter(300),
        ];
    }

    public function handle(WebhookService $webhookService): void
    {
        // Verifier que le webhook est toujours actif
        if (!$this->webhook->enabled) {
            Log::info('Webhook dispatch skipped (disabled)', [
                'webhook_id' => $this->webhook->id,
                'event'      => $this->event,
            ]);
            return;
        }

        $delivery = $webhookService->send(
            $this->webhook,
            $this->event,
            $this->payload,
            $this->attempt,
        );

        // Si echec et qu'il reste des tentatives, replanifier avec backoff
        if ($delivery->isFailed() && $this->attempt < $this->webhook->retry_count) {
            $this->scheduleRetry($delivery);
        }
    }

    /**
     * Planifier une nouvelle tentative avec backoff exponentiel.
     *
     * Tentative 1 (echec) → retry dans 10 secondes
     * Tentative 2 (echec) → retry dans 60 secondes
     * Tentative 3 (echec) → abandon
     */
    protected function scheduleRetry(WebhookDelivery $delivery): void
    {
        $delays = [10, 60, 300]; // secondes : 10s, 1min, 5min
        $delayIndex = min($this->attempt - 1, count($delays) - 1);
        $delay = $delays[$delayIndex];

        $nextRetryAt = now()->addSeconds($delay);

        // Mettre a jour la livraison avec la date de prochaine tentative
        $delivery->update([
            'next_retry_at' => $nextRetryAt,
        ]);

        // Dispatcher un nouveau job avec delai
        self::dispatch(
            $this->webhook,
            $this->event,
            $this->payload,
            $this->attempt + 1,
        )->delay($delay);

        Log::info('Webhook retry scheduled', [
            'webhook_id' => $this->webhook->id,
            'event'      => $this->event,
            'attempt'    => $this->attempt + 1,
            'delay'      => $delay,
            'next_retry' => $nextRetryAt->toIso8601String(),
        ]);
    }

    /**
     * En cas d'echec non gere du job.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('WebhookDispatchJob failed unexpectedly', [
            'webhook_id' => $this->webhook->id,
            'event'      => $this->event,
            'attempt'    => $this->attempt,
            'error'      => $exception->getMessage(),
        ]);
    }
}
```

### Configuration de la queue

```php
// config/queue.php — ajouter la queue 'webhooks'
'connections' => [
    'redis' => [
        'driver'     => 'redis',
        'connection' => 'default',
        'queue'      => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
        'block_for'   => null,
    ],
],

// Lancer le worker dedie
// php artisan queue:work --queue=webhooks
```

---

## 9. Trait DispatchesWebhooks (integration Observer)

Ce trait s'applique aux modeles Eloquent pour dispatcher automatiquement les evenements webhook lors des operations CRUD.

```php
// app/CMS/Traits/DispatchesWebhooks.php
<?php

declare(strict_types=1);

namespace App\CMS\Traits;

use App\Services\WebhookService;

trait DispatchesWebhooks
{
    /**
     * Boot du trait : enregistrer les observers Eloquent.
     */
    public static function bootDispatchesWebhooks(): void
    {
        static::created(function ($model) {
            $model->dispatchWebhookEvent('created');
        });

        static::updated(function ($model) {
            $model->dispatchWebhookEvent('updated');
        });

        static::deleted(function ($model) {
            $model->dispatchWebhookEvent('deleted');
        });
    }

    /**
     * Dispatcher un evenement webhook pour ce modele.
     *
     * Construit le nom d'evenement (ex: "page.created") et le payload,
     * puis passe au WebhookService.
     */
    protected function dispatchWebhookEvent(string $action): void
    {
        $eventName = $this->getWebhookEventPrefix() . '.' . $action;
        $payload = $this->toWebhookPayload($action);

        app(WebhookService::class)->dispatch($eventName, $payload);
    }

    /**
     * Dispatcher un evenement webhook custom (ex: "published").
     * A appeler manuellement dans les services.
     */
    public function dispatchWebhook(string $action): void
    {
        $this->dispatchWebhookEvent($action);
    }

    /**
     * Prefixe d'evenement pour ce modele.
     * Ex: "page" pour le modele Page → "page.created", "page.updated", etc.
     */
    protected function getWebhookEventPrefix(): string
    {
        // Peut etre surcharge par le modele
        if (property_exists($this, 'webhookEventPrefix')) {
            return $this->webhookEventPrefix;
        }

        // Convention : nom du modele en kebab-case singulier
        return strtolower(class_basename($this));
    }

    /**
     * Transformer le modele en payload webhook.
     * Peut etre surcharge par le modele pour personnaliser les donnees envoyees.
     */
    protected function toWebhookPayload(string $action): array
    {
        // Attributs a exclure du payload (sensibles ou volumineux)
        $excluded = $this->getWebhookExcludedAttributes();

        $attributes = array_diff_key(
            $this->attributesToArray(),
            array_flip($excluded),
        );

        $payload = [
            'id'     => $this->getKey(),
            'action' => $action,
        ];

        if ($action === 'updated') {
            // N'inclure que les champs modifies + les champs de contexte
            $dirty = array_diff_key($this->getDirty(), array_flip($excluded));
            $payload['changes'] = $dirty;
            $payload['previous'] = array_intersect_key($this->getOriginal(), $dirty);
        }

        return array_merge($payload, $attributes);
    }

    /**
     * Attributs exclus du payload webhook (secrets, contenu volumineux).
     */
    protected function getWebhookExcludedAttributes(): array
    {
        return $this->webhookExcluded ?? [
            'password',
            'remember_token',
            'two_factor_secret',
            'content', // JSON du page builder (trop volumineux)
        ];
    }
}
```

### Utilisation sur les modeles

```php
// app/Models/Page.php
<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\DispatchesWebhooks;
use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use LogsActivity;
    use DispatchesWebhooks;

    protected string $webhookEventPrefix = 'page';

    protected array $webhookExcluded = [
        'content',       // JSON du page builder
        'updated_at',
        'created_at',
    ];

    // ...
}
```

```php
// app/Models/Post.php
<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\DispatchesWebhooks;
use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use LogsActivity;
    use DispatchesWebhooks;

    protected string $webhookEventPrefix = 'post';

    protected array $webhookExcluded = [
        'content',
        'updated_at',
        'created_at',
    ];

    // ...
}
```

```php
// app/Models/Media.php
<?php

declare(strict_types=1);

namespace App\Models;

use App\CMS\Traits\DispatchesWebhooks;
use App\CMS\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use LogsActivity;
    use DispatchesWebhooks;

    protected string $webhookEventPrefix = 'media';

    protected array $webhookExcluded = [
        'metadata',
        'thumbnails',
        'updated_at',
    ];

    /**
     * Payload personnalise pour les medias.
     */
    protected function toWebhookPayload(string $action): array
    {
        return [
            'id'                => $this->id,
            'action'            => $action,
            'original_filename' => $this->original_filename,
            'mime_type'         => $this->mime_type,
            'size'              => $this->size,
            'url'               => $this->url,
            'uploaded_by'       => $this->user ? [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ] : null,
        ];
    }
}
```

### Dispatch manuel pour les evenements non-CRUD

Certains evenements (published, form.submitted, etc.) ne correspondent pas a un simple CRUD Eloquent. Ils doivent etre dispatches manuellement dans les services :

```php
// app/Services/PageService.php
public function publish(Page $page): Page
{
    $page->update([
        'status'       => 'published',
        'published_at' => now(),
    ]);

    // Dispatch webhook "page.published" manuellement
    $page->dispatchWebhook('published');

    return $page;
}
```

```php
// content/plugins/form-builder/src/Services/SubmissionService.php
public function submit(Form $form, array $data): FormSubmission
{
    $submission = FormSubmission::create([
        'form_id' => $form->id,
        'data'    => $data,
    ]);

    // Dispatch webhook "form.submitted" via le service
    app(WebhookService::class)->dispatch('form.submitted', [
        'form_id'       => $form->id,
        'form_name'     => $form->name,
        'submission_id' => $submission->id,
        'fields'        => $data,
        'submitted_at'  => now()->toIso8601String(),
    ]);

    return $submission;
}
```

---

## 10. Interface admin

### Routes

```php
// routes/admin.php
Route::middleware(['web', 'auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // ...

    Route::prefix('settings/webhooks')->name('webhooks.')->group(function () {
        Route::get('/', [WebhookController::class, 'index'])->name('index');
        Route::get('/create', [WebhookController::class, 'create'])->name('create');
        Route::post('/', [WebhookController::class, 'store'])->name('store');
        Route::get('/{webhook}/edit', [WebhookController::class, 'edit'])->name('edit');
        Route::put('/{webhook}', [WebhookController::class, 'update'])->name('update');
        Route::delete('/{webhook}', [WebhookController::class, 'destroy'])->name('destroy');
        Route::post('/{webhook}/toggle', [WebhookController::class, 'toggle'])->name('toggle');
        Route::post('/{webhook}/test', [WebhookController::class, 'test'])->name('test');
        Route::post('/{webhook}/reset', [WebhookController::class, 'reset'])->name('reset');

        // Deliveries
        Route::get('/{webhook}/deliveries', [WebhookController::class, 'deliveries'])->name('deliveries');
        Route::post('/deliveries/{delivery}/retry', [WebhookController::class, 'retryDelivery'])->name('deliveries.retry');
    });
});
```

### Controller

```php
// app/Http/Controllers/Admin/WebhookController.php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreWebhookRequest;
use App\Http\Requests\Admin\UpdateWebhookRequest;
use App\Models\Webhook;
use App\Models\WebhookDelivery;
use App\Services\WebhookService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WebhookController extends Controller
{
    public function __construct(
        protected WebhookService $webhookService,
    ) {}

    public function index(): Response
    {
        $webhooks = Webhook::withCount('deliveries')
            ->orderByDesc('updated_at')
            ->paginate(20);

        return Inertia::render('Admin/Settings/Webhooks/Index', [
            'webhooks' => $webhooks,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Settings/Webhooks/Create', [
            'availableEvents' => $this->getAvailableEvents(),
            'generatedSecret' => $this->webhookService->generateSecret(),
        ]);
    }

    public function store(StoreWebhookRequest $request): RedirectResponse
    {
        Webhook::create($request->validated());

        return redirect()
            ->route('admin.webhooks.index')
            ->with('success', __('cms.webhooks.created'));
    }

    public function edit(Webhook $webhook): Response
    {
        return Inertia::render('Admin/Settings/Webhooks/Edit', [
            'webhook'         => $webhook,
            'availableEvents' => $this->getAvailableEvents(),
        ]);
    }

    public function update(UpdateWebhookRequest $request, Webhook $webhook): RedirectResponse
    {
        $webhook->update($request->validated());

        return redirect()
            ->route('admin.webhooks.index')
            ->with('success', __('cms.webhooks.updated'));
    }

    public function destroy(Webhook $webhook): RedirectResponse
    {
        $webhook->delete();

        return redirect()
            ->route('admin.webhooks.index')
            ->with('success', __('cms.webhooks.deleted'));
    }

    /**
     * Activer/desactiver un webhook.
     */
    public function toggle(Webhook $webhook): RedirectResponse
    {
        $webhook->update(['enabled' => !$webhook->enabled]);

        $message = $webhook->enabled
            ? __('cms.webhooks.enabled')
            : __('cms.webhooks.disabled');

        return back()->with('success', $message);
    }

    /**
     * Envoyer un ping de test.
     */
    public function test(Webhook $webhook): RedirectResponse
    {
        $delivery = $this->webhookService->sendPing($webhook);

        $message = $delivery->isSuccess()
            ? __('cms.webhooks.test_success', ['code' => $delivery->response_code])
            : __('cms.webhooks.test_failed', ['error' => $delivery->error_message]);

        return back()->with(
            $delivery->isSuccess() ? 'success' : 'error',
            $message,
        );
    }

    /**
     * Reinitialiser le compteur d'echecs et reactiver.
     */
    public function reset(Webhook $webhook): RedirectResponse
    {
        $webhook->resetFailures();

        return back()->with('success', __('cms.webhooks.reset'));
    }

    /**
     * Afficher les livraisons d'un webhook.
     */
    public function deliveries(Webhook $webhook, Request $request): Response
    {
        $query = $webhook->deliveries()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('event')) {
            $query->where('event', $request->string('event'));
        }

        return Inertia::render('Admin/Settings/Webhooks/Deliveries', [
            'webhook'    => $webhook,
            'deliveries' => $query->paginate(50)->withQueryString(),
            'filters'    => $request->only(['status', 'event']),
        ]);
    }

    /**
     * Re-envoyer une livraison echouee.
     */
    public function retryDelivery(WebhookDelivery $delivery): RedirectResponse
    {
        $newDelivery = $this->webhookService->retry($delivery);

        $message = $newDelivery->isSuccess()
            ? __('cms.webhooks.retry_success')
            : __('cms.webhooks.retry_failed');

        return back()->with(
            $newDelivery->isSuccess() ? 'success' : 'error',
            $message,
        );
    }

    // ─── Helpers ──────────────────────────────────────────

    /**
     * Liste des evenements disponibles groupes par categorie.
     */
    protected function getAvailableEvents(): array
    {
        $events = [
            'Contenu' => [
                'page.created'   => 'Page creee',
                'page.updated'   => 'Page modifiee',
                'page.published' => 'Page publiee',
                'page.deleted'   => 'Page supprimee',
                'post.created'   => 'Article cree',
                'post.updated'   => 'Article modifie',
                'post.published' => 'Article publie',
                'post.deleted'   => 'Article supprime',
            ],
            'Media' => [
                'media.uploaded' => 'Media uploade',
                'media.deleted'  => 'Media supprime',
            ],
            'Navigation' => [
                'menu.updated' => 'Menu modifie',
            ],
            'Formulaire' => [
                'form.submitted' => 'Formulaire soumis',
            ],
            'Utilisateurs' => [
                'user.created' => 'Utilisateur cree',
                'user.updated' => 'Utilisateur modifie',
            ],
            'Systeme' => [
                'plugin.activated'   => 'Plugin active',
                'plugin.deactivated' => 'Plugin desactive',
                'theme.activated'    => 'Theme active',
                'backup.completed'   => 'Sauvegarde terminee',
                'site.settings_updated' => 'Parametres modifies',
            ],
        ];

        // Permettre aux plugins d'ajouter des evenements
        \App\CMS\CMS::filter('webhook_available_events', $events);

        return $events;
    }
}
```

### Form Requests

```php
// app/Http/Requests/Admin/StoreWebhookRequest.php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreWebhookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('cms.manage');
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'url'          => ['required', 'url', 'max:2048'],
            'secret'       => ['nullable', 'string', 'max:255'],
            'events'       => ['required', 'array', 'min:1'],
            'events.*'     => ['required', 'string'],
            'headers'      => ['nullable', 'array'],
            'headers.*.key'   => ['required_with:headers', 'string', 'max:255'],
            'headers.*.value' => ['required_with:headers', 'string', 'max:1024'],
            'enabled'      => ['boolean'],
            'retry_count'  => ['integer', 'min:0', 'max:10'],
            'timeout'      => ['integer', 'min:5', 'max:60'],
        ];
    }

    public function messages(): array
    {
        return [
            'url.url'         => __('cms.webhooks.validation.url_invalid'),
            'events.required' => __('cms.webhooks.validation.events_required'),
            'events.min'      => __('cms.webhooks.validation.events_min'),
        ];
    }
}
```

```php
// app/Http/Requests/Admin/UpdateWebhookRequest.php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

class UpdateWebhookRequest extends StoreWebhookRequest
{
    // Memes regles que StoreWebhookRequest
}
```

### Page React : liste des webhooks

```tsx
// resources/js/pages/Admin/Settings/Webhooks/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Play, Pencil, Trash2, RotateCcw } from 'lucide-react';

interface Webhook {
    id: number;
    name: string;
    url: string;
    events: string[];
    enabled: boolean;
    consecutive_failures: number;
    last_triggered_at: string | null;
    last_status: string | null;
    deliveries_count: number;
}

interface Props {
    webhooks: {
        data: Webhook[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
}

export default function WebhooksIndex({ webhooks }: Props) {
    function handleToggle(webhook: Webhook) {
        router.post(route('admin.webhooks.toggle', webhook.id), {}, {
            preserveScroll: true,
        });
    }

    function handleTest(webhook: Webhook) {
        router.post(route('admin.webhooks.test', webhook.id), {}, {
            preserveScroll: true,
        });
    }

    function handleDelete(webhook: Webhook) {
        if (confirm(`Supprimer le webhook "${webhook.name}" ?`)) {
            router.delete(route('admin.webhooks.destroy', webhook.id));
        }
    }

    function handleReset(webhook: Webhook) {
        router.post(route('admin.webhooks.reset', webhook.id), {}, {
            preserveScroll: true,
        });
    }

    function getStatusBadge(webhook: Webhook) {
        if (!webhook.enabled && webhook.consecutive_failures >= 10) {
            return <Badge variant="destructive">Auto-desactive</Badge>;
        }
        if (!webhook.enabled) {
            return <Badge variant="secondary">Inactif</Badge>;
        }
        if (webhook.last_status === 'failed') {
            return <Badge variant="destructive">Erreur</Badge>;
        }
        if (webhook.last_status === 'success') {
            return <Badge variant="default">Actif</Badge>;
        }
        return <Badge variant="outline">Jamais declenche</Badge>;
    }

    return (
        <AdminLayout>
            <Head title="Webhooks" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Webhooks</h1>
                        <p className="text-sm text-muted-foreground">
                            Notifier des services externes lors d'evenements CMS
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.webhooks.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouveau webhook
                        </Link>
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Evenements</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Dernier envoi</TableHead>
                            <TableHead>Livraisons</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {webhooks.data.map((webhook) => (
                            <TableRow key={webhook.id}>
                                <TableCell className="font-medium">
                                    {webhook.name}
                                </TableCell>
                                <TableCell>
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                        {webhook.url.length > 50
                                            ? webhook.url.substring(0, 50) + '...'
                                            : webhook.url}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                        {webhook.events.length} evenement(s)
                                    </span>
                                </TableCell>
                                <TableCell>{getStatusBadge(webhook)}</TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                        {webhook.last_triggered_at
                                            ? new Date(webhook.last_triggered_at).toLocaleString('fr-FR')
                                            : 'Jamais'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Link
                                        href={route('admin.webhooks.deliveries', webhook.id)}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        {webhook.deliveries_count}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleTest(webhook)}>
                                                <Play className="mr-2 h-4 w-4" />
                                                Tester (ping)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('admin.webhooks.edit', webhook.id)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggle(webhook)}>
                                                {webhook.enabled ? 'Desactiver' : 'Activer'}
                                            </DropdownMenuItem>
                                            {webhook.consecutive_failures >= 10 && (
                                                <DropdownMenuItem onClick={() => handleReset(webhook)}>
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Reinitialiser
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDelete(webhook)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
```

### Page React : journal de livraison

```tsx
// resources/js/pages/Admin/Settings/Webhooks/Deliveries.tsx
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface WebhookDeliveryEntry {
    id: number;
    event: string;
    response_code: number | null;
    duration_ms: number | null;
    status: string;
    attempt: number;
    error_message: string | null;
    created_at: string;
}

interface Props {
    webhook: { id: number; name: string; url: string };
    deliveries: {
        data: WebhookDeliveryEntry[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

export default function WebhookDeliveries({ webhook, deliveries, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    function applyFilter(status: string) {
        setStatusFilter(status);
        router.get(
            route('admin.webhooks.deliveries', webhook.id),
            { status: status || undefined },
            { preserveState: true },
        );
    }

    function handleRetry(delivery: WebhookDeliveryEntry) {
        router.post(route('admin.webhooks.deliveries.retry', delivery.id), {}, {
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout>
            <Head title={`Livraisons - ${webhook.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.webhooks.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Livraisons</h1>
                        <p className="text-sm text-muted-foreground">
                            {webhook.name} &mdash;{' '}
                            <code className="text-xs">{webhook.url}</code>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Select value={statusFilter} onValueChange={applyFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tous</SelectItem>
                            <SelectItem value="success">Succes</SelectItem>
                            <SelectItem value="failed">Echec</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        {deliveries.total} livraison(s)
                    </span>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Evenement</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Code HTTP</TableHead>
                            <TableHead>Duree</TableHead>
                            <TableHead>Tentative</TableHead>
                            <TableHead>Erreur</TableHead>
                            <TableHead className="w-[70px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deliveries.data.map((delivery) => (
                            <TableRow key={delivery.id}>
                                <TableCell>
                                    <time
                                        className="whitespace-nowrap text-sm text-muted-foreground"
                                        dateTime={delivery.created_at}
                                    >
                                        {new Date(delivery.created_at).toLocaleString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        })}
                                    </time>
                                </TableCell>
                                <TableCell>
                                    <code className="text-xs">{delivery.event}</code>
                                </TableCell>
                                <TableCell>
                                    <Badge className={STATUS_COLORS[delivery.status] ?? ''}>
                                        {delivery.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono text-sm">
                                        {delivery.response_code ?? '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                        {delivery.duration_ms ? `${delivery.duration_ms} ms` : '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{delivery.attempt}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="max-w-[200px] truncate text-xs text-destructive">
                                        {delivery.error_message ?? '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {delivery.status === 'failed' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRetry(delivery)}
                                            title="Re-envoyer"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
```

---

## 11. Commande de nettoyage des livraisons

```php
// app/Console/Commands/CleanupWebhookDeliveries.php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\WebhookDelivery;
use Illuminate\Console\Command;

class CleanupWebhookDeliveries extends Command
{
    protected $signature = 'cms:webhooks:cleanup
                            {--days=30 : Nombre de jours a conserver}
                            {--dry-run : Afficher le nombre sans supprimer}';

    protected $description = 'Supprimer les anciennes livraisons de webhooks';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $count = WebhookDelivery::where('created_at', '<', $cutoff)->count();

        if ($count === 0) {
            $this->info('Aucune livraison a supprimer.');
            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info("Mode dry-run : {$count} livraisons seraient supprimees (anterieures au {$cutoff->toDateString()}).");
            return self::SUCCESS;
        }

        $deleted = 0;
        do {
            $batch = WebhookDelivery::where('created_at', '<', $cutoff)
                ->limit(1000)
                ->delete();
            $deleted += $batch;
        } while ($batch > 0);

        $this->info("{$deleted} livraisons supprimees.");

        return self::SUCCESS;
    }
}
```

### Planification

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('cms:webhooks:cleanup --days=30')->daily()->at('04:00');
```

---

## 12. Configuration

```php
// config/cms.php — section webhooks
'webhooks' => [
    'enabled'        => env('CMS_WEBHOOKS_ENABLED', true),
    'queue'          => env('CMS_WEBHOOKS_QUEUE', 'webhooks'),
    'retention_days' => env('CMS_WEBHOOKS_RETENTION_DAYS', 30),
    'max_retries'    => env('CMS_WEBHOOKS_MAX_RETRIES', 3),
    'default_timeout' => env('CMS_WEBHOOKS_DEFAULT_TIMEOUT', 30),

    // Nombre d'echecs consecutifs avant auto-desactivation
    'auto_disable_threshold' => 10,

    // Delais de retry (en secondes) pour chaque tentative
    'retry_delays' => [10, 60, 300],
],
```

---

## 13. Integration dans le menu admin

```php
// Dans CMSServiceProvider::boot() ou via le hook system
CMS::hook('admin_sidebar', function (&$items) {
    // Ajouter dans le sous-menu "Parametres"
    $items[] = [
        'label'      => __('cms.sidebar.webhooks'),
        'icon'       => 'webhook',       // Icone Lucide
        'url'        => '/admin/settings/webhooks',
        'parent'     => 'settings',      // Sous-menu de Parametres
        'position'   => 50,
        'permission' => 'cms.manage',
    ];
});
```

---

## 14. Relations Eloquent (resume)

```
Webhook hasMany WebhookDelivery
WebhookDelivery belongsTo Webhook

Page uses DispatchesWebhooks → dispatche page.created, page.updated, page.deleted
Post uses DispatchesWebhooks → dispatche post.created, post.updated, post.deleted
Media uses DispatchesWebhooks → dispatche media.uploaded (created), media.deleted
```

---

## 15. Checklist d'implementation

### Phase 1 (Fondations)
- [ ] Migration `create_cms_webhooks_table`
- [ ] Migration `create_cms_webhook_deliveries_table`
- [ ] Modele `Webhook` avec relations, scopes, casts
- [ ] Modele `WebhookDelivery` avec relations, scopes, casts
- [ ] Configuration dans `config/cms.php`

### Phase 2 (Service et Job)
- [ ] `WebhookService` avec dispatch, send, sign, ping, retry
- [ ] `WebhookDispatchJob` avec backoff exponentiel
- [ ] Queue `webhooks` configuree
- [ ] Auto-desactivation apres 10 echecs consecutifs

### Phase 3 (Trait Observer)
- [ ] Trait `DispatchesWebhooks` cree dans `app/CMS/Traits/`
- [ ] Trait applique sur les modeles : Page, Post, Media
- [ ] Dispatch manuel dans les services : publish, form.submitted, etc.
- [ ] Hook `webhook_available_events` pour les plugins

### Phase 4 (Interface admin)
- [ ] Controller `WebhookController` avec CRUD + test + toggle + retry
- [ ] Form Requests `StoreWebhookRequest` et `UpdateWebhookRequest`
- [ ] Page Inertia `Admin/Settings/Webhooks/Index.tsx`
- [ ] Page Inertia `Admin/Settings/Webhooks/Create.tsx` et `Edit.tsx`
- [ ] Page Inertia `Admin/Settings/Webhooks/Deliveries.tsx`
- [ ] Integration dans le menu sidebar admin

### Phase 5 (Maintenance)
- [ ] Commande `cms:webhooks:cleanup` avec options `--days` et `--dry-run`
- [ ] Planification du nettoyage automatique (daily a 04:00)
- [ ] Tests unitaires pour WebhookService, WebhookDispatchJob, DispatchesWebhooks
- [ ] Tests d'integration pour le controller admin
