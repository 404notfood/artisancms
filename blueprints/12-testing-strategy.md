# Blueprint 12 - Stratégie de Tests

## Vue d'ensemble
ArtisanCMS utilise **PHPUnit** pour le backend Laravel et **Vitest** pour les packages React. Ce document définit la structure, les patterns, les priorités et les exemples pour chaque couche de tests.

---

## 1. Structure des dossiers

```
tests/
├── Unit/                          # Tests unitaires PHP (services, models)
│   ├── Services/
│   │   ├── PageServiceTest.php
│   │   ├── PostServiceTest.php
│   │   ├── MediaServiceTest.php
│   │   ├── MenuServiceTest.php
│   │   ├── SettingServiceTest.php
│   │   └── InstallerServiceTest.php
│   ├── Models/
│   │   ├── PageTest.php
│   │   ├── PostTest.php
│   │   └── RolePermissionTest.php
│   └── CMS/
│       ├── PluginManagerTest.php
│       ├── ThemeManagerTest.php
│       ├── BlockRegistryTest.php
│       └── ContentSanitizerTest.php
├── Feature/                       # Tests d'intégration PHP (controllers, API)
│   ├── Admin/
│   │   ├── PageControllerTest.php
│   │   ├── PostControllerTest.php
│   │   ├── MediaControllerTest.php
│   │   └── SettingControllerTest.php
│   ├── Api/
│   │   ├── BuilderApiTest.php
│   │   ├── MediaApiTest.php
│   │   └── PublicApiTest.php
│   ├── Install/
│   │   ├── InstallWizardTest.php
│   │   └── CMSInstallCommandTest.php
│   └── Auth/
│       ├── LoginTest.php
│       └── PermissionTest.php
└── Factories/                     # Model Factories
    ├── PageFactory.php
    ├── PostFactory.php
    ├── MediaFactory.php
    └── ...

packages/
├── page-builder/
│   └── tests/
│       ├── builder-store.test.ts
│       ├── tree-operations.test.ts
│       ├── history.test.ts
│       └── components/
│           ├── Canvas.test.tsx
│           └── BlockRenderer.test.tsx
├── blocks/
│   └── tests/
│       ├── registry.test.ts
│       ├── schemas.test.ts
│       └── renderers/
│           ├── HeadingRenderer.test.tsx
│           ├── TextRenderer.test.tsx
│           └── ImageRenderer.test.tsx
├── ui/
│   └── tests/
│       └── components.test.tsx
└── theme-engine/
    └── tests/
        ├── theme-resolver.test.ts
        └── css-variables.test.ts
```

---

## 2. Configuration PHPUnit

```xml
<!-- phpunit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>app</directory>
        </include>
        <exclude>
            <directory>app/Console</directory>
        </exclude>
    </source>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_CONNECTION" value="mysql"/>
        <env name="DB_DATABASE" value="artisan_cms_test"/>
        <env name="CACHE_STORE" value="array"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
    </php>
</phpunit>
```

---

## 3. Configuration Vitest

```typescript
// packages/page-builder/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/index.ts', 'src/**/*.d.ts'],
        },
    },
});
```

```typescript
// packages/page-builder/tests/setup.ts
import '@testing-library/jest-dom';
```

---

## 4. Model Factories

```php
// database/factories/PageFactory.php
<?php

namespace Database\Factories;

use App\Models\Page;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PageFactory extends Factory
{
    protected $model = Page::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'slug' => fake()->unique()->slug(3),
            'content' => [
                'version' => '1.0',
                'blocks' => [
                    [
                        'id' => fake()->uuid(),
                        'type' => 'section',
                        'props' => ['fullWidth' => false],
                        'styles' => ['desktop' => ['padding' => '40px 0']],
                        'visibility' => ['desktop' => true, 'tablet' => true, 'mobile' => true],
                        'children' => [
                            [
                                'id' => fake()->uuid(),
                                'type' => 'heading',
                                'props' => ['text' => fake()->sentence(), 'level' => 1],
                                'styles' => ['desktop' => []],
                                'visibility' => ['desktop' => true, 'tablet' => true, 'mobile' => true],
                            ],
                        ],
                    ],
                ],
                'settings' => [],
            ],
            'status' => 'draft',
            'template' => 'default',
            'meta_title' => fake()->optional()->sentence(6),
            'meta_description' => fake()->optional()->text(155),
            'parent_id' => null,
            'order' => 0,
            'created_by' => User::factory(),
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function scheduled(): static
    {
        return $this->state(fn () => [
            'status' => 'scheduled',
            'published_at' => now()->addDays(3),
        ]);
    }

    public function trashed(): static
    {
        return $this->state(fn () => [
            'status' => 'trash',
            'deleted_at' => now(),
        ]);
    }
}
```

