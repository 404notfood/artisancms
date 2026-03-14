# Blueprint 06 - Référence complète dnd-kit pour le Page Builder

## Pourquoi dnd-kit et pas GrapesJS, react-beautiful-dnd ou autre ?

| Critère | dnd-kit | react-beautiful-dnd | GrapesJS |
|---------|---------|---------------------|----------|
| **Maintenu** | Oui (actif 2024+) | Non (Atlassian l'a abandonné) | Oui mais vanilla JS |
| **React natif** | 100% hooks | Oui mais API ancienne | Non, wrapper nécessaire |
| **Imbrication** | Supporté nativement | Très limité | Natif |
| **Performance** | Excellent (tree-shakeable) | Bon | Lourd (bundle ~300kb) |
| **Accessibilité** | Excellent (ARIA, clavier) | Bon | Basique |
| **TypeScript** | First-class | Types ajoutés | Types partiels |
| **Customisation** | Totale (sensors, modifiers, collision) | Limitée | Via API/plugins |
| **Sortable** | Package dédié `@dnd-kit/sortable` | Natif | Via plugin |
| **Bundle size** | ~12kb core | ~30kb | ~300kb+ |

**Verdict** : dnd-kit est le seul qui coche toutes les cases pour un page builder React moderne : performance, accessibilité, imbrication profonde, customisation totale.

---

## Packages à installer

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
```

| Package | Taille | Rôle |
|---------|--------|------|
| `@dnd-kit/core` | ~12kb | DndContext, useDraggable, useDroppable, DragOverlay, sensors, collision detection |
| `@dnd-kit/sortable` | ~5kb | SortableContext, useSortable, arrayMove, stratégies de tri |
| `@dnd-kit/utilities` | ~2kb | CSS.Transform, CSS.Translate helpers |
| `@dnd-kit/modifiers` | ~3kb | restrictToWindowEdges, snapCenterToCursor, etc. |

---

## Concepts fondamentaux

### 1. DndContext - Le provider principal

Tout le drag & drop doit être wrappé dans un `DndContext`. C'est lui qui :
- Gère les capteurs (pointer, clavier, touch)
- Détecte les collisions entre les éléments
- Dispatche les événements (start, over, end, cancel)
- Gère l'auto-scroll pendant le drag

```tsx
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
  pointerWithin,      // Algorithme de collision pour conteneurs imbriqués
  closestCenter,      // Algorithme pour listes simples
  MeasuringStrategy,
} from '@dnd-kit/core';

<DndContext
  sensors={sensors}
  collisionDetection={pointerWithin}  // CRITIQUE pour l'imbrication
  measuring={{
    droppable: {
      strategy: MeasuringStrategy.Always, // Remesurer à chaque frame
    },
  }}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}    // CRITIQUE pour le cross-container
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
>
  {children}
</DndContext>
```

### 2. Sensors - Détection des interactions

```tsx
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const sensors = useSensors(
  // Souris / tactile : distance de 8px avant que le drag démarre
  // C'est ESSENTIEL pour que les clicks sur les boutons/inputs des blocs fonctionnent
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // pixels de mouvement avant activation
    },
  }),
  // Clavier : pour l'accessibilité
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

**Pourquoi `distance: 8` ?** Sans cette contrainte, un simple click sur un bloc déclencherait immédiatement un drag. Avec 8px, l'utilisateur doit bouger sa souris d'au moins 8px pour que le drag commence, permettant ainsi les clicks normaux sur les boutons, liens et inputs à l'intérieur des blocs.

### 3. Collision Detection - Algorithmes

| Algorithme | Comportement | Quand l'utiliser |
|-----------|-------------|-----------------|
| `rectIntersection` | Détecte le chevauchement de rectangles | Cas simple, éléments non imbriqués |
| `closestCenter` | Distance entre les centres | Listes sortables simples |
| `closestCorners` | Distance depuis les coins | Multi-conteneurs simples |
| `pointerWithin` | **Position du pointeur dans les bornes** | **NOTRE CHOIX - Conteneurs imbriqués** |

