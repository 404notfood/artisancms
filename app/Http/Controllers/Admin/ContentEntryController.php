<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
    public function store(Request $request, ContentType $contentType): RedirectResponse
    {
        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'array'],
            'excerpt' => ['nullable', 'string', 'max:5000'],
            'featured_image' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'string', 'in:draft,published,scheduled,trash'],
            'fields_data' => ['nullable', 'array'],
            'published_at' => ['nullable', 'date'],
        ];

        $validated = $request->validate($rules);

        $this->contentTypeService->createEntry($contentType, $validated);

        return redirect()
            ->route('admin.content-entries.index', $contentType)
            ->with('success', 'Entree creee avec succes.');
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
    public function update(Request $request, ContentType $contentType, ContentEntry $contentEntry): RedirectResponse
    {
        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'array'],
            'excerpt' => ['nullable', 'string', 'max:5000'],
            'featured_image' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'string', 'in:draft,published,scheduled,trash'],
            'fields_data' => ['nullable', 'array'],
            'published_at' => ['nullable', 'date'],
        ];

        $validated = $request->validate($rules);

        $this->contentTypeService->updateEntry($contentEntry, $validated);

        return redirect()
            ->back()
            ->with('success', 'Entree mise a jour.');
    }

    /**
     * Delete the specified entry.
     */
    public function destroy(ContentType $contentType, ContentEntry $contentEntry): RedirectResponse
    {
        $this->contentTypeService->deleteEntry($contentEntry);

        return redirect()
            ->route('admin.content-entries.index', $contentType)
            ->with('success', 'Entree supprimee.');
    }
}