```php
// database/factories/RoleFactory.php
<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            'name' => 'Editor',
            'slug' => 'editor',
            'permissions' => ['pages.*', 'posts.*', 'media.*'],
            'is_system' => false,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'name' => 'Admin',
            'slug' => 'admin',
            'permissions' => ['*'],
            'is_system' => true,
        ]);
    }

    public function author(): static
    {
        return $this->state(fn () => [
            'name' => 'Author',
            'slug' => 'author',
            'permissions' => ['pages.create', 'pages.edit_own', 'posts.create', 'posts.edit_own', 'media.upload'],
            'is_system' => true,
        ]);
    }
}
```

---

## 5. Exemples de tests PHP

### Test unitaire — Service
```php
// tests/Unit/Services/PageServiceTest.php
<?php

namespace Tests\Unit\Services;

use App\Models\Page;
use App\Models\User;
use App\Models\Role;
use App\Services\PageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageServiceTest extends TestCase
{
    use RefreshDatabase;

    private PageService $service;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PageService();
        $role = Role::factory()->admin()->create();
        $this->admin = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($this->admin);
    }

    public function test_create_page_generates_slug(): void
    {
        $page = $this->service->create([
            'title' => 'Mon super titre',
            'status' => 'draft',
        ]);

        $this->assertEquals('mon-super-titre', $page->slug);
        $this->assertEquals($this->admin->id, $page->created_by);
    }

    public function test_create_page_with_custom_slug(): void
    {
        $page = $this->service->create([
            'title' => 'Mon titre',
            'slug' => 'custom-slug',
            'status' => 'draft',
        ]);

        $this->assertEquals('custom-slug', $page->slug);
    }

    public function test_update_content_creates_revision(): void
    {
        $page = Page::factory()->create(['created_by' => $this->admin->id]);
        $originalContent = $page->content;

        $newContent = ['version' => '1.0', 'blocks' => [], 'settings' => []];
        $this->service->updateContent($page, $newContent);

        $this->assertCount(1, $page->revisions);
        $this->assertEquals($originalContent, $page->revisions->first()->data['content']);
    }

    public function test_list_pages_with_filters(): void
    {
        Page::factory()->count(5)->published()->create(['created_by' => $this->admin->id]);
        Page::factory()->count(3)->create(['created_by' => $this->admin->id, 'status' => 'draft']);

        $published = $this->service->list(['status' => 'published']);
        $this->assertEquals(5, $published->total());

        $drafts = $this->service->list(['status' => 'draft']);
        $this->assertEquals(3, $drafts->total());
    }

    public function test_find_by_slug_returns_only_published(): void
    {
        Page::factory()->create([
            'slug' => 'draft-page',
            'status' => 'draft',
            'created_by' => $this->admin->id,
        ]);

        Page::factory()->published()->create([
            'slug' => 'live-page',
            'created_by' => $this->admin->id,
        ]);

        $this->assertNull($this->service->findBySlug('draft-page'));
        $this->assertNotNull($this->service->findBySlug('live-page'));
    }

    public function test_delete_is_soft_delete(): void
    {
        $page = Page::factory()->create(['created_by' => $this->admin->id]);
        $this->service->delete($page);

        $this->assertSoftDeleted($page);
        $this->assertDatabaseHas('pages', ['id' => $page->id]);
    }
}
```

