# Blueprint 04 - Page Builder (dnd-kit)

## Vue d'ensemble
Le page builder est le cœur no-code d'ArtisanCMS. Il permet de construire des pages visuellement avec du drag & drop, type Elementor/Divi. Construit avec React + dnd-kit, stocké en JSON dans la base de données.

---

## Architecture technique

### Packages npm
```bash
# Core drag & drop
@dnd-kit/core          # DndContext, useDraggable, useDroppable
@dnd-kit/sortable      # SortableContext, useSortable, arrayMove
@dnd-kit/utilities     # CSS.Transform, CSS.Translate
@dnd-kit/modifiers     # restrictToWindowEdges, snapCenterToCursor

# Rich text editing
@tiptap/react          # Éditeur rich text pour les blocs texte
@tiptap/starter-kit    # Extensions de base

# Utilitaires
uuid                   # Génération d'IDs uniques pour les blocs
immer                  # Gestion immutable du state complexe
zustand                # Store global pour le builder state
```

---

## Structure JSON d'une page

```typescript
interface PageContent {
  version: string;           // "1.0" - pour migrations futures
  blocks: BlockNode[];       // Arbre de blocs
  settings: PageSettings;    // Paramètres globaux de la page
}

interface BlockNode {
  id: string;                // UUID unique
  type: string;              // "section", "grid", "heading", etc.
  props: Record<string, any>; // Propriétés du bloc
  styles: ResponsiveStyles;  // Styles responsive
  children?: BlockNode[];    // Blocs enfants (pour section, grid, column)
  visibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
}

interface ResponsiveStyles {
  desktop: CSSProperties;
  tablet?: Partial<CSSProperties>;
  mobile?: Partial<CSSProperties>;
}

interface CSSProperties {
  // Layout
  padding?: string;
  margin?: string;
  width?: string;
  maxWidth?: string;
  minHeight?: string;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;

  // Borders
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;

  // Typography
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  lineHeight?: string;

  // Effects
  opacity?: number;
  boxShadow?: string;
}

interface PageSettings {
  bodyClass?: string;
  customCss?: string;
  customJs?: string;
}
```

### Exemple concret de page JSON

```json
{
  "version": "1.0",
  "blocks": [
    {
      "id": "sect-001",
      "type": "section",
      "props": { "fullWidth": true },
      "styles": {
        "desktop": { "padding": "80px 0", "backgroundColor": "#f8fafc" }
      },
      "visibility": { "desktop": true, "tablet": true, "mobile": true },
      "children": [
        {
          "id": "grid-001",
          "type": "grid",
          "props": { "columns": 2, "gap": "32px" },
          "styles": {
            "desktop": { "maxWidth": "1280px", "margin": "0 auto", "padding": "0 24px" }
          },
          "visibility": { "desktop": true, "tablet": true, "mobile": true },
          "children": [
            {
              "id": "col-001",
              "type": "column",
              "props": {},
              "styles": { "desktop": {} },
              "visibility": { "desktop": true, "tablet": true, "mobile": true },
              "children": [
                {
                  "id": "hdg-001",
                  "type": "heading",
                  "props": { "text": "Bienvenue sur notre site", "level": 1 },
                  "styles": {
                    "desktop": { "fontSize": "48px", "fontWeight": "700", "color": "#0f172a", "lineHeight": "1.1" },
                    "tablet": { "fontSize": "36px" },
                    "mobile": { "fontSize": "28px" }
                  },
                  "visibility": { "desktop": true, "tablet": true, "mobile": true }
                },
                {
                  "id": "txt-001",
                  "type": "text",
                  "props": { "html": "<p>Découvrez nos services et notre expertise.</p>" },
                  "styles": {
                    "desktop": { "fontSize": "18px", "color": "#64748b", "lineHeight": "1.6" }
                  },
                  "visibility": { "desktop": true, "tablet": true, "mobile": true }
                },
                {
                  "id": "btn-001",
                  "type": "button",
                  "props": {
                    "text": "En savoir plus",
                    "url": "/about",
                    "variant": "primary",
                    "size": "lg"
                  },
                  "styles": { "desktop": { "margin": "24px 0 0 0" } },
                  "visibility": { "desktop": true, "tablet": true, "mobile": true }
                }
              ]
            },
            {
              "id": "col-002",
              "type": "column",
              "props": {},
              "styles": { "desktop": {} },
              "visibility": { "desktop": true, "tablet": true, "mobile": true },
              "children": [
                {
                  "id": "img-001",
                  "type": "image",
                  "props": {
                    "src": "/media/hero-image.jpg",
                    "alt": "Hero image",
                    "objectFit": "cover"
                  },
                  "styles": {
                    "desktop": { "borderRadius": "12px", "width": "100%" }
                  },
                  "visibility": { "desktop": true, "tablet": true, "mobile": true }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "settings": {}
}
```

