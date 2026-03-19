<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContentEntryRequest;
use App\Models\ContentEntry;
use App\Models\ContentType;
use App\Services\ContentTypeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContentEntryController extends Controller
{
    public function __construct(
        private readonly ContentTypeService $contentTypeService,
    ) {}

    /**
     * Display a paginated list of entries for a content type.
     */
    public function index(Request $request, ContentType $contentType): Response
    {
        $filters = $request->only(['status', 'search', 'sort_by', 'sort_dir', 'per_page']);

        $entries = $this->contentTypeService->getEntries($contentType, $filters);

        return Inertia::render('Admin/ContentEntries/Index', [
            'contentType' => $contentType,
            'entries' => $entries,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new entry.
     */
    public function create(ContentType $contentType): Response
    {
        return Inertia::render('Admin/ContentEntries/Create', [
            'contentType' => $contentType,
        ]);
    }

    /**
     * Store a newly created entry.
     */
    public function store(ContentEntryRequest $request, ContentType $contentType): RedirectResponse
    {
        $this->contentTypeService->createEntry($contentType, $request->validated());

        return redirect()
            ->route('admin.content-entries.index', $contentType)
            ->with('success', __('cms.content_entries.created'));
    }

    /**
     * Show the form for editing an entry.
     */
    public function edit(ContentType $contentType, ContentEntry $contentEntry): Response
    {
        $contentEntry->load('author');

        return Inertia::render('Admin/ContentEntries/Edit', [
            'contentType' => $contentType,
            'contentEntry' => $contentEntry,
        ]);
    }

    /**
     * Update the specified entry.
     */
    public function update(ContentEntryRequest $request, ContentType $contentType, ContentEntry $contentEntry): RedirectResponse
    {
        $this->contentTypeService->updateEntry($contentEntry, $request->validated());

        return redirect()
            ->back()
            ->with('success', __('cms.content_entries.updated'));
    }

    /**
     * Delete the specified entry.
     */
    public function destroy(ContentType $contentType, ContentEntry $contentEntry): RedirectResponse
    {
        $this->contentTypeService->deleteEntry($contentEntry);

        return redirect()
            ->route('admin.content-entries.index', $contentType)
            ->with('success', __('cms.content_entries.deleted'));
    }
}