### Test d'intégration — Controller
```php
// tests/Feature/Admin/PageControllerTest.php
<?php

namespace Tests\Feature\Admin;

use App\Models\Page;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $author;

    protected function setUp(): void
    {
        parent::setUp();
        $adminRole = Role::factory()->admin()->create();
        $authorRole = Role::factory()->author()->create();
        $this->admin = User::factory()->create(['role_id' => $adminRole->id]);
        $this->author = User::factory()->create(['role_id' => $authorRole->id]);
    }

    public function test_admin_can_view_pages_index(): void
    {
        Page::factory()->count(5)->create(['created_by' => $this->admin->id]);

        $response = $this->actingAs($this->admin)
            ->get('/admin/pages');

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Pages/Index')
                ->has('pages.data', 5)
        );
    }

    public function test_admin_can_create_page(): void
    {
        $response = $this->actingAs($this->admin)
            ->post('/admin/pages', [
                'title' => 'Nouvelle page',
                'slug' => 'nouvelle-page',
                'status' => 'draft',
                'template' => 'default',
            ]);

        $response->assertRedirect('/admin/pages');
        $this->assertDatabaseHas('pages', ['slug' => 'nouvelle-page']);
    }

    public function test_author_cannot_delete_others_page(): void
    {
        $adminPage = Page::factory()->create(['created_by' => $this->admin->id]);

        $response = $this->actingAs($this->author)
            ->delete("/admin/pages/{$adminPage->id}");

        $response->assertForbidden();
    }

    public function test_guest_cannot_access_admin(): void
    {
        $response = $this->get('/admin/pages');
        $response->assertRedirect('/login');
    }
}
```

### Test API Builder
```php
// tests/Feature/Api/BuilderApiTest.php
<?php

namespace Tests\Feature\Api;

use App\Models\Page;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BuilderApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $role = Role::factory()->admin()->create();
        $this->admin = User::factory()->create(['role_id' => $role->id]);
    }

    public function test_save_page_content(): void
    {
        $page = Page::factory()->create(['created_by' => $this->admin->id]);

        $content = [
            'version' => '1.0',
            'blocks' => [
                [
                    'id' => 'test-uuid',
                    'type' => 'heading',
                    'props' => ['text' => 'Hello', 'level' => 1],
                    'styles' => ['desktop' => []],
                    'visibility' => ['desktop' => true, 'tablet' => true, 'mobile' => true],
                ],
            ],
            'settings' => [],
        ];

        $response = $this->actingAs($this->admin)
            ->putJson("/api/builder/pages/{$page->id}/content", ['content' => $content]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $page->refresh();
        $this->assertEquals($content, $page->content);
    }

    public function test_save_content_sanitizes_xss(): void
    {
        $page = Page::factory()->create(['created_by' => $this->admin->id]);

        $content = [
            'version' => '1.0',
            'blocks' => [
                [
                    'id' => 'test-uuid',
                    'type' => 'text',
                    'props' => ['html' => '<p>Safe</p><script>alert("xss")</script>'],
                    'styles' => ['desktop' => []],
                    'visibility' => ['desktop' => true, 'tablet' => true, 'mobile' => true],
                ],
            ],
            'settings' => [],
        ];

        $this->actingAs($this->admin)
            ->putJson("/api/builder/pages/{$page->id}/content", ['content' => $content]);

        $page->refresh();
        $html = $page->content['blocks'][0]['props']['html'];
        $this->assertStringNotContainsString('<script>', $html);
        $this->assertStringContainsString('<p>Safe</p>', $html);
    }

    public function test_autosave_does_not_create_revision(): void
    {
        $page = Page::factory()->create(['created_by' => $this->admin->id]);

        $this->actingAs($this->admin)
            ->postJson("/api/builder/pages/{$page->id}/autosave", [
                'content' => ['version' => '1.0', 'blocks' => [], 'settings' => []],
            ]);

        $this->assertCount(0, $page->revisions);
    }
}
```

### Test installation
```php
// tests/Feature/Install/CMSInstallCommandTest.php
<?php

namespace Tests\Feature\Install;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class CMSInstallCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // S'assurer que le fichier sentinelle n'existe pas
        File::delete(storage_path('.installed'));
    }

    protected function tearDown(): void
    {
        File::delete(storage_path('.installed'));
        parent::tearDown();
    }

    public function test_quick_install_creates_all_data(): void
    {
        $this->artisan('cms:install', ['--quick' => true])
            ->assertSuccessful();

        $this->assertFileExists(storage_path('.installed'));
        $this->assertDatabaseHas('roles', ['slug' => 'admin']);
        $this->assertDatabaseHas('users', ['email' => 'admin@artisancms.dev']);
        $this->assertDatabaseHas('settings', ['key' => 'site_name']);
        $this->assertDatabaseHas('cms_themes', ['slug' => 'default', 'active' => true]);
    }

    public function test_install_blocked_when_already_installed(): void
    {
        File::put(storage_path('.installed'), json_encode(['version' => '1.0']));

        $this->artisan('cms:install', ['--quick' => true])
            ->assertFailed();
    }
}
```

