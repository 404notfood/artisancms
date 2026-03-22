<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BlockPatternStoreRequest;
use App\Http\Requests\BlockPatternUpdateRequest;
use App\Models\BlockPattern;
use App\Services\BlockPatternService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

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
    public function store(BlockPatternStoreRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $validated['created_by'] = $request->user()?->id;

        $pattern = $this->blockPatternService->create($validated);

        return response()->json(['pattern' => $pattern], 201);
    }

    /**
     * Update a pattern.
     */
    public function update(BlockPatternUpdateRequest $request, BlockPattern $blockPattern): JsonResponse
    {
        $validated = $request->validated();

        $pattern = $this->blockPatternService->update($blockPattern, $validated);

        return response()->json(['pattern' => $pattern]);
    }

    /**
     * Delete a pattern.
     */
    public function destroy(BlockPattern $blockPattern): JsonResponse
    {
        $this->blockPatternService->delete($blockPattern);

        return response()->json(['message' => __('cms.block_patterns.deleted')]);
    }
}
