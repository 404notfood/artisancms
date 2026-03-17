<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlockPattern;
use App\Services\BlockPatternService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BlockPatternController extends Controller
{
    public function __construct(
        private readonly BlockPatternService $blockPatternService,
    ) {}

    /**
     * List patterns (JSON for builder sidebar).
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'patterns' => $this->blockPatternService->getAll(),
            'categories' => $this->blockPatternService->getCategories(),
        ]);
    }

    /**
     * Store a new pattern.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:cms_block_patterns,slug',
            'content' => 'required|array',
            'category' => 'nullable|string|max:50',
            'is_synced' => 'nullable|boolean',
        ]);

        $validated['created_by'] = $request->user()?->id;

        $pattern = $this->blockPatternService->create($validated);

        return response()->json(['pattern' => $pattern], 201);
    }

    /**
     * Update a pattern.
     */
    public function update(Request $request, BlockPattern $blockPattern): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'content' => 'nullable|array',
            'category' => 'nullable|string|max:50',
            'is_synced' => 'nullable|boolean',
        ]);

        $pattern = $this->blockPatternService->update($blockPattern, $validated);

        return response()->json(['pattern' => $pattern]);
    }

    /**
     * Delete a pattern.
     */
    public function destroy(BlockPattern $blockPattern): JsonResponse
    {
        $this->blockPatternService->delete($blockPattern);

        return response()->json(['message' => 'Pattern supprime.']);
    }
}