---

## Blocs de base (core)

### Layout Blocks (structurels)

| Slug | Props | Enfants | Description |
|------|-------|---------|-------------|
| `section` | `fullWidth`, `tag` (div/section/article) | Oui | Conteneur principal, empilés verticalement |
| `grid` | `columns` (1-6), `gap` | Oui → columns | Grille de colonnes |
| `column` | - | Oui | Colonne dans un grid |
| `container` | `maxWidth` | Oui | Wrapper avec largeur max |
| `spacer` | `height` | Non | Espace vertical |
| `divider` | `style`, `color`, `width` | Non | Ligne de séparation |

### Content Blocks

| Slug | Props | Description |
|------|-------|-------------|
| `heading` | `text`, `level` (h1-h6), `tag` | Titre |
| `text` | `html` (rich text via TipTap) | Paragraphe / texte riche |
| `image` | `src`, `alt`, `objectFit`, `link` | Image simple |
| `video` | `url`, `type` (youtube/vimeo/mp4), `autoplay`, `loop` | Vidéo embarquée |
| `button` | `text`, `url`, `variant`, `size`, `icon`, `target` | Bouton CTA |
| `icon` | `name` (Lucide), `size`, `color` | Icône |
| `html` | `code` | HTML/CSS/JS custom |

### Navigation Blocks

| Slug | Props | Description |
|------|-------|-------------|
| `tabs` | `items: [{label, content}]` | Onglets |
| `accordion` | `items: [{title, content}]` | Accordéon |
| `breadcrumb` | `auto` (boolean) | Fil d'Ariane |

### Data Blocks

| Slug | Props | Description |
|------|-------|-------------|
| `post-list` | `count`, `category`, `layout` (list/grid), `columns` | Liste d'articles |
| `post-grid` | `count`, `category`, `columns` | Grille d'articles |
| `form` | `fields: [{type, label, required}]`, `action`, `method` | Formulaire |
| `map` | `address`, `lat`, `lng`, `zoom` | Carte Google Maps |

### Media Blocks

| Slug | Props | Description |
|------|-------|-------------|
| `gallery` | `images: [{src, alt}]`, `columns`, `lightbox` | Galerie d'images |
| `slider` | `slides: [{image, title, text}]`, `autoplay`, `interval` | Carousel |

---

## Architecture React du Builder

```
packages/page-builder/src/
├── index.ts                     # Export principal
├── PageBuilder.tsx              # Composant principal
├── store/
│   ├── builder-store.ts         # Zustand store (state global)
│   └── history.ts               # Undo/redo stack
├── canvas/
│   ├── Canvas.tsx               # Zone d'édition principale
│   ├── BlockRenderer.tsx        # Rendu récursif des blocs
│   ├── SortableBlock.tsx        # Wrapper useSortable pour chaque bloc
│   ├── DropZone.tsx             # Zone de drop entre les blocs
│   └── DragOverlay.tsx          # Preview pendant le drag
├── sidebar/
│   ├── Sidebar.tsx              # Panel latéral (onglets)
│   ├── BlockLibrary.tsx         # Liste des blocs à glisser (toolbox)
│   ├── BlockSettings.tsx        # Propriétés du bloc sélectionné
│   ├── StylePanel.tsx           # Panneau de styles (padding, margin, etc.)
│   └── ResponsivePanel.tsx      # Switches desktop/tablet/mobile
├── toolbar/
│   ├── Toolbar.tsx              # Barre d'outils supérieure
│   ├── UndoRedo.tsx             # Boutons undo/redo
│   ├── DevicePreview.tsx        # Switcher desktop/tablet/mobile
│   └── SaveButton.tsx           # Sauvegarde (POST vers API Laravel)
├── blocks/
│   ├── registry.ts              # Registre de tous les blocs
│   ├── block-schema.ts          # Schémas de validation (Zod)
│   └── renderers/
│       ├── SectionRenderer.tsx
│       ├── GridRenderer.tsx
│       ├── HeadingRenderer.tsx
│       ├── TextRenderer.tsx
│       ├── ImageRenderer.tsx
│       ├── ButtonRenderer.tsx
│       └── ...
├── hooks/
│   ├── use-builder.ts           # Hook principal d'accès au store
│   ├── use-selected-block.ts    # Bloc actuellement sélectionné
│   ├── use-drag-handlers.ts     # Handlers DnD (onDragStart, onDragEnd, onDragOver)
│   └── use-auto-save.ts         # Auto-save debounced
└── utils/
    ├── tree-operations.ts       # Opérations sur l'arbre de blocs (add, move, remove, duplicate)
    └── responsive.ts            # Utils pour les breakpoints
```