---

## 6. Exemples de tests Vitest (React)

### Test du store Zustand
```typescript
// packages/page-builder/tests/builder-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilderStore } from '../src/store/builder-store';
import type { BlockNode, PageContent } from '../src/types';

describe('BuilderStore', () => {
    beforeEach(() => {
        useBuilderStore.setState({
            pageContent: { version: '1.0', blocks: [], settings: {} },
            selectedBlockId: null,
            history: [],
            historyIndex: -1,
            isDirty: false,
        });
    });

    it('should add a block', () => {
        const block: BlockNode = {
            id: 'test-1',
            type: 'heading',
            props: { text: 'Hello', level: 1 },
            styles: { desktop: {} },
            visibility: { desktop: true, tablet: true, mobile: true },
        };

        useBuilderStore.getState().addBlock(block, 'root', 0);

        const { pageContent } = useBuilderStore.getState();
        expect(pageContent.blocks).toHaveLength(1);
        expect(pageContent.blocks[0].id).toBe('test-1');
    });

    it('should select a block', () => {
        useBuilderStore.getState().selectBlock('block-id');
        expect(useBuilderStore.getState().selectedBlockId).toBe('block-id');
    });

    it('should undo and redo', () => {
        const store = useBuilderStore.getState();

        // Action 1
        store.addBlock({
            id: 'b1', type: 'heading', props: {}, styles: { desktop: {} },
            visibility: { desktop: true, tablet: true, mobile: true },
        }, 'root', 0);
        store.pushHistory();

        // Action 2
        store.addBlock({
            id: 'b2', type: 'text', props: {}, styles: { desktop: {} },
            visibility: { desktop: true, tablet: true, mobile: true },
        }, 'root', 1);
        store.pushHistory();

        expect(useBuilderStore.getState().pageContent.blocks).toHaveLength(2);

        // Undo
        useBuilderStore.getState().undo();
        expect(useBuilderStore.getState().pageContent.blocks).toHaveLength(1);

        // Redo
        useBuilderStore.getState().redo();
        expect(useBuilderStore.getState().pageContent.blocks).toHaveLength(2);
    });

    it('should mark as dirty after changes', () => {
        expect(useBuilderStore.getState().isDirty).toBe(false);

        useBuilderStore.getState().addBlock({
            id: 'b1', type: 'heading', props: {}, styles: { desktop: {} },
            visibility: { desktop: true, tablet: true, mobile: true },
        }, 'root', 0);

        expect(useBuilderStore.getState().isDirty).toBe(true);
    });
});
```

### Test des opérations sur l'arbre
```typescript
// packages/page-builder/tests/tree-operations.test.ts
import { describe, it, expect } from 'vitest';
import { addBlock, removeBlock, moveBlock, duplicateBlock, findBlock } from '../src/utils/tree-operations';
import type { BlockNode } from '../src/types';

describe('Tree Operations', () => {
    const sampleTree: BlockNode[] = [
        {
            id: 'section-1',
            type: 'section',
            props: {},
            styles: { desktop: {} },
            visibility: { desktop: true, tablet: true, mobile: true },
            children: [
                {
                    id: 'heading-1',
                    type: 'heading',
                    props: { text: 'Title', level: 1 },
                    styles: { desktop: {} },
                    visibility: { desktop: true, tablet: true, mobile: true },
                },
                {
                    id: 'text-1',
                    type: 'text',
                    props: { html: '<p>Content</p>' },
                    styles: { desktop: {} },
                    visibility: { desktop: true, tablet: true, mobile: true },
                },
            ],
        },
    ];

    it('should find a block by id', () => {
        const block = findBlock(sampleTree, 'heading-1');
        expect(block).toBeDefined();
        expect(block?.type).toBe('heading');
    });

    it('should remove a block', () => {
        const result = removeBlock(sampleTree, 'heading-1');
        expect(findBlock(result, 'heading-1')).toBeUndefined();
        expect(result[0].children).toHaveLength(1);
    });

    it('should duplicate a block with new id', () => {
        const result = duplicateBlock(sampleTree, 'heading-1');
        const section = result[0];
        expect(section.children).toHaveLength(3);
        expect(section.children![1].type).toBe('heading');
        expect(section.children![1].id).not.toBe('heading-1');
    });
});
```

