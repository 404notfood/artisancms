# Blueprint 07 - Référence shadcn/ui + better-auth

## Partie 1 : shadcn/ui

### Philosophie : tu possèdes le code

shadcn/ui n'est PAS une dépendance npm classique. Quand tu fais `npx shadcn@latest add button`, il **copie le code source** du composant dans ton projet (`components/ui/button.tsx`). Tu peux le modifier à volonté. Pas de breaking changes, pas de mise à jour forcée.

Les composants sont construits sur :
- **Radix UI** → logique, accessibilité, comportement (non visible)
- **Tailwind CSS** → styling (visible, modifiable)
- **class-variance-authority (CVA)** → variants typées

### Installation dans le projet Laravel React

Le starter kit Laravel React inclut déjà shadcn/ui. Pour ajouter des composants :

```bash
npx shadcn@latest add [component]
```

Composants installés dans : `resources/js/components/ui/`
Config : `components.json` à la racine du projet

### Theming via CSS Variables

```css
/* resources/css/app.css - Variables Tailwind v4 */
@theme {
  --color-background: 0 0% 100%;
  --color-foreground: 240 10% 3.9%;
  --color-primary: 240 5.9% 10%;
  --color-primary-foreground: 0 0% 98%;
  --color-secondary: 240 4.8% 95.9%;
  --color-secondary-foreground: 240 5.9% 10%;
  --color-muted: 240 4.8% 95.9%;
  --color-muted-foreground: 240 3.8% 46.1%;
  --color-accent: 240 4.8% 95.9%;
  --color-accent-foreground: 240 5.9% 10%;
  --color-destructive: 0 84.2% 60.2%;
  --color-border: 240 5.9% 90%;
  --color-input: 240 5.9% 90%;
  --color-ring: 240 5.9% 10%;
  --radius: 0.5rem;
}

.dark {
  --color-background: 240 10% 3.9%;
  --color-foreground: 0 0% 98%;
  /* ... dark mode overrides ... */
}
```

**Lien avec le système de thèmes ArtisanCMS** : Les CSS variables du thème CMS (Blueprint 03) seront injectées AVANT celles de shadcn/ui, permettant au thème actif de personnaliser les couleurs de l'admin et du front.

---

### Composants essentiels pour l'admin CMS

#### 1. Sidebar (navigation admin)

```tsx
// Hiérarchie des composants
SidebarProvider          // Wraps l'app, gère l'état open/closed
  Sidebar                // Le sidebar lui-même
    SidebarHeader        // Logo + infos en haut
    SidebarContent       // Zone scrollable
      SidebarGroup       // Groupe de menu items
        SidebarGroupLabel
        SidebarGroupContent
          SidebarMenu
            SidebarMenuItem
              SidebarMenuButton  // Bouton cliquable
              SidebarMenuSub     // Sous-menu collapsible
                SidebarMenuSubItem
    SidebarFooter        // User info en bas
  SidebarInset           // Zone de contenu principale (à droite du sidebar)
  SidebarTrigger         // Bouton hamburger pour toggle

// Hook utile
const { state, open, setOpen, toggleSidebar, isMobile } = useSidebar();
```

**Pattern pour l'admin CMS :**
```tsx
// resources/js/components/cms-sidebar.tsx
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarFooter,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import {
  LayoutDashboard, FileText, BookOpen, Image, Menu, Puzzle,
  Palette, Settings, Users, BarChart3,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Pages', icon: FileText, href: '/admin/pages', children: [
    { label: 'Toutes les pages', href: '/admin/pages' },
    { label: 'Nouvelle page', href: '/admin/pages/create' },
  ]},
  { label: 'Articles', icon: BookOpen, href: '/admin/posts', children: [
    { label: 'Tous les articles', href: '/admin/posts' },
    { label: 'Nouvel article', href: '/admin/posts/create' },
    { label: 'Catégories', href: '/admin/taxonomies/categories' },
    { label: 'Tags', href: '/admin/taxonomies/tags' },
  ]},
  { label: 'Médias', icon: Image, href: '/admin/media' },
  { label: 'Menus', icon: Menu, href: '/admin/menus' },
  { label: 'Plugins', icon: Puzzle, href: '/admin/plugins' },
  { label: 'Thèmes', icon: Palette, href: '/admin/themes' },
  { label: 'Utilisateurs', icon: Users, href: '/admin/users' },
  { label: 'Réglages', icon: Settings, href: '/admin/settings' },
];
```