**Pourquoi `pointerWithin` ?** Dans un page builder, les sections contiennent des grids qui contiennent des colonnes qui contiennent des blocs. Avec `rectIntersection`, le drag pourrait matcher plusieurs conteneurs imbriqués. `pointerWithin` ne matche que le conteneur le plus profond sous le curseur.

**Composition custom pour fallback clavier :**

```tsx
import { pointerWithin, rectIntersection, CollisionDetection } from '@dnd-kit/core';

const customCollisionDetection: CollisionDetection = (args) => {
  // D'abord essayer la détection par pointeur (souris/touch)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  // Fallback pour le clavier (pas de position de pointeur)
  return rectIntersection(args);
};
```

---

## Pattern #1 : Rendre un élément DRAGGABLE (toolbox)

Les éléments de la toolbox (sidebar) sont des `useDraggable` purs - ils ne sont pas droppables car on ne peut pas les réorganiser. On les drag vers le canvas.

```tsx
import { useDraggable } from '@dnd-kit/core';

interface ToolboxItemProps {
  blockType: string;  // 'heading', 'text', 'image', etc.
  label: string;
  icon: React.ReactNode;
}

function ToolboxItem({ blockType, label, icon }: ToolboxItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox-${blockType}`,  // Préfixe 'toolbox-' pour distinguer des blocs existants
    data: {
      type: 'toolbox-item',       // Tag pour identifier dans onDragEnd
      blockType: blockType,       // Le type de bloc à créer
      fromToolbox: true,          // Flag explicite
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg border cursor-grab',
        'hover:bg-accent hover:border-primary/20 transition-colors',
        isDragging && 'opacity-50 cursor-grabbing'
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
```

### Le `data` prop est CRITIQUE

Le `data` prop permet de passer des métadonnées arbitraires qui seront accessibles dans les event handlers via `event.active.data.current`. C'est ainsi qu'on distingue :
- Un item de la toolbox (nouveau bloc à créer) d'un bloc existant (à déplacer)
- Le type de bloc (section vs column vs block)
- Le parent d'un bloc

```tsx
// Dans onDragEnd :
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;

  const activeData = active.data.current;

  if (activeData?.fromToolbox) {
    // C'est un nouveau bloc depuis la toolbox → CRÉER
    const newBlock = createBlock(activeData.blockType);
    const targetContainer = findContainer(over.id);
    insertBlock(newBlock, targetContainer, over.id);
  } else {
    // C'est un bloc existant → DÉPLACER
    moveBlock(active.id, over.id);
  }
}
```

---

## Pattern #2 : Éléments SORTABLES (blocs dans le canvas)

Les blocs dans le canvas sont des `useSortable` - ils sont à la fois draggable ET droppable, et peuvent être réordonnés.

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableBlockProps {
  block: BlockNode;
  children: React.ReactNode;
}

function SortableBlock({ block, children }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    isSorting,
    setActivatorNodeRef, // Pour le drag handle
  } = useSortable({
    id: block.id,
    data: {
      type: getBlockCategory(block.type), // 'section', 'grid', 'column', 'block'
      block: block,
      parentId: block.parentId,           // Référence au parent
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isOver && 'ring-2 ring-primary/30',
        isDragging && 'shadow-xl'
      )}
    >
      {/* Toolbar flottante - visible au hover */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 flex gap-1 bg-background shadow-md rounded-lg p-1 border">
        {/* DRAG HANDLE - seulement ce bouton active le drag */}
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="p-1 hover:bg-accent rounded cursor-grab"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button onClick={() => duplicateBlock(block.id)} className="p-1 hover:bg-accent rounded">
          <Copy className="h-4 w-4" />
        </button>
        <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-destructive/10 text-destructive rounded">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Contenu du bloc */}
      {children}
    </div>
  );
}
```

