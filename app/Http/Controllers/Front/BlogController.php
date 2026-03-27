<?php

declare(strict_types=1);

namespace App\Http\Controllers\Front;

use App\Http\Controllers\Concerns\HasFrontData;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicCommentRequest;
use App\Models\Post;
use App\Models\TaxonomyTerm;
use App\Services\CommentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    use HasFrontData;

    public function __construct(
        private readonly CommentService $commentService,
    ) {}

    public function index(Request $request): Response
    {
        $posts = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->orderByDesc('published_at')
            ->paginate(15);

        return Inertia::render('Front/Blog/Index', [
            ...$this->frontData(),
            'posts' => $posts,
            'categories' => $this->getCategories(),
            'recentPosts' => $this->getRecentPosts(),
            'archives' => $this->getArchiveList(),
        ]);
    }

    public function show(string $slug): Response
    {
        $post = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->where('slug', $slug)
            ->firstOrFail();

        if ($post->access_level === 'authenticated' && ! Auth::check()) {
            abort(403, __('cms.content.login_required'));
        }

        $comments = $this->commentService->getForPost($post->id);

        return Inertia::render('Front/Blog/Show', [
            ...$this->frontData(),
            'post' => $post,
            'seo' => $this->buildSeoMeta($post),
            'comments' => $comments,
            'categories' => $this->getCategories(),
            'recentPosts' => $this->getRecentPosts(5, $post->id),
        ]);
    }

    public function storeComment(PublicCommentRequest $request, string $slug): RedirectResponse
    {
        $validated = $request->validated();

        // Honeypot spam check
        if (!empty($validated['honeypot'])) {
            return redirect()->back()->with('success', __('cms.comments.submitted'));
        }

        $post = Post::published()
            ->where('slug', $slug)
            ->where('allow_comments', true)
            ->firstOrFail();

        $data = [
            'post_id' => $post->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'author_name' => $validated['author_name'],
            'author_email' => $validated['author_email'],
            'content' => strip_tags($validated['content']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        if (Auth::check()) {
            $user = Auth::user();
            $data['user_id'] = $user->id;
            $data['author_name'] = $user->name;
            $data['author_email'] = $user->email;
        }

        $this->commentService->store($data);

        return redirect()->back()->with('success', __('cms.comments.submitted'));
    }

    public function category(string $slug): Response
    {
        return $this->byTaxonomy('categories', $slug, 'Front/Blog/Category');
    }

    public function tag(string $slug): Response
    {
        return $this->byTaxonomy('tags', $slug, 'Front/Blog/Tag');
    }

    public function archive(int $year, ?int $month = null): Response
    {
        $query = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->whereYear('published_at', $year);

        if ($month !== null) {
            $query->whereMonth('published_at', $month);
        }

        $posts = $query->orderByDesc('published_at')->paginate(15);

        return Inertia::render('Front/Blog/Archive', [
            ...$this->frontData(),
            'posts' => $posts,
            'year' => $year,
            'month' => $month,
            'categories' => $this->getCategories(),
            'recentPosts' => $this->getRecentPosts(),
            'archives' => $this->getArchiveList(),
        ]);
    }

    private function byTaxonomy(string $taxonomySlug, string $termSlug, string $component): Response
    {
        $term = TaxonomyTerm::whereHas(
            'taxonomy',
            fn ($q) => $q->where('slug', $taxonomySlug),
        )->where('slug', $termSlug)->firstOrFail();

        $posts = Post::published()
            ->with(['author', 'terms.taxonomy'])
            ->whereHas('terms', fn ($q) => $q->where('taxonomy_terms.id', $term->id))
            ->orderByDesc('published_at')
            ->paginate(15);

        return Inertia::render($component, [
            ...$this->frontData(),
            'term' => $term,
            'posts' => $posts,
            'categories' => $this->getCategories(),
            'recentPosts' => $this->getRecentPosts(),
        ]);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, TaxonomyTerm>
     */
    private function getCategories(): \Illuminate\Database\Eloquent\Collection
    {
        return TaxonomyTerm::whereHas(
            'taxonomy',
            fn ($q) => $q->where('slug', 'categories'),
        )
            ->withCount(['posts' => fn ($q) => $q->published()])
            ->orderBy('name')
            ->get();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Post>
     */
    private function getRecentPosts(int $limit = 5, ?int $excludeId = null): \Illuminate\Database\Eloquent\Collection
    {
        return Post::published()
            ->select(['id', 'title', 'slug', 'featured_image', 'published_at'])
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get();
    }

    /**
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
}