---

## Store Zustand (builder-store.ts)

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { BlockNode, PageContent } from './types';

interface BuilderState {
  // Data
  pageContent: PageContent;
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  activeDevice: 'desktop' | 'tablet' | 'mobile';
  isDirty: boolean;

  // History
  history: PageContent[];
  historyIndex: number;

  // Actions
  setPageContent: (content: PageContent) => void;
  selectBlock: (id: string | null) => void;
  hoverBlock: (id: string | null) => void;
  setDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;

  // Block operations
  addBlock: (block: BlockNode, parentId: string, index: number) => void;
  moveBlock: (blockId: string, newParentId: string, newIndex: number) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  updateBlockProps: (blockId: string, props: Partial<BlockNode['props']>) => void;
  updateBlockStyles: (blockId: string, device: string, styles: Partial<CSSProperties>) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Save
  save: () => Promise<void>;
}
```

---

## Structure DnD (dnd-kit)

```tsx
// PageBuilder.tsx - Architecture de haut niveau
<DndContext
  sensors={sensors}                    // PointerSensor (distance: 8) + KeyboardSensor
  collisionDetection={pointerWithin}   // Meilleur pour conteneurs imbriqués
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  {/* Sidebar : blocs à glisser */}
  <Sidebar>
    <BlockLibrary />   {/* useDraggable pour chaque bloc toolbox */}
    <BlockSettings />  {/* Props du bloc sélectionné */}
  </Sidebar>

  {/* Canvas : la page en construction */}
  <Canvas>
    {/* Niveau 1 : Sections sortables */}
    <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
      {sections.map(section => (
        <SortableSection key={section.id}>
          {/* Niveau 2 : Grids/conteneurs sortables */}
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            {section.children.map(child => (
              <SortableBlock key={child.id}>
                {/* Niveau 3+ : Récursif */}
                {child.children && <NestedSortable blocks={child.children} />}
              </SortableBlock>
            ))}
          </SortableContext>
        </SortableSection>
      ))}
    </SortableContext>
  </Canvas>

  {/* Overlay pendant le drag */}
  <DragOverlay>
    {activeBlock && <BlockPreview block={activeBlock} />}
  </DragOverlay>
</DndContext>
```

---

## Flow de données

```
1. Chargement page :
   Laravel Controller → Inertia::render('Builder/Edit', ['page' => $page])
   → React reçoit page.content (JSON) → Zustand store initialisé

2. Édition :
   User drag & drop / modifie props → Zustand store mis à jour
   → Canvas re-render → History push (pour undo/redo)

3. Sauvegarde :
   Zustand store → JSON sérialisé → POST /api/pages/{id}/content
   → Laravel Controller → PageService::updateContent($page, $json)
   → Validation JSON → Sauvegarde en DB → Révision créée

4. Rendu front :
   Visiteur accède à /ma-page → Laravel charge page.content
   → Inertia::render('Front/Page', ['page' => $page, 'theme' => $activeTheme])
   → React BlockRenderer parcourt le JSON → Composants React rendus
   → ThemeEngine applique les styles du thème actif