### Pourquoi `setActivatorNodeRef` est important ?

Par défaut, tout le bloc est draggable (`setNodeRef` + `listeners`). Mais dans un page builder, les blocs contiennent du contenu interactif (texte éditable, boutons, liens). On utilise `setActivatorNodeRef` pour limiter la zone de drag à un "handle" (icône grip), et `setNodeRef` pour définir les bornes du bloc.

```
╔══════════════════════════════════════╗
║ [≡] [📋] [🗑]  ← Toolbar (handle = [≡])
║                                      ║
║   Heading Text Here                  ║  ← Clickable, pas draggable
║   Paragraph content...               ║
║   [Button]                           ║  ← Clickable, pas draggable
║                                      ║
╚══════════════════════════════════════╝
     ↑ Tout le bloc = zone droppable (setNodeRef)
     ↑ Seul le grip [≡] = zone draggable (setActivatorNodeRef)
```

---

## Pattern #3 : Imbrication de SortableContext (CRITIQUE)

Le page builder a une hiérarchie imbriquée. On utilise un SortableContext par niveau :

```tsx
function Canvas({ pageContent }: { pageContent: PageContent }) {
  const sectionIds = pageContent.blocks.map(b => b.id);

  return (
    <div className="min-h-screen bg-muted/50 p-4">
      {/* Niveau 1: Sections */}
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        {pageContent.blocks.map((section) => (
          <SortableBlock key={section.id} block={section}>
            <SectionRenderer section={section}>
              {/* Niveau 2: Children de la section (grids, containers) */}
              {section.children && (
                <SortableContext
                  items={section.children.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {section.children.map((child) => (
                    <SortableBlock key={child.id} block={child}>
                      <BlockRenderer block={child}>
                        {/* Niveau 3+: Récursif */}
                        {child.children && (
                          <NestedBlocks blocks={child.children} parentId={child.id} />
                        )}
                      </BlockRenderer>
                    </SortableBlock>
                  ))}
                </SortableContext>
              )}
            </SectionRenderer>
          </SortableBlock>
        ))}
      </SortableContext>

      {/* Zone de drop pour ajouter une nouvelle section en bas */}
      <AddSectionZone />
    </div>
  );
}

function NestedBlocks({ blocks, parentId }: { blocks: BlockNode[]; parentId: string }) {
  return (
    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
      {blocks.map((block) => (
        <SortableBlock key={block.id} block={{ ...block, parentId }}>
          <BlockRenderer block={block}>
            {block.children && (
              <NestedBlocks blocks={block.children} parentId={block.id} />
            )}
          </BlockRenderer>
        </SortableBlock>
      ))}
    </SortableContext>
  );
}
```

### Règle importante : IDs uniques GLOBAUX

Chaque `useSortable({ id })` DOIT avoir un ID unique dans tout le DndContext, pas seulement dans son SortableContext parent. C'est pourquoi on utilise des UUID pour chaque bloc.

---

## Pattern #4 : DragOverlay (prévisualisation pendant le drag)

Le DragOverlay affiche une copie visuelle du bloc pendant le drag. C'est ESSENTIEL pour une bonne UX :

```tsx
import { DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { createPortal } from 'react-dom';

function PageBuilder() {
  const [activeBlock, setActiveBlock] = useState<BlockNode | null>(null);
  const [activeToolboxItem, setActiveToolboxItem] = useState<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;

    if (data?.fromToolbox) {
      setActiveToolboxItem(data.blockType);
    } else if (data?.block) {
      setActiveBlock(data.block);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveBlock(null);
    setActiveToolboxItem(null);
    // ... logique de drop
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } },
    }),
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* ... sidebar + canvas ... */}

      {/* OVERLAY - toujours rendu, contenu conditionnel */}
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation} zIndex={9999}>
          {activeToolboxItem && (
            <div className="bg-background border-2 border-primary rounded-lg p-4 shadow-xl opacity-80">
              <span className="text-sm font-medium">
                {getBlockLabel(activeToolboxItem)}
              </span>
            </div>
          )}
          {activeBlock && (
            <div className="bg-background border-2 border-primary rounded-lg shadow-xl opacity-90 max-w-md">
              <BlockPreview block={activeBlock} />
            </div>
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
```

