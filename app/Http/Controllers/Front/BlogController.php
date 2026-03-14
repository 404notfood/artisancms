<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\CMS\Themes\ThemeManager;
use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Post;
use App\Models\TaxonomyTerm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function __construct(
        private readonly ThemeManager $themeManager,
    ) {}

    /**
     * List all published posts with pagination.
     */
    public function index(Request $request): Response
    {
        $posts = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->orderByDesc('published_at')
            ->paginate(15);

        $categories = $this->getCategories();
        $recentPosts = $this->getRecentPosts();
        $archives = $this->getArchiveList();

        return Inertia::render('Front/Blog/Index', [
            ...$this->frontData(),
            'posts' => $posts,
            'categories' => $categories,
            'recentPosts' => $recentPosts,
            'archives' => $archives,
        ]);
    }

    /**
     * Show a single published post by slug.
     */
    public function show(string $slug): Response
    {
        $post = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->where('slug', $slug)
            ->firstOrFail();

        $comments = $post->comments()
            ->approved()
            ->whereNull('parent_id')
            ->with(['replies' => function ($query): void {
                $query->approved()->with('user')->orderBy('created_at');
            }, 'user'])
            ->orderBy('created_at')
            ->get();

        $categories = $this->getCategories();
        $recentPosts = $this->getRecentPosts(5, $post->id);

        return Inertia::render('Front/Blog/Show', [
            ...$this->frontData(),
            'post' => $post,
            'comments' => $comments,
            'categories' => $categories,
            'recentPosts' => $recentPosts,
        ]);
    }

    /**
     * Store a comment on a post.
     */
    public function storeComment(Request $request, string $slug): RedirectResponse
    {
        $post = Post::published()
            ->where('slug', $slug)
            ->where('allow_comments', true)
            ->firstOrFail();

        $validated = $request->validate([
            'author_name' => ['required', 'string', 'max:255'],
            'author_email' => ['required', 'email', 'max:255'],
            'content' => ['required', 'string', 'max:5000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        $post->comments()->create([
            ...$validated,
            'user_id' => $request->user()?->id,
            'status' => 'pending',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()
            ->back()
            ->with('success', __('cms.blog.comment_submitted'));
    }

    /**
     * List posts by category taxonomy term.
     */
    public function category(string $slug): Response
    {
        $term = TaxonomyTerm::whereHas('taxonomy', function ($query): void {
            $query->where('slug', 'categories');
        })->where('slug', $slug)->firstOrFail();

        $posts = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->whereHas('terms', function ($query) use ($term): void {
                $query->where('taxonomy_terms.id', $term->id);
            })
            ->orderByDesc('published_at')
            ->paginate(15);

        $categories = $this->getCategories();
        $recentPosts = $this->getRecentPosts();

        return Inertia::render('Front/Blog/Category', [
            ...$this->frontData(),
            'term' => $term,
            'posts' => $posts,
            'categories' => $categories,
            'recentPosts' => $recentPosts,
        ]);
    }

    /**
     * List posts by tag taxonomy term.
     */
    public function tag(string $slug): Response
    {
        $term = TaxonomyTerm::whereHas('taxonomy', function ($query): void {
            $query->where('slug', 'tags');
        })->where('slug', $slug)->firstOrFail();

        $posts = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->whereHas('terms', function ($query) use ($term): void {
                $query->where('taxonomy_terms.id', $term->id);
            })
            ->orderByDesc('published_at')
            ->paginate(15);

        $categories = $this->getCategories();
        $recentPosts = $this->getRecentPosts();

        return Inertia::render('Front/Blog/Tag', [
            ...$this->frontData(),
            'term' => $term,
            'posts' => $posts,
            'categories' => $categories,
            'recentPosts' => $recentPosts,
        ]);
    }

    /**
     * List posts by year and optional month.
     */
    public function archive(int $year, ?int $month = null): Response
    {
        $query = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->whereYear('published_at', $year);

        if ($month !== null) {
            $query->whereMonth('published_at', $month);
        }

        $posts = $query->orderByDesc('published_at')->paginate(15);

        $categories = $this->getCategories();
        $recentPosts = $this->getRecentPosts();
        $archives = $this->getArchiveList();

        return Inertia::render('Front/Blog/Archive', [
            ...$this->frontData(),
            'posts' => $posts,
            'year' => $year,
            'month' => $month,
            'categories' => $categories,
            'recentPosts' => $recentPosts,
            'archives' => $archives,
        ]);
    }

    /**
     * Get all category terms with post counts.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, TaxonomyTerm>
     */
    private function getCategories(): \Illuminate\Database\Eloquent\Collection
    {
        return TaxonomyTerm::whereHas('taxonomy', function ($query): void {
            $query->where('slug', 'categories');
        })
            ->withCount(['posts' => function ($query): void {
                $query->published();
            }])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get recent published posts for the sidebar.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Post>
     */
    private function getRecentPosts(int $limit = 5, ?int $excludeId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Post::published()
            ->select(['id', 'title', 'slug', 'featured_image', 'published_at'])
            ->orderByDesc('published_at');

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->limit($limit)->get();
    }

    /**
     * Get archive list grouped by year/month.
     *
     * @return array<int, array{year: int, month: int, count: int}>
     */
    private function getArchiveList(): array
    {
        return Post::published()
            ->selectRaw('YEAR(published_at) as year, MONTH(published_at) as month, COUNT(*) as count')
            ->groupByRaw('YEAR(published_at), MONTH(published_at)')
            ->orderByRaw('YEAR(published_at) DESC, MONTH(published_at) DESC')
            ->limit(12)
            ->get()
            ->map(fn ($row) => [
                'year' => (int) $row->year,
                'month' => (int) $row->month,
                'count' => (int) $row->count,
            ])
            ->toArray();
    }

    /**
     * Get shared front-end data (menus, theme).
     *
     * @return array<string, mixed>
     */
    private function frontData(): array
    {
        $menus = Menu::with(['items' => function ($query): void {
            $query->orderBy('order');
        }])->get()->keyBy('location');

        $theme = $this->themeManager->getActive();
        $themeConfig = $theme ? $this->themeManager->getThemeConfig($theme->slug) : [];

        return [
            'menus' => $menus,
            'theme' => [
                'customizations' => $theme?->customizations ?? [],
                'layouts' => $themeConfig['layouts'] ?? [],
            ],
        ];
    }
}