```

---

## API Laravel pour le builder

```php
// routes/api.php
Route::middleware(['web', 'auth'])->prefix('api/builder')->group(function () {
    // Sauvegarder le contenu d'une page
    Route::put('/pages/{page}/content', [BuilderController::class, 'saveContent']);

    // Upload média inline (depuis le builder)
    Route::post('/media/upload', [BuilderController::class, 'uploadMedia']);

    // Auto-save (draft)
    Route::post('/pages/{page}/autosave', [BuilderController::class, 'autoSave']);

    // Preview (rendu temporaire sans sauvegarder)
    Route::post('/pages/{page}/preview', [BuilderController::class, 'preview']);

    // Templates de pages
    Route::get('/templates', [BuilderController::class, 'listTemplates']);
    Route::post('/templates', [BuilderController::class, 'saveAsTemplate']);
});
```

---

## Fonctionnalités avancées

### 1. Undo/Redo
- History stack dans Zustand (max 50 entrées)
- Ctrl+Z / Ctrl+Y (ou Cmd sur Mac)
- Chaque action qui modifie l'arbre push dans l'historique

### 2. Auto-save
- Debounce de 3 secondes après chaque modification
- POST vers `/api/builder/pages/{id}/autosave`
- Indicateur visuel : "Sauvegardé" / "Non sauvegardé"

### 3. Responsive editing
- 3 breakpoints : desktop (1280px+), tablet (768px-1279px), mobile (<768px)
- L'iframe du canvas change de taille
- Les styles sont mergés : mobile hérite de desktop, tablet peut override

### 4. Copy/Paste de blocs
- Ctrl+C copie le bloc sélectionné dans un "clipboard" Zustand
- Ctrl+V colle le bloc (avec de nouveaux IDs) dans la position actuelle

### 5. Templates de pages
- Sauvegarder une page comme template
- Charger un template existant dans une nouvelle page
- Templates pré-définis : "Homepage", "About", "Contact", "Blog", "Landing"

---

## Gestion d'erreurs du builder

### 1. JSON invalide
Si le contenu d'une page ne peut pas être parsé :
```tsx
// Dans le chargement initial du builder
function loadPageContent(content: unknown): PageContent {
    try {
        // Valider avec le schéma Zod
        return pageContentSchema.parse(content);
    } catch (error) {
        console.error('Invalid page content:', error);
        // Retourner un contenu vide plutôt que crasher
        return { version: '1.0', blocks: [], settings: {} };
    }
}
```

### 2. Bloc d'un plugin désactivé
Quand un plugin est désactivé, ses blocs ne sont plus dans le registry. Le builder doit quand même afficher la page :
```tsx
// Dans BlockRenderer.tsx
function BlockRenderer({ block }: { block: BlockNode }) {
    const renderer = blockRegistry.getRenderer(block.type);

    if (!renderer) {
        // Bloc inconnu → afficher un placeholder
        return (
            <div className="border-2 border-dashed border-amber-400 p-4 rounded bg-amber-50">
                <p className="text-amber-700 text-sm">
                    ⚠️ Bloc "{block.type}" non disponible
                    (plugin désactivé ou bloc supprimé)
                </p>
            </div>
        );
    }

    return renderer(block);
}
```

### 3. Erreur de rendu d'un bloc
```tsx
// ErrorBoundary par bloc
import { ErrorBoundary } from 'react-error-boundary';

function BlockErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="border-2 border-red-300 p-4 rounded bg-red-50">
            <p className="text-red-700 text-sm font-medium">Erreur de rendu</p>
            <p className="text-red-500 text-xs mt-1">{error.message}</p>
            <button onClick={resetErrorBoundary} className="text-xs underline mt-2">
                Réessayer
            </button>
        </div>
    );
}

// Wrapper chaque bloc :
<ErrorBoundary FallbackComponent={BlockErrorFallback}>
    <BlockRenderer block={block} />
</ErrorBoundary>
```

### 4. Échec de sauvegarde
```tsx
// Dans le hook useAutoSave
async function save(): Promise<void> {
    try {
        setStatus('saving');
        await axios.put(`/api/builder/pages/${pageId}/content`, {
            content: store.pageContent,
        });
        setStatus('saved');
        store.setDirty(false);
    } catch (error) {
        setStatus('error');
        // Afficher un toast d'erreur mais ne pas perdre le contenu local
        toast.error('Erreur de sauvegarde. Vos modifications sont conservées localement.');

        // Sauvegarder en localStorage comme backup
        localStorage.setItem(`cms-builder-backup-${pageId}`, JSON.stringify(store.pageContent));
    }
}
```

### 5. Recovery mode
Si le builder crashe complètement, proposer une récupération :
```tsx
// Dans la page Builder/Edit.tsx
useEffect(() => {
    const backup = localStorage.getItem(`cms-builder-backup-${pageId}`);
    if (backup) {
        const shouldRestore = window.confirm(
            'Une sauvegarde locale a été trouvée. Voulez-vous la restaurer ?'
        );
        if (shouldRestore) {
            store.setPageContent(JSON.parse(backup));
        }
        localStorage.removeItem(`cms-builder-backup-${pageId}`);
    }
}, [pageId]);
```

### 6. Validation Zod avant sauvegarde
```typescript
// packages/blocks/src/schemas/page-content.ts
import { z } from 'zod';

const blockNodeSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        id: z.string().min(1),
        type: z.string().min(1),
        props: z.record(z.unknown()),
        styles: z.object({
            desktop: z.record(z.unknown()),
            tablet: z.record(z.unknown()).optional(),
            mobile: z.record(z.unknown()).optional(),
        }),
        visibility: z.object({
            desktop: z.boolean(),
            tablet: z.boolean(),
            mobile: z.boolean(),
        }),
        children: z.array(blockNodeSchema).optional(),
    })
);

export const pageContentSchema = z.object({
    version: z.string(),
    blocks: z.array(blockNodeSchema),
    settings: z.object({
        bodyClass: z.string().optional(),
        customCss: z.string().optional(),
        customJs: z.string().optional(),
    }).optional(),
});
```