### Règles du DragOverlay

1. **Toujours le rendre** (pas de montage/démontage conditionnel) sinon les animations de drop ne marchent pas
2. **Rendre les children conditionnellement** (null quand pas de drag actif)
3. **Utiliser `createPortal`** vers `document.body` pour éviter les problèmes de `overflow: hidden` ou de z-index
4. **Mémoriser le contenu** avec `useMemo` pour éviter les re-renders à chaque mouvement

---

## Pattern #5 : Gestion du cross-container avec onDragOver

C'est le pattern le plus complexe mais le plus important. `onDragOver` est appelé continuellement pendant le drag et permet de déplacer un bloc d'un conteneur à un autre EN TEMPS RÉEL.

```tsx
function handleDragOver(event: DragOverEvent) {
  const { active, over } = event;
  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  // Ne rien faire si on est au-dessus de soi-même
  if (activeId === overId) return;

  const activeData = active.data.current;
  const overData = over.data.current;

  // Ne pas gérer les items de la toolbox dans onDragOver
  if (activeData?.fromToolbox) return;

  // Trouver les conteneurs parents
  const activeContainer = findParentContainer(activeId);
  const overContainer = overData?.type === 'column' || overData?.type === 'section'
    ? overId // over EST un conteneur
    : findParentContainer(overId); // over est dans un conteneur

  if (!activeContainer || !overContainer || activeContainer === overContainer) return;

  // Déplacer le bloc de activeContainer vers overContainer
  updateStore((draft) => {
    const sourceBlocks = getBlockChildren(draft, activeContainer);
    const destBlocks = getBlockChildren(draft, overContainer);

    // Retirer de la source
    const activeIndex = sourceBlocks.findIndex(b => b.id === activeId);
    const [movedBlock] = sourceBlocks.splice(activeIndex, 1);

    // Calculer l'index d'insertion dans la destination
    const overIndex = destBlocks.findIndex(b => b.id === overId);
    const insertIndex = overIndex >= 0 ? overIndex : destBlocks.length;

    // Insérer dans la destination
    destBlocks.splice(insertIndex, 0, movedBlock);
  });
}
```

### Flow complet : Toolbox → Canvas

```
User drag "Heading" depuis la toolbox
  ↓
onDragStart → setActiveToolboxItem('heading') → DragOverlay montre "Heading"
  ↓
onDragOver → (ignoré pour toolbox items, le curseur glide au-dessus des blocs)
  ↓
onDragEnd → {active: {id: 'toolbox-heading', data: {fromToolbox: true, blockType: 'heading'}},
              over: {id: 'col-001', data: {type: 'column'}}}
  ↓
Créer un nouveau BlockNode : { id: uuid(), type: 'heading', props: defaultProps, ... }
  ↓
Insérer dans col-001 à l'index approprié
  ↓
Store update → Canvas re-render → Nouveau bloc visible
```

### Flow complet : Déplacer un bloc entre colonnes

```
User drag bloc "hdg-001" de col-001 vers col-002
  ↓
onDragStart → setActiveBlock(blocks['hdg-001']) → DragOverlay montre le heading
  ↓
onDragOver (continu pendant le drag) →
  Détecte que hdg-001 (dans col-001) est au-dessus de col-002
  → Retire hdg-001 de col-001.children
  → Insère hdg-001 dans col-002.children
  → Canvas re-render immédiat (le bloc "saute" visuellement)
  ↓
onDragEnd → Finaliser la position, cleanup, pushHistory (pour undo)
```

