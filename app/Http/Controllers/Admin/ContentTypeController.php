<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContentTypeRequest;
use App\Models\ContentType;
use App\Services\ContentTypeService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContentTypeController extends Controller
{
    public function __construct(
        private readonly ContentTypeService $contentTypeService,
    ) {}

    /**
     * Display a list of all content types.
     */
    public function index(): Response
    {
        $contentTypes = $this->contentTypeService->getAll();

        return Inertia::render('Admin/ContentTypes/Index', [
            'contentTypes' => $contentTypes,
        ]);
    }

    /**
     * Show the form for creating a new content type.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/ContentTypes/Create');
    }

    /**
     * Store a newly created content type.
     */
    public function store(ContentTypeRequest $request): RedirectResponse
    {
        $this->contentTypeService->create($request->validated());

        return redirect()
            ->route('admin.content-types.index')
            ->with('success', __('cms.content_types.created'));
    }

    /**
     * Show the form for editing a content type.
     */
    public function edit(ContentType $contentType): Response
    {
        return Inertia::render('Admin/ContentTypes/Edit', [
            'contentType' => $contentType,
        ]);
    }

    /**
     * Update the specified content type.
     */
    public function update(ContentTypeRequest $request, ContentType $contentType): RedirectResponse
    {
        $this->contentTypeService->update($contentType, $request->validated());

        return redirect()
            ->route('admin.content-types.index')
            ->with('success', __('cms.content_types.updated'));
    }

    /**
     * Delete the specified content type.
     */
    public function destroy(ContentType $contentType): RedirectResponse
    {
        try {
            $this->contentTypeService->delete($contentType);

            return redirect()
                ->route('admin.content-types.index')
                ->with('success', __('cms.content_types.deleted'));
        } catch (\RuntimeException) {
            return redirect()
                ->back()
                ->with('error', __('cms.content_types.has_entries'));
        }
    }
}
