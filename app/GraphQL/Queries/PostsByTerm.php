<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;

/**
 * Custom resolver : récupérer les posts publiés filtrés par slug de terme
 * (catégorie, tag, ou tout terme de taxonomie).
 *
 * Utilisé dans le schema GraphQL via @builder.
 *
 * Exemple de query :
 *   postsByTerm(term_slug: "php", taxonomy_slug: "category", first: 10) { ... }
 */
final class PostsByTerm
{
    /**
     * @param  array<string, mixed>  $args
     * @return Builder<Post>
     */
    public function __invoke(?object $root, array $args): Builder
    {
        $query = Post::query()
            ->published()
            ->whereHas('terms', function (Builder $q) use ($args): void {
                $q->where('slug', $args['term_slug']);

                if (! empty($args['taxonomy_slug'])) {
                    $q->whereHas('taxonomy', function (Builder $tq) use ($args): void {
                        $tq->where('slug', $args['taxonomy_slug']);
                    });
                }
            });

        return $query->orderByDesc('published_at');
    }
}