#### 2. Data Table (listes admin)

Basé sur **TanStack Table** (`@tanstack/react-table`). Ce n'est pas un composant drop-in mais un pattern de composition.

```bash
npx shadcn@latest add table
npm install @tanstack/react-table
```

**Pattern pour la liste de pages :**

```tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

const columns: ColumnDef<Page>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Titre <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <Link href={`/admin/pages/${row.original.id}/edit`} className="font-medium hover:underline">
          {row.getValue('title')}
        </Link>
        <p className="text-sm text-muted-foreground">/{row.original.slug}</p>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge variant={row.getValue('status') === 'published' ? 'default' : 'secondary'}>
        {row.getValue('status')}
      </Badge>
    ),
  },
  {
    accessorKey: 'author',
    header: 'Auteur',
    cell: ({ row }) => row.original.author?.name,
  },
  {
    accessorKey: 'updated_at',
    header: 'Modifié',
    cell: ({ row }) => formatDate(row.getValue('updated_at')),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/admin/pages/${row.original.id}/edit`}>Modifier</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/builder/${row.original.id}`}>Page Builder</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(row.original.id)}>
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
```

#### 3. Form (formulaires admin)

Basé sur **react-hook-form** + **Zod**.

```bash
npx shadcn@latest add form input select textarea switch
npm install react-hook-form zod @hookform/resolvers
```

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';

const pageSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format: mon-slug'),
  template: z.string(),
  status: z.enum(['draft', 'published', 'scheduled']),
  meta_title: z.string().max(70).optional().nullable(),
  meta_description: z.string().max(160).optional().nullable(),
  parent_id: z.number().optional().nullable(),
});