---

## Opérations sur l'arbre de blocs (tree-operations.ts)

```typescript
import { v4 as uuid } from 'uuid';

// Trouver un bloc par ID dans l'arbre (récursif)
export function findBlockById(blocks: BlockNode[], id: string): BlockNode | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.children) {
      const found = findBlockById(block.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Trouver le parent d'un bloc
export function findParent(blocks: BlockNode[], childId: string): { parent: BlockNode; index: number } | null {
  for (const block of blocks) {
    if (block.children) {
      const index = block.children.findIndex(c => c.id === childId);
      if (index !== -1) return { parent: block, index };
      const found = findParent(block.children, childId);
      if (found) return found;
    }
  }
  return null;
}

// Retirer un bloc de l'arbre
export function removeBlock(blocks: BlockNode[], id: string): BlockNode[] {
  return blocks.reduce<BlockNode[]>((acc, block) => {
    if (block.id === id) return acc; // Skip ce bloc
    const newBlock = { ...block };
    if (newBlock.children) {
      newBlock.children = removeBlock(newBlock.children, id);
    }
    acc.push(newBlock);
    return acc;
  }, []);
}

// Insérer un bloc dans un conteneur à un index donné
export function insertBlock(
  blocks: BlockNode[],
  containerId: string,
  newBlock: BlockNode,
  index: number
): BlockNode[] {
  return blocks.map(block => {
    if (block.id === containerId && block.children) {
      const children = [...block.children];
      children.splice(index, 0, newBlock);
      return { ...block, children };
    }
    if (block.children) {
      return { ...block, children: insertBlock(block.children, containerId, newBlock, index) };
    }
    return block;
  });
}

// Dupliquer un bloc (avec nouveaux IDs récursifs)
export function duplicateBlock(block: BlockNode): BlockNode {
  return {
    ...block,
    id: uuid(),
    children: block.children?.map(child => duplicateBlock(child)),
  };
}

// Déplacer un bloc d'un conteneur à un autre
export function moveBlock(
  blocks: BlockNode[],
  blockId: string,
  targetContainerId: string,
  targetIndex: number
): BlockNode[] {
  const blockToMove = findBlockById(blocks, blockId);
  if (!blockToMove) return blocks;

  // 1. Retirer le bloc
  let newBlocks = removeBlock(blocks, blockId);

  // 2. Insérer à la nouvelle position
  newBlocks = insertBlock(newBlocks, targetContainerId, blockToMove, targetIndex);

  return newBlocks;
}

// Créer un nouveau bloc avec les props par défaut
export function createBlock(type: string): BlockNode {
  const defaults = getBlockDefaults(type);
  return {
    id: uuid(),
    type,
    props: defaults.props,
    styles: {
      desktop: defaults.styles || {},
    },
    visibility: { desktop: true, tablet: true, mobile: true },
    children: defaults.hasChildren ? [] : undefined,
  };
}
```

---

## TypeScript Types complets

```typescript
// Types principaux de dnd-kit utilisés dans le builder

import type {
  UniqueIdentifier,
  DragStartEvent,
  DragMoveEvent,
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
  Active,
  Over,
  CollisionDetection,
  Modifier,
} from '@dnd-kit/core';

import type { SortingStrategy } from '@dnd-kit/sortable';

// Nos types custom pour le builder
interface BuilderDragData {
  type: 'section' | 'grid' | 'column' | 'block' | 'toolbox-item';
  block?: BlockNode;
  blockType?: string;     // Pour les toolbox items
  fromToolbox?: boolean;
  parentId?: string;
}

// Typage fort des événements
type BuilderDragStartEvent = DragStartEvent & {
  active: Active & { data: { current: BuilderDragData } };
};

type BuilderDragEndEvent = DragEndEvent & {
  active: Active & { data: { current: BuilderDragData } };
  over: (Over & { data: { current: BuilderDragData } }) | null;
};
```