### Test d'un renderer
```tsx
// packages/blocks/tests/renderers/HeadingRenderer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeadingRenderer } from '../../src/renderers/HeadingRenderer';

describe('HeadingRenderer', () => {
    it('renders h1 by default', () => {
        render(<HeadingRenderer text="Hello World" level={1} />);
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent('Hello World');
    });

    it('renders correct heading level', () => {
        render(<HeadingRenderer text="Subtitle" level={3} />);
        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading).toBeInTheDocument();
    });

    it('applies custom styles', () => {
        const { container } = render(
            <HeadingRenderer
                text="Styled"
                level={2}
                styles={{ color: '#ff0000', fontSize: '32px' }}
            />
        );
        const heading = container.querySelector('h2');
        expect(heading).toHaveStyle({ color: '#ff0000', fontSize: '32px' });
    });
});
```

---

## 7. Priorités de test par phase

### Phase 1 — Fondations
| Quoi tester | Type | Priorité |
|-------------|------|----------|
| Model factories fonctionnelles | Unit | Haute |
| Relations Eloquent | Unit | Haute |
| Services CRUD (Page, Post) | Unit | Haute |
| InstallerService | Unit | Haute |
| CMSInstall command (--quick) | Feature | Haute |
| Wizard /install flow | Feature | Moyenne |
| Permissions et Policies | Feature | Haute |
| Middleware EnsureInstalled | Feature | Haute |

### Phase 2 — Contenu
| Quoi tester | Type | Priorité |
|-------------|------|----------|
| CRUD Pages (controller) | Feature | Haute |
| CRUD Posts (controller) | Feature | Haute |
| Media upload validation | Feature | Haute |
| ContentSanitizer | Unit | Haute |
| Search / filters | Feature | Moyenne |

### Phase 3 — Page Builder
| Quoi tester | Type | Priorité |
|-------------|------|----------|
| Tree operations (add, remove, move, duplicate) | Vitest | Haute |
| Builder store (Zustand) | Vitest | Haute |
| Undo/Redo | Vitest | Haute |
| Block schemas (Zod validation) | Vitest | Haute |
| API save content | Feature | Haute |
| Block renderers | Vitest | Moyenne |
| Auto-save | Vitest | Moyenne |

### Phase 4-5 — Plugins / E-commerce
| Quoi tester | Type | Priorité |
|-------------|------|----------|
| PluginManager install/activate/deactivate | Unit | Haute |
| Hook system (fire + listen) | Unit | Haute |
| Filter system | Unit | Haute |
| CartService | Unit | Haute |
| OrderService | Unit | Haute |

---

## 8. Commandes de test

```bash
# Tous les tests PHP
php artisan test

# Un seul fichier
php artisan test --filter=PageServiceTest

# Un seul test
php artisan test --filter=test_create_page_generates_slug

# Avec couverture
php artisan test --coverage --min=70

# Tests Vitest (tous les packages)
npm test

# Un seul package
npm test --workspace=@artisan/page-builder

# Avec couverture
npm test -- --coverage

# CI : tous les tests
php artisan test && npm test
```

---

## 9. Objectifs de couverture

| Couche | Objectif | Raison |
|--------|----------|--------|
| Services PHP | ≥ 80% | Logique métier critique |
| Policies PHP | ≥ 90% | Sécurité |
| Controllers PHP | ≥ 70% | Intégration |
| Tree operations (TS) | ≥ 90% | Manipulation de données critique |
| Builder store (TS) | ≥ 80% | State management |
| Block renderers (TS) | ≥ 60% | UI (tests plus fragiles) |
| **Global** | **≥ 70%** | |

---

## 10. Trait de test utilitaire

```php
// tests/Traits/CmsTestHelpers.php
<?php

namespace Tests\Traits;

use App\Models\User;
use App\Models\Role;

trait CmsTestHelpers
{
    protected function createAdmin(): User
    {
        $role = Role::factory()->admin()->create();
        return User::factory()->create(['role_id' => $role->id]);
    }

    protected function createEditor(): User
    {
        $role = Role::factory()->create(['slug' => 'editor', 'permissions' => ['pages.*', 'posts.*', 'media.*']]);
        return User::factory()->create(['role_id' => $role->id]);
    }

    protected function createAuthor(): User
    {
        $role = Role::factory()->author()->create();
        return User::factory()->create(['role_id' => $role->id]);
    }

    protected function installCms(): void
    {
        $this->artisan('cms:install', ['--quick' => true]);
    }
}
```