function PageForm({ page, templates }: { page?: Page; templates: string[] }) {
  const form = useForm<z.infer<typeof pageSchema>>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: page?.title ?? '',
      slug: page?.slug ?? '',
      template: page?.template ?? 'default',
      status: page?.status ?? 'draft',
      meta_title: page?.meta_title ?? '',
      meta_description: page?.meta_description ?? '',
      parent_id: page?.parent_id ?? null,
    },
  });

  // Auto-générer le slug à partir du titre
  const title = form.watch('title');
  useEffect(() => {
    if (!page) { // Seulement en création
      form.setValue('slug', slugify(title));
    }
  }, [title]);

  function onSubmit(values: z.infer<typeof pageSchema>) {
    if (page) {
      router.put(`/admin/pages/${page.id}`, values);
    } else {
      router.post('/admin/pages', values);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Titre</FormLabel>
            <FormControl><Input placeholder="Ma page" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="slug" render={({ field }) => (
          <FormItem>
            <FormLabel>Slug (URL)</FormLabel>
            <FormControl><Input placeholder="ma-page" {...field} /></FormControl>
            <FormDescription>L'URL sera : votresite.com/{field.value}</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="template" render={({ field }) => (
            <FormItem>
              <FormLabel>Template</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* SEO */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">SEO</h3>
          <FormField control={form.control} name="meta_title" render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Title</FormLabel>
              <FormControl><Input maxLength={70} {...field} value={field.value ?? ''} /></FormControl>
              <FormDescription>{(field.value?.length ?? 0)}/70 caractères</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="meta_description" render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Description</FormLabel>
              <FormControl><Textarea maxLength={160} {...field} value={field.value ?? ''} /></FormControl>
              <FormDescription>{(field.value?.length ?? 0)}/160 caractères</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {page ? 'Mettre à jour' : 'Créer la page'}
          </Button>
          {page && (
            <Button type="button" variant="outline" asChild>
              <Link href={`/admin/builder/${page.id}`}>Ouvrir dans le Builder</Link>
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
```

#### 4. Dialog (modales)

```tsx
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

// Modale de confirmation de suppression
function DeletePageDialog({ page, onConfirm }: { page: Page; onConfirm: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Supprimer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer "{page.title}" ?</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. La page et toutes ses révisions seront supprimées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 5. Sheet (panneau latéral - pour le page builder)

```tsx
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader,
  SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';

// Panel de propriétés dans le page builder
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[400px]">
    <SheetHeader>
      <SheetTitle>Propriétés du bloc</SheetTitle>
      <SheetDescription>Modifier les propriétés du bloc sélectionné</SheetDescription>
    </SheetHeader>
    <BlockSettingsForm block={selectedBlock} />
  </SheetContent>
</Sheet>
```

---

## Partie 2 : better-auth (pour la V2 Next.js)

### Vue d'ensemble

better-auth est une lib d'auth **framework-agnostique** pour TypeScript. Elle gère auth email/password, OAuth (Google, GitHub, etc.), sessions, RBAC. C'est l'alternative recommandée à NextAuth pour Next.js.

### Installation (V2 - futur)

```bash
npm install better-auth
```

### Configuration serveur

```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { admin, organization } from 'better-auth/plugins';

export const auth = betterAuth({
  database: {
    provider: 'mysql',
    url: process.env.DATABASE_URL!, // mysql://user:pass@localhost:3306/artisan_cms
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min cache pour éviter les requêtes DB à chaque route
    },
  },
  plugins: [
    admin(),           // Gestion admin users
    organization({     // Multi-tenant + RBAC
      // Les rôles CMS seront définis ici
    }),
  ],
});
```

### Configuration client React

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
});
```

### Tables DB créées par better-auth

| Table | Colonnes principales |
|-------|---------------------|
| `user` | id, name, email, emailVerified, image, createdAt, updatedAt |
| `session` | id, userId, token, expiresAt, ipAddress, userAgent |
| `account` | id, userId, providerId, accountId, accessToken, refreshToken |
| `verification` | id, identifier, value, expiresAt |

### RBAC avec le plugin Organization

```typescript
import { createAccessControl } from 'better-auth/plugins';

const ac = createAccessControl({
  page: ['create', 'read', 'update', 'delete', 'publish'],
  post: ['create', 'read', 'update', 'delete', 'publish'],
  media: ['upload', 'read', 'delete'],
  plugin: ['install', 'activate', 'deactivate', 'uninstall'],
  theme: ['activate', 'customize'],
  user: ['read', 'create', 'update', 'delete'],
  settings: ['read', 'update'],
});

// Définir les rôles CMS
const roles = {
  admin: ac.newRole({
    page: ['create', 'read', 'update', 'delete', 'publish'],
    post: ['create', 'read', 'update', 'delete', 'publish'],
    media: ['upload', 'read', 'delete'],
    plugin: ['install', 'activate', 'deactivate', 'uninstall'],
    theme: ['activate', 'customize'],
    user: ['read', 'create', 'update', 'delete'],
    settings: ['read', 'update'],
  }),
  editor: ac.newRole({
    page: ['create', 'read', 'update', 'publish'],
    post: ['create', 'read', 'update', 'publish'],
    media: ['upload', 'read'],
    user: ['read'],
    settings: ['read'],
  }),
  author: ac.newRole({
    page: ['create', 'read', 'update'],
    post: ['create', 'read', 'update'],
    media: ['upload', 'read'],
  }),
  subscriber: ac.newRole({
    page: ['read'],
    post: ['read'],
  }),
};
```

### Hook React useSession

```tsx
function DashboardPage() {
  const { data: session, isPending, error } = useSession();

  if (isPending) return <Skeleton />;
  if (!session) return redirect('/sign-in');

  return <div>Welcome, {session.user.name}</div>;
}
```

### Intégration Next.js (API Route)

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

### Points clés pour la migration V1 → V2

1. **Schéma DB compatible** : Les tables better-auth (`user`, `session`, `account`) coexistent avec les tables CMS. Il faudra un mapping entre le `user` better-auth et notre table `users` Laravel.
2. **Les packages React partagés** (`@artisan/page-builder`, `@artisan/blocks`, `@artisan/ui`) fonctionnent identiquement dans les deux stacks.
3. **L'API du page builder** devra être exposée en REST/JSON depuis Next.js (au lieu d'Inertia).
4. **Les plugins PHP** ne seront pas compatibles → il faudra un système de plugins JS pour la V2.
