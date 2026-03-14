# Blueprint 05 - Référence Laravel + Inertia.js

## Vue d'ensemble
Ce document est la référence technique pour le développement avec le starter kit Laravel React (Inertia 2).

---

## Installation du projet

```bash
# Prérequis
# PHP 8.2+, Composer, Node.js 20+, MySQL/MariaDB

# Créer le projet Laravel avec le starter kit React
composer global require laravel/installer
laravel new artisan-cms
# → Choisir "React" comme starter kit
# → Choisir "Laravel" (built-in auth, pas WorkOS)

cd artisan-cms

# Installer les dépendances front
npm install && npm run build

# Configurer la DB (.env)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=artisan_cms
# DB_USERNAME=root
# DB_PASSWORD=

# Lancer les migrations
php artisan migrate

# Démarrer le dev server (Laravel + Vite HMR)
composer run dev
# → http://localhost:8000
```

---

## Structure des fichiers (starter kit)

```
resources/js/
├── components/           # Composants React réutilisables
│   ├── ui/               # shadcn/ui (button, dialog, form, sidebar, etc.)
│   └── app-sidebar.tsx   # Sidebar de l'app
├── hooks/                # Custom React hooks
├── layouts/              # Layouts de l'app
│   ├── app-layout.tsx    # Layout principal (wraps sidebar ou header)
│   ├── auth-layout.tsx   # Layout auth (login, register)
│   └── app/
│       ├── app-sidebar-layout.tsx
│       └── app-header-layout.tsx
├── lib/                  # Utilitaires
│   └── utils.ts          # cn() - merge Tailwind classes
├── pages/                # Pages Inertia (= routes)
│   ├── dashboard.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── settings/
│       ├── profile.tsx
│       ├── password.tsx
│       └── appearance.tsx
└── types/                # Définitions TypeScript
    └── index.d.ts        # User, SharedData, BreadcrumbItem
```

---

## Patterns Inertia essentiels

### 1. Route → Controller → Inertia::render → React Page

```php
// routes/web.php
Route::get('/pages', [PageController::class, 'index'])->name('admin.pages.index');

// app/Http/Controllers/Admin/PageController.php
public function index(): \Inertia\Response
{
    return Inertia::render('Admin/Pages/Index', [
        'pages' => Page::query()
            ->with('author')
            ->orderBy('updated_at', 'desc')
            ->paginate(20),
    ]);
}
```

```tsx
// resources/js/pages/Admin/Pages/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

interface Props {
    pages: PaginatedData<Page>;
}

export default function PagesIndex({ pages }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Pages', href: '/admin/pages' }]}>
            <Head title="Pages" />
            {/* ... */}
        </AppLayout>
    );
}
```

### 2. Shared Data (données globales dans HandleInertiaRequests)

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user(),
        ],
        'flash' => [
            'message' => fn () => $request->session()->get('message'),
            'error' => fn () => $request->session()->get('error'),
        ],
        // CMS-specific shared data
        'cms' => [
            'siteName' => fn () => setting('site_name', 'ArtisanCMS'),
            'activeTheme' => fn () => app('cms.themes')->getActive()['slug'] ?? null,
        ],
    ];
}
```

### 3. Formulaires avec useForm

```tsx
import { useForm } from '@inertiajs/react';

export default function CreatePage() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        template: 'default',
        status: 'draft',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/pages');
    }

    return (
        <form onSubmit={handleSubmit}>
            <Input
                value={data.title}
                onChange={e => setData('title', e.target.value)}
                error={errors.title}
            />
            <Button type="submit" disabled={processing}>
                Créer
            </Button>
        </form>
    );
}
```

### 4. Navigation programmatique

```tsx
import { router } from '@inertiajs/react';

// Navigation simple
router.visit('/admin/pages');

// POST / PUT / DELETE
router.post('/admin/pages', formData);
router.put(`/admin/pages/${page.id}`, formData);
router.delete(`/admin/pages/${page.id}`);

// Partial reload (ne recharger que certains props)
router.reload({ only: ['pages'] });
```

### 5. Liens Inertia

```tsx
import { Link } from '@inertiajs/react';

<Link href="/admin/pages">Pages</Link>
<Link href="/admin/pages" method="post" as="button">Créer</Link>
<Link href="/admin/pages" preserveScroll>Pages (garder scroll)</Link>
```

---

## Ajout de composants shadcn/ui

```bash
# Les composants essentiels pour le CMS admin
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add sheet          # Side panels (page builder)
npx shadcn@latest add sidebar        # Déjà inclus dans le starter kit
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add switch
npx shadcn@latest add textarea
npx shadcn@latest add tooltip
npx shadcn@latest add alert-dialog   # Confirmations de suppression
npx shadcn@latest add command        # Command palette (recherche rapide)
npx shadcn@latest add separator
npx shadcn@latest add skeleton       # Loading states
npx shadcn@latest add breadcrumb     # Déjà inclus dans le starter kit
```

Les composants sont copiés dans `resources/js/components/ui/`.
Utiliser `@/components/ui/button` pour les importer.

---

## Forms avec react-hook-form + Zod (pattern shadcn/ui)

```bash
npm install react-hook-form zod @hookform/resolvers
```

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const pageSchema = z.object({
    title: z.string().min(1, 'Le titre est requis').max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
    template: z.string(),
    status: z.enum(['draft', 'published', 'scheduled']),
    meta_title: z.string().max(70).optional(),
    meta_description: z.string().max(160).optional(),
});

type PageFormData = z.infer<typeof pageSchema>;
```

---

## Data Table avec TanStack Table (pattern shadcn/ui)

```bash
npm install @tanstack/react-table
```

Voir la doc shadcn/ui pour le pattern complet.
Essentiel pour : liste de pages, liste de posts, media library, utilisateurs, plugins.

---

## TypeScript types pour le CMS

```typescript
// resources/js/types/cms.d.ts

interface Page {
    id: number;
    title: string;
    slug: string;
    content: PageContent | null;
    status: 'draft' | 'published' | 'scheduled' | 'trash';
    template: string;
    meta_title: string | null;
    meta_description: string | null;
    parent_id: number | null;
    order: number;
    created_by: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author?: User;
}

interface Post {
    id: number;
    title: string;
    slug: string;
    content: PageContent | null;
    excerpt: string | null;
    status: 'draft' | 'published' | 'scheduled' | 'trash';
    featured_image: string | null;
    created_by: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author?: User;
    terms?: TaxonomyTerm[];
}

interface Media {
    id: number;
    filename: string;
    original_filename: string;
    path: string;
    mime_type: string;
    size: number;
    alt_text: string | null;
    title: string | null;
    metadata: { width?: number; height?: number } | null;
    thumbnails: { sm?: string; md?: string; lg?: string } | null;
    url: string; // Computed
}

interface Menu {
    id: number;
    name: string;
    slug: string;
    location: string | null;
    items?: MenuItem[];
}

interface MenuItem {
    id: number;
    menu_id: number;
    parent_id: number | null;
    label: string;
    type: 'page' | 'post' | 'url' | 'custom' | 'taxonomy';
    url: string | null;
    target: '_self' | '_blank';
    order: number;
    children?: MenuItem[];
}

interface Taxonomy {
    id: number;
    name: string;
    slug: string;
    type: string;
    hierarchical: boolean;
    terms?: TaxonomyTerm[];
}

interface TaxonomyTerm {
    id: number;
    taxonomy_id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    children?: TaxonomyTerm[];
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Setting {
    id: number;
    group: string;
    key: string;
    value: any;
    type: string;
}
```

---

## Helpers et utilitaires

### setting() helper PHP
```php
// app/helpers.php (à enregistrer dans composer.json autoload.files)
function setting(string $key, mixed $default = null): mixed
{
    return app(App\Services\SettingService::class)->get($key, $default);
}
```

### Route helpers
```php
// Routes admin avec middleware
Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('pages', PageController::class);
    Route::resource('posts', PostController::class);
    Route::resource('media', MediaController::class);
    Route::resource('menus', MenuController::class);
    Route::get('settings/{group?}', [SettingController::class, 'index'])->name('settings.index');
    Route::put('settings/{group}', [SettingController::class, 'update'])->name('settings.update');
    Route::get('themes', [ThemeController::class, 'index'])->name('themes.index');
    Route::get('plugins', [PluginController::class, 'index'])->name('plugins.index');
});

// Routes front (gérées en dernier, catch-all pour les pages dynamiques)
Route::get('/{slug}', [FrontPageController::class, 'show'])->where('slug', '.*')->name('front.page');
```
